# Link Manager

A zero‑dependency, single‑page web app to organize your links by category — with a responsive card layout, a11y‑friendly dialogs, and beautiful themes. Built with plain HTML/CSS/JavaScript and `localStorage` for persistence.

## ✨ Features

- **Categories sidebar** with counts, add/rename/delete, and an “All Links” virtual view.
- **Link cards** with name, description, and URL. Whole card opens the link; inline buttons for Edit/Delete.
- **Add/Edit dialogs** for links and categories, with keyboard support (Enter = confirm, Esc = cancel).
- **Live search** filters within the current category (name / description / URL).
- **Theme picker** (Dark, Ocean, Forest, Sand, Light, Excel) driven by CSS tokens; the swatches are read directly from CSS so they always match your theme colors.
- **Local storage “DB”** (no backend). Clean key names, easy to export/reset.
- **Zero build**: open `index.html` or host on any static server / GitHub Pages.

## 🚀 Quick start

1. **Clone or download** this repo.
2. Open `index.html` in your browser (or run a static server like `npx serve`).
3. Start adding categories and links. Your data is saved locally in your browser.

> Tip: For local development with auto‑reload, you can use VS Code’s “Live Server” extension or `python -m http.server`.

## 🧭 Project structure

```
.
├─ index.html        # App layout: sidebar + main + dialogs (script loaded as ES module)
├─ styles.css        # Theme tokens, layout, cards grid, and dialog styles
├─ utils.js          # uid(), HTML/URL escaping, localStorage DB wrapper, theme swatch reader
├─ popup.js          # Reusable modal system exported as ui.info/ui.error/ui.confirm/ui.confirmDelete
└─ app.js            # App state, rendering, CRUD, theme picker, search
```

## 🛠 How it works

### Data model & persistence
- Data lives in `localStorage` as JSON arrays for **categories** and **links**, plus the **selected category id** and **active theme** (`lm_theme`).
- First run seeds a few categories/links for a friendly starting point. You can remove or customize the seed logic.
- Deleting a category also removes its links; “All Links” is a virtual view and can’t be deleted.

### Rendering
- The sidebar lists **All Links** and all user categories with per‑category counts.
- The main area shows **cards** for links in the current category (or the full set when “All Links” is selected).
- The **search** box filters the currently visible set by name, description, or URL.

### Modals / popups
- A small, framework‑agnostic modal builder powers **info**, **error**, **confirm**, and **confirmDelete** dialogs.
- It traps focus, supports Enter/Esc, and closes on backdrop click when safe to do so.
- You can also register custom variants or override classes if you’re integrating into a different design system.

### Theming
- Themes are defined with **CSS custom properties**. The theme picker reads the live values from CSS (so swatches always match) and persists the chosen theme to `localStorage`.
- Add your own theme by copying a `data-theme="..."` block and updating the color tokens.

## 🧩 Customization

### Add a new theme
1. In **`styles.css`**, add a block like:

```css
[data-theme="sunset"]{
  --bg:#120814; --panel:#1d0f24; --panel-2:#2a1633;
  --text:#ffeef8; --muted:#f0b3d2; --primary:#ff6cab; --primary-2:#d44f89;
  --card:#26122f; --card-highlight:#3a1c4a; --border:#6e3b84;
  /* …and other tokens as desired… */
}
```

2. In **`app.js`**, add it to the `THEMES` list used by the picker:

```js
{ key: 'sunset', label: 'Sunset' }
```

> The swatch row is generated at runtime by reading `--card`, `--primary`, and `--muted` from CSS; no hard‑coding of colors in JS.

### Change seed data
- Update the `ensureSeed()` function to rename or replace the initial categories/links.

### Customize dialogs
- Replace icons/titles or register new variants via the `ui` export. You can also override class names if you want the dialogs to inherit styles from another CSS framework.

## ⌨️ Keyboard & a11y

- **Dialogs**: Enter = confirm · Esc = cancel (when allowed) · Backdrop click cancels (for confirm/cancel dialogs).
- **Focus trap** keeps tabbing inside the dialog while it’s open.
- **ARIA** attributes/roles are set for dialogs and menu items; theme menu supports roving focus and `aria-checked` state.

## 🔐 Data & privacy

- All data is stored locally in your browser (`localStorage`). There is no backend and no network requests. Clearing your browser data will remove the app’s data.

## 🌐 Deploy to GitHub Pages

1. Commit and push this folder to a GitHub repository.
2. In your repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, then pick your default branch and `/ (root)` as the folder.
4. Save. GitHub will give you a Pages URL in a minute.

## 🧰 Troubleshooting

- **Nothing happens when clicking “Add Link”**: Make sure `index.html` loads `app.js` with `type="module"` and the file lives next to it.
- **Theme menu shows empty swatches**: Ensure your theme defines `--card`, `--primary`, and `--muted` tokens.
- **Links don’t open**: Some popup blockers treat `window.open` as a popup if the click target is ambiguous. Click on the card body (not the buttons), or allow popups for your site.
- **Reset the app**: Open DevTools → Application → Local Storage and clear keys starting with `lm.`

## 🗺️ Roadmap ideas

- Import/export of links as JSON
- Drag‑and‑drop re‑order and category move
- “Pin” important links to the top
- Keyboard shortcuts for Add/Edit/Delete
- Simple backups (download/upload JSON)

## 🤝 Contributing

Issues and PRs are welcome! If you add features (e.g., import/export, bulk actions, or more themes), keep the zero‑dependency design and a11y in mind.

## 📄 License

MIT — do what you love. Add a `LICENSE` file if you publish publicly.
