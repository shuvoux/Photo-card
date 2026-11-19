import { templates, fonts, baseCss } from './templates.js';

const STORAGE_KEY = 'photocard-studio-v1';
const THEME_KEY = 'photocard-studio-theme';
const EXPORT_SIZE = 1080;
const EXPORT_SCALE = 2;

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/* A self-contained placeholder so the first card looks finished and exports safely. */
const DEMO_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#251a4d"/><stop offset="0.52" stop-color="#6a3df0"/><stop offset="1" stop-color="#ff8a5b"/>
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#100c22"/><stop offset="1" stop-color="#100c22" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="1200" fill="url(#g)"/>
    <circle cx="905" cy="292" r="196" fill="#ffd166" opacity="0.92"/>
    <circle cx="250" cy="240" r="210" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
    <circle cx="250" cy="240" r="128" fill="#ffffff" opacity="0.06"/>
    <path d="M0 786 L322 528 L604 742 L902 468 L1200 754 L1200 1200 L0 1200 Z" fill="#1a1233" opacity="0.86"/>
    <path d="M0 930 L302 748 L642 968 L986 706 L1200 902 L1200 1200 L0 1200 Z" fill="#0e0a1e" opacity="0.94"/>
    <rect y="820" width="1200" height="380" fill="url(#fade)"/>
  </svg>`);

const DEFAULT_MEDIA = {
  image: DEMO_IMAGE,
  imageSource: 'demo',
  imageCors: null,
  zoom: 1,
  x: 0,
  y: 0,
  fit: 'cover',
  logo: '',
  logoSource: 'none',
  ad: '',
  adSource: 'none'
};

const state = {
  templateId: templates[0].id,
  content: {},
  style: {},
  media: { ...DEFAULT_MEDIA }
};

const el = {};
let saveTimer = null;
let previewScale = 0.5;
let busy = false;
let drag = null;

/* ------------------------------------------------------------------ helpers */

const $ = (id) => document.getElementById(id);

const fontStack = (id) => (fonts.find((f) => f.id === id) || fonts[0]).stack;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const formatText = (value) => escapeHtml(value || '').replace(/\n/g, '<br>');

const slug = (value) =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card';

function toast(message, kind = 'info') {
  const node = document.createElement('div');
  node.className = `toast toast-${kind}`;
  node.textContent = message;
  el.toastHost.appendChild(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 260);
  }, kind === 'error' ? 5200 : 2800);
}

function setSaveStatus(text, faded = false) {
  el.saveState.textContent = text;
  el.saveState.classList.toggle('is-faded', faded);
}

/* -------------------------------------------------------------- state setup */

function templateById(id) {
  return templates.find((t) => t.id === id) || templates[0];
}

function contentFor(tpl) {
  if (!state.content[tpl.id]) {
    state.content[tpl.id] = {};
    tpl.fields.forEach((field) => {
      state.content[tpl.id][field.key] = tpl.values[field.key] ?? '';
    });
  }
  return state.content[tpl.id];
}

function styleFor(tpl) {
  if (!state.style[tpl.id]) {
    state.style[tpl.id] = { ...tpl.defaults, headlineScale: 1 };
  }
  return state.style[tpl.id];
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveStatus('Saved locally');
  } catch (err) {
    try {
      const slim = {
        ...state,
        media: { ...state.media, image: state.media.imageSource === 'demo' ? DEMO_IMAGE : '', logo: '', ad: '' }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      setSaveStatus('Saved (photos not cached)', true);
    } catch (err2) {
      setSaveStatus('Local save unavailable', true);
    }
  }
}

function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 350);
}

function loadState() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (err) {
    saved = null;
  }
  if (!saved || typeof saved !== 'object') return;

  if (saved.templateId && templates.some((t) => t.id === saved.templateId)) {
    state.templateId = saved.templateId;
  }
  if (saved.content && typeof saved.content === 'object') {
    // Merge so templates added later still get their defaults.
    templates.forEach((tpl) => {
      const stored = saved.content[tpl.id];
      if (!stored) return;
      state.content[tpl.id] = {};
      tpl.fields.forEach((field) => {
        state.content[tpl.id][field.key] =
          typeof stored[field.key] === 'string' ? stored[field.key] : tpl.values[field.key] ?? '';
      });
    });
  }
  if (saved.style && typeof saved.style === 'object') {
    templates.forEach((tpl) => {
      const stored = saved.style[tpl.id];
      if (!stored) return;
      state.style[tpl.id] = {
        accent: stored.accent || tpl.defaults.accent,
        bg: stored.bg || tpl.defaults.bg,
        text: stored.text || tpl.defaults.text,
        font: fonts.some((f) => f.id === stored.font) ? stored.font : tpl.defaults.font,
        headlineScale: typeof stored.headlineScale === 'number' ? stored.headlineScale : 1
      };
    });
  }
  if (saved.media && typeof saved.media === 'object') {
    state.media = { ...DEFAULT_MEDIA, ...saved.media };
    if (!state.media.image) state.media.image = DEMO_IMAGE;
  }
}

/* --------------------------------------------------------------- theme */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));
}

/* --------------------------------------------------------------- rendering */

function buildCard(tpl, values, style) {
  let html = tpl.html;
  tpl.fields.forEach((field) => {
    html = html.replaceAll(`{{${field.key}}}`, formatText(values[field.key]));
  });
  html = html
    .replaceAll('{{image}}', state.media.image || TRANSPARENT_PIXEL)
    .replaceAll('{{logo}}', state.media.logo || TRANSPARENT_PIXEL)
    .replaceAll('{{accent}}', style.accent)
    .replaceAll('{{bg}}', style.bg)
    .replaceAll('{{text}}', style.text)
    .replaceAll('{{font}}', fontStack(style.font));

  const holder = document.createElement('div');
  holder.innerHTML = html.trim();
  const card = holder.firstElementChild;
  card.style.setProperty('--accent', style.accent);
  card.style.setProperty('--bg', style.bg);
  card.style.setProperty('--text', style.text);
  card.style.setProperty('--font', fontStack(style.font));
  card.style.height = `${cardHeight()}px`;
  card.classList.toggle('has-logo', Boolean(state.media.logo));
  card.classList.toggle('has-image', Boolean(state.media.image) && state.media.imageSource !== 'demo');
  card.classList.toggle('has-ad', Boolean(state.media.ad));
  const font = fonts.find((f) => f.id === style.font);
  card.classList.toggle('is-bengali', Boolean(font && font.bengali));

  const adBand = document.createElement('div');
  adBand.className = 'ad-band';
  const adImage = document.createElement('img');
  adImage.src = state.media.ad || TRANSPARENT_PIXEL;
  adImage.alt = '';
  adBand.appendChild(adImage);
  card.appendChild(adBand);
  return card;
}

function cardHeight() {
  return Number(templateById(state.templateId).height) || EXPORT_SIZE;
}

function syncStageSize() {
  const height = cardHeight();
  el.canvasScale.style.height = `${height}px`;
  el.stageCard.style.height = `${height}px`;
  el.sizeBadge.textContent = `1080 × ${height}`;
  el.stageFoot.textContent = `Drag the photo to reposition · Export is 2160 × ${height * 2} px (2×) for crisp detail`;
}

function applyImageTransform() {
  const card = el.renderTarget.firstElementChild;
  if (!card) return;
  const img = card.querySelector('.main-image');
  if (!img) return;
  const { zoom, x, y, fit } = state.media;
  img.style.objectFit = fit;
  img.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
}

function fitHeadlines(card, scale = 1) {
  card.querySelectorAll('[data-fit]').forEach((node) => {
    if (!node.dataset.cssSize) {
      const cssSize = parseFloat(getComputedStyle(node).fontSize);
      node.dataset.cssSize = String(Number.isFinite(cssSize) ? cssSize : 40);
    }
    const max = parseFloat(getComputedStyle(node).maxHeight);
    if (!Number.isFinite(max)) return;
    let size = Math.round(Number(node.dataset.cssSize) * scale);
    node.style.fontSize = `${size}px`;
    // scrollHeight includes glyph overhang from tight line boxes, so compare it to
    // the layout cap instead of clientHeight to avoid shrinking text that already fits.
    let guard = 0;
    while (node.scrollHeight > max + 1 && size > 22 && guard < 60) {
      size -= 2;
      node.style.fontSize = `${size}px`;
      guard += 1;
    }
  });
}

function renderPreview({ rebuild = true } = {}) {
  const tpl = templateById(state.templateId);
  const values = contentFor(tpl);
  const style = styleFor(tpl);

  if (!el.templateStyles) {
    el.templateStyles = document.createElement('style');
    el.templateStyles.id = 'template-styles';
    document.head.appendChild(el.templateStyles);
  }
  const css = baseCss + '\n' + tpl.css;
  if (el.templateStyles.textContent !== css) el.templateStyles.textContent = css;

  if (rebuild) {
    el.renderTarget.replaceChildren(buildCard(tpl, values, style));
  }
  syncStageSize();
  applyImageTransform();
  fitHeadlines(el.renderTarget.firstElementChild, Number(style.headlineScale) || 1);
  fitPreview();
}

function renderTemplateGrid() {
  el.templateGrid.replaceChildren();
  el.templateCount.textContent = `${templates.length} design${templates.length === 1 ? '' : 's'}`;
  templates.forEach((tpl) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'template-btn';
    button.dataset.id = tpl.id;
    button.setAttribute('aria-pressed', String(tpl.id === state.templateId));
    button.innerHTML = `
      <span class="mini mini-${tpl.id}" aria-hidden="true"></span>
      <span class="template-name">${tpl.name}</span>`;
    button.addEventListener('click', () => selectTemplate(tpl.id));
    el.templateGrid.appendChild(button);
  });
}

function renderFields() {
  const tpl = templateById(state.templateId);
  const values = contentFor(tpl);
  el.contentFields.replaceChildren();
  el.templateDesc.textContent = tpl.description;
  el.stageName.textContent = tpl.name;
  el.templateTag.textContent = tpl.tag;

  tpl.fields.forEach((field) => {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    const label = document.createElement('span');
    label.className = 'field-label';
    label.textContent = field.label;

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }
    input.className = 'text-input';
    input.value = values[field.key] ?? '';
    input.spellcheck = true;
    input.addEventListener('input', () => {
      values[field.key] = input.value;
      renderPreview();
      saveState();
    });
    wrap.append(label, input);
    el.contentFields.appendChild(wrap);
  });
}

function renderStyleInputs() {
  const tpl = templateById(state.templateId);
  const style = styleFor(tpl);
  el.fontSelect.value = style.font;
  el.accentColor.value = style.accent;
  el.bgColor.value = style.bg;
  el.textColor.value = style.text;
  setColorLabel(el.accentHex, style.accent);
  setColorLabel(el.bgHex, style.bg);
  setColorLabel(el.textHex, style.text);
  el.headlineScaleOut.textContent = `${Math.round((Number(style.headlineScale) || 1) * 100)}%`;
}

function setColorLabel(node, value) {
  node.textContent = String(value).toUpperCase();
}

function renderMediaInputs() {
  const media = state.media;
  el.zoom.value = String(Math.round(media.zoom * 100));
  el.zoomOut.textContent = `${Math.round(media.zoom * 100)}%`;
  el.posX.value = String(Math.round(media.x));
  el.posXOut.textContent = `${Math.round(media.x)}px`;
  el.posY.value = String(Math.round(media.y));
  el.posYOut.textContent = `${Math.round(media.y)}px`;
  el.fit.value = media.fit;
  el.imageUrl.value = media.imageSource === 'url' ? media.imageCorsUrl || '' : '';
  el.logoUrl.value = media.logoSource === 'url' ? media.logoUrlValue || '' : '';
  el.adUrl.value = media.adSource === 'url' ? media.adUrlValue || '' : '';
  el.removeImage.hidden = !media.image || media.imageSource === 'demo';
  el.removeLogo.hidden = !media.logo;
  el.removeAd.hidden = !media.ad;

  if (media.ad) {
    el.adPreview.hidden = false;
    if (el.adThumb.getAttribute('src') !== media.ad) el.adThumb.src = media.ad;
    el.adHint.textContent = 'Optional. The strip is 110 px tall and sits at the bottom of the card.';
  } else {
    el.adPreview.hidden = true;
    el.adHint.textContent = 'Optional. Adds a 110 px sponsor strip at the bottom of the card.';
  }

  const hint = el.imageStatus;
  if (media.imageSource === 'demo') {
    hint.textContent = 'Using the built-in sample image. Upload your own to replace it.';
    hint.className = 'hint';
  } else if (media.imageSource === 'url' && media.imageCors === false) {
    hint.textContent = 'This host may block image export. Upload the file for guaranteed results.';
    hint.className = 'hint hint-warn';
  } else if (media.imageSource === 'url') {
    hint.textContent = 'Loaded from URL. Drag the photo in the preview to reposition it.';
    hint.className = 'hint';
  } else {
    hint.textContent = 'Photo uploaded. Drag it in the preview to reposition it.';
    hint.className = 'hint';
  }
}

function selectTemplate(id) {
  if (id === state.templateId) return;
  state.templateId = id;
  el.stageCard.classList.add('is-switching');
  setTimeout(() => el.stageCard.classList.remove('is-switching'), 220);
  renderTemplateGrid();
  renderFields();
  renderStyleInputs();
  renderPreview();
  saveState();
}

/* ---------------------------------------------------------------- fitting */

function fitPreview() {
  const area = el.stageCanvas;
  const availableW = area.clientWidth - 56;
  const availableH = area.clientHeight - 56;
  if (availableW <= 0 || availableH <= 0) return;
  const height = cardHeight();
  const scale = Math.min(availableW / EXPORT_SIZE, availableH / height);
  previewScale = Math.max(0.08, Math.min(scale, 1.4));
  el.canvasScale.style.transform = `scale(${previewScale})`;
  el.canvasFit.style.width = `${EXPORT_SIZE * previewScale}px`;
  el.canvasFit.style.height = `${height * previewScale}px`;
}

/* ------------------------------------------------------------------ images */

function setImage(source, { source: kind = 'file', cors = null, url = '' } = {}) {
  state.media.image = source;
  state.media.imageSource = kind;
  state.media.imageCors = cors;
  state.media.imageCorsUrl = url;
  state.media.zoom = 1;
  state.media.x = 0;
  state.media.y = 0;
  renderPreview();
  renderMediaInputs();
  saveState();
}

function readFile(file, maxMb = 12) {
  readImageFile(file, (data) => setImage(data, { source: 'file' }), maxMb);
}

function readImageFile(file, onLoad, maxMb = 12) {
  if (!file) return;
  if (!/^image\//.test(file.type)) {
    toast('That file is not an image.', 'error');
    return;
  }
  if (file.size > maxMb * 1024 * 1024) {
    toast(`Image is too large. Keep it under ${maxMb} MB.`, 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result));
  reader.onerror = () => toast('Could not read that file.', 'error');
  reader.readAsDataURL(file);
}

function loadFromUrl(url, kind = 'image') {
  const clean = url.trim();
  if (!clean) return;
  if (!/^(https?:|data:)/i.test(clean)) {
    toast('Use a full http(s) image URL.', 'error');
    return;
  }

  if (kind === 'logo') {
    state.media.logo = clean;
    state.media.logoSource = 'url';
    state.media.logoUrlValue = clean;
    renderPreview();
    renderMediaInputs();
    saveState();
    toast('Logo added.');
    return;
  }

  if (kind === 'ad') {
    state.media.ad = clean;
    state.media.adSource = 'url';
    state.media.adUrlValue = clean;
    renderPreview();
    renderMediaInputs();
    saveState();
    toast('Ad banner added.');
    return;
  }

  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.onload = () => {
    setImage(clean, { source: 'url', cors: true, url: clean });
    toast('Photo loaded.');
  };
  probe.onerror = () => {
    const plain = new Image();
    plain.onload = () => {
      setImage(clean, { source: 'url', cors: false, url: clean });
      toast('Photo loaded, but this host may block PNG export. Upload the file instead.', 'error');
    };
    plain.onerror = () => toast('That image could not be loaded.', 'error');
    plain.src = clean;
  };
  probe.src = clean;
}

/* -------------------------------------------------------------------- drag */

function onPreviewPointerDown(event) {
  const img = event.target.closest('.main-image');
  if (!img || !el.renderTarget.contains(img)) return;
  event.preventDefault();
  drag = {
    startX: event.clientX,
    startY: event.clientY,
    originX: state.media.x,
    originY: state.media.y,
    pointerId: event.pointerId
  };
  try {
    img.setPointerCapture?.(event.pointerId);
  } catch (err) {
    /* synthetic or already-released pointers */
  }
  el.stageCard.classList.add('is-dragging');
}

function onPreviewPointerMove(event) {
  if (!drag) return;
  const dx = (event.clientX - drag.startX) / previewScale;
  const dy = (event.clientY - drag.startY) / previewScale;
  state.media.x = Math.round(drag.originX + dx);
  state.media.y = Math.round(drag.originY + dy);
  applyImageTransform();
  el.posX.value = String(state.media.x);
  el.posXOut.textContent = `${state.media.x}px`;
  el.posY.value = String(state.media.y);
  el.posYOut.textContent = `${state.media.y}px`;
}

function onPreviewPointerUp() {
  if (!drag) return;
  drag = null;
  el.stageCard.classList.remove('is-dragging');
  saveState();
}

/* ------------------------------------------------------------------ export */

function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.onload = resolve;
          img.onerror = resolve;
        })
    )
  );
}

function drawToCanvas(img, { fit, zoom = 1, x = 0, y = 0 }) {
  const width = img.offsetWidth;
  const height = img.offsetHeight;
  if (!width || !height || !img.naturalWidth || !img.naturalHeight) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let baseW;
  let baseH;
  if (fit === 'fill') {
    baseW = width;
    baseH = height;
  } else {
    const ratio =
      fit === 'contain'
        ? Math.min(width / img.naturalWidth, height / img.naturalHeight)
        : Math.max(width / img.naturalWidth, height / img.naturalHeight);
    baseW = img.naturalWidth * ratio;
    baseH = img.naturalHeight * ratio;
  }

  const drawW = baseW * zoom;
  const drawH = baseH * zoom;
  const drawX = (width - drawW) / 2 + x;
  const drawY = (height - drawH) / 2 + y;

  try {
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } catch (err) {
    return null;
  }

  const computed = getComputedStyle(img);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.display = computed.display;
  canvas.style.position = computed.position;
  canvas.style.top = computed.top;
  canvas.style.right = computed.right;
  canvas.style.bottom = computed.bottom;
  canvas.style.left = computed.left;
  canvas.style.margin = computed.margin;
  canvas.style.borderRadius = computed.borderRadius;
  canvas.style.zIndex = computed.zIndex;
  canvas.style.opacity = computed.opacity;
  canvas.style.transform = 'none';
  return canvas;
}

function bakeImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    const computed = getComputedStyle(img);
    const isMain = img.classList.contains('main-image');
    const fit = isMain ? state.media.fit : computed.objectFit;
    if (fit !== 'cover' && fit !== 'contain' && fit !== 'fill') return;
    if (isMain) {
      const canvas = drawToCanvas(img, {
        fit,
        zoom: state.media.zoom,
        x: state.media.x,
        y: state.media.y
      });
      if (canvas) img.replaceWith(canvas);
    } else {
      const canvas = drawToCanvas(img, { fit, zoom: 1, x: 0, y: 0 });
      if (canvas) img.replaceWith(canvas);
    }
  });
}

async function exportPng() {
  if (busy) return;
  const source = el.renderTarget.firstElementChild;
  if (!source) return;
  if (typeof window.html2canvas !== 'function') {
    toast('Export library did not load. Check your connection and reload.', 'error');
    return;
  }

  busy = true;
  const originalLabel = el.downloadBtn.innerHTML;
  el.downloadBtn.disabled = true;
  el.downloadBtn.innerHTML = '<span class="spinner"></span> Rendering…';
  setSaveStatus('Rendering PNG…', true);

  const holder = document.createElement('div');
  const exportHeight = cardHeight();
  holder.style.cssText =
    `position:fixed;left:-20000px;top:0;width:1080px;height:${exportHeight}px;pointer-events:none;opacity:1;`;

  try {
    await document.fonts.ready;
    const clone = source.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.height = `${exportHeight}px`;
    holder.appendChild(clone);
    document.body.appendChild(holder);

    await waitForImages(clone);
    bakeImages(clone);

    const canvas = await window.html2canvas(clone, {
      scale: EXPORT_SCALE,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      width: EXPORT_SIZE,
      height: exportHeight,
      windowWidth: EXPORT_SIZE,
      windowHeight: exportHeight
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('BLOCKED');

    const tpl = templateById(state.templateId);
    const link = document.createElement('a');
    link.download = `photocard-${slug(tpl.name)}-${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    toast(`PNG downloaded — 2160 × ${exportHeight * 2} px.`);
    setSaveStatus('Saved locally');
  } catch (err) {
    console.error(err);
    if (String(err && err.message) === 'BLOCKED') {
      toast('Export blocked by the image host. Upload the photo file instead of using a URL.', 'error');
    } else {
      toast('Export failed. Try uploading the photo as a file.', 'error');
    }
    setSaveStatus('Export failed', true);
  } finally {
    holder.remove();
    busy = false;
    el.downloadBtn.disabled = false;
    el.downloadBtn.innerHTML = originalLabel;
  }
}

/* -------------------------------------------------------------------- init */

function cacheElements() {
  const ids = [
    'sidebar', 'sidebarScrim', 'openSidebar', 'closeSidebar', 'themeToggle',
    'templateGrid', 'templateCount', 'templateDesc', 'templateTag', 'contentFields',
    'dropzone', 'imageInput', 'imageUrl', 'imageStatus', 'removeImage',
    'zoom', 'zoomOut', 'posX', 'posXOut', 'posY', 'posYOut', 'fit',
    'logoInput', 'logoUrl', 'removeLogo',
    'adInput', 'adUrl', 'removeAd', 'adPreview', 'adThumb', 'adHint',
    'headlineUp', 'headlineDown', 'headlineScaleOut',
    'fontSelect', 'accentColor', 'accentHex', 'bgColor', 'bgHex', 'textColor', 'textHex',
    'resetBtn', 'downloadBtn', 'saveState',
    'stageCanvas', 'canvasFit', 'canvasScale', 'renderTarget',
    'stageName', 'stageCard', 'sizeBadge', 'stageFoot', 'toastHost'
  ];
  ids.forEach((id) => {
    el[id] = $(id);
  });
}

function bindEvents() {
  el.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  el.openSidebar.addEventListener('click', () => el.sidebar.classList.add('open'));
  el.closeSidebar.addEventListener('click', () => el.sidebar.classList.remove('open'));
  el.sidebarScrim.addEventListener('click', () => el.sidebar.classList.remove('open'));

  el.stageCanvas.addEventListener('pointerdown', onPreviewPointerDown);
  window.addEventListener('pointermove', onPreviewPointerMove);
  window.addEventListener('pointerup', onPreviewPointerUp);
  window.addEventListener('pointercancel', onPreviewPointerUp);

  el.imageInput.addEventListener('change', () => {
    readFile(el.imageInput.files && el.imageInput.files[0]);
    el.imageInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((type) => {
    el.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.dropzone.classList.add('is-over');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    el.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      if (type === 'dragleave' && el.dropzone.contains(event.relatedTarget)) return;
      el.dropzone.classList.remove('is-over');
    });
  });
  el.dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) readFile(file);
  });

  el.imageUrl.addEventListener('change', () => loadFromUrl(el.imageUrl.value, 'image'));
  el.imageUrl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadFromUrl(el.imageUrl.value, 'image');
    }
  });

  el.logoInput.addEventListener('change', () => {
    const file = el.logoInput.files && el.logoInput.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast('That file is not an image.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.media.logo = String(reader.result);
      state.media.logoSource = 'file';
      renderPreview();
      renderMediaInputs();
      saveState();
      toast('Logo added.');
    };
    reader.readAsDataURL(file);
    el.logoInput.value = '';
  });

  el.logoUrl.addEventListener('change', () => loadFromUrl(el.logoUrl.value, 'logo'));
  el.logoUrl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadFromUrl(el.logoUrl.value, 'logo');
    }
  });

  const clearLogo = () => {
    state.media.logo = '';
    state.media.logoSource = 'none';
    state.media.logoUrlValue = '';
    renderPreview();
    renderMediaInputs();
    saveState();
  };
  el.removeLogo.addEventListener('click', clearLogo);

  el.adInput.addEventListener('change', () => {
    const file = el.adInput.files && el.adInput.files[0];
    readImageFile(
      file,
      (data) => {
        state.media.ad = data;
        state.media.adSource = 'file';
        renderPreview();
        renderMediaInputs();
        saveState();
        toast('Ad banner added.');
      },
      8
    );
    el.adInput.value = '';
  });

  el.adUrl.addEventListener('change', () => loadFromUrl(el.adUrl.value, 'ad'));
  el.adUrl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadFromUrl(el.adUrl.value, 'ad');
    }
  });

  el.removeAd.addEventListener('click', () => {
    state.media.ad = '';
    state.media.adSource = 'none';
    state.media.adUrlValue = '';
    renderPreview();
    renderMediaInputs();
    saveState();
    toast('Ad banner removed.');
  });

  el.removeImage.addEventListener('click', () => {
    state.media.image = DEMO_IMAGE;
    state.media.imageSource = 'demo';
    state.media.imageCors = null;
    state.media.imageCorsUrl = '';
    state.media.zoom = 1;
    state.media.x = 0;
    state.media.y = 0;
    renderPreview();
    renderMediaInputs();
    saveState();
  });

  el.zoom.addEventListener('input', () => {
    state.media.zoom = Number(el.zoom.value) / 100;
    el.zoomOut.textContent = `${el.zoom.value}%`;
    applyImageTransform();
    saveState();
  });

  el.posX.addEventListener('input', () => {
    state.media.x = Number(el.posX.value);
    el.posXOut.textContent = `${state.media.x}px`;
    applyImageTransform();
    saveState();
  });

  el.posY.addEventListener('input', () => {
    state.media.y = Number(el.posY.value);
    el.posYOut.textContent = `${state.media.y}px`;
    applyImageTransform();
    saveState();
  });

  el.fit.addEventListener('change', () => {
    state.media.fit = el.fit.value;
    applyImageTransform();
    saveState();
  });

  el.fontSelect.addEventListener('change', () => {
    styleFor(templateById(state.templateId)).font = el.fontSelect.value;
    renderPreview();
    saveState();
  });

  const nudgeHeadline = (delta) => {
    const style = styleFor(templateById(state.templateId));
    const next = Math.min(1.6, Math.max(0.7, Math.round(((Number(style.headlineScale) || 1) + delta) * 100) / 100));
    if (next === style.headlineScale) return;
    style.headlineScale = next;
    el.headlineScaleOut.textContent = `${Math.round(next * 100)}%`;
    renderPreview();
    saveState();
  };
  el.headlineUp.addEventListener('click', () => nudgeHeadline(0.05));
  el.headlineDown.addEventListener('click', () => nudgeHeadline(-0.05));

  const colorBinding = (input, hexNode, key) => {
    input.addEventListener('input', () => {
      styleFor(templateById(state.templateId))[key] = input.value;
      setColorLabel(hexNode, input.value);
      renderPreview();
      saveState();
    });
  };
  colorBinding(el.accentColor, el.accentHex, 'accent');
  colorBinding(el.bgColor, el.bgHex, 'bg');
  colorBinding(el.textColor, el.textHex, 'text');

  el.resetBtn.addEventListener('click', () => {
    if (!window.confirm('Reset this card to its template defaults? Your text and photo settings will be cleared.')) {
      return;
    }
    delete state.content[state.templateId];
    delete state.style[state.templateId];
    state.media = { ...DEFAULT_MEDIA };
    renderFields();
    renderStyleInputs();
    renderMediaInputs();
    renderPreview();
    clearTimeout(saveTimer);
    persist();
    toast('Card reset to defaults.');
  });

  el.downloadBtn.addEventListener('click', exportPng);

  window.addEventListener('resize', fitPreview);
  if ('ResizeObserver' in window) {
    new ResizeObserver(fitPreview).observe(el.stageCanvas);
  }

  window.addEventListener('beforeunload', () => {
    clearTimeout(saveTimer);
    persist();
  });
}

function init() {
  initTheme();
  cacheElements();
  loadState();

  el.fontSelect.innerHTML = fonts
    .map(
      (font) =>
        `<option value="${font.id}">${font.name}${font.bengali ? ' — বাংলা' : ''}</option>`
    )
    .join('');

  bindEvents();
  renderTemplateGrid();
  renderFields();
  renderStyleInputs();
  renderMediaInputs();
  renderPreview();
  fitPreview();
  setSaveStatus(localStorage.getItem(STORAGE_KEY) ? 'Saved locally' : 'Ready', !localStorage.getItem(STORAGE_KEY));
}

init();
