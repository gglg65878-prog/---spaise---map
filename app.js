'use strict';

const scene = document.querySelector('#scene');
const canvas = document.querySelector('#cross-field');
const pen = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const svgNS = 'http://www.w3.org/2000/svg';
const corners = ['tl', 'tr', 'br', 'bl'];
const anchors = corners.map(corner => `<i class="anchor" data-corner="${corner}" aria-hidden="true"></i>`).join('');
const frameLayer = '<svg class="frame-layer" aria-hidden="true"></svg>';
const hubAxes = [23, 50, 77];
const hubLayout = [
  'projects', null, 'research',
  null, 'events', null,
  'about', null, 'idea',
];
const hubSymbols = {
  projects: 'M6 40V9h36v31H32V27a8 8 0 0 0-16 0v13H6Zm0-27h36M11 9v31m26-31v31',
  research: 'M5 28 23 7l20 11-16 23L5 28Zm8-1 12-14 10 6-10 15-12-7Zm-9 8 17 9m12-5 11-17',
  events: 'M8 40V11h32v29H8Zm0-21h32M16 7v8m16-8v8M15 25h3m5 0h3m5 0h3m-19 7h3m5 0h3m5 0h3',
  about: 'M5 9h26v26H5zM17 15h26v26H17zm0 0 14 20m0-20L17 35',
  idea: 'M24 5v7m15-1-5 5m10 9h-8M9 11l5 5M4 25h8m6 12h12m-10 5h8m-10-5v-3l-4-7a10 10 0 1 1 20 0l-4 7v3',
};
const figures = {
  arch: 'M12 53V14h51l14 12v27H60V37a12 12 0 0 0-24 0v16H12zm0-39 14-10h38l13 22M26 4v39m10 10 13-10m11 10 13-10',
  design: 'M18 50 37 11l25 9 13 33H24zm19-39 8 42m17-33L24 53M18 50 62 20l-17 33m-29 3h61M12 11h64',
  landscape: 'M5 44 34 8l45 18-23 28zM11 45l27-32 35 14-18 22zM20 43l21-24 26 10-13 16zM29 42l16-17 15 7-8 10zM40 40l8-10 6 4-4 5z',
  art: 'M13 49V13h36v36zm18 7V28h39v28zM37 45 57 8l21 37zM7 55h74M28 5v54',
  overlap: 'M10 43 30 13l44 10-19 30zm3-20 44-10 20 30-45 10zM28 34l14-23 17 23-16 20zm-16 0h65',
};
let route;
let fieldFrame;
let resizeFrame;
let transition = 0;
let sceneAnimations = [];

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
  const guides = hubAxes.map(axis => `M${axis} 6V94 M3 ${axis}H97`).join(' ');
  return `<section class="hub" aria-labelledby="hub-title">
    <header class="hub-head">
      <p class="eyebrow technical"><b>01</b> АРКА / ГЛАВНОЕ МЕНЮ</p>
      <h1 id="hub-title">Карта пространства</h1>
    </header>
    <nav class="hub-grid" aria-label="Разделы АРКИ">
      <svg class="hub-guides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="${guides}"/>
      </svg>
      ${hubLayout.map((id, index) => {
        const x = hubAxes[index % hubAxes.length];
        const y = hubAxes[Math.floor(index / hubAxes.length)];
        const style = `--x:${x}%;--y:${y}%`;
        if (!id) return `<i class="hub-joint" style="${style}" aria-hidden="true"></i>`;
        const section = sections.find(entry => entry.id === id);
        return `<a class="hub-node" href="#/${id}" style="${style}" aria-label="${section.title}">
          <svg class="hub-mark" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M17 6h6v11h11v6H23v11h-6V23H6v-6h11z"/>
          </svg>
          <span class="hub-preview" aria-hidden="true">
            <svg viewBox="0 0 48 48"><path d="${hubSymbols[id]}"/></svg>
            <span class="technical">${section.title}</span>
          </span>
        </a>`;
      }).join('')}
      <div class="hub-cursor" aria-hidden="true">
        <i class="hub-cursor-core"></i>
        <i class="hub-cursor-hair"></i>
      </div>
    </nav>
    <p class="hub-hint technical"><i class="legend-cross" aria-hidden="true"></i><span class="hint-pointer">Наведите на крест, чтобы увидеть символ раздела</span><span class="hint-dot">Точка ходит по осям и магнитится к крестам</span><span class="hint-touch">Нажмите на крест, чтобы открыть раздел</span></p>
  </section>`;
}

// Плавающая точка главного меню: ходит только вдоль осей и «магнитится»
// к ближайшему кресту, когда её к нему приближают.
let cursor;
let cursorTarget = { c: 1, r: 1 };
let cursorPos = { x: 50, y: 50 };
let cursorLocked = false;
let cursorLastTick = 0;
let cursorTick = null;
const CURSOR_MAGNET_R = 56;
const CURSOR_RELEASE_R = 96;
let cursorPreviewNode = null;

function hubCursorSetPreview(node) {
  if (node === cursorPreviewNode) return;
  if (cursorPreviewNode) cursorPreviewNode.classList.remove('is-forced');
  cursorPreviewNode = node;
  if (node) node.classList.add('is-forced');
}

function nearestAxisIndex(value, axes) {
  let best = 0;
  let diff = 1 / 0;
  axes.forEach((axis, index) => {
    const d = Math.abs(value - axis);
    if (d < diff) {
      diff = d;
      best = index;
    }
  });
  return best;
}

function hubCursorInit() {
  hubCursorStop();
  cursor = scene.querySelector('.hub-cursor');
  if (!cursor) return;
  cursorTarget = { c: 1, r: 1 };
  cursorPos = { x: 50, y: 50 };
  cursorLocked = false;
  cursorPreviewNode = null;
  cursorLastTick = performance.now();
  hubCursorTick();
}

function hubCursorStop() {
  if (cursorTick) {
    cancelAnimationFrame(cursorTick);
    cursorTick = null;
  }
}

function hubCursorMove(event) {
  if (route.level !== 1 || !cursor) return;
  const grid = scene.querySelector('.hub-grid');
  const rect = grid.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  if (px < 0 || py < 0 || px > rect.width || py > rect.height) return;
  cursorTarget.c = nearestAxisIndex((px / rect.width) * 100, hubAxes);
  cursorTarget.r = nearestAxisIndex((py / rect.height) * 100, hubAxes);
  const cx = (hubAxes[cursorTarget.c] / 100) * rect.width;
  const cy = (hubAxes[cursorTarget.r] / 100) * rect.height;
  const d = Math.hypot(px - cx, py - cy);
  if (!cursorLocked && d < CURSOR_MAGNET_R) {
    cursorLocked = true;
    cursor.classList.add('is-lock');
  } else if (cursorLocked && d > CURSOR_RELEASE_R) {
    cursorLocked = false;
    cursor.classList.remove('is-lock');
  }
}

function hubCursorTick() {
  const now = performance.now();
  const dt = Math.max(0.001, Math.min(0.05, (now - cursorLastTick) / 1000));
  cursorLastTick = now;
  if (!cursor) return;

  const targetX = hubAxes[cursorTarget.c];
  const targetY = hubAxes[cursorTarget.r];
  const k = reducedMotion.matches ? 1 : 1 - Math.exp(-14 * dt);
  const snap = cursorLocked ? 1 : k;
  cursorPos.x += (targetX - cursorPos.x) * snap;
  cursorPos.y += (targetY - cursorPos.y) * snap;

  cursor.style.left = `${cursorPos.x}%`;
  cursor.style.top = `${cursorPos.y}%`;

  // Предпросмотр появляется, когда точка стоит на кресте узла,
  // независимо от того, где сам курсор.
  const PREVIEW_DISTANCE = 25;
  let previewNode = null;
  const grid = scene.querySelector('.hub-grid');
  if (grid) {
    const rect = grid.getBoundingClientRect();
    const dist = (rect.width / 100) * Math.hypot(
      targetX - cursorPos.x,
      targetY - cursorPos.y
    );
    if (dist <= PREVIEW_DISTANCE) {
      const id = hubLayout[cursorTarget.r * 3 + cursorTarget.c];
      if (id) previewNode = scene.querySelector(`.hub-node[href="#/${id}"]`);
    }
  }
  hubCursorSetPreview(previewNode);

  cursorTick = requestAnimationFrame(hubCursorTick);
}

function hubCursorStep(dx, dy) {
  if (route.level !== 1 || !cursor) return;
  const c = Math.max(0, Math.min(2, cursorTarget.c + dx));
  const r = Math.max(0, Math.min(2, cursorTarget.r + dy));
  if (c === cursorTarget.c && r === cursorTarget.r) return;
  cursorTarget = { c, r };
  cursorLocked = false;
  cursor.classList.remove('is-lock');
}

function hubCursorOpen() {
  const section = sections.find(entry => entry.id === hubLayout[cursorTarget.r * 3 + cursorTarget.c]);
  if (!section) return;
  const anchor = scene.querySelector(`.hub-node[href="#/${section.id}"]`);
  history.pushState(null, '', `#${section.id}`);
  navigate(anchor);
}

function hubCursorKey(event) {
  if (route.level !== 1) return;
  if (event.target && event.target.closest?.('a')) return;
  let moved = false;
  if (event.key === 'ArrowUp') {
    hubCursorStep(0, -1);
    moved = true;
  } else if (event.key === 'ArrowDown') {
    hubCursorStep(0, 1);
    moved = true;
  } else if (event.key === 'ArrowLeft') {
    hubCursorStep(-1, 0);
    moved = true;
  } else if (event.key === 'ArrowRight') {
    hubCursorStep(1, 0);
    moved = true;
  } else if (event.key === 'Enter' || event.key === ' ') {
    hubCursorOpen();
    return;
  }
  if (moved) event.preventDefault();
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
  document.body.dataset.level = level;
  scene.innerHTML = level === 1 ? hub() : level === 2 ? category(section) : focus(section, item);
  document.title = level === 1 ? 'АРКА — пространство совместного' : `${item?.title ?? section.title} — АРКА`;
  window.scrollTo(0, 0);
  drawFrame(animate);
  if (level === 1) hubCursorInit(); else hubCursorStop();
  if (focusHeading) {
    const heading = scene.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function animateScene(element, keyframes, duration, easing = 'cubic-bezier(.23,.7,.28,1)') {
  const animation = element.animate(keyframes, { duration, easing, fill: 'both' });
  sceneAnimations.push(animation);
  return animation;
}

function expandHubNode({ x, y }, markWidth) {
  const layer = document.createElement('div');
  layer.className = 'hub-expansion';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="hub-expansion-frame"></div><svg></svg>';
  document.body.append(layer);

  const arm = markWidth * .275;
  const split = markWidth * .45;
  const inset = 8;
  const duration = 390;
  const openAt = .33;
  const stretch = 'cubic-bezier(.28,.04,.2,1)';
  const shift = (dx, dy) => `translate(${x + dx}px, ${y + dy}px)`;
  const farEdge = `calc(100% - ${inset}px)`;
  const drawing = layer.querySelector('svg');
  for (const side of [-1, 1]) {
    // В исходном положении два Г-образных штриха складываются в крест.
    const end = -side * arm;
    const corner = svgPath('hub-expansion-corner', `M${end} 0H0V${end}`);
    corner.setAttribute('stroke-width', markWidth * .15);
    drawing.append(corner);
    const push = -side * markWidth * .13;
    const start = `${inset}px`;
    const edge = side < 0 ? start : farEdge;
    animateScene(corner, [
      { transform: shift(0, 0), offset: 0 },
      { transform: shift(push, push), offset: .15, easing: 'ease-out' },
      { transform: shift(side * split, side * split), offset: openAt, easing: stretch },
      { transform: `translate(${edge}, ${edge})`, offset: 1 },
    ], duration, 'linear');
  }

  const initialFrame = { left: `${x - split}px`, top: `${y - split}px`, width: `${2 * split}px`, height: `${2 * split}px` };
  const fullSize = `calc(100% - ${2 * inset}px)`;
  const frame = animateScene(layer.firstElementChild, [
    { ...initialFrame, opacity: 0, offset: 0 },
    { ...initialFrame, opacity: 0, offset: openAt, easing: stretch },
    { left: `${inset}px`, top: `${inset}px`, width: fullSize, height: fullSize, opacity: 1, offset: 1 },
  ], duration, 'linear');
  return { layer, frame };
}

async function navigate(source) {
  const next = readRoute();
  const previous = route;
  const ticket = ++transition;
  sceneAnimations.forEach(animation => animation.cancel());
  sceneAnimations = [];
  document.querySelector('.hub-expansion')?.remove();
  scene.querySelector('.hub-source')?.classList.remove('hub-source');
  scene.inert = false;

  if (reducedMotion.matches) {
    render(next, false, true);
    return;
  }

  const zoomIn = next.level > previous.level;
  const hubMark = zoomIn ? source?.querySelector('.hub-mark') : null;
  const sourceRect = (hubMark ?? source)?.getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();
  const origin = {
    x: sourceRect ? sourceRect.left + sourceRect.width / 2 : innerWidth / 2,
    y: sourceRect ? sourceRect.top + sourceRect.height / 2 : innerHeight / 2,
  };
  const transformOrigin = `${origin.x - sceneRect.left}px ${origin.y - sceneRect.top}px`;
  scene.querySelector('.frame-layer')?.classList.add('erased');
  scene.inert = true;
  const expansion = hubMark ? expandHubNode(origin, sourceRect.width) : null;
  if (expansion) {
    source.classList.add('hub-source');
  } else {
    burst(origin);
  }
  if (zoomIn && source?.matches('.window, .hub-node')) {
    for (const sibling of source.parentElement.querySelectorAll('.window, .hub-node, .hub-joint')) {
      if (sibling === source) continue;
      const rect = sibling.getBoundingClientRect();
      const dx = (rect.left + rect.width / 2 - origin.x) * .33;
      const dy = (rect.top + rect.height / 2 - origin.y) * .33;
      animateScene(sibling, [{ translate: '0 0', opacity: 1 }, { translate: `${dx}px ${dy}px`, opacity: 0 }], expansion ? 245 : 135);
    }
  }
  const outgoing = expansion?.frame ?? animateScene(scene, [
    { transform: 'scale(1)', opacity: 1, transformOrigin },
    { transform: zoomIn ? 'scale(1.15)' : 'scale(.96)', opacity: 0, transformOrigin },
  ], 135);
  try {
    await outgoing.finished;
  } catch {
    return;
  }
  if (ticket !== transition) return;
  if (!expansion) {
    sceneAnimations.forEach(animation => animation.cancel());
    sceneAnimations = [];
  }
  scene.inert = false;
  const animate = !reducedMotion.matches;
  render(next, animate, true);
  if (!animate) {
    expansion?.layer.remove();
    sceneAnimations = [];
    return;
  }
  const incoming = expansion ? animateScene(expansion.layer, [{ opacity: 1 }, { opacity: 0 }], 100) : animateScene(scene, [
    { transform: zoomIn ? 'scale(.968)' : 'scale(1.025)', opacity: .25 },
    { transform: 'scale(1)', opacity: 1 },
  ], 300);
  incoming.finished.then(() => {
    if (ticket !== transition) return;
    expansion?.layer.remove();
    sceneAnimations.forEach(animation => animation.cancel());
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
window.addEventListener('pointermove', hubCursorMove);
document.addEventListener('keydown', hubCursorKey);
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
reducedMotion.addEventListener('change', ({ matches }) => {
  if (!matches) return;
  sceneAnimations.forEach(animation => animation.finish());
  cancelAnimationFrame(fieldFrame);
  paintCrosses();
});
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeField();
    drawFrame();
  });
});

resizeField();
render(readRoute(), false, false);
