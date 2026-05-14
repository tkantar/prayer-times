// ============================================================================
//  Hijri-Datum via Intl.DateTimeFormat (islamic-umalqura Kalender).
//  Funktioniert in allen modernen Browsern.
// ============================================================================

const HIJRI_MONTHS_DE = [
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

/**
 * Liefert ein Hijri-Datum als { day, month, year, formatted }.
 * Die formatierte Ausgabe ist z.B. "26. Shawwāl 1447".
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
  // Year kommt z.B. als "1447 AH" — wir extrahieren die Zahl.
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
