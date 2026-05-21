// ============================================================================
//  Hijri-Datum via Intl.DateTimeFormat (islamic-umalqura Kalender).
//  Funktioniert in allen modernen Browsern.
// ============================================================================

export const HIJRI_MONTHS_DE = [
  'Muharram',
  'Safar',
  "Rabīʿ al-awwal",
  "Rabīʿ ath-thānī",
  "Jumādā al-ūlā",
  "Jumādā ath-thāniyya",
  'Rajab',
  "Shaʿbān",
  'Ramaḍān',
  'Shawwāl',
  "Dhū al-Qaʿda",
  "Dhū al-Ḥijja",
];

export const HIJRI_MONTHS_SHORT = [
  'Muh.', 'Saf.', 'Rab. I', 'Rab. II',
  'Jum. I', 'Jum. II', 'Raj.', 'Shaʿ.',
  'Ram.', 'Shaw.', 'Qaʿ.', 'Ḥij.',
];

// ASCII-Variante fuer PDF/Filenames (kein Unicode-Font noetig)
export const HIJRI_MONTHS_ASCII = [
  'Muharram', 'Safar', 'Rabi al-awwal', 'Rabi ath-thani',
  'Jumada al-ula', 'Jumada ath-thaniyya', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhu al-Qada', 'Dhu al-Hijja',
];

/**
 * Liefert das Hijri-Datum fuer ein Gregorianisches Datum.
 * @returns {{day:number, month:number, monthName:string, year:number, formatted:string}}
 */
export function getHijriDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const day = Number(lookup.day);
  const month = Number(lookup.month);
  const year = Number(String(lookup.year).replace(/\D/g, ''));

  const monthName = HIJRI_MONTHS_DE[month - 1] ?? `${month}`;
  return {
    day,
    month,
    monthName,
    year,
    formatted: `${day}. ${monthName} ${year}`,
  };
}

/**
 * Hijri (year, month, day) -> Gregorian Date.
 * Naehert mit der durchschnittlichen Hijri-Jahreslaenge (354.367 Tage)
 * und verfeinert per Intl-Round-Trip, bis das exakte Datum gefunden ist.
 *
 * @returns {Date | null}
 */
export function hijriToGregorian(hYear, hMonth, hDay) {
  // 1 Muharram 1 AH ≈ 16. Juli 622 CE (Julian) bzw. 19. Juli 622 (proleptic Greg.)
  const epochMs = Date.UTC(622, 6, 19);
  const approxDays =
    (hYear - 1) * 354.367 + (hMonth - 1) * 29.53 + (hDay - 1);
  const approxMs = epochMs + approxDays * 86_400_000;

  // Bidirektionaler Suchradius: zuerst eng, dann breit.
  for (const radius of [4, 12, 30]) {
    for (let offset = -radius; offset <= radius; offset++) {
      const test = new Date(approxMs + offset * 86_400_000);
      const h = getHijriDate(test);
      if (h.year === hYear && h.month === hMonth && h.day === hDay) {
        // Auf Mittag normalisieren, damit DST-Sprünge nicht stören.
        test.setHours(12, 0, 0, 0);
        return test;
      }
    }
  }
  return null;
}

/**
 * Anzahl Tage in einem Hijri-Monat (29 oder 30).
 */
export function hijriDaysInMonth(hYear, hMonth) {
  const firstDay = hijriToGregorian(hYear, hMonth, 1);
  if (!firstDay) return 30;
  for (let d = 30; d >= 29; d--) {
    const test = new Date(firstDay.getTime() + (d - 1) * 86_400_000);
    const h = getHijriDate(test);
    if (h.year === hYear && h.month === hMonth && h.day === d) return d;
  }
  return 29;
}
