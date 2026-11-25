(() => {
  const body = document.body;
  const buttonHost = document.querySelector('.top-actions') || document.querySelector('.login-page');
  if (!buttonHost) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'pass-time-btn';
  toggle.className = 'button pass-time-btn';
  toggle.setAttribute('aria-pressed', 'false');
  buttonHost.append(toggle);
  if (buttonHost.classList.contains('login-page')) toggle.classList.add('pass-time-login');

  const overlay = document.createElement('div');
  overlay.id = 'celestial-overlay';
  overlay.className = 'celestial-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<div class="celestial-sun"></div><div class="celestial-moon"></div><div class="celestial-stars"></div>';
  body.append(overlay);

  const isNokron = () => body.dataset.mode === 'nokron';
  const renderToggle = () => {
    const night = isNokron();
    toggle.textContent = night ? 'Pass Time: Daybreak' : 'Pass Time: Nightfall';
    toggle.setAttribute('aria-pressed', String(night));
    toggle.title = night ? 'Return to this page’s daylight region' : 'Pass time into Nokron, Eternal City';
  };
  const setMode = (night) => {
    if (night) {
      body.dataset.mode = 'nokron';
      try { localStorage.setItem('ims-mode', 'nokron'); } catch { /* Local file or private mode may block storage. */ }
    } else {
      delete body.dataset.mode;
      try { localStorage.setItem('ims-mode', 'day'); } catch { /* Keep the current page usable without storage. */ }
    }
    renderToggle();
  };

  try {
    if (localStorage.getItem('ims-mode') === 'nokron') body.dataset.mode = 'nokron';
  } catch { /* Default to the page's regional palette. */ }
  renderToggle();

  let transitioning = false;
  toggle.addEventListener('click', () => {
    if (transitioning) return;
    const goingToNight = !isNokron();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setMode(goingToNight);
      return;
    }

    transitioning = true;
    toggle.disabled = true;
    overlay.classList.remove('active', 'to-day');
    if (!goingToNight) overlay.classList.add('to-day');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    window.setTimeout(() => setMode(goingToNight), 950);
    window.setTimeout(() => {
      overlay.classList.remove('active', 'to-day');
      toggle.disabled = false;
      transitioning = false;
    }, 1800);
  });
})();
