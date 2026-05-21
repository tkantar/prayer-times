// ============================================================================
//  PDF-Export der Gebetszeiten fuer einen ausgewaehlten Monat.
//  jsPDF + autotable werden per dynamic import nur bei Bedarf geladen.
// ============================================================================

import { calculatePrayerTimes, formatTime } from './prayerTimes.js';
import { getHijriDate, HIJRI_MONTHS_ASCII } from './hijri.js';
import { ORG, BUFFERS } from '../config.js';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const WEEKDAYS_DE_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function sanitizeFilename(s) {
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @param {object} params
 * @param {'gregorian'|'hijri'} params.mode
 * @param {Date[]} params.days — Liste aller Tage des Monats (Gregorian)
 * @param {{name:string, country:string, latitude:number, longitude:number, timezone:string}} params.location
 * @param {string} params.monthTitle — z.B. "Mai 2026" oder "Dhu al-Qada 1447"
 */
export async function exportMonthAsPdf({ mode, days, location, monthTitle }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Gebetszeiten - ${monthTitle}`, pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  // Bullets als "·" sind in Latin-1 enthalten, daher OK.
  const locLine = `${ORG.name} · ${location.name}${location.country ? ', ' + location.country : ''}`;
  doc.text(locLine, pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `Koordinaten: ${location.latitude.toFixed(3)}° N / ${location.longitude.toFixed(3)}° O · Zeitzone ${location.timezone}`,
    pageWidth / 2, 31, { align: 'center' },
  );
  doc.text(
    `Fajr 18° · Isha = min(17°, 1/3 Nacht) · Dhuhr +${BUFFERS.dhuhrMinutes} Min · Maghrib +${BUFFERS.maghribMinutes} Min`,
    pageWidth / 2, 36, { align: 'center' },
  );
  doc.setTextColor(0);

  // --- Table ---
  const head = [[
    'Datum',
    'Hijri',
    'Fajr',
    'Schuruq',
    'Dhuhr',
    'Asr',
    'Asr (H.)',
    'Maghrib',
    'Isha',
  ]];

  const body = days.map((d) => {
    const times = calculatePrayerTimes(d, location);
    const h = getHijriDate(d);
    const hijriMonthName = HIJRI_MONTHS_ASCII[h.month - 1];
    const weekday = WEEKDAYS_DE_SHORT[(d.getDay() + 6) % 7];
    const gregFormatted =
      `${weekday} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const hijriFormatted = `${h.day}. ${hijriMonthName} ${h.year}`;

    return [
      gregFormatted,
      hijriFormatted,
      formatTime(times.fajr, location.timezone),
      formatTime(times.sunrise, location.timezone),
      formatTime(times.dhuhr, location.timezone),
      formatTime(times.asr, location.timezone),
      formatTime(times.asrHanafi, location.timezone),
      formatTime(times.maghrib, location.timezone),
      formatTime(times.isha, location.timezone),
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 42,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [212, 175, 55],
      textColor: 20,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 36 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
    },
  });

  // Footer
  const finalY = doc.lastAutoTable?.finalY ?? 42;
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    'Generiert am ' + new Date().toLocaleString('de-DE'),
    pageWidth / 2,
    Math.min(finalY + 8, doc.internal.pageSize.getHeight() - 8),
    { align: 'center' },
  );

  // --- Filename + Download ---
  const filenameMonth = mode === 'hijri'
    ? `hijri-${monthTitle}`
    : `${monthTitle}`;
  const filename =
    `gebetszeiten-${sanitizeFilename(location.name)}-${sanitizeFilename(filenameMonth)}.pdf`;

  doc.save(filename);
}
