const sampleRows = [
  { old: 'D1.10', new: 'C2.11', info: 'Mathématiques' },
  { old: 'A2.05', new: 'D1.08', info: 'Français' },
  { old: 'B1.12', new: 'A1.05', info: 'Physique' },
  { old: 'E0.03', new: 'B2.03', info: 'Anglais' },
  { old: 'C2.09', new: 'E1.10', info: 'Histoire' },
  { old: 'D2.07', new: 'D2.02', info: 'Informatique' },
  { old: 'A1.01', new: 'C1.07', info: 'Biologie' },
  { old: 'B2.02', new: 'A2.12', info: 'Chimie' },
  { old: 'E1.06', new: 'E0.01', info: 'Économie' },
  { old: 'C1.04', new: 'B1.09', info: 'Géographie' }
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function getRows() {
  try { return JSON.parse(localStorage.getItem('roomChanges')) || sampleRows; }
  catch { return sampleRows; }
}

function renderDisplay() {
  const rows = getRows().slice(0, 10);
  const oldRooms = document.getElementById('oldRooms');
  const newRooms = document.getElementById('newRooms');
  const arrows = document.getElementById('arrows');
  oldRooms.innerHTML = '';
  newRooms.innerHTML = '';
  arrows.innerHTML = '';

  if (!rows.length) {
    oldRooms.innerHTML = '<div class="empty-message">Aucune donnée</div>';
    return;
  }

  rows.forEach(row => {
    oldRooms.insertAdjacentHTML('beforeend', `
      <div class="room-row">
        <span class="badge">👥</span>
        <span class="room-code">${escapeHtml(row.old)}</span>
        <span class="room-info">${escapeHtml(row.info || '')}</span>
      </div>`);
    newRooms.insertAdjacentHTML('beforeend', `
      <div class="room-row">
        <span class="badge">▦</span>
        <span class="room-code">${escapeHtml(row.new)}</span>
        <span class="room-info"></span>
      </div>`);
    arrows.insertAdjacentHTML('beforeend', '<div class="arrow">→</div>');
  });
}

function updateClock() {
  document.getElementById('displayTime').textContent = new Date().toLocaleTimeString('fr-LU', { hour: '2-digit', minute: '2-digit' });
}

function updateWeatherFromStorage() {
  try {
    const weather = JSON.parse(localStorage.getItem('roomWeather'));
    if (!weather) return;
    document.getElementById('displayWeatherTemp').textContent = `${weather.temp}°C`;
    document.getElementById('displayWeatherText').textContent = weather.text;
  } catch {}
}

window.addEventListener('storage', () => { renderDisplay(); updateWeatherFromStorage(); });
setInterval(() => { renderDisplay(); updateWeatherFromStorage(); }, 3000);
setInterval(updateClock, 1000);
renderDisplay(); updateClock(); updateWeatherFromStorage();
