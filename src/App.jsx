import { useEffect, useMemo, useState } from 'react';
import {
  calculatePrayerTimes,
  formatTime,
  nextPrayer,
} from './lib/prayerTimes.js';
import { getHijriDate } from './lib/hijri.js';
import { resolveUserLocation } from './lib/location.js';
import {
  LOCATION as DEFAULT_LOCATION,
  ORG,
  MESSAGES,
  PRAYER_DISPLAY,
  USE_GEOLOCATION,
} from './config.js';
import './App.css';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Versucht beim ersten Render, den Standort des Besuchers per GPS zu
 * ermitteln. Bis das fertig ist (oder fehlschlaegt), bleibt der Default.
 */
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

export default function App() {
  const now = useNow();
  const location = useLocation();
  const times = useMemo(
    () => calculatePrayerTimes(now, location),
    // Neu berechnen, wenn der Kalendertag wechselt oder der Standort
    // sich aendert (GPS hat geliefert / Wechsel auf Default).
    [now.toDateString(), location.latitude, location.longitude],
  );
  const nextKey = useMemo(() => nextPrayer(times, now), [times, now]);

  return (
    <div className="page">
      <div className="background" aria-hidden="true" />

      <header className="header">
        <img className="logo" src="logo.jpeg" alt={`${ORG.name} Logo`} />
        <div className="header-text">
          <div className="org-name">{ORG.name}</div>
          <div className="org-tagline">
            {ORG.tagline} · {location.name}
          </div>
        </div>
      </header>

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

      <footer className="footer">
        <span>
          {location.name}
          {location.country ? `, ${location.country}` : ''} ·{' '}
          {location.latitude.toFixed(3)}°N / {location.longitude.toFixed(3)}°O
        </span>
      </footer>
    </div>
  );
}
