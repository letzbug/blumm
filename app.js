els.openDisplay.addEventListener('click', async () => {
  const overlay = document.createElement('div');
  overlay.className = 'real-fullscreen-overlay';
  overlay.innerHTML = `
    <iframe src="display.html" class="real-fullscreen-frame"></iframe>
    <div class="fullscreen-exit-hint">Cliquer pour quitter le plein écran</div>
  `;

  document.body.appendChild(overlay);

  try {
    await overlay.requestFullscreen();
  } catch (err) {
    console.warn('Fullscreen non disponible:', err);
  }

  overlay.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
    overlay.remove();
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.contains(overlay)) {
      overlay.remove();
    }
  }, { once: true });
});