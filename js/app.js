/* ═════════════════════════════════════════════════════════
   3D Project Tree — Application Logic
   不用修改这个文件，定制请编辑 config.js
   ═════════════════════════════════════════════════════════ */

// ============================================================
//  LAYOUT
// ============================================================
const LAYOUT = {
  compactH: TREE_CONFIG.compactH,
  expandedH: TREE_CONFIG.expandedH,
  gap: TREE_CONFIG.gap,
  compactW: 0,
  expandedW: 0,
};

function updateLayout() {
  const w = container.clientWidth;
  LAYOUT.compactW = Math.min(w * TREE_CONFIG.compactWRatio, TREE_CONFIG.compactWMax);
  LAYOUT.expandedW = Math.min(w * TREE_CONFIG.expandedWRatio, TREE_CONFIG.expandedWMax);
}

// ============================================================
//  STATE
// ============================================================
let currentItems = [];
let focusIndex = 0;
let navStack = [{ node: TREE_DATA, title: TREE_DATA.icon + ' ' + TREE_DATA.name, focus: 0 }];
let isTransitioning = false;

const container = document.getElementById('card-container');

function getTagColor(tag) { return TAG_COLORS[tag] || '#636e72'; }
function hasKids(item) { return item.children && item.children.length > 0; }

// ============================================================
//  RENDER
// ============================================================
function renderCards(node, initialFocus) {
  currentItems = node.children || [];
  focusIndex = initialFocus || 0;
  container.innerHTML = '';
  if (!currentItems.length) {
    container.innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.12);font-size:14px;text-align:center;">📭 空文件夹</div>`;
    return;
  }
  updateLayout();

  currentItems.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'card-item';
    card.dataset.index = i;
    const color = getTagColor(item.tag);
    const count = hasKids(item) ? item.children.length : 0;

    card.innerHTML = `
      <div class="card-glow" style="background:${color};"></div>
      <div class="card-glass"></div>
      <div class="card-shine"></div>
      <div class="card-inner">
        <div class="card-row">
          <div class="card-icon">${item.icon || '📄'}</div>
          <div class="card-name">${item.name}</div>
          <div class="card-desc-compact">${item.desc || ''}</div>
          <div class="card-compact-tag" style="color:${color};">${item.tag || '—'}</div>
        </div>
        <div class="card-extras">
          <div class="card-desc">${item.desc || ''}</div>
          <div class="card-meta">
            <span class="card-meta-tag" style="color:${color};background:${color}18;">${item.tag || 'item'}</span>
            ${count ? `<span class="card-meta-count">📦 ${count} 项</span>` : ''}
            ${hasKids(item) ? '<span class="card-meta-enter">展开 →</span>' : ''}
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (isTransitioning) return;
      if (i === focusIndex) enterFolder(item);
      else scrollTo(i);
    });

    container.appendChild(card);
  });

  layoutCards();
  updateDepth();
  TREE_HOOKS.onRender(currentItems);
}

function layoutCards() {
  const cards = container.querySelectorAll('.card-item');
  const vh = innerHeight;
  const focusY = vh / 2;
  const { compactH, expandedH, gap, compactW, expandedW } = LAYOUT;
  const cw = container.clientWidth;

  cards.forEach((card, i) => {
    const off = i - focusIndex;
    if (off < -TREE_CONFIG.visibleRange || off > TREE_CONFIG.visibleRange) {
      card.style.display = 'none'; return;
    }
    card.style.display = 'flex';

    const focused = off === 0;
    const h = focused ? expandedH : compactH;
    const w = focused ? expandedW : compactW;

    let y;
    if (off === 0) {
      y = focusY - h / 2;
    } else if (off < 0) {
      y = focusY - expandedH / 2 - Math.abs(off) * (gap + compactH);
    } else {
      y = focusY + expandedH / 2 + off * gap + (off - 1) * compactH;
    }

    const baseLeft = TREE_CONFIG.leftPct / 100 * cw + TREE_CONFIG.leftOffset;
    const liftY = focused ? TREE_CONFIG.focusedLiftY : 0;
    card.style.left = baseLeft + 'px';
    card.style.top = (y + liftY) + 'px';
    card.style.width = w + 'px';
    card.style.height = h + 'px';
    const tiltX = off * TREE_CONFIG.tiltPerOffset;
    const scale = focused ? TREE_CONFIG.focusedScale : 1;
    card.style.transform = `scale(${scale}) rotateX(${tiltX}deg) rotateY(${TREE_CONFIG.rotateY}deg) rotateZ(${TREE_CONFIG.rotateZ}deg)`;
    card.style.transformOrigin = 'center center';

    if (focused) {
      card.style.opacity = '1';
      card.style.filter = 'drop-shadow(0 12px 40px rgba(0,0,0,0.6))';
      card.style.zIndex = String(TREE_CONFIG.focusedZIndex);
      card.classList.add('focused');
    } else {
      const fade = Math.max(TREE_CONFIG.minOpacity, 1 - Math.abs(off) * TREE_CONFIG.fadePerOffset);
      card.style.opacity = fade + '';
      card.style.filter = 'blur(0)';
      card.style.zIndex = '5';
      card.classList.remove('focused');
    }
  });
}

// ============================================================
//  NAVIGATION
// ============================================================
function scrollTo(index) {
  if (isTransitioning || index < 0 || index >= currentItems.length) return;
  focusIndex = index;
  layoutCards();
  updateDepth();
  TREE_HOOKS.onFocusChange(index, currentItems[index]);
}
function scrollUp() { scrollTo(focusIndex - 1); }
function scrollDown() { scrollTo(focusIndex + 1); }

function enterFolder(item) {
  if (isTransitioning || !hasKids(item)) {
    if (!hasKids(item)) {
      const card = container.querySelector('.card-item.focused');
      if (card) {
        card.style.transition = 'transform 0.12s';
        card.style.transform = 'scale(0.97)';
        setTimeout(() => { card.style.transform = ''; }, 180);
      }
    }
    return;
  }

  isTransitioning = true;
  TREE_HOOKS.onEnterFolder(item);

  const cards = container.querySelectorAll('.card-item');
  cards.forEach((card, i) => {
    const off = i - focusIndex;
    card.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
    card.style.transform = off >= 0 ? 'translateX(-60px) scale(0.95)' : 'translateX(60px) scale(0.95)';
    card.style.opacity = '0';
  });

  setTimeout(() => {
    navStack[navStack.length - 1].focus = focusIndex;
    navStack.push({ node: item, title: `${item.icon || '📁'} ${item.name}`, focus: 0 });
    updateBreadcrumb();
    renderCards(item);

    const newCards = container.querySelectorAll('.card-item');
    newCards.forEach((card, i) => {
      card.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.opacity = '';
        card.style.transform = '';
        setTimeout(() => { card.style.transition = ''; }, 400);
      }, 50 + i * 30);
    });
    setTimeout(() => { isTransitioning = false; }, 500);
  }, 300);
}

function goBack() {
  if (isTransitioning || navStack.length <= 1) return;
  isTransitioning = true;
  TREE_HOOKS.onGoBack(navStack[navStack.length - 1].node);

  const cards = container.querySelectorAll('.card-item');
  cards.forEach((card, i) => {
    card.style.transition = 'all 0.25s cubic-bezier(0.4,0,0.2,1)';
    card.style.transform = 'scale(0.9)';
    card.style.opacity = '0';
  });

  setTimeout(() => {
    navStack.pop();
    const prev = navStack[navStack.length - 1];
    focusIndex = prev.focus || 0;
    updateBreadcrumb();
    renderCards(prev.node, prev.focus || 0);

    const newCards = container.querySelectorAll('.card-item');
    newCards.forEach((card, i) => {
      card.style.transition = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.opacity = '0';
      setTimeout(() => {
        card.style.opacity = '';
        setTimeout(() => { card.style.transition = ''; }, 350);
      }, 40 + i * 20);
    });
    setTimeout(() => { isTransitioning = false; }, 450);
  }, 250);
}

function goRoot() {
  if (isTransitioning) return;
  while (navStack.length > 1) navStack.pop();
  focusIndex = navStack[0].focus || 0;
  updateBreadcrumb();
  renderCards(navStack[0].node, navStack[0].focus || 0);
  TREE_HOOKS.onGoRoot();
}

// ============================================================
//  BREADCRUMB
// ============================================================
function updateBreadcrumb() {
  const el = document.getElementById('breadcrumb');
  el.innerHTML = '';
  navStack.forEach((item, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep'; sep.textContent = '›';
      el.appendChild(sep);
    }
    const crumb = document.createElement('span');
    crumb.className = 'item' + (i === navStack.length - 1 ? ' active' : '');
    crumb.textContent = item.title;
    crumb.addEventListener('click', () => {
      if (i < navStack.length - 1 && !isTransitioning) {
        while (navStack.length > i + 1) navStack.pop();
        const prev = navStack[navStack.length - 1];
        focusIndex = prev.focus || 0;
        updateBreadcrumb();
        renderCards(prev.node, prev.focus || 0);
      }
    });
    el.appendChild(crumb);
  });
}

function updateDepth() {
  const el = document.getElementById('depth-indicator');
  el.textContent = navStack.length === 1
    ? `📁 根目录 · ${currentItems.length} 项`
    : navStack.map(n => n.title).join(' › ') + ` · ${currentItems.length} 项`;
}

// ============================================================
//  INPUT
// ============================================================
const stage = document.getElementById('card-stage');

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (!isTransitioning) e.deltaY > 0 ? scrollDown() : scrollUp();
}, { passive: false });

let touchY = 0, touching = false;
stage.addEventListener('touchstart', (e) => {
  touchY = e.touches[0].clientY; touching = true;
}, { passive: true });
stage.addEventListener('touchend', (e) => {
  if (!touching) return;
  touching = false;
  if (isTransitioning) return;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dy) > 30) dy < 0 ? scrollDown() : scrollUp();
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); scrollDown(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); scrollUp(); }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (currentItems[focusIndex]) enterFolder(currentItems[focusIndex]);
  } else if (e.key === 'Escape' || e.key === 'Backspace') { goBack(); }
  else if (e.key === 'r' || e.key === 'R') { goRoot(); }
});

addEventListener('resize', () => { if (!isTransitioning) layoutCards(); });

// ============================================================
//  BACKGROUND PARTICLES
// ============================================================
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgParticles = [];

function resizeBg() { bgCanvas.width = innerWidth; bgCanvas.height = innerHeight; }
resizeBg();
addEventListener('resize', resizeBg);

class BgParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.sz = Math.random() * 2 + 0.5;
    this.sx = (Math.random() - 0.5) * 0.2;
    this.sy = (Math.random() - 0.5) * 0.2;
    this.o = Math.random() * 0.25 + 0.05;
  }
  update() {
    this.x += this.sx; this.y += this.sy;
    if (this.x < 0 || this.x > bgCanvas.width) this.sx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.sy *= -1;
  }
  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(108,92,231,${this.o})`;
    bgCtx.fill();
  }
}

let bgParticleCount = 100;
for (let i = 0; i < bgParticleCount; i++) bgParticles.push(new BgParticle());

let bgMouseX = -1e4, bgMouseY = -1e4;
addEventListener('mousemove', (e) => { bgMouseX = e.clientX; bgMouseY = e.clientY; });

function animateBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const grad = bgCtx.createRadialGradient(bgMouseX, bgMouseY, 0, bgMouseX, bgMouseY, 500);
  grad.addColorStop(0, 'rgba(108,92,231,0.03)');
  grad.addColorStop(1, 'rgba(5,5,16,0)');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles.forEach(p => { p.update(); p.draw(); });
  for (let i = 0; i < bgParticles.length; i++) {
    for (let j = i+1; j < bgParticles.length; j++) {
      const dx = bgParticles[i].x - bgParticles[j].x;
      const dy = bgParticles[i].y - bgParticles[j].y;
      const d = dx * dx + dy * dy;
      if (d < 14400) {
        bgCtx.beginPath();
        bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
        bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
        bgCtx.strokeStyle = `rgba(108,92,231,${0.06 * (1 - Math.sqrt(d) / 120)})`;
        bgCtx.lineWidth = 0.5;
        bgCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateBg);
}
animateBg();

// ============================================================
//  INIT
// ============================================================
// Set CSS variable for perspective
document.getElementById('card-stage').style.setProperty('--perspective', TREE_CONFIG.perspective + 'px');

renderCards(TREE_DATA);
updateBreadcrumb();

setTimeout(() => {
  document.getElementById('loading').classList.add('hide');
  setTimeout(() => document.getElementById('loading').style.display = 'none', 800);
}, 400);

setTimeout(() => {
  const hint = document.getElementById('hint-text');
  if (hint) hint.style.opacity = '0';
}, 10000);

TREE_HOOKS.onReady();

console.log('🚀 3D Project Tree 已加载');
console.log('📝 编辑 js/config.js 中的 TREE_DATA 来替换项目树');
console.log('⌨️ ↑↓ 选择 | Enter/点击 展开 | ESC 返回 | R 回根');
console.log('✋ 点击"手势"开启摄像头控制');
