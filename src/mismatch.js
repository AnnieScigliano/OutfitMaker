// mismatch.js — Tag-based clash detection

// Color clash rules — simple complementary conflicts
const COLOR_CLASHES = [
  ['#FF6B6B', '#FF8C42'],  // red + orange
  ['#FF6B6B', '#FF69B4'],  // red + pink (close)
  ['#FFD93D', '#FF8C42'],  // yellow + orange
];

function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function colorsClash(c1, c2) {
  if (!c1 || !c2) return false;
  // Neutrals never clash
  const neutrals = ['#FFFFFF', '#1A1A1A', '#2C3E50', '#D4A574', '#8B4513', '#000000'];
  if (neutrals.includes(c1.toUpperCase()) || neutrals.includes(c2.toUpperCase())) return false;

  // Check explicit clash list
  for (const [a, b] of COLOR_CLASHES) {
    if ((c1.toUpperCase() === a && c2.toUpperCase() === b) ||
        (c1.toUpperCase() === b && c2.toUpperCase() === a)) return true;
  }

  // HSL-based: very similar but not identical hues (within 15-30 degrees) can clash
  const h1 = hexToHSL(c1), h2 = hexToHSL(c2);
  const hueDiff = Math.abs(h1.h - h2.h);
  const minDiff = Math.min(hueDiff, 360 - hueDiff);
  if (minDiff > 10 && minDiff < 30 && h1.s > 30 && h2.s > 30) return true;

  return false;
}

function seasonsClash(items) {
  if (items.length < 2) return null;
  const validItems = items.filter(i => i && i.seasons && i.seasons.length > 0);
  if (validItems.length < 2) return null;

  // Check if any two items share zero seasons
  for (let a = 0; a < validItems.length; a++) {
    for (let b = a + 1; b < validItems.length; b++) {
      const shared = validItems[a].seasons.filter(s => validItems[b].seasons.includes(s));
      if (shared.length === 0) {
        return `${validItems[a].name || 'Item'} and ${validItems[b].name || 'Item'} don't share a season!`;
      }
    }
  }
  return null;
}

function occasionsClash(items) {
  if (items.length < 2) return null;
  const validItems = items.filter(i => i && i.occasions && i.occasions.length > 0);
  if (validItems.length < 2) return null;

  for (let a = 0; a < validItems.length; a++) {
    for (let b = a + 1; b < validItems.length; b++) {
      const shared = validItems[a].occasions.filter(o => validItems[b].occasions.includes(o));
      if (shared.length === 0) {
        return `${validItems[a].name || 'Item'} and ${validItems[b].name || 'Item'} don't match the occasion!`;
      }
    }
  }
  return null;
}

/**
 * Check for mismatches between selected items
 * @param {Array} items - array of wardrobe item objects
 * @returns {{ hasMismatch: boolean, reason: string|null }}
 */
export function checkMismatch(items) {
  const validItems = items.filter(Boolean);
  if (validItems.length < 2) return { hasMismatch: false, reason: null };

  // Season clash
  const seasonIssue = seasonsClash(validItems);
  if (seasonIssue) return { hasMismatch: true, reason: seasonIssue };

  // Occasion clash
  const occasionIssue = occasionsClash(validItems);
  if (occasionIssue) return { hasMismatch: true, reason: occasionIssue };

  // Color clash — check all pairs
  for (let a = 0; a < validItems.length; a++) {
    for (let b = a + 1; b < validItems.length; b++) {
      if (colorsClash(validItems[a].color, validItems[b].color)) {
        return { hasMismatch: true, reason: `Color clash between ${validItems[a].name || 'Item'} and ${validItems[b].name || 'Item'}!` };
      }
    }
  }

  return { hasMismatch: false, reason: null };
}
