import { useEffect, useMemo, useState } from 'react';
import {
  calculatePrayerTimes,
  formatTime,
  nextPrayer,
} from './lib/prayerTimes.js';
import {
  getHijriDate,
  HIJRI_MONTHS_DE,
  HIJRI_MONTHS_SHORT,
  HIJRI_MONTHS_ASCII,
  hijriToGregorian,
  hijriDaysInMonth,
} from './lib/hijri.js';
import { exportMonthAsPdf } from './lib/pdfExport.js';
import { resolveUserLocation } from './lib/location.js';
import {
  LOCATION as DEFAULT_LOCATION,
  ORG,
  MESSAGES,
  PRAYER_DISPLAY,
  USE_GEOLOCATION,
} from './config.js';
import './App.css';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const MONTHS_SHORT_DE = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];
const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ----- Hooks ---------------------------------------------------------------

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useLocation() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  useEffect(() => {
    if (!USE_GEOLOCATION) return;
    let cancelled = false;
    resolveUserLocation().then((loc) => {
      if (!cancelled && loc) setLocation(loc);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return location;
}

// ----- Icons ---------------------------------------------------------------

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ----- Shared building blocks ---------------------------------------------

function Header({ location, view, onToggleView }) {
  return (
    <header className="header">
      <img className="logo" src="logo.jpeg" alt={`${ORG.name} Logo`} />
      <div className="header-text">
        <div className="org-name">{ORG.name}</div>
        <div className="org-tagline">
          {ORG.tagline} · {location.name}
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={onToggleView}
        aria-label={view === 'home' ? 'Kalender öffnen' : 'Kalender schließen'}
        title={view === 'home' ? 'Kalender' : 'Zurück'}
      >
        {view === 'home' ? <CalendarIcon /> : <CloseIcon />}
      </button>
    </header>
  );
}

function Footer({ location }) {
  return (
    <footer className="footer">
      <span>
        {location.name}
        {location.country ? `, ${location.country}` : ''} ·{' '}
        {location.latitude.toFixed(3)}°N / {location.longitude.toFixed(3)}°O
      </span>
    </footer>
  );
}

// ----- Home view ----------------------------------------------------------

function DateBlock({ now, timezone }) {
  const gregorian = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: timezone,
      }).format(now),
    [now, timezone],
  );
  const hijri = useMemo(() => getHijriDate(now), [now]);
  return (
    <div className="date-block">
      <div className="date-gregorian">{gregorian}</div>
      <div className="date-hijri">{hijri.formatted}</div>
    </div>
  );
}

function Clock({ now, timezone }) {
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
      }).format(now),
    [now, timezone],
  );
  return <div className="clock">{time}</div>;
}

function PrayerRow({ entry, times, isNext, timezone }) {
  const { key, de, ar, note } = entry;
  let display;
  if (key === 'asr') {
    display = `${formatTime(times.asr, timezone)} / ${formatTime(times.asrHanafi, timezone)}`;
  } else {
    display = formatTime(times[key], timezone);
  }
  return (
    <div className={`prayer-row${isNext ? ' is-next' : ''}`}>
      <div className="prayer-name">
        <span className="prayer-de">{de}</span>
        <span className="prayer-ar">{ar}</span>
      </div>
      <div className="prayer-note">{note}</div>
      <div className="prayer-time">{display}</div>
    </div>
  );
}

function MessageBoard() {
  if (!MESSAGES.length) return null;
  return (
    <section className="messages">
      <h2>Nachrichten</h2>
      <ul>
        {MESSAGES.map((m, i) => (
          <li key={i}>
            <div className="msg-title">{m.title}</div>
            <div className="msg-body">{m.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeView({ now, location }) {
  const times = useMemo(
    () => calculatePrayerTimes(now, location),
    [now.toDateString(), location.latitude, location.longitude],
  );
  const nextKey = useMemo(() => nextPrayer(times, now), [times, now]);

  return (
    <main className="main">
      <section className="clock-card">
        <Clock now={now} timezone={location.timezone} />
        <DateBlock now={now} timezone={location.timezone} />
      </section>

      <section className="prayer-card">
        <h2>Heutige Gebetszeiten</h2>
        <div className="prayer-list">
          {PRAYER_DISPLAY.map((entry) => (
            <PrayerRow
              key={entry.key}
              entry={entry}
              times={times}
              isNext={nextKey === entry.key}
              timezone={location.timezone}
            />
          ))}
        </div>
      </section>

      <MessageBoard />
    </main>
  );
}

// ----- Calendar view ------------------------------------------------------

function buildGregorianGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(12, 0, 0, 0);
    cells.push({ display: d, date });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function buildHijriGrid(hYear, hMonth) {
  const firstDate = hijriToGregorian(hYear, hMonth, 1);
  if (!firstDate) return [];
  const startOffset = (firstDate.getDay() + 6) % 7;
  const daysInMonth = hijriDaysInMonth(hYear, hMonth);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(firstDate.getTime() + (d - 1) * 86_400_000);
    date.setHours(12, 0, 0, 0);
    cells.push({ display: d, date });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function CalendarView({ location }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const [mode, setMode] = useState('gregorian'); // 'gregorian' | 'hijri'
  const [selectedDate, setSelectedDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  // --- View-Daten je nach Mode -------------------------------------------
  const view = useMemo(() => {
    if (mode === 'gregorian') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const currentYear = today.getFullYear();
      return {
        year,
        month,
        years: [currentYear, currentYear + 1],
        monthNames: MONTHS_DE,
        monthShort: MONTHS_SHORT_DE,
        cells: buildGregorianGrid(year, month),
      };
    } else {
      const h = getHijriDate(selectedDate);
      const todayH = getHijriDate(today);
      return {
        year: h.year,
        month: h.month - 1, // 0-indexed fuer das Picker-Array
        years: [todayH.year, todayH.year + 1],
        monthNames: HIJRI_MONTHS_DE,
        monthShort: HIJRI_MONTHS_SHORT,
        cells: buildHijriGrid(h.year, h.month),
      };
    }
  }, [mode, selectedDate, today]);

  const dayPrayers = useMemo(
    () => calculatePrayerTimes(selectedDate, location),
    [selectedDate, location.latitude, location.longitude],
  );

  const selectedFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(selectedDate),
    [selectedDate],
  );
  const selectedHijri = useMemo(() => getHijriDate(selectedDate), [selectedDate]);

  // --- Navigation --------------------------------------------------------
  const goToYear = (y) => {
    if (mode === 'gregorian') {
      const newDate = new Date(y, view.month, Math.min(selectedDate.getDate(), 28));
      newDate.setHours(12, 0, 0, 0);
      setSelectedDate(newDate);
    } else {
      // view.month ist 0-indexed → Hijri-Monat = view.month + 1
      const target = hijriToGregorian(y, view.month + 1, 1);
      if (target) setSelectedDate(target);
    }
  };
  const goToMonth = (m) => {
    if (mode === 'gregorian') {
      const newDate = new Date(view.year, m, Math.min(selectedDate.getDate(), 28));
      newDate.setHours(12, 0, 0, 0);
      setSelectedDate(newDate);
    } else {
      const target = hijriToGregorian(view.year, m + 1, 1);
      if (target) setSelectedDate(target);
    }
  };
  const goToCellDate = (cellDate) => {
    const d = new Date(cellDate);
    d.setHours(12, 0, 0, 0);
    setSelectedDate(d);
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    // selectedDate bleibt — wird im neuen Mode neu interpretiert.
  };

  // --- PDF Export --------------------------------------------------------
  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const days = view.cells.filter((c) => c !== null).map((c) => c.date);
      // Fuer den PDF-Titel ASCII-Schrift verwenden (jsPDF Helvetica kann
      // keine Unicode-Zeichen wie ū, Ḥ oder em-dash darstellen).
      const monthTitle =
        mode === 'gregorian'
          ? `${MONTHS_DE[view.month]} ${view.year}`
          : `${HIJRI_MONTHS_ASCII[view.month]} ${view.year}`;
      await exportMonthAsPdf({ mode, days, location, monthTitle });
    } catch (e) {
      console.error('PDF Export fehlgeschlagen', e);
      alert('PDF-Export ist fehlgeschlagen. Schau in die Browser-Konsole.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="calendar-main">
      <div className="cal-controls">
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'gregorian' ? 'active' : ''}
            onClick={() => switchMode('gregorian')}
          >
            Gregorianisch
          </button>
          <button
            type="button"
            className={mode === 'hijri' ? 'active' : ''}
            onClick={() => switchMode('hijri')}
          >
            Hijri
          </button>
        </div>
        <div className="year-toggle">
          {view.years.map((y) => (
            <button
              key={y}
              type="button"
              className={y === view.year ? 'active' : ''}
              onClick={() => goToYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="month-picker">
          {view.monthShort.map((m, i) => (
            <button
              key={m + i}
              type="button"
              className={i === view.month ? 'active' : ''}
              onClick={() => goToMonth(i)}
              title={view.monthNames[i]}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <section className="cal-grid">
        <div className="weekday-row">
          {WEEKDAYS_DE.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="day-grid">
          {view.cells.map((cell, i) => {
            if (cell === null) {
              return <div key={i} className="day-cell empty" aria-hidden />;
            }
            const isToday = sameDate(cell.date, today);
            const isSelected = sameDate(cell.date, selectedDate);
            return (
              <button
                key={i}
                type="button"
                className={`day-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => goToCellDate(cell.date)}
              >
                {cell.display}
              </button>
            );
          })}
        </div>
      </section>

      <section className="cal-prayer-list">
        <div className="cal-prayer-header">
          <div className="cal-day-greg">{selectedFormatted}</div>
          <div className="cal-day-hijri">{selectedHijri.formatted}</div>
        </div>
        <div className="cal-prayer-rows">
          {PRAYER_DISPLAY.map((entry) => {
            let display;
            if (entry.key === 'asr') {
              display = `${formatTime(dayPrayers.asr, location.timezone)} / ${formatTime(dayPrayers.asrHanafi, location.timezone)}`;
            } else {
              display = formatTime(dayPrayers[entry.key], location.timezone);
            }
            return (
              <div key={entry.key} className="cal-prayer-row">
                <span className="cal-prayer-name">
                  <span className="prayer-de">{entry.de}</span>
                  <span className="prayer-ar">{entry.ar}</span>
                </span>
                <span className="cal-prayer-time">{display}</span>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="export-btn"
          onClick={handleExportPdf}
          disabled={isExporting}
        >
          {isExporting ? 'PDF wird erzeugt…' : 'Als PDF exportieren'}
        </button>
      </section>
    </main>
  );
}

// ----- App ----------------------------------------------------------------

export default function App() {
  const now = useNow();
  const location = useLocation();
  const [view, setView] = useState('home');

  const toggleView = () => setView((v) => (v === 'home' ? 'calendar' : 'home'));

  return (
    <div className={`page view-${view}`}>
      <div className="background" aria-hidden="true" />

      <Header location={location} view={view} onToggleView={toggleView} />

      {view === 'home' ? (
        <HomeView now={now} location={location} />
      ) : (
        <CalendarView location={location} />
      )}

      <Footer location={location} />
    </div>
  );
}
