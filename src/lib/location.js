// ============================================================================
//  Standort-Ermittlung.
//  - Browser-Geolocation API fragt den Nutzer um Erlaubnis.
//  - Bei Zustimmung wird das Reverse-Geocoding ueber BigDataCloud
//    durchgefuehrt (kostenlose Client-API, kein API-Key noetig,
//    CORS-erlaubt).
//  - Bei Ablehnung / Fehler: null, der Aufrufer faellt auf den
//    Default-Standort aus config.js zurueck.
// ============================================================================

/**
 * Fragt den Browser nach der aktuellen GPS-Position.
 * @returns {Promise<{latitude:number, longitude:number} | null>}
 */
function getBrowserCoords() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60 * 60 * 1000 },
    );
  });
}

/**
 * Reverse-Geocoding via BigDataCloud (kostenlose Client-API).
 * @returns {Promise<{ city: string|null, country: string|null }>}
 */
async function reverseGeocode({ latitude, longitude }) {
  try {
    const url =
      'https://api.bigdatacloud.net/data/reverse-geocode-client' +
      `?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`;
    const res = await fetch(url);
    if (!res.ok) return { city: null, country: null };
    const data = await res.json();
    return {
      city:
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        null,
      country: data.countryName || null,
    };
  } catch {
    return { city: null, country: null };
  }
}

/**
 * Ermittelt den Benutzerstandort komplett:
 * GPS-Position + Stadt-/Landname + Browser-Zeitzone.
 *
 * Liefert null, wenn Geolocation nicht verfuegbar ist oder der
 * Benutzer die Erlaubnis verweigert hat.
 */
export async function resolveUserLocation() {
  const coords = await getBrowserCoords();
  if (!coords) return null;

  const { city, country } = await reverseGeocode(coords);
  return {
    name: city || 'Mein Standort',
    country: country || '',
    latitude: coords.latitude,
    longitude: coords.longitude,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin',
  };
}
