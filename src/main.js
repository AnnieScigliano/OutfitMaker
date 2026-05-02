// main.js — App entry point, wires everything together
import './style.css';
import {
  loadWardrobe, addItem, removeItem, getItemsByTypes,
  initStarterWardrobe, loadHistory, saveOutfit, removeOutfit,
  STEP1_TOP_TYPES, STEP1_BOTTOM_TYPES, STEP2_TYPES, TYPES
} from './wardrobe.js';
import { checkMismatch } from './mismatch.js';

// --- State ---
const state = {
  currentStep: 1,
  currentView: 'outfit', // 'outfit' | 'closet' | 'history'
  // Carousel indices (index into the filtered items array; -1 = none selected / skip)
  carouselIndex: { tops: 0, bottoms: 0, shoes: 0, coats: -1, accessories: -1, purses: -1 },
  // Cached item arrays per carousel
  carouselItems: { tops: [], bottoms: [], shoes: [], coats: [], accessories: [], purses: [] },
  // Selected items (actual objects)
  selected: { top: null, bottom: null, shoes: null, coat: null, accessory: null, purse: null },
  // Filters
  filters: { season: '', occasion: '' },
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  await initStarterWardrobe();
  refreshCarousels();
  updateStatusBar();
  updateSeasonTag();
  showStep(1);
});

// --- Event Binding ---
function bindEvents() {
  // Title bar header icons
  document.getElementById('btn-add').addEventListener('click', openUploadModal);
  document.getElementById('btn-history').addEventListener('click', () => showView('history'));
  document.getElementById('btn-new-outfit').addEventListener('click', startNewOutfit);

  // Action bar
  document.getElementById('btn-browse').addEventListener('click', () => showView('closet'));
  document.getElementById('btn-next-step').addEventListener('click', tryAdvanceToStep2);
  document.getElementById('btn-prev-step').addEventListener('click', () => showStep(1));
  document.getElementById('btn-dress-me').addEventListener('click', () => {
    if (state.currentStep === 1) tryAdvanceToStep2();
    else tryDressMe();
  });

  // Category ribbon — open closet filtered by clicked type
  document.querySelectorAll('.cat-link[data-type]').forEach(link => {
    link.addEventListener('click', () => {
      const type = link.dataset.type;
      document.getElementById('closet-filter-type').value = type;
      showView('closet');
    });
  });

  // Filters
  document.getElementById('filter-season-1').addEventListener('change', (e) => {
    state.filters.season = e.target.value;
    refreshCarousels();
    updateSeasonTag();
  });
  document.getElementById('filter-occasion-1').addEventListener('change', (e) => {
    state.filters.occasion = e.target.value;
    refreshCarousels();
  });

  // Carousel arrows
  document.querySelectorAll('.carousel-arrow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.target.closest('.carousel-section');
      const carouselKey = getCarouselKey(section.id);
      if (!carouselKey) return;
      const dir = e.target.dataset.dir;
      navigateCarousel(carouselKey, dir);
    });
  });

  // Closet
  document.getElementById('btn-close-closet').addEventListener('click', () => showView('outfit'));
  document.getElementById('closet-filter-type').addEventListener('change', renderCloset);

  // History
  document.getElementById('btn-close-history').addEventListener('click', () => showView('outfit'));

  // Upload modal
  document.getElementById('btn-close-modal').addEventListener('click', closeUploadModal);
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeUploadModal);
  document.getElementById('file-input').addEventListener('change', handleFileSelect);
  document.getElementById('upload-dropzone').addEventListener('click', (e) => {
    if (e.target.id !== 'file-input') document.getElementById('file-input').click();
  });
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      document.getElementById('upload-color').value = sw.dataset.color;
      document.getElementById('upload-color-picker').value = sw.dataset.color;
      document.getElementById('color-hex-display').textContent = sw.dataset.color;
    });
  });
  document.getElementById('upload-color-picker').addEventListener('input', (e) => {
    document.getElementById('upload-color').value = e.target.value;
    document.getElementById('color-hex-display').textContent = e.target.value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  });
  document.getElementById('btn-save-item').addEventListener('click', saveNewItem);

  // Celebration
  document.getElementById('btn-save-outfit').addEventListener('click', saveCurrentOutfit);
  document.getElementById('btn-new-after-save').addEventListener('click', () => {
    document.getElementById('celebration-overlay').classList.add('hidden');
    startNewOutfit();
  });
}

// --- Carousel Key Mapping ---
function getCarouselKey(sectionId) {
  const map = {
    'carousel-tops': 'tops', 'carousel-bottoms': 'bottoms',
    'carousel-shoes': 'shoes', 'carousel-coats': 'coats',
    'carousel-accessories': 'accessories', 'carousel-purses': 'purses',
  };
  return map[sectionId];
}

// --- Navigation ---
function showStep(step) {
  state.currentStep = step;
  document.getElementById('step-1').classList.toggle('active', step === 1);
  document.getElementById('step-2').classList.toggle('active', step === 2);

  // Action bar reflects current step
  const prevBtn = document.getElementById('btn-prev-step');
  const nextBtn = document.getElementById('btn-next-step');
  const dressBtn = document.getElementById('btn-dress-me');
  const stepNum = document.getElementById('step-num');
  if (stepNum) stepNum.textContent = step;
  prevBtn.classList.toggle('hidden', step === 1);
  nextBtn.classList.toggle('hidden', step === 2);
  dressBtn.disabled = step !== 2;

  if (step === 2) {
    updateStep2Silhouette();
    document.getElementById('locked-badge').classList.remove('hidden');
    refreshStep2Carousels();
  }
  hideMismatchBanners();
}

function updateSeasonTag() {
  const tag = document.getElementById('season-tag');
  if (!tag) return;
  const s = state.filters.season;
  const label = s ? `${s.toUpperCase()} FASHIONS` : 'FALL FASHIONS';
  tag.textContent = `▌ ${label} ▐`;
}

function showView(view) {
  state.currentView = view;
  // Always hide closet and history first
  document.getElementById('closet-view').classList.add('hidden');
  document.getElementById('history-view').classList.add('hidden');
  // Show/hide outfit steps
  document.getElementById('step-1').classList.toggle('active', view === 'outfit' && state.currentStep === 1);
  document.getElementById('step-2').classList.toggle('active', view === 'outfit' && state.currentStep === 2);
  // Show the requested view
  if (view === 'closet') {
    document.getElementById('closet-view').classList.remove('hidden');
    renderCloset();
  } else if (view === 'history') {
    document.getElementById('history-view').classList.remove('hidden');
    renderHistory();
  }
}

function startNewOutfit() {
  state.currentStep = 1;
  state.carouselIndex = { tops: 0, bottoms: 0, shoes: 0, coats: -1, accessories: -1, purses: -1 };
  state.selected = { top: null, bottom: null, shoes: null, coat: null, accessory: null, purse: null };
  refreshCarousels();
  showView('outfit');
  showStep(1);
}

// --- Carousel Logic ---
function refreshCarousels() {
  const f = state.filters;
  state.carouselItems.tops = getItemsByTypes(STEP1_TOP_TYPES, f);
  state.carouselItems.bottoms = getItemsByTypes(STEP1_BOTTOM_TYPES, f);

  // Clamp indices
  ['tops', 'bottoms'].forEach(key => {
    const items = state.carouselItems[key];
    if (items.length === 0) state.carouselIndex[key] = 0;
    else state.carouselIndex[key] = Math.min(state.carouselIndex[key], items.length - 1);
  });

  updateCarouselDisplay('tops', 'carousel-tops');
  updateCarouselDisplay('bottoms', 'carousel-bottoms');
  updateSelections();
  handleDressMode();
  hideMismatchBanners();
}

function refreshStep2Carousels() {
  const f = state.filters;
  state.carouselItems.shoes = getItemsByTypes(STEP2_TYPES.shoes, f);
  state.carouselItems.coats = getItemsByTypes(STEP2_TYPES.coats, f);
  state.carouselItems.accessories = getItemsByTypes(STEP2_TYPES.accessories, f);
  state.carouselItems.purses = getItemsByTypes(STEP2_TYPES.purses, f);

  ['shoes', 'coats', 'accessories', 'purses'].forEach(key => {
    const items = state.carouselItems[key];
    if (items.length === 0) state.carouselIndex[key] = -1;
    else if (state.carouselIndex[key] < 0) state.carouselIndex[key] = 0;
    else state.carouselIndex[key] = Math.min(state.carouselIndex[key], items.length - 1);
  });

  updateCarouselDisplay('shoes', 'carousel-shoes');
  updateCarouselDisplay('coats', 'carousel-coats');
  updateCarouselDisplay('accessories', 'carousel-accessories');
  updateCarouselDisplay('purses', 'carousel-purses');
  updateSelections();
  hideMismatchBanners();
}

function navigateCarousel(key, dir) {
  const items = state.carouselItems[key];
  if (items.length === 0) return;

  // For optional carousels (step 2), allow cycling to -1 (none)
  const isOptional = ['coats', 'accessories', 'purses'].includes(key);
  const max = items.length - 1;
  let idx = state.carouselIndex[key];

  if (dir === 'next') {
    idx++;
    if (isOptional && idx > max) idx = -1;
    else if (!isOptional && idx > max) idx = 0;
  } else {
    idx--;
    if (isOptional && idx < -1) idx = max;
    else if (!isOptional && idx < 0) idx = max;
  }

  state.carouselIndex[key] = idx;
  const sectionId = `carousel-${key}`;
  updateCarouselDisplay(key, sectionId);
  updateSelections();
  handleDressMode();
  hideMismatchBanners();

  if (state.currentStep === 2) updateStep2Silhouette();
}

function updateCarouselDisplay(key, sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const items = state.carouselItems[key];
  const idx = state.carouselIndex[key];
  const img = section.querySelector('.carousel-img');
  const empty = section.querySelector('.carousel-empty');
  const current = section.querySelector('.carousel-counter .current');
  const total = section.querySelector('.carousel-counter .total');

  if (items.length === 0 || idx < 0) {
    img.src = '';
    img.style.display = 'none';
    empty.style.display = 'block';
    empty.textContent = idx < 0 && items.length > 0 ? '— Skip —' : 'No items yet — add some!';
    current.textContent = idx < 0 ? '-' : '0';
    total.textContent = items.length;
  } else {
    const item = items[idx];
    img.src = item.image;
    img.alt = item.name || item.type;
    img.style.display = 'block';
    empty.style.display = 'none';
    current.textContent = idx + 1;
    total.textContent = items.length;
  }
}

function updateSelections() {
  const get = (key) => {
    const items = state.carouselItems[key];
    const idx = state.carouselIndex[key];
    return (idx >= 0 && idx < items.length) ? items[idx] : null;
  };
  state.selected.top = get('tops');
  state.selected.bottom = get('bottoms');
  state.selected.shoes = get('shoes');
  state.selected.coat = get('coats');
  state.selected.accessory = get('accessories');
  state.selected.purse = get('purses');

  // Update step 1 silhouette overlays
  setOverlay('silhouette-overlay-top', state.selected.top);
  setOverlay('silhouette-overlay-bottom', state.selected.top?.type === TYPES.DRESSES ? null : state.selected.bottom);
}

function setOverlay(elementId, item) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (item) {
    el.innerHTML = `<img src="${item.image}" alt="${item.name || ''}" />`;
  } else {
    el.innerHTML = '';
  }
}

function updateStep2Silhouette() {
  setOverlay('silhouette2-overlay-top', state.selected.top);
  setOverlay('silhouette2-overlay-bottom', state.selected.top?.type === TYPES.DRESSES ? null : state.selected.bottom);
  setOverlay('silhouette2-overlay-shoes', state.selected.shoes);
  setOverlay('silhouette2-overlay-coat', state.selected.coat);
  setOverlay('silhouette2-overlay-accessory', state.selected.accessory);
  setOverlay('silhouette2-overlay-purse', state.selected.purse);
}

function handleDressMode() {
  const bottomSection = document.getElementById('carousel-bottoms');
  if (state.selected.top?.type === TYPES.DRESSES) {
    bottomSection.classList.add('dimmed');
  } else {
    bottomSection.classList.remove('dimmed');
  }
}

// --- Mismatch ---
// The banner only appears when the user tries to advance (NEXT / DRESS ME).
// Any carousel change clears it so it never blocks browsing.
function currentStepMismatch() {
  const items = state.currentStep === 1
    ? [state.selected.top, state.selected.bottom]
    : [state.selected.top, state.selected.bottom, state.selected.shoes, state.selected.coat, state.selected.accessory, state.selected.purse];
  return checkMismatch(items);
}

function showMismatchBanner(step, reason) {
  const el = document.getElementById(`mismatch-warning-${step}`);
  if (!el) return;
  el.classList.remove('hidden');
  const banner = el.querySelector('.mismatch-banner');
  if (banner) banner.title = reason || '';
}

function hideMismatchBanners() {
  document.getElementById('mismatch-warning-1')?.classList.add('hidden');
  document.getElementById('mismatch-warning-2')?.classList.add('hidden');
}

function tryAdvanceToStep2() {
  const { hasMismatch, reason } = currentStepMismatch();
  if (hasMismatch) {
    showMismatchBanner(1, reason);
    return;
  }
  showStep(2);
}

function tryDressMe() {
  const { hasMismatch, reason } = currentStepMismatch();
  if (hasMismatch) {
    showMismatchBanner(2, reason);
    return;
  }
  dressMe();
}

// --- Upload Modal ---
let uploadImageData = null;

function openUploadModal() {
  document.getElementById('upload-modal').classList.remove('hidden');
  resetUploadForm();
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
  resetUploadForm();
}

function resetUploadForm() {
  uploadImageData = null;
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('upload-preview').src = '';
  document.querySelector('.dropzone-content').style.display = '';
  document.getElementById('file-input').value = '';
  document.getElementById('upload-type').value = '';
  document.querySelectorAll('#upload-seasons input').forEach(cb => cb.checked = false);
  document.querySelectorAll('#upload-occasions input').forEach(cb => cb.checked = false);
  document.getElementById('upload-color').value = '';
  document.getElementById('upload-name').value = '';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    uploadImageData = ev.target.result;
    const preview = document.getElementById('upload-preview');
    preview.src = uploadImageData;
    preview.classList.remove('hidden');
    document.querySelector('.dropzone-content').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function saveNewItem() {
  const type = document.getElementById('upload-type').value;
  if (!type) { flashError('Please select a type!'); return; }

  const seasons = [...document.querySelectorAll('#upload-seasons input:checked')].map(cb => cb.value);
  const occasions = [...document.querySelectorAll('#upload-occasions input:checked')].map(cb => cb.value);
  const color = document.getElementById('upload-color').value || '#CCCCCC';
  const name = document.getElementById('upload-name').value || type;
  const image = uploadImageData || createPlaceholderImage(color);

  addItem({ type, seasons, occasions, color, name, image });
  closeUploadModal();
  refreshCarousels();
  if (state.currentStep === 2) refreshStep2Carousels();
  updateStatusBar();
}

function createPlaceholderImage(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
    <rect x="10" y="10" width="80" height="80" rx="10" fill="${color}" stroke="#666" stroke-width="2"/>
    <text x="50" y="55" text-anchor="middle" font-size="12" fill="#666">?</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function flashError(msg) {
  // Simple alert for now
  const btn = document.getElementById('btn-save-item');
  const original = btn.textContent;
  btn.textContent = '⚠ ' + msg;
  btn.style.borderColor = '#FF6B6B';
  setTimeout(() => { btn.textContent = original; btn.style.borderColor = ''; }, 2000);
}

// --- Closet View ---
function renderCloset() {
  const grid = document.getElementById('closet-grid');
  const filterType = document.getElementById('closet-filter-type').value;
  let items = loadWardrobe();
  if (filterType) items = items.filter(i => i.type === filterType);

  grid.innerHTML = items.map(item => `
    <div class="closet-item" data-id="${item.id}">
      <button class="closet-item-delete" data-id="${item.id}" title="Remove">✕</button>
      <img src="${item.image}" alt="${item.name || item.type}" />
      <div class="closet-item-name">${item.name || item.type}</div>
      <div class="closet-item-type">${item.type}</div>
      <span class="closet-item-color" style="background:${item.color || '#ccc'}"></span>
    </div>
  `).join('');

  grid.querySelectorAll('.closet-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeItem(btn.dataset.id);
      renderCloset();
      refreshCarousels();
      updateStatusBar();
    });
  });
}

// --- History View ---
function renderHistory() {
  const grid = document.getElementById('history-grid');
  const emptyMsg = document.getElementById('history-empty');
  const history = loadHistory();

  if (history.length === 0) {
    grid.innerHTML = '';
    emptyMsg.classList.remove('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');
  grid.innerHTML = history.map(outfit => {
    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.coat, outfit.accessory, outfit.purse]
      .filter(Boolean);
    const thumbs = items.slice(0, 4).map(i =>
      `<img src="${i.image}" alt="${i.name || ''}" style="width:40px;height:40px;object-fit:contain;" />`
    ).join('');
    const date = new Date(outfit.savedAt).toLocaleDateString();
    return `
      <div class="history-item" data-id="${outfit.id}">
        <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:6px">${thumbs}</div>
        <div class="closet-item-type">${date}</div>
        <button class="closet-item-delete" data-id="${outfit.id}" title="Remove">✕</button>
      </div>`;
  }).join('');

  grid.querySelectorAll('.closet-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeOutfit(btn.dataset.id);
      renderHistory();
      updateStatusBar();
    });
  });
}

// --- Dress Me! ---
function dressMe() {
  const overlay = document.getElementById('celebration-overlay');
  overlay.classList.remove('hidden');

  // Confetti
  spawnConfetti();

  // Build summary
  const summary = document.getElementById('outfit-summary');
  const items = [
    { label: 'Top', item: state.selected.top },
    { label: 'Bottom', item: state.selected.bottom },
    { label: 'Shoes', item: state.selected.shoes },
    { label: 'Coat', item: state.selected.coat },
    { label: 'Accessory', item: state.selected.accessory },
    { label: 'Purse', item: state.selected.purse },
  ].filter(x => x.item);

  summary.innerHTML = items.map(({ label, item }) => `
    <div class="summary-item">
      <img src="${item.image}" alt="${item.name || label}" />
      <span>${item.name || label}</span>
    </div>
  `).join('');
}

function saveCurrentOutfit() {
  saveOutfit({
    top: state.selected.top,
    bottom: state.selected.bottom,
    shoes: state.selected.shoes,
    coat: state.selected.coat,
    accessory: state.selected.accessory,
    purse: state.selected.purse,
  });
  updateStatusBar();

  const btn = document.getElementById('btn-save-outfit');
  btn.textContent = '✅ Saved!';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = '💾 Save Outfit'; btn.disabled = false; }, 2000);
}

function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#FF69B4', '#FFD93D', '#87CEEB', '#9B59B6', '#6BCB77', '#FF6B6B'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random() * 100 + '%';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (6 + Math.random() * 8) + 'px';
    el.style.height = (6 + Math.random() * 8) + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(el);
  }
}

// --- Status Bar ---
function updateStatusBar() {
  document.getElementById('status-items').textContent = `Items: ${loadWardrobe().length}`;
  document.getElementById('status-outfits').textContent = `Outfits: ${loadHistory().length}`;
}
