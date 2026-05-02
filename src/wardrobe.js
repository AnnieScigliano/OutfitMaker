// wardrobe.js — Wardrobe CRUD + localStorage

const STORAGE_KEY = 'outfitmaker_wardrobe';
const HISTORY_KEY = 'outfitmaker_history';

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

// Starter wardrobe with inline SVG data URLs
export function initStarterWardrobe() {
  if (loadWardrobe().length > 0) return;

  const starterItems = [
    { name: 'Yellow Plaid Blazer', type: TYPES.SHIRTS, seasons: ['Fall', 'Spring'], occasions: ['Uni', 'Work'], color: '#FFD93D', image: createSVGItem('blazer', '#FFD93D') },
    { name: 'Pink Crop Top', type: TYPES.SHIRTS, seasons: ['Summer', 'Spring'], occasions: ['Uni', 'Party'], color: '#FF69B4', image: createSVGItem('top', '#FF69B4') },
    { name: 'White Blouse', type: TYPES.SHIRTS, seasons: ['Spring', 'Summer', 'Fall'], occasions: ['Work', 'Uni'], color: '#FFFFFF', image: createSVGItem('blouse', '#FFFFFF') },
    { name: 'Plaid Mini Skirt', type: TYPES.PANTS_SKIRTS, seasons: ['Fall', 'Spring'], occasions: ['Uni'], color: '#FFD93D', image: createSVGItem('skirt', '#FFD93D') },
    { name: 'Black Pants', type: TYPES.PANTS_SKIRTS, seasons: ['Fall', 'Winter', 'Spring'], occasions: ['Work', 'Uni'], color: '#1A1A1A', image: createSVGItem('pants', '#1A1A1A') },
    { name: 'Blue Jeans', type: TYPES.PANTS_SKIRTS, seasons: ['Spring', 'Fall'], occasions: ['Uni', 'Party'], color: '#4D96FF', image: createSVGItem('pants', '#4D96FF') },
    { name: 'Little Black Dress', type: TYPES.DRESSES, seasons: ['Summer', 'Spring', 'Fall'], occasions: ['Party', 'Work'], color: '#1A1A1A', image: createSVGItem('dress', '#1A1A1A') },
    { name: 'Platform Sandals', type: TYPES.SHOES, seasons: ['Summer', 'Spring'], occasions: ['Uni', 'Party'], color: '#D4A574', image: createSVGItem('shoes', '#D4A574') },
    { name: 'White Sneakers', type: TYPES.SHOES, seasons: ['Spring', 'Summer', 'Fall'], occasions: ['Uni'], color: '#FFFFFF', image: createSVGItem('sneakers', '#FFFFFF') },
    { name: 'Black Boots', type: TYPES.SHOES, seasons: ['Fall', 'Winter'], occasions: ['Work', 'Party'], color: '#1A1A1A', image: createSVGItem('boots', '#1A1A1A') },
    { name: 'Fall Trench Coat', type: TYPES.COATS_FS, seasons: ['Fall', 'Spring'], occasions: ['Work', 'Uni'], color: '#D4A574', image: createSVGItem('coat', '#D4A574') },
    { name: 'Fuzzy Bag', type: TYPES.PURSES, seasons: ['Fall', 'Winter'], occasions: ['Party'], color: '#FF69B4', image: createSVGItem('bag', '#FF69B4') },
    { name: 'Sunglasses', type: TYPES.ACCESSORIES, seasons: ['Summer', 'Spring'], occasions: ['Uni', 'Party'], color: '#1A1A1A', image: createSVGItem('sunglasses', '#1A1A1A') },
  ];

  starterItems.forEach(item => addItem(item));
}

function createSVGItem(type, color) {
  const darken = (hex, amt) => {
    let c = parseInt(hex.slice(1), 16);
    let r = Math.max(0, (c >> 16) - amt);
    let g = Math.max(0, ((c >> 8) & 0xFF) - amt);
    let b = Math.max(0, (c & 0xFF) - amt);
    return `rgb(${r},${g},${b})`;
  };
  const stroke = darken(color, 60);
  const isLight = parseInt(color.slice(1), 16) > 0x888888;
  const strokeW = 2;

  const shapes = {
    blazer: `<rect x="25" y="15" width="50" height="65" rx="6" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M45 15 L50 40 L55 15" fill="${isLight ? darken(color,30) : 'rgba(255,255,255,0.15)'}" stroke="none"/>
      <line x1="50" y1="15" x2="50" y2="80" stroke="${stroke}" stroke-width="1" opacity="0.3"/>
      <rect x="30" y="20" width="8" height="3" rx="1" fill="${stroke}" opacity="0.3"/>
      <rect x="62" y="20" width="8" height="3" rx="1" fill="${stroke}" opacity="0.3"/>`,
    top: `<path d="M30 25 Q50 15 70 25 L68 75 Q50 80 32 75 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M30 25 Q50 20 70 25" fill="none" stroke="${stroke}" stroke-width="1.5"/>`,
    blouse: `<rect x="28" y="18" width="44" height="60" rx="4" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M28 30 L20 35 L20 55 L28 50" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M72 30 L80 35 L80 55 L72 50" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <circle cx="50" cy="30" r="2" fill="${stroke}" opacity="0.3"/>
      <circle cx="50" cy="40" r="2" fill="${stroke}" opacity="0.3"/>
      <circle cx="50" cy="50" r="2" fill="${stroke}" opacity="0.3"/>`,
    skirt: `<path d="M32 15 L25 80 Q50 85 75 80 L68 15 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M35 15 L42 80" stroke="${stroke}" stroke-width="0.5" opacity="0.3"/>
      <path d="M65 15 L58 80" stroke="${stroke}" stroke-width="0.5" opacity="0.3"/>`,
    pants: `<path d="M30 15 L28 80 L45 80 L50 45 L55 80 L72 80 L70 15 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>`,
    dress: `<path d="M35 15 Q50 10 65 15 L70 50 Q72 80 60 85 Q50 87 40 85 Q28 80 30 50 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M35 15 Q50 12 65 15" fill="none" stroke="${stroke}" stroke-width="1.5"/>
      <line x1="50" y1="40" x2="50" y2="45" stroke="${stroke}" stroke-width="1" opacity="0.3"/>`,
    shoes: `<path d="M25 50 Q25 35 40 35 L60 35 Q75 35 75 50 L80 60 Q80 70 70 70 L30 70 Q20 70 20 60 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>`,
    sneakers: `<path d="M20 45 Q20 30 40 30 L65 30 Q80 30 80 45 L82 55 Q82 65 72 65 L28 65 Q18 65 18 55 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M25 48 L75 48" stroke="${stroke}" stroke-width="1.5" opacity="0.4"/>
      <circle cx="35" cy="40" r="2" fill="${stroke}" opacity="0.3"/>
      <circle cx="45" cy="38" r="2" fill="${stroke}" opacity="0.3"/>`,
    boots: `<path d="M30 10 L28 60 L25 70 Q25 80 35 80 L65 80 Q75 80 75 70 L72 60 L70 10 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <line x1="30" y1="40" x2="70" y2="40" stroke="${stroke}" stroke-width="1" opacity="0.3"/>`,
    coat: `<rect x="20" y="10" width="60" height="75" rx="6" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <line x1="50" y1="10" x2="50" y2="85" stroke="${stroke}" stroke-width="1.5" opacity="0.3"/>
      <rect x="15" y="15" width="12" height="45" rx="4" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <rect x="73" y="15" width="12" height="45" rx="4" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <circle cx="46" cy="30" r="2.5" fill="${stroke}" opacity="0.3"/>
      <circle cx="46" cy="45" r="2.5" fill="${stroke}" opacity="0.3"/>
      <rect x="30" y="10" width="40" height="8" rx="3" fill="${darken(color,15)}" stroke="${stroke}" stroke-width="1"/>`,
    bag: `<rect x="25" y="30" width="50" height="45" rx="8" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
      <path d="M35 30 Q35 15 50 15 Q65 15 65 30" fill="none" stroke="${stroke}" stroke-width="3"/>
      <rect x="40" y="48" width="20" height="6" rx="3" fill="${stroke}" opacity="0.3"/>`,
    sunglasses: `<circle cx="35" cy="45" r="15" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}" opacity="0.7"/>
      <circle cx="65" cy="45" r="15" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}" opacity="0.7"/>
      <line x1="50" y1="45" x2="50" y2="45" stroke="${stroke}" stroke-width="3"/>
      <path d="M50 45 Q50 42 50 45" stroke="${stroke}" stroke-width="2"/>
      <line x1="20" y1="42" x2="12" y2="38" stroke="${stroke}" stroke-width="2"/>
      <line x1="80" y1="42" x2="88" y2="38" stroke="${stroke}" stroke-width="2"/>`,
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 95" width="200" height="190">${shapes[type] || shapes.top}</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
