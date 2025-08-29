// === Popup (Modal) System ===



// ---------- IDs ----------
export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------- Escaping ----------
export function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]));
}
export function escapeAttr(s = "") {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
export function escapeUrl(u = "") {
  try { new URL(u); return u; } catch { return "#"; }
}

// ---------- LocalStorage "DB" ----------
export const DB_KEYS = {
  categories: "lm.categories",
  links: "lm.links",
  selectedCategoryId: "lm.selectedCategoryId",
};

export const db = {
  load() {
    const categories = JSON.parse(localStorage.getItem(DB_KEYS.categories) || "[]");
    const links = JSON.parse(localStorage.getItem(DB_KEYS.links) || "[]");
    const selectedCategoryId = localStorage.getItem(DB_KEYS.selectedCategoryId) || "all";
    return { categories, links, selectedCategoryId };
  },
  save({ categories, links, selectedCategoryId }) {
    localStorage.setItem(DB_KEYS.categories, JSON.stringify(categories));
    localStorage.setItem(DB_KEYS.links, JSON.stringify(links));
    localStorage.setItem(DB_KEYS.selectedCategoryId, selectedCategoryId);
  },
};

// ---------- Theme swatch reader (DOM utility, but generic) ----------
export function getSwatchesForTheme(themeKey) {
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', themeKey);
  probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;pointer-events:none;';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const card    = cs.getPropertyValue('--card').trim()    || '#999';
  const primary = cs.getPropertyValue('--primary').trim() || '#999';
  const muted   = cs.getPropertyValue('--muted').trim()   || '#999';
  document.body.removeChild(probe);
  return [card, primary, muted];
}


