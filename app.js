'use strict';

const scene = document.querySelector('#scene');
const canvas = document.querySelector('#cross-field');
const pen = canvas.getContext('2d');
const motionButton = document.querySelector('#motion');
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sheetCaption = document.querySelector('#sheet-caption');
const svgNS = 'http://www.w3.org/2000/svg';
const corners = ['tl', 'tr', 'br', 'bl'];
const anchors = corners.map(corner => `<i class="anchor" data-corner="${corner}" aria-hidden="true"></i>`).join('');
const frameLayer = '<svg class="frame-layer" aria-hidden="true"></svg>';
const positions = [[23, 20], [83, 26], [86, 54], [20, 61], [67, 83]];
const figures = {
  arch: 'M12 53V14h51l14 12v27H60V37a12 12 0 0 0-24 0v16H12zm0-39 14-10h38l13 22M26 4v39m10 10 13-10m11 10 13-10',
  design: 'M18 50 37 11l25 9 13 33H24zm19-39 8 42m17-33L24 53M18 50 62 20l-17 33m-29 3h61M12 11h64',
  landscape: 'M5 44 34 8l45 18-23 28zM11 45l27-32 35 14-18 22zM20 43l21-24 26 10-13 16zM29 42l16-17 15 7-8 10zM40 40l8-10 6 4-4 5z',
  art: 'M13 49V13h36v36zm18 7V28h39v28zM37 45 57 8l21 37zM7 55h74M28 5v54',
  overlap: 'M10 43 30 13l44 10-19 30zm3-20 44-10 20 30-45 10zM28 34l14-23 17 23-16 20zm-16 0h65',
};
let route;
let motionOverride;
let fieldFrame;
let resizeFrame;
let transition = 0;
let sceneAnimations = [];

function motionEnabled() {
  return motionOverride ?? !systemMotion.matches;
}

function syncMotion() {
  const enabled = motionEnabled();
  document.body.dataset.motion = enabled ? 'on' : 'off';
  motionButton.setAttribute('aria-pressed', String(enabled));
  document.querySelector('#motion-state').textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
  if (!enabled) {
    sceneAnimations.forEach(animation => animation.finish());
    cancelAnimationFrame(fieldFrame);
    paintCrosses();
  }
}

function paintCrosses(origin, progress = 0) {
  if (!pen) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const step = width > 740 ? 32 : 25;
  pen.clearRect(0, 0, width, height);
  pen.strokeStyle = '#0f3d2e';
  pen.globalAlpha = .23 - progress * .16;
  pen.lineWidth = .8;
  pen.beginPath();
  for (let y = 14; y < height; y += step) {
    for (let x = 14; x < width; x += step) {
      const dx = origin ? x - origin.x : 0;
      const dy = origin ? y - origin.y : 0;
      const distance = Math.hypot(dx, dy) || 1;
      const shift = progress * (22 + 115 * Math.exp(-distance / 260)) / distance;
      const px = x + dx * shift;
      const py = y + dy * shift;
      pen.moveTo(px - 2.5, py);
      pen.lineTo(px + 2.5, py);
      pen.moveTo(px, py - 2.5);
      pen.lineTo(px, py + 2.5);
    }
  }
  pen.stroke();
}

function resizeField() {
  if (!pen) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * ratio);
  canvas.height = Math.round(canvas.clientHeight * ratio);
  pen.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintCrosses();
}

function burst(origin) {
  cancelAnimationFrame(fieldFrame);
  const start = performance.now();
  function tick(now) {
    const time = Math.min(1, (now - start) / 420);
    const displacement = Math.sin(Math.PI * time) ** .72;
    paintCrosses(origin, displacement);
    if (time < 1) fieldFrame = requestAnimationFrame(tick);
  }
  fieldFrame = requestAnimationFrame(tick);
}

function readRoute() {
  const [sectionId, itemId] = location.hash.slice(1).split('/').filter(Boolean);
  const section = sections.find(entry => entry.id === sectionId);
  const item = section?.items.find(entry => entry.id === itemId);
  return { section, item, level: item ? 3 : section ? 2 : 1 };
}

function figure(name) {
  return `<svg class="figure" viewBox="0 0 88 60" aria-hidden="true">
    <path class="aux" d="M4 53h79M14 3v55m61-55v55M4 13h79"/>
    <path d="${figures[name]}"/>
  </svg>`;
}

function hub() {
  return `<section class="hub">
    <div class="intro">
      <p class="eyebrow technical"><b>01</b> КАРТА ПРОСТРАНСТВА</p>
      <h1>АРК<span>А</span></h1>
      <h2>Город можно спроектировать заново.</h2>
      <p class="intro-copy">Сообщество студентов-архитекторов. Изучаем существующую застройку и придумываем, как город может работать лучше.</p>
      <p class="intro-note technical">ВЫБЕРИТЕ УЗЕЛ НА ЧЕРТЕЖЕ</p>
    </div>
    <div class="diagram">
      <span class="diagram-meta technical" aria-hidden="true">РИС. 01 / АКСОНОМЕТРИЯ</span>
      <img class="portal" src="assets/portal.svg" alt="" width="620" height="500" fetchpriority="high">
      <svg class="hub-guides" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path class="axis" d="M48 500H957M500 88V907"/>
        <path d="M230 200H345V344h100M830 260H725V357H624M860 540H738V493H686M200 610H305V560H419M670 830H556V705H510"/>
        <path d="M445 335v18m-9-9h18m170 4v18m-9-9h18m53 127v18m-9-9h18m-276 58v18m-9-9h18m82 136v18m-9-9h18"/>
      </svg>
      <nav class="hub-menu" aria-label="Разделы АРКИ">
        ${sections.map((section, index) => `<a class="hub-node" href="#/${section.id}" style="--x:${positions[index][0]}%;--y:${positions[index][1]}%">
          <span class="technical">УЗЕЛ ${section.number}</span><span class="node-title">${section.title}</span><span class="node-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </nav>
      <span class="diagram-scale technical" aria-hidden="true">0&nbsp;&nbsp;&nbsp;&nbsp; 1&nbsp;&nbsp;&nbsp;&nbsp; 2 М</span>
    </div>
  </section>`;
}

function crumbs(section, item) {
  return `<nav class="crumbs technical" aria-label="Путь страницы">
    <a href="#/">← КАРТА</a><span aria-hidden="true">/</span>
    ${item ? `<a href="#/${section.id}">${section.title}</a><span aria-hidden="true">/</span>` : ''}
    <span aria-current="page">${item?.title ?? section.title}</span>
  </nav>`;
}

function category(section) {
  return `<section class="sheet">
    <div class="sheet-head">
      ${crumbs(section)}
      <div><p class="eyebrow technical"><b>02</b> ЛИСТ ${section.number}</p><h1>${section.title}</h1></div>
      <p class="sheet-summary">${section.description}</p>
    </div>
    <div class="board" data-frame data-count="${section.items.length}">
      ${section.items.map((item, index) => `<a class="window" data-window href="#/${section.id}/${item.id}">
        ${anchors}
        <div class="window-top technical"><span>${section.number}.${String(index + 1).padStart(2, '0')}${item.demo ? ' / ПРИМЕР' : ''}</span><b aria-hidden="true">↗</b></div>
        ${figure(item.figure)}<h2>${item.title}</h2><p>${item.description}</p>
      </a>`).join('')}
      ${frameLayer}
    </div>
    <p class="sheet-note technical">+ ОПОРНЫЙ УЗЕЛ <span aria-hidden="true"> / </span> ВЫБЕРИТЕ ОКНО ДЛЯ ПРИБЛИЖЕНИЯ</p>
  </section>`;
}

function focus(section, item) {
  return `<section class="focus">
    ${crumbs(section, item)}
    <article class="focus-panel" data-frame data-window>
      ${anchors}
      <div class="focus-copy">
        <p class="eyebrow technical"><b>03</b> ${item.demo ? 'ДЕМОНСТРАЦИОННЫЙ ПРИМЕР' : 'ФОКУС'}</p>
        <h1>${item.title}</h1>
        <p>${item.detail ?? item.description}</p>
        ${item.link ? `<a class="action technical" href="${item.link[0]}">${item.link[1]} ↗</a>` : ''}
        ${item.form ? ideaForm() : ''}
      </div>
      <div class="focus-art">${item.figure === 'arch' ? '<img src="assets/portal.svg" alt="" width="620" height="500">' : figure(item.figure)}</div>
      ${frameLayer}
    </article>
  </section>`;
}

function ideaForm() {
  return `<form class="idea-form">
    <label>Как вас зовут<input name="name" maxlength="100" placeholder="Имя" required></label>
    <label>Как с вами связаться<input name="contact" maxlength="160" placeholder="Почта или Telegram" required></label>
    <label>Ваша идея<textarea name="idea" rows="3" maxlength="3000" placeholder="Что хочется исследовать или создать?" required></textarea></label>
    <p class="form-note">В прототипе черновик скачивается на устройство. Отправка редакторам пока не подключена.</p>
    <button class="action technical" type="submit">СКАЧАТЬ ЧЕРНОВИК ↓</button>
    <output class="form-result" aria-live="polite"></output>
  </form>`;
}

function svgPath(className, data) {
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('class', className);
  path.setAttribute('d', data);
  return path;
}

function drawFrame(animate = false) {
  const frame = scene.querySelector('[data-frame]');
  if (!frame) return;
  const layer = frame.querySelector('.frame-layer');
  if (layer.classList.contains('erased')) return;

  // DOM-координаты переводим в систему SVG с поправкой на масштаб сцены.
  const rect = layer.getBoundingClientRect();
  const { width, height } = getComputedStyle(layer);
  const scaleX = parseFloat(width) / rect.width;
  const scaleY = parseFloat(height) / rect.height;
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return;
  const points = new Map();
  const borders = [];
  const windows = frame.matches('[data-window]') ? [frame] : frame.querySelectorAll('[data-window]');
  for (const panel of windows) {
    const ends = [...panel.querySelectorAll('.anchor')].map(anchor => {
      const box = anchor.getBoundingClientRect();
      const x = Math.round((box.left - rect.left) * scaleX * 4) / 4;
      const y = Math.round((box.top - rect.top) * scaleY * 4) / 4;
      const point = { x, y, key: `${x},${y}` };
      points.set(point.key, point);
      return point;
    });
    ends.forEach((from, index) => borders.push([from, ends[(index + 1) % ends.length]]));
  }

  const ink = document.createDocumentFragment();
  const segments = new Set();
  const gap = 12; // Луч крестика занимает 6 px. До начала линии остаётся ещё 6 px.
  for (const [from, to] of borders) {
    const axis = from.y === to.y ? 'x' : 'y';
    const fixed = axis === 'x' ? 'y' : 'x';
    const min = Math.min(from[axis], to[axis]);
    const max = Math.max(from[axis], to[axis]);
    // В Т-стыке промежуточный крестик разбивает длинную сторону на отрезки.
    const joints = [...points.values()].filter(point =>
      point[fixed] === from[fixed] && point[axis] >= min && point[axis] <= max
    ).sort((a, b) => a[axis] - b[axis]);
    for (let i = 1; i < joints.length; i++) {
      const a = joints[i - 1];
      const b = joints[i];
      const key = `${a.key}:${b.key}`;
      if (segments.has(key) || b[axis] - a[axis] <= 2 * gap) continue;
      segments.add(key);
      const data = axis === 'x' ? `M${a.x + gap} ${a.y}H${b.x - gap}` : `M${a.x} ${a.y + gap}V${b.y - gap}`;
      const line = svgPath(animate ? 'frame-line draw' : 'frame-line', data);
      line.setAttribute('pathLength', '1');
      if (animate) line.style.animationDelay = `${Math.min(segments.size - 1, 6) * 5}ms`;
      ink.append(line);
    }
  }
  for (const { x, y } of points.values()) {
    ink.append(svgPath('frame-cross', `M${x - 6} ${y}h12M${x} ${y - 6}v12`));
  }
  layer.replaceChildren(ink);
}

function render(next, animate, focusHeading) {
  route = next;
  const { section, item, level } = next;
  scene.innerHTML = level === 1 ? hub() : level === 2 ? category(section) : focus(section, item);
  sheetCaption.textContent = ['01 — КАРТА ПРОСТРАНСТВА', '02 — ЛИСТ КАТЕГОРИИ', '03 — ФОКУС'][level - 1];
  document.title = level === 1 ? 'АРКА — пространство совместного' : `${item?.title ?? section.title} — АРКА`;
  window.scrollTo(0, 0);
  drawFrame(animate);
  if (focusHeading) {
    const heading = scene.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function animateScene(element, keyframes, duration) {
  const animation = element.animate(keyframes, { duration, easing: 'cubic-bezier(.23,.7,.28,1)', fill: 'both' });
  sceneAnimations.push(animation);
  return animation;
}

async function navigate(source) {
  const next = readRoute();
  const previous = route;
  const ticket = ++transition;
  sceneAnimations.forEach(animation => animation.cancel());
  sceneAnimations = [];
  scene.inert = false;

  if (!motionEnabled()) {
    render(next, false, true);
    return;
  }

  const sourceRect = source?.getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();
  const origin = {
    x: sourceRect ? sourceRect.left + sourceRect.width / 2 : innerWidth / 2,
    y: sourceRect ? sourceRect.top + sourceRect.height / 2 : innerHeight / 2,
  };
  const zoomIn = next.level > previous.level;
  const transformOrigin = `${origin.x - sceneRect.left}px ${origin.y - sceneRect.top}px`;
  scene.querySelector('.frame-layer')?.classList.add('erased');
  scene.inert = true;
  burst(origin);
  if (zoomIn && source?.matches('.window, .hub-node')) {
    for (const sibling of source.parentElement.querySelectorAll('.window, .hub-node')) {
      if (sibling === source) continue;
      const rect = sibling.getBoundingClientRect();
      const dx = (rect.left + rect.width / 2 - origin.x) * .33;
      const dy = (rect.top + rect.height / 2 - origin.y) * .33;
      animateScene(sibling, [{ translate: '0 0', opacity: 1 }, { translate: `${dx}px ${dy}px`, opacity: 0 }], 135);
    }
  }
  const outgoing = animateScene(scene, [
    { transform: 'scale(1)', opacity: 1, transformOrigin },
    { transform: zoomIn ? 'scale(1.15)' : 'scale(.96)', opacity: 0, transformOrigin },
  ], 135);
  try {
    await outgoing.finished;
  } catch {
    return;
  }
  if (ticket !== transition) return;
  sceneAnimations.forEach(animation => animation.cancel());
  sceneAnimations = [];
  scene.inert = false;
  const animate = motionEnabled();
  render(next, animate, true);
  if (!animate) return;
  const incoming = animateScene(scene, [
    { transform: zoomIn ? 'scale(.968)' : 'scale(1.025)', opacity: .25 },
    { transform: 'scale(1)', opacity: 1 },
  ], 300);
  incoming.finished.then(() => {
    if (ticket !== transition) return;
    incoming.cancel();
    sceneAnimations = [];
  }, () => {});
}

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  scene.focus();
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#/"]');
  if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.hash === location.hash) return;
  history.pushState(null, '', link.hash);
  navigate(link);
});
window.addEventListener('hashchange', () => navigate());
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || route.level === 1) return;
  const parent = route.level === 3 ? `#/${route.section.id}` : '#/';
  if (parent === location.hash) return;
  history.pushState(null, '', parent);
  navigate();
});
scene.addEventListener('submit', event => {
  if (!event.target.matches('.idea-form')) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const text = `АРКА / ЧЕРНОВИК ИДЕИ\n\nИмя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\n\n${data.get('idea')}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'arka-idea.txt';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  event.target.querySelector('output').textContent = 'Черновик подготовлен для скачивания.';
});
motionButton.addEventListener('click', () => {
  motionOverride = !motionEnabled();
  syncMotion();
});
systemMotion.addEventListener('change', syncMotion);
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeField();
    drawFrame();
  });
});

syncMotion();
resizeField();
render(readRoute(), false, false);
