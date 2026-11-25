(() => {
  const canvas = document.getElementById('region-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let particles = [];
  let dragons = [];
  let currentEffect = '';
  let lightningAlpha = 0;
  let frameId = 0;
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  const getActiveEffect = () => document.body.dataset.mode === 'nokron'
    ? 'nokron'
    : (document.body.dataset.page || 'login');

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = pixelRatio();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (currentEffect) spawnParticles(currentEffect);
    if (reducedMotion) drawFrame();
  };

  const spawnParticles = (effect) => {
    currentEffect = effect;
    lightningAlpha = 0;
    const counts = { nokron: 32, login: 35, dashboard: 45, inventory: 40, 'add-item': 50, history: 45 };
    const count = counts[effect] || 35;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1.5,
      length: Math.random() * 130 + 70,
      speedX: (Math.random() - .5) * 1.2,
      speedY: Math.random() * 1.2 + .4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * .05,
      alpha: Math.random() * .35 + .12,
      orbitRadius: Math.random() * (width * .35) + 60,
      orbitSpeed: (Math.random() * .004 + .002) * (Math.random() > .5 ? 1 : -1),
    }));
    dragons = effect === 'history' ? Array.from({ length: 3 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * .4) + 40,
      speed: Math.random() * .45 + .25,
      scale: Math.random() * .35 + .35,
      flap: Math.random() * Math.PI * 2,
    })) : [];
  };

  const drawDragon = (dragon) => {
    if (!reducedMotion) {
      dragon.x += dragon.speed;
      dragon.flap += .035;
      if (dragon.x > width + 90) {
        dragon.x = -90;
        dragon.y = Math.random() * (height * .4) + 40;
      }
    }
    const wingY = Math.sin(dragon.flap) * 11 * dragon.scale;
    context.save();
    context.translate(dragon.x, dragon.y);
    context.scale(dragon.scale, dragon.scale);
    context.fillStyle = 'rgba(18,20,22,.48)';
    context.beginPath();
    context.moveTo(-32, 0);
    context.quadraticCurveTo(-20, -6 + wingY, -8, 1);
    context.quadraticCurveTo(0, -5, 9, 1);
    context.quadraticCurveTo(21, -7 - wingY, 34, -1);
    context.quadraticCurveTo(23, 3, 13, 5);
    context.quadraticCurveTo(3, 8, -7, 4);
    context.quadraticCurveTo(-19, 7, -32, 0);
    context.fill();
    context.restore();
  };

  const drawNokron = () => {
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.y += particle.speedY * 1.05;
        particle.x -= .22;
        if (particle.y - particle.length > height) {
          particle.y = -particle.length;
          particle.x = Math.random() * width;
        }
      }
      const gradient = context.createLinearGradient(particle.x, particle.y, particle.x + 5, particle.y + particle.length);
      gradient.addColorStop(0, 'rgba(90,175,255,0)');
      gradient.addColorStop(.55, `rgba(110,195,255,${particle.alpha})`);
      gradient.addColorStop(1, 'rgba(195,235,255,0)');
      context.beginPath();
      context.strokeStyle = gradient;
      context.lineWidth = particle.size * .45;
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x + 5, particle.y + particle.length);
      context.stroke();
    });
  };

  const drawLimgrave = () => {
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.x += Math.abs(particle.speedX) + .55;
        particle.y += Math.sin(particle.angle) * .45 + .22;
        particle.angle += particle.spin;
        if (particle.x > width + 10) { particle.x = -10; particle.y = Math.random() * height; }
      }
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.fillStyle = `rgba(222,188,102,${particle.alpha})`;
      context.beginPath();
      context.ellipse(0, 0, particle.size * 1.5, particle.size * .65, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  };

  const drawLeyndell = () => {
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.y += particle.speedY * .55;
        particle.x += Math.sin(particle.y * .015) * .3;
        if (particle.y > height + 10) { particle.y = -10; particle.x = Math.random() * width; }
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * .58, 0, Math.PI * 2);
      context.fillStyle = `rgba(242,206,120,${particle.alpha})`;
      context.shadowBlur = 7;
      context.shadowColor = 'rgba(242,206,120,.42)';
      context.fill();
      context.shadowBlur = 0;
    });
  };

  const drawLucaria = () => {
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.y -= particle.speedY * .4;
        particle.x += Math.cos(particle.y * .02) * .22;
        if (particle.y < -10) { particle.y = height + 10; particle.x = Math.random() * width; }
      }
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(Math.PI / 4 + particle.angle);
      context.fillStyle = `rgba(110,205,255,${particle.alpha})`;
      context.shadowBlur = 8;
      context.shadowColor = 'rgba(80,180,255,.55)';
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      context.restore();
    });
  };

  const drawVolcano = () => {
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.y -= particle.speedY * 1.1;
        particle.x += Math.sin(particle.y * .025) * .55;
        if (particle.y < -10) { particle.y = height + 10; particle.x = Math.random() * width; }
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * .55, 0, Math.PI * 2);
      context.fillStyle = `rgba(255,110,45,${Math.min(.55,particle.alpha + .1)})`;
      context.shadowBlur = 8;
      context.shadowColor = 'rgba(255,70,20,.55)';
      context.fill();
      context.shadowBlur = 0;
    });
  };

  const drawFarum = () => {
    if (!reducedMotion && Math.random() < .0025) lightningAlpha = .1;
    if (lightningAlpha > 0) {
      context.fillStyle = `rgba(218,224,232,${lightningAlpha})`;
      context.fillRect(0, 0, width, height);
      if (!reducedMotion) lightningAlpha = Math.max(0, lightningAlpha - .008);
    }
    dragons.forEach(drawDragon);
    particles.forEach((particle) => {
      if (!reducedMotion) {
        particle.angle += particle.orbitSpeed;
        particle.y -= particle.speedY * .28;
        if (particle.y < -20) particle.y = height + 20;
      }
      const x = width * .5 + Math.cos(particle.angle) * particle.orbitRadius;
      const y = particle.y + Math.sin(particle.angle) * 25;
      context.save();
      context.translate(x, y);
      context.rotate(particle.angle * 3);
      context.fillStyle = `rgba(80,83,87,${Math.min(.42,particle.alpha + .12)})`;
      context.beginPath();
      context.moveTo(-particle.size, -particle.size * .6);
      context.lineTo(particle.size * .8, -particle.size);
      context.lineTo(particle.size, particle.size * .7);
      context.lineTo(-particle.size * .6, particle.size);
      context.closePath();
      context.fill();
      context.restore();
    });
  };

  const drawFrame = () => {
    context.clearRect(0, 0, width, height);
    if (currentEffect === 'nokron') drawNokron();
    else if (currentEffect === 'login') drawLimgrave();
    else if (currentEffect === 'dashboard') drawLeyndell();
    else if (currentEffect === 'inventory') drawLucaria();
    else if (currentEffect === 'add-item') drawVolcano();
    else if (currentEffect === 'history') drawFarum();
    if (!reducedMotion && !document.hidden) frameId = window.requestAnimationFrame(drawFrame);
    else frameId = 0;
  };

  const updateEffect = () => {
    const nextEffect = getActiveEffect();
    if (nextEffect === currentEffect) return;
    spawnParticles(nextEffect);
    if (reducedMotion) drawFrame();
  };

  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = pixelRatio();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!currentEffect) spawnParticles(getActiveEffect());
    if (reducedMotion) drawFrame();
  };

  const observer = new MutationObserver(updateEffect);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-mode', 'data-page'] });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (!reducedMotion && !frameId) drawFrame();
  });

  resizeCanvas();
  updateEffect();
  if (!reducedMotion) drawFrame();
})();
