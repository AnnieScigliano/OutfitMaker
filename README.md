# Outfit Maker

A retro outfit picker inspired by Cher's wardrobe computer from *Clueless* (1995).
Pick a top and bottom, then finish the look with shoes, a coat, accessories and a
purse. The app warns you when something clashes — by season, occasion, or color.

Vanilla JS + Vite, no framework. All state lives in `localStorage`, so the wardrobe
and outfit history are per-browser and local.

## Quick start

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Adding clothes

The starter wardrobe loads from `public/clothes/manifest.json` on first run. Each
entry points to an image in the same folder and carries the metadata used by the
mismatch checker:

```json
{
  "file": "blazer-amarillo.jpeg",
  "name": "Yellow Plaid Blazer",
  "type": "Shirts",
  "color": "#FFD93D",
  "seasons": ["Fall", "Spring"],
  "occasions": ["Uni", "Work"]
}
```

Valid `type` values: `Shirts`, `Pants/Skirts`, `Dresses`, `Shoes`,
`Coats (Fall/Spring)`, `Coats (Winter)`, `Accessories`, `Purses/Backpacks`.

To swap the entire starter set, drop new images into `public/clothes/`, update
the manifest, and bump `STARTER_VERSION` in `src/wardrobe.js`. Next reload, the
old starter items are removed and the new set is seeded. User-added items
(uploaded through the **+ Add Item** button) survive the migration.

You can also add items at runtime through the UI — the upload modal accepts any
image, stores it as a data URL in `localStorage`, and adds it alongside the
starter wardrobe.

## Project layout

```
public/
  assets/         silhouette + plaid wallpaper
  clothes/        starter wardrobe images + manifest.json
src/
  main.js         app entry, event wiring, view state
  wardrobe.js     CRUD + localStorage + manifest loader
  mismatch.js     color/season/occasion clash detection
  style.css       all styling (Cher's wardrobe aesthetic)
index.html        UI structure
```

## Storage keys

| Key | Holds |
|-----|-------|
| `outfitmaker_wardrobe` | Array of wardrobe items |
| `outfitmaker_history` | Array of saved outfits |
| `outfitmaker_starter_version` | Migration version for the starter seed |

Clearing localStorage resets the app and re-seeds the starter wardrobe.

## Mismatch rules

- **Season**: any two items must share at least one season.
- **Occasion**: any two items must share at least one occasion.
- **Color**: explicit clash list + HSL hue distance between 10°–30° with
  saturation > 30 (close-but-not-matching hues). Neutrals never clash.

The banner only appears when you press **NEXT** or **DRESS ME** — it never
blocks browsing through the carousels.
