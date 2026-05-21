// ============================================================================
//  Zentrale Konfiguration der Webseite
//  Hier kannst du alle wichtigen Werte anpassen, ohne im restlichen Code zu
//  graben. Aenderungen werden beim naechsten Reload uebernommen.
// ============================================================================

// Standort: Essen, Deutschland (Default, falls keine GPS-Erlaubnis).
export const LOCATION = {
  name: 'Essen',
  country: 'Deutschland',
  latitude: 51.4556,
  longitude: 7.0116,
  timezone: 'Europe/Berlin',
};

// Wenn aktiviert, fragt der Browser beim Laden nach der GPS-Position
// und berechnet die Gebetszeiten fuer den aktuellen Standort des
// Besuchers. Bei Ablehnung wird der Default oben verwendet.
// Auf "false" setzen, um die Abfrage komplett zu deaktivieren.
export const USE_GEOLOCATION = true;

// Verein / Branding
export const ORG = {
  name: 'Hidaya e.V.',
  tagline: 'Gebetszeiten',
};

// Puffer in Minuten, die zu Dhuhr und Maghrib hinzu-addiert werden.
// Aendere diese Werte, um z.B. einen Sicherheitspuffer einzubauen.
export const BUFFERS = {
  dhuhrMinutes: 3,
  maghribMinutes: 3,
};

// Parameter fuer die Gebetszeit-Berechnung.
// Die Werte entsprechen weitestgehend der "Muslim World League"-Methode,
// die fuer Mitteleuropa gut funktioniert, kombiniert mit deinen Wuenschen:
//   - Fajr-Winkel: 18 Grad (astronomische Daemmerung)
//   - Isha-Winkel: 17 Grad
//   - Zusaetzlich: Isha = min(17-Grad-Zeit, Sonnenuntergang + Nachtdrittel)
//   - Fajr-Fallback bei "weissen Naechten": astronomische Mitternacht
export const CALCULATION = {
  fajrAngle: 18,
  ishaAngle: 17,
  // "third" = Isha = Sonnenuntergang + 1/3 der Nacht (Nacht = Sunset bis 18 Grad Fajr).
  // Es wird automatisch das frueher eintretende der beiden gewaehlt.
  ishaRule: 'min(angle, third)',
};

// Nachrichten / Ankuendigungen, die unter den Gebetszeiten angezeigt werden.
// Aendere/erweitere die Liste einfach hier im Code.
// Beispiele: Veranstaltungen, Spendenaufrufe, Hinweise zur Moschee.
export const MESSAGES = [
  {
    title: 'Willkommen',
    body: 'Salamun alaikum!',
  },
];

// Wie die Gebete angezeigt werden sollen (Reihenfolge + Beschriftung).
// Falls du z.B. Sunrise mit anzeigen willst, fuege hier eine Zeile hinzu.
export const PRAYER_DISPLAY = [
  { key: 'fajr',    de: 'Fajr',    ar: 'الفجر',  note: '18° / astron. Mitternacht' },
  { key: 'sunrise', de: 'Schuruq', ar: 'الشروق', note: 'Sonnenaufgang' },
  { key: 'dhuhr',   de: 'Dhuhr',   ar: 'الظهر',  note: 'Mittagsgebet' },
  { key: 'asr',     de: 'Asr',     ar: 'العصر',  note: 'Standard / Hanafi' },
  { key: 'maghrib', de: 'Maghrib', ar: 'المغرب', note: 'Sonnenuntergang' },
  { key: 'isha',    de: 'Isha',    ar: 'العشاء', note: '17° oder 1/3 Nacht' },
];