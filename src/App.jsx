import { useEffect, useMemo, useState } from 'react';
import {
  calculatePrayerTimes,
  formatTime,
  nextPrayer,
} from './lib/prayerTimes.js';
import { getHijriDate } from './lib/hijri.js';
import { LOCATION, ORG, MESSAGES, PRAYER_DISPLAY } from './config.js';
import './App.css';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function DateBlock({ now }) {
  const gregorian = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: LOCATION.timezone,
      }).format(now),
    [now],
  );
  const hijri = useMemo(() => getHijriDate(now), [now]);
  return (
    <div className="date-block">
      <div className="date-gregorian">{gregorian}</div>
      <div className="date-hijri">{hijri.formatted}</div>
    </div>
  );
}

function Clock({ now }) {
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: LOCATION.timezone,
      }).format(now),
    [now],
  );
  return <div className="clock">{time}</div>;
}

function PrayerRow({ entry, times, isNext }) {
  const { key, de, ar, note } = entry;

  let display;
  if (key === 'asr') {
    display = `${formatTime(times.asr)} / ${formatTime(times.asrHanafi)}`;
  } else {
    display = formatTime(times[key]);
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
  const times = useMemo(() => calculatePrayerTimes(now), [
    // Neu berechnen, wenn der Kalendertag wechselt.
    now.toDateString(),
  ]);
  const nextKey = useMemo(() => nextPrayer(times, now), [times, now]);

  return (
    <div className="page">
      <div className="background" aria-hidden="true" />

      <header className="header">
        <img className="logo" src="logo.jpeg" alt={`${ORG.name} Logo`} />
        <div className="header-text">
          <div className="org-name">{ORG.name}</div>
          <div className="org-tagline">
            {ORG.tagline} · {LOCATION.name}
          </div>
        </div>
      </header>

      <main className="main">
        <section className="clock-card">
          <Clock now={now} />
          <DateBlock now={now} />
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
              />
            ))}
          </div>
        </section>

        <MessageBoard />
      </main>

      <footer className="footer">
        <span>
          {LOCATION.name}, {LOCATION.country} · {LOCATION.latitude.toFixed(3)}°N
          / {LOCATION.longitude.toFixed(3)}°O
        </span>
      </footer>
    </div>
  );
}
