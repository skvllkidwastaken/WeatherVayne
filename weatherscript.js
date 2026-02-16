async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    return res.json();
  }
  
// helper: readable weathercode -> text (basic)
function weatherCodeToText(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm',
  };
  return map[code] || 'Unknown';
}

// Map weather code to a simple emoji for quick glance
function weatherCodeToEmoji(code) {
  const m = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌧️',
    55: '🌧️',
    61: '🌦️',
    63: '🌧️',
    65: '🌧️',
    71: '🌨️',
    73: '🌨️',
    75: '❄️',
    95: '⛈️',
  };
  return m[code] || '🔆';
}

// Time widget
// Time widget (reads `data-timezone` on the element; use 'auto' for local)
function startClock(el) {
  function update() {
    const now = new Date();
    const tz = (el.dataset && el.dataset.timezone) ? el.dataset.timezone : 'auto';
    if (tz && tz !== 'auto') {
      try {
        el.textContent = new Intl.DateTimeFormat(undefined, {
          timeZone: tz,
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(now);
        return;
      } catch (e) {
        // fallthrough to local
      }
    }
    el.textContent = now.toLocaleString();
  }
  update();
  return setInterval(update, 1000);
}

// Weather widget rendering
async function renderWeather(el, lat, lon) {
  try {
    el.innerHTML = '<p class="loading">Fetching weather…</p>';
    const data = await getWeather(lat, lon);
    const cur = data.current_weather || {};
    const temp = cur.temperature;
    const wind = cur.windspeed;
    const code = cur.weathercode;

    const emoji = weatherCodeToEmoji(code);
    el.innerHTML = `
      <div class="weather-current">
        <div class="emoji">${emoji}</div>
        <div class="temp">${temp != null ? Math.round(temp) + '°' : '—'}</div>
        <div class="desc">${weatherCodeToText(code)}</div>
        <div class="meta">Wind: ${wind != null ? wind + ' km/h' : '—'}</div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// Doppler widget: shows a small embedded RainViewer map; clicking opens full map
function renderDoppler(el, lat, lon) {
  el.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'doppler-frame';

  // small iframe preview that links to full map
  const iframe = document.createElement('iframe');
  const zoom = 7;
  iframe.src = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}`;
  iframe.title = 'Doppler preview';
  iframe.loading = 'lazy';
  wrapper.appendChild(iframe);

  const openLink = document.createElement('a');
  openLink.href = `https://www.rainviewer.com/map.html?loc=${lat},${lon},7`;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.textContent = 'Open full Doppler map';
  wrapper.appendChild(openLink);

  el.appendChild(wrapper);
}

// Try to get user geolocation; fallback to provided default
function withLocation(defaultLat, defaultLon, cb) {
  if (navigator.geolocation) {
    const opts = { timeout: 5000 };
    navigator.geolocation.getCurrentPosition(
      pos => cb(pos.coords.latitude, pos.coords.longitude),
      () => cb(defaultLat, defaultLon),
      opts
    );
  } else {
    cb(defaultLat, defaultLon);
  }
}

// Init widgets on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const timeEl = document.getElementById('time');
  const weatherEl = document.getElementById('weather');
  const dopplerEl = document.getElementById('doppler');

  // default coords (New York) used if geolocation denied
  const defaultLat = 40.7128;
  const defaultLon = -74.0060;

  // Start clock
  startClock(timeEl);

  // Resolve location then render weather + doppler
  withLocation(defaultLat, defaultLon, (lat, lon) => {
    renderWeather(weatherEl, lat, lon);
    renderDoppler(dopplerEl, lat, lon);
  });
});