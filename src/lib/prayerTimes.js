// ============================================================================
//  Berechnung der Gebetszeiten.
//
//  Es wird die adhan-js Library fuer die astronomische Basis verwendet
//  (Sonnenstand, Daemmerungswinkel, Asr-Schatten). Auf dieser Basis bauen
//  wir die Custom-Logik:
//
//    - Fajr: 18° Sonnentiefe. Wenn 18° in Sommernaechten nicht eintritt
//      (Essen liegt auf ~51,5° N), Fallback auf astronomische Mitternacht
//      = Mitte zwischen Sonnenuntergang und Sonnenaufgang.
//    - Isha: Wir berechnen beides — 17°-Variante und 1/3-der-Nacht-Variante
//      (Nacht = Sonnenuntergang heute bis Fajr 18° morgen). Der FRUEHERE
//      Zeitpunkt gewinnt.
//    - Dhuhr / Maghrib: Puffer in Minuten aus config.js wird addiert.
// ============================================================================

import {
  PrayerTimes,
  CalculationParameters,
  Coordinates,
  Madhab,
  HighLatitudeRule,
} from 'adhan';

import { LOCATION, BUFFERS, CALCULATION } from '../config.js';

const coords = new Coordinates(LOCATION.latitude, LOCATION.longitude);

function buildParams(madhab) {
  // CalculationParameters(method, fajrAngle, ishaAngle, ishaInterval, methodAdjustments?)
  const p = new CalculationParameters(
    'Other',
    CALCULATION.fajrAngle,
    CALCULATION.ishaAngle,
    0,
  );
  p.madhab = madhab;
  // Wir wollen kein eingebautes Hochbreiten-Mapping — wir machen unser eigenes.
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  return p;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isValid(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Liefert die berechneten Gebetszeiten fuer den uebergebenen Tag.
 *
 * @param {Date} date — Datum (Uhrzeit wird ignoriert, es zaehlt der Kalendertag)
 * @returns {{
 *   fajr: Date,
 *   sunrise: Date,
 *   dhuhr: Date,
 *   asr: Date,
 *   asrHanafi: Date,
 *   maghrib: Date,
 *   isha: Date,
 *   meta: { fajrFallback: boolean, ishaSource: 'angle' | 'third' }
 * }}
 */
export function calculatePrayerTimes(date) {
  const today = startOfDay(date);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const ptShafi = new PrayerTimes(coords, today, buildParams(Madhab.Shafi));
  const ptHanafi = new PrayerTimes(coords, today, buildParams(Madhab.Hanafi));
  const ptTomorrow = new PrayerTimes(coords, tomorrow, buildParams(Madhab.Shafi));
  const ptYesterday = new PrayerTimes(coords, yesterday, buildParams(Madhab.Shafi));

  // --- Fajr ---------------------------------------------------------------
  let fajr = ptShafi.fajr;
  let fajrFallback = false;
  if (!isValid(fajr)) {
    // Astronomische Mitternacht = Mitte zwischen Sonnenuntergang gestern und
    // Sonnenaufgang heute.
    const sunsetYesterday = ptYesterday.maghrib;
    const sunriseToday = ptShafi.sunrise;
    if (isValid(sunsetYesterday) && isValid(sunriseToday)) {
      fajr = new Date(
        (sunsetYesterday.getTime() + sunriseToday.getTime()) / 2,
      );
      fajrFallback = true;
    }
  }

  // --- Sonnenaufgang -------------------------------------------------------
  const sunrise = ptShafi.sunrise;

  // --- Dhuhr (mit Puffer) --------------------------------------------------
  const dhuhr = addMinutes(ptShafi.dhuhr, BUFFERS.dhuhrMinutes);

  // --- Asr (standard + Hanafi) --------------------------------------------
  const asr = ptShafi.asr;
  const asrHanafi = ptHanafi.asr;

  // --- Maghrib (mit Puffer) ------------------------------------------------
  const sunsetToday = ptShafi.maghrib; // unbuffered fuer Nachtberechnung
  const maghrib = addMinutes(sunsetToday, BUFFERS.maghribMinutes);

  // --- Isha: min(17°, sunset + Nacht/3) -----------------------------------
  const ishaAngle = ptShafi.isha;

  // "Nacht" laeuft von Sonnenuntergang heute bis Fajr (18°) morgen.
  // Wenn morgen 18° nicht eintritt, nehmen wir naeherungsweise den
  // Sonnenaufgang morgen als Nachtende.
  const tomorrowFajr = ptTomorrow.fajr;
  const nightEnd = isValid(tomorrowFajr) ? tomorrowFajr : ptTomorrow.sunrise;
  const nightLengthMs = nightEnd.getTime() - sunsetToday.getTime();
  const ishaThird = new Date(sunsetToday.getTime() + nightLengthMs / 3);

  let isha;
  let ishaSource;
  if (!isValid(ishaAngle)) {
    isha = ishaThird;
    ishaSource = 'third';
  } else if (ishaAngle.getTime() <= ishaThird.getTime()) {
    isha = ishaAngle;
    ishaSource = 'angle';
  } else {
    isha = ishaThird;
    ishaSource = 'third';
  }

  return {
    fajr,
    sunrise,
    dhuhr,
    asr,
    asrHanafi,
    maghrib,
    isha,
    meta: { fajrFallback, ishaSource },
  };
}

/**
 * Formatiert ein Date als "HH:MM" in der Zeitzone von Essen.
 */
export function formatTime(date) {
  if (!isValid(date)) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: LOCATION.timezone,
  }).format(date);
}

/**
 * Bestimmt aus den Tageszeiten, welches Gebet als naechstes ansteht.
 * Liefert den key (z.B. 'dhuhr') oder null, wenn alle vorbei sind.
 */
export function nextPrayer(times, now = new Date()) {
  const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const key of order) {
    const t = times[key];
    if (isValid(t) && t.getTime() > now.getTime()) return key;
  }
  return null;
}