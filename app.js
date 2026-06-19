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

const els = {
  fileInput: document.getElementById('fileInput'),
  dropzone: document.getElementById('dropzone'),
  previewBody: document.getElementById('previewBody'),
  uploadStatus: document.getElementById('uploadStatus'),
  openDisplay: document.getElementById('openDisplay')
};

function saveRows(rows) {
  localStorage.setItem('roomChanges', JSON.stringify(rows.slice(0, 13)));
  window.dispatchEvent(new Event('storage'));
}

function getRows() {
  try { return JSON.parse(localStorage.getItem('roomChanges')) || sampleRows; }
  catch { return sampleRows; }
}

function renderPreview(rows) {
  els.previewBody.innerHTML = '';
  rows.slice(0, 13).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(row.old)}</td><td>${escapeHtml(row.new)}</td><td>${escapeHtml(row.info || '')}</td>`;
    els.previewBody.appendChild(tr);
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function normalizeHeader(header) {
  return String(header || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function mapRows(jsonRows) {
  return jsonRows.map(obj => {
    const keys = Object.keys(obj);
    const find = names => keys.find(k => names.includes(normalizeHeader(k)));
    const oldKey = find(['ancienne salle','ancienne','ancien','old','old room','salle ancienne']);
    const newKey = find(['nouvelle salle','nouvelle','nouveau','new','new room','salle nouvelle']);
    const infoKey = find(['info','information','cours','branche','matiere','matiere/cours','optionnel']);
    return {
      old: oldKey ? obj[oldKey] : obj[keys[0]],
      new: newKey ? obj[newKey] : obj[keys[1]],
      info: infoKey ? obj[infoKey] : obj[keys[2]] || ''
    };
  }).filter(r => r.old && r.new).slice(0, 13);
}

async function handleFile(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const mapped = mapRows(rows);
  if (!mapped.length) {
    els.uploadStatus.textContent = 'Aucune correspondance trouvée. Vérifiez les colonnes du fichier.';
    els.uploadStatus.style.color = '#b42318';
    return;
  }
  saveRows(mapped);
  renderPreview(mapped);
  els.uploadStatus.textContent = `✓ Fichier téléversé avec succès : ${mapped.length} correspondance(s) mise(s) à jour.`;
  els.uploadStatus.style.color = '#06722a';
}

els.fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));
els.dropzone.addEventListener('dragover', e => { e.preventDefault(); els.dropzone.classList.add('active'); });
els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('active'));
els.dropzone.addEventListener('drop', e => { e.preventDefault(); els.dropzone.classList.remove('active'); const file = e.dataTransfer.files[0]; if (file) handleFile(file); });
els.openDisplay.addEventListener('click', async () => {
  const overlay = document.createElement('div');
  overlay.className = 'real-fullscreen-overlay';

  overlay.innerHTML = `
    <iframe src="display.html" class="real-fullscreen-frame" title="Affichage plein écran"></iframe>
    <button type="button" class="fullscreen-exit-layer" aria-label="Quitter le plein écran"></button>
  `;

  document.body.appendChild(overlay);

  const closeFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
    overlay.remove();
  };

  try {
    await overlay.requestFullscreen();
  } catch (err) {
    console.warn('Fullscreen non disponible:', err);
  }

  overlay.querySelector('.fullscreen-exit-layer').addEventListener('click', closeFullscreen);

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.contains(overlay)) {
      overlay.remove();
    }
  }, { once: true });
});

function updateClock() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('fr-LU', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-LU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

async function updateWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=49.6009&longitude=6.1175&current=temperature_2m,weather_code&timezone=Europe%2FLuxembourg';
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const text = weatherText(code);
    document.getElementById('weatherTemp').textContent = `${temp}°C`;
    document.getElementById('weatherText').textContent = text;
    document.getElementById('weatherIcon').textContent = weatherIcon(code);
    localStorage.setItem('roomWeather', JSON.stringify({ temp, text, icon: weatherIcon(code), updated: Date.now() }));
  } catch {
    document.getElementById('weatherText').textContent = 'Météo indisponible';
  }
}
function weatherText(code){ if(code===0)return'Ensoleillé'; if([1,2,3].includes(code))return'Partiellement nuageux'; if([45,48].includes(code))return'Brouillard'; if([51,53,55,61,63,65,80,81,82].includes(code))return'Pluie'; if([71,73,75,77,85,86].includes(code))return'Neige'; if([95,96,99].includes(code))return'Orage'; return'Variable'; }
function weatherIcon(code){ if(code===0)return'☀️'; if([1,2,3].includes(code))return'🌤️'; if([45,48].includes(code))return'🌫️'; if([51,53,55,61,63,65,80,81,82].includes(code))return'🌧️'; if([71,73,75,77,85,86].includes(code))return'❄️'; if([95,96,99].includes(code))return'⛈️'; return'☁️'; }
updateWeather(); setInterval(updateWeather, 10 * 60 * 1000);

if (!localStorage.getItem('roomChanges')) saveRows(sampleRows);
renderPreview(getRows());
