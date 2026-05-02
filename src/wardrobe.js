// wardrobe.js — Wardrobe CRUD + localStorage

const STORAGE_KEY = 'outfitmaker_wardrobe';
const HISTORY_KEY = 'outfitmaker_history';
const STARTER_VERSION_KEY = 'outfitmaker_starter_version';
const STARTER_VERSION = 2;
const MANIFEST_URL = '/clothes/manifest.json';

export const TYPES = {
  SHIRTS: 'Shirts',
  PANTS_SKIRTS: 'Pants/Skirts',
  DRESSES: 'Dresses',
  SHOES: 'Shoes',
  COATS_FS: 'Coats (Fall/Spring)',
  COATS_W: 'Coats (Winter)',
  ACCESSORIES: 'Accessories',
  PURSES: 'Purses/Backpacks',
};

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const OCCASIONS = ['Uni', 'Work', 'Party'];

// Step 1 types (tops carousel): Shirts + Dresses
export const STEP1_TOP_TYPES = [TYPES.SHIRTS, TYPES.DRESSES];
// Step 1 types (bottoms carousel): Pants/Skirts
export const STEP1_BOTTOM_TYPES = [TYPES.PANTS_SKIRTS];
// Step 2 carousel types
export const STEP2_TYPES = {
  shoes: [TYPES.SHOES],
  coats: [TYPES.COATS_FS, TYPES.COATS_W],
  accessories: [TYPES.ACCESSORIES],
  purses: [TYPES.PURSES],
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function loadWardrobe() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveWardrobe(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addItem(item) {
  const items = loadWardrobe();
  const newItem = { id: generateId(), ...item, createdAt: Date.now() };
  items.push(newItem);
  saveWardrobe(items);
  return newItem;
}

export function removeItem(id) {
  const items = loadWardrobe().filter(i => i.id !== id);
  saveWardrobe(items);
  return items;
}

export function getItemsByTypes(types, filters = {}) {
  let items = loadWardrobe().filter(i => types.includes(i.type));
  if (filters.season) {
    items = items.filter(i => i.seasons && i.seasons.includes(filters.season));
  }
  if (filters.occasion) {
    items = items.filter(i => i.occasions && i.occasions.includes(filters.occasion));
  }
  return items;
}

// Outfit history
export function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveOutfit(outfit) {
  const history = loadHistory();
  history.unshift({ id: generateId(), ...outfit, savedAt: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function removeOutfit(id) {
  const history = loadHistory().filter(o => o.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Starter wardrobe loaded from /clothes/manifest.json on first run.
// Versioned: bumping STARTER_VERSION drops old starters (identified by
// data:image/svg URLs from the previous SVG-based seed) and re-seeds.
export async function initStarterWardrobe() {
  const currentVer = parseInt(localStorage.getItem(STARTER_VERSION_KEY) || '0', 10);
  if (currentVer >= STARTER_VERSION) return;

  const items = loadWardrobe().filter(i =>
    !(typeof i.image === 'string' && i.image.startsWith('data:image/svg'))
  );
  saveWardrobe(items);

  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();
    for (const entry of manifest) {
      const { file, ...rest } = entry;
      addItem({ ...rest, image: `/clothes/${file}`, starter: true });
    }
    localStorage.setItem(STARTER_VERSION_KEY, String(STARTER_VERSION));
  } catch (err) {
    console.error('Failed to load starter wardrobe manifest:', err);
  }
}
