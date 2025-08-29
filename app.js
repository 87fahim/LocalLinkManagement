import {

  uid,
  escapeHtml,
  escapeAttr,
  escapeUrl,
  db,
  getSwatchesForTheme
} from './utils.js';
import {
    ui
} from './popup.js';
// ------------------------------
// Theme picker (IIFE)
// ------------------------------
(() => {
  // Keys & labels only; colors will be read from CSS variables dynamically
  const THEMES = [
    { key: 'dark',   label: 'Dark'   },
    { key: 'ocean',  label: 'Ocean'  },
    { key: 'forest', label: 'Forest' },
    { key: 'sand',   label: 'Sand'   },
    { key: 'light',  label: 'Light'  },
    { key: 'excel',  label: 'Excel'  }
  ];

  const root = document.documentElement; // <html>
  const picker = document.getElementById('themePicker');
  const btn = document.getElementById('themeButton');
  const menu = document.getElementById('themeMenu');
  const labelEl = document.getElementById('themeLabel');
  const swatchEl = document.getElementById('themeSwatch');

  if (!picker || !btn || !menu) return;

  function applyTheme(key) {
    root.setAttribute('data-theme', key);
    localStorage.setItem('lm_theme', key);
    const t = THEMES.find(x => x.key === key) || THEMES[0];
    labelEl.textContent = t.label;
    const [, primary] = getSwatchesForTheme(key);
    swatchEl.style.background = primary;
  }

  function toggleMenu(show) {
    const willShow = show ?? !menu.classList.contains('open');
    menu.classList.toggle('open', willShow);
    btn.setAttribute('aria-expanded', String(willShow));
  }

  function buildMenu() {
    menu.innerHTML = '';
    THEMES.forEach(t => {
      const [card, primary, muted] = getSwatchesForTheme(t.key);
      const item = document.createElement('div');
      item.className = 'theme-option';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', root.getAttribute('data-theme') === t.key ? 'true' : 'false');
      item.dataset.key = t.key;

      const dots = document.createElement('div');
      dots.className = 'swatch-row';
      [card, primary, muted].forEach(color => {
        const d = document.createElement('span');
        d.className = 'sw';
        d.style.background = color;
        dots.appendChild(d);
      });

      const text = document.createElement('span');
      text.textContent = t.label;

      item.appendChild(dots);
      item.appendChild(text);

      item.addEventListener('click', () => {
        applyTheme(t.key);
        [...menu.querySelectorAll('.theme-option')].forEach(el =>
          el.setAttribute('aria-checked', el.dataset.key === t.key ? 'true' : 'false')
        );
        toggleMenu(false);
      });

      menu.appendChild(item);
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) toggleMenu(false);
  });

  // Button events
  btn.addEventListener('click', () => toggleMenu());
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); toggleMenu(true);
      const first = menu.querySelector('.theme-option');
      first && first.focus && first.focus();
    }
  });

  // Init
  const saved = localStorage.getItem('lm_theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');
  root.setAttribute('data-theme', initial);
  buildMenu();
  applyTheme(initial);
})();

// ------------------------------
// Local Storage "DB" (via utils.db)
// ------------------------------
const DB_KEYS = {
  categories: "lm.categories",
  links: "lm.links",
  selectedCategoryId: "lm.selectedCategoryId",
};

// ------------------------------
// State
// ------------------------------
let state = {
  categories: [],
  links: [],
  selectedCategoryId: "all",
  editingLinkId: null,
};

// ------------------------------
// Elements
// ------------------------------
const categoryListEl = document.getElementById("categoryList");
const addCategoryForm = document.getElementById("addCategoryForm");
const newCategoryNameEl = document.getElementById("newCategoryName");

const searchLinkEl = document.getElementById("searchLink");

const currentCategoryTitleEl = document.getElementById("currentCategoryTitle");
const linkCountEl = document.getElementById("linkCount");
const cardsEl = document.getElementById("cards");

const addLinkBtn = document.getElementById("addLinkBtn");
const editCategoryBtn = document.getElementById("editCategoryBtn");

const linkDialog = document.getElementById("linkDialog");
const linkDialogTitle = document.getElementById("linkDialogTitle");
const linkForm = document.getElementById("linkForm");
const linkNameEl = document.getElementById("linkName");
const linkUrlEl = document.getElementById("linkUrl");
const linkDescEl = document.getElementById("linkDesc");

const categoryDialog = document.getElementById("categoryDialog");
const renameCategoryInput = document.getElementById("renameCategoryInput");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");

// ------------------------------
// Init
// ------------------------------
function ensureSeed() {
  const { categories, links, selectedCategoryId } = db.load();

  if (categories.length === 0 && links.length === 0) {
    const catDev = { id: uid(), name: "Development" };
    const catNews = { id: uid(), name: "News" };
    const catShopping = { id: uid(), name: "Shopping" };

    const seedLinks = [
      { id: uid(), categoryId: catDev.id, name: "MDN Web Docs", url: "https://developer.mozilla.org/", desc: "Canonical docs for the web platform", createdAt: Date.now() },
      { id: uid(), categoryId: catDev.id, name: "Stack Overflow", url: "https://stackoverflow.com/", desc: "Q&A for programmers", createdAt: Date.now() },
      { id: uid(), categoryId: catNews.id, name: "Hacker News", url: "https://news.ycombinator.com/", desc: "Tech news & discussions", createdAt: Date.now() },
      { id: uid(), categoryId: catShopping.id, name: "Amazon", url: "https://amazon.com", desc: "", createdAt: Date.now() },
    ];

    db.save({ categories: [catDev, catNews, catShopping], links: seedLinks, selectedCategoryId: "all" });
  } else {
    db.save({ categories, links, selectedCategoryId });
  }
}

function loadState() {
  const { categories, links, selectedCategoryId } = db.load();
  state.categories = categories;
  state.links = links;
  state.selectedCategoryId = selectedCategoryId || "all";
}

// ------------------------------
// Render
// ------------------------------
function render() {
  renderCategories();
  renderCards(); // default: full list for current category
  renderHeader();
}

// Accept an optional pre-filtered list of links (e.g., from search)
function renderCards(linksOverride) {
  cardsEl.innerHTML = "";
  const links = Array.isArray(linksOverride) ? linksOverride : filteredLinks();

  if (links.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No links yet.";
    cardsEl.appendChild(empty);
    linkCountEl.textContent = "0";
    return;
  }

  links.forEach(link => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h4>${escapeHtml(link.name)}</h4>
      <p>${escapeHtml(link.desc || "")}</p>
      <p>${escapeHtml(link.url || "")}</p>
      <div class="card-actions">
        <button class="mini edit" data-action="edit" aria-label="Edit ${escapeAttr(link.name)}">Edit</button>
        <button class="mini delete" data-action="delete" aria-label="Delete ${escapeAttr(link.name)}">Delete</button>
      </div>
    `;

    // Whole card opens the link unless a button was clicked
    card.addEventListener("click", (e) => {
      if (!e.target.closest("button")) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    });

    // Edit & Delete buttons
    card.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
      e.stopPropagation();
      openEditLink(link.id);
    });
    card.querySelector('[data-action="delete"]').addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteLink(link.id);
    });

    cardsEl.appendChild(card);
  });

  linkCountEl.textContent = String(links.length);
}

function renderCategories() {
  categoryListEl.innerHTML = "";

  // "All Links" virtual item
  const allItem = document.createElement("div");
  allItem.className = "category-item" + (state.selectedCategoryId === "all" ? " active" : "");
  allItem.tabIndex = 0;
  allItem.innerHTML = `
    <span class="name">All Links</span>
    <span class="count">${state.links.length}</span>
  `;
  allItem.addEventListener("click", () => selectCategory("all"));
  categoryListEl.appendChild(allItem);

  // Real categories
  state.categories.forEach(cat => {
    const count = state.links.filter(l => l.categoryId === cat.id).length;

    const item = document.createElement("div");
    item.className = "category-item" + (state.selectedCategoryId === cat.id ? " active" : "");
    item.tabIndex = 0;
    item.dataset.id = cat.id;

    // Left side: name; middle: count; right: trash icon
    item.innerHTML = `
      <span class="name">${escapeHtml(cat.name)}</span>
      <span class="count">${count}</span>
    `;

    item.addEventListener("click", () => selectCategory(cat.id));

    // Trash icon button
    const remove = document.createElement("button");
    remove.className = "icon-btn trash-btn";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete category ${cat.name}`);
    remove.title = "Delete category";
    remove.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm2 2v0h2V5h-2zM7 7v12h10V7H7zm3 2h2v8h-2V9zm4 0h2v8h-2V9z" fill="currentColor"/>
      </svg>
    `;

    remove.addEventListener("click", async (e) => {
      e.stopPropagation();
      const count = state.links.filter(l => l.categoryId === cat.id).length;
      const ok = await ui.confirmDelete(cat.name, `${count} link(s)`);
      if (!ok) return;
      state.links = state.links.filter(l => l.categoryId !== cat.id);
      state.categories = state.categories.filter(c => c.id !== cat.id);
      if (state.selectedCategoryId === cat.id) state.selectedCategoryId = "all";
      persist();
      render();
    });

    item.appendChild(remove);
    categoryListEl.appendChild(item);
  });
}

function renderHeader() {
  if (state.selectedCategoryId === "all") {
    currentCategoryTitleEl.textContent = "All Links";
    editCategoryBtn.disabled = true;
    editCategoryBtn.title = "Select a category to rename/delete";
  } else {
    const cat = state.categories.find(c => c.id === state.selectedCategoryId);
    currentCategoryTitleEl.textContent = cat ? cat.name : "Unknown";
    editCategoryBtn.disabled = false;
    editCategoryBtn.title = "Rename/Delete current category";
  }
}

// ------------------------------
// Helpers
// ------------------------------
function filteredLinks() {
  if (state.selectedCategoryId === "all") {
    return [...state.links].sort((a, b) => b.createdAt - a.createdAt);
  }
  return state.links
    .filter(l => l.categoryId === state.selectedCategoryId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function selectCategory(id) {
  state.selectedCategoryId = id;
  persist();
  render();
}

function persist() {
  db.save({
    categories: state.categories,
    links: state.links,
    selectedCategoryId: state.selectedCategoryId,
  });
}

// ------------------------------
// Category CRUD
// ------------------------------
addCategoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = newCategoryNameEl.value.trim();
  if (!name) return;
  const exists = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) { await ui.error("Category already exists."); return; }
  const cat = { id: uid(), name };
  state.categories.push(cat);
  newCategoryNameEl.value = "";
  selectCategory(cat.id);
});

// Live search across name/description/url within the current category scope
searchLinkEl.addEventListener("input", () => {
  const q = searchLinkEl.value.trim().toLowerCase();

  // If empty, restore normal view (category-only filter)
  if (!q) {
    render();
    return;
  }

  const pool = filteredLinks();
  const filtered = pool.filter(l => {
    const name = (l.name || "").toLowerCase();
    const desc = (l.desc || "").toLowerCase();
    const url  = (l.url  || "").toLowerCase();
    return name.includes(q) || desc.includes(q) || url.includes(q);
  });

  renderCards(filtered);
});

editCategoryBtn.addEventListener("click", () => {
  if (state.selectedCategoryId === "all") return;
  const cat = state.categories.find(c => c.id === state.selectedCategoryId);
  if (!cat) return;
  renameCategoryInput.value = cat.name;
  categoryDialog.showModal();
});

document.getElementById("saveCategoryBtn").addEventListener("click", async () => {
  if (state.selectedCategoryId === "all") return;
  const cat = state.categories.find(c => c.id === state.selectedCategoryId);
  if (!cat) return;
  const name = renameCategoryInput.value.trim();
  if (!name) return;
  const exists = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== cat.id);
  if (exists) { await ui.error("Another category with that name exists."); return; }
  cat.name = name;
  persist(); render();
});

deleteCategoryBtn.addEventListener("click", async () => {
  if (state.selectedCategoryId === "all") return;
  const cat = state.categories.find(c => c.id === state.selectedCategoryId);
  if (!cat) return;

  const count = state.links.filter(l => l.categoryId === cat.id).length;
  const ok = await ui.confirmDelete(cat.name, `${count} link(s)`);
  if (!ok) return;

  state.links = state.links.filter(l => l.categoryId !== cat.id);
  state.categories = state.categories.filter(c => c.id !== cat.id);
  state.selectedCategoryId = "all";
  persist(); render();
  categoryDialog.close();
});

// ------------------------------
// Link CRUD
// ------------------------------
addLinkBtn.addEventListener("click", () => openAddLink());

function openAddLink() {
  state.editingLinkId = null;
  linkDialogTitle.textContent = "Add Link";
  linkNameEl.value = "";
  linkUrlEl.value = "";
  linkDescEl.value = "";
  linkDialog.showModal();
}

function openEditLink(linkId) {
  const link = state.links.find(l => l.id === linkId);
  if (!link) return;
  state.editingLinkId = linkId;
  linkDialogTitle.textContent = "Edit Link";
  linkNameEl.value = link.name;
  linkUrlEl.value = link.url;
  linkDescEl.value = link.desc || "";
  linkDialog.showModal();
}

linkForm.addEventListener("submit", (e) => {
  e.preventDefault(); // let JS save before dialog closes
});

document.getElementById("cancelLinkBtn").addEventListener("click", () => {
  linkDialog.close();
});

document.getElementById("saveLinkBtn").addEventListener("click", async () => {
  const name = linkNameEl.value.trim();
  const url = linkUrlEl.value.trim();
  const desc = linkDescEl.value.trim();

  if (!name || !url) { await ui.info("Please enter both a name and a URL."); return; }

  const normalizedUrl = (/^https?:\/\//i.test(url)) ? url : `https://${url}`;

  if (state.editingLinkId) {
    const link = state.links.find(l => l.id === state.editingLinkId);
    if (!link) return;
    link.name = name;
    link.url = normalizedUrl;
    link.desc = desc;
  } else {
    if (state.selectedCategoryId === "all") {
      await ui.info("Please select a category on the left before adding a link.");
      return;
    }
    state.links.push({
      id: uid(),
      categoryId: state.selectedCategoryId,
      name,
      url: normalizedUrl,
      desc,
      createdAt: Date.now(),
    });
  }
  persist(); render();
  linkDialog.close();
});

async function deleteLink(linkId) {
  const link = state.links.find(l => l.id === linkId);
  if (!link) return;
  const ok = await ui.confirmDelete(link.name);
  if (!ok) return;
  state.links = state.links.filter(l => l.id !== linkId);
  persist(); render();
}

// ------------------------------
// Boot
// ------------------------------
function ensureHtmlIsModule() {
  // Reminder for devs: ensure <script type="module" src="./app.js"></script> in HTML
  // No-op at runtime; kept for clarity.
}
ensureSeed();
loadState();
render();
ensureHtmlIsModule();
