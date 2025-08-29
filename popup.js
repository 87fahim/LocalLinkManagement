// utils.js (UI module section) — fully modular & extensible

// ------------------------------
// Constants & Config
// ------------------------------
const ICONS = {
  info:    '<path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 4a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 6Zm-1.25 4h2.5v8h-2.5v-8Z"/>',
  error:   '<path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm4.24 13.17-1.06 1.06L12 13.06l-3.17 3.17-1.06-1.06L10.94 12 7.77 8.83l1.06-1.06L12 10.94l3.17-3.17 1.06 1.06L13.06 12l3.18 3.17Z"/>',
  confirm: '<path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1.2 12.6-3-3 1.4-1.4 1.6 1.6 4.8-4.8 1.4 1.4-6.2 6.6Z"/>',
  delete:  '<path d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm-1 4v12h8V7H8zm2 2h2v8h-2V9zm4 0h2v8h-2V9z"/>'
};

const DEFAULTS = {
  titles:   { info: 'Info', error: 'Error', confirm: 'Confirm', delete: 'Delete' },
  confirmText: 'OK',
  cancelText:  'Cancel'
};

let CLASSNAMES = {
  backdrop:  'lm-backdrop',
  modal:     'lm-modal',
  variant:   (v) => `lm-variant-${v}`,
  head:      'lm-head',
  icon:      'lm-icon',
  title:     'lm-title',
  body:      'lm-body',
  actions:   'lm-actions',
  btn:       'lm-btn',
  btnPrimary:'primary',
  btnDanger: 'danger'
};

// Storage for custom variants (icon/title/labels)
const VARIANTS = new Map([
  ['info',    { icon: ICONS.info,    title: DEFAULTS.titles.info }],
  ['error',   { icon: ICONS.error,   title: DEFAULTS.titles.error }],
  ['confirm', { icon: ICONS.confirm, title: DEFAULTS.titles.confirm }],
  ['delete',  { icon: ICONS.delete,  title: DEFAULTS.titles.delete }]
]);

// ------------------------------
// Small DOM factories
// ------------------------------
function createIcon(variant) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.classList.add(CLASSNAMES.icon);
  const spec = VARIANTS.get(variant) || VARIANTS.get('info');
  svg.innerHTML = spec.icon || ICONS.info;
  return svg;
}

function createHeader(title, variant) {
  const head = document.createElement('div');
  head.className = CLASSNAMES.head;

  const icon = createIcon(variant);
  const ttl  = document.createElement('div');
  ttl.className = CLASSNAMES.title;
  const spec = VARIANTS.get(variant) || VARIANTS.get('info');
  ttl.textContent = title || spec.title || DEFAULTS.titles.info;

  head.appendChild(icon);
  head.appendChild(ttl);
  return { head, titleEl: ttl };
}

function createBody(message) {
  const body = document.createElement('div');
  body.className = CLASSNAMES.body;
  body.textContent = message || '';
  return body;
}

function createButton({ text, classes = [], onClick }) {
  const btn = document.createElement('button');
  btn.className = [CLASSNAMES.btn, ...classes].join(' ');
  btn.textContent = text;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

function createActions({ confirmText, cancelText, danger, close }) {
  const actions = document.createElement('div');
  actions.className = CLASSNAMES.actions;

  let cancelBtn = null;
  if (cancelText) {
    cancelBtn = createButton({
      text: cancelText,
      onClick: () => close(false)
    });
    actions.appendChild(cancelBtn);
  }

  const okBtn = createButton({
    text: confirmText,
    classes: [danger ? CLASSNAMES.btnDanger : CLASSNAMES.btnPrimary],
    onClick: () => close(true)
  });
  actions.appendChild(okBtn);

  return { actions, okBtn, cancelBtn };
}

// ------------------------------
// Mount / unmount helpers
// ------------------------------
function mountModal(variant) {
  const backdrop = document.createElement('div');
  backdrop.className = CLASSNAMES.backdrop;

  const modal = document.createElement('div');
  modal.className = `${CLASSNAMES.modal} ${CLASSNAMES.variant(variant)}`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  return { backdrop, modal };
}

function trapFocusWithin(modal, initialEl) {
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    if (focusable.length === 0) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  modal.addEventListener('keydown', onKeydown);
  setTimeout(() => (initialEl || first)?.focus(), 0);
  return () => modal.removeEventListener('keydown', onKeydown);
}

// ------------------------------
// Core builder
// ------------------------------
function make({
  title,
  message,
  variant = 'info',
  confirmText = DEFAULTS.confirmText,
  cancelText,
  danger = false
}) {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement;

    const { backdrop, modal } = mountModal(variant);

    // Build pieces
    const { head, titleEl } = createHeader(title, variant);
    const body  = createBody(message);
    const close = (result) => {
      document.removeEventListener('keydown', onKey);
      backdrop.removeEventListener('mousedown', onBackdrop);
      untrap();
      backdrop.remove();
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      resolve(result);
    };
    const { actions, okBtn, cancelBtn } = createActions({ confirmText, cancelText, danger, close });

    // A11y IDs
    const titleId = `lm-title-${Math.random().toString(36).slice(2, 8)}`;
    const bodyId  = `lm-body-${Math.random().toString(36).slice(2, 8)}`;
    titleEl.id = titleId;
    body.id = bodyId;
    modal.setAttribute('aria-labelledby', titleId);
    modal.setAttribute('aria-describedby', bodyId);

    // Assemble
    modal.appendChild(head);
    modal.appendChild(body);
    modal.appendChild(actions);

    // Events
    function onKey(e) {
      if (e.key === 'Escape' && cancelBtn) { e.preventDefault(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true); }
    }
    function onBackdrop(e) {
      if (e.target === backdrop && cancelBtn) close(false);
    }
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('mousedown', onBackdrop);

    // Focus trap
    const untrap = trapFocusWithin(modal, okBtn);
  });
}

// ------------------------------
// Public API
// ------------------------------
function info(msg, title = DEFAULTS.titles.info) {
  return make({ title, message: msg, variant: 'info', confirmText: 'OK' });
}
function error(msg, title = DEFAULTS.titles.error) {
  return make({ title, message: msg, variant: 'error', confirmText: 'OK' });
}
function confirm(message, opts = {}) {
  return make({
    title: opts.title || DEFAULTS.titles.confirm,
    message,
    variant: 'confirm',
    confirmText: opts.confirmText || DEFAULTS.confirmText,
    cancelText: (opts.cancelText ?? DEFAULTS.cancelText)
  });
}
function confirmDelete(what, extra = '') {
  return make({
    title: DEFAULTS.titles.delete,
    message: extra
      ? `Delete "${what}" (${extra})? This cannot be undone.`
      : `Delete "${what}"? This cannot be undone.`,
    variant: 'delete',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true
  });
}

// ------------------------------
// Extensibility
// ------------------------------
// Add or replace a variant at runtime.
// Example: ui.register('warning', { icon: '<path .../>', title: 'Warning' })
function register(variantKey, { icon, title }) {
  if (!variantKey) throw new Error('variantKey is required');
  VARIANTS.set(variantKey, {
    icon: icon || ICONS.info,
    title: title || DEFAULTS.titles.info
  });
}

// Override default titles/labels.
function setDefaults(partial = {}) {
  if (partial.titles) Object.assign(DEFAULTS.titles, partial.titles);
  if (typeof partial.confirmText === 'string') DEFAULTS.confirmText = partial.confirmText;
  if (typeof partial.cancelText === 'string') DEFAULTS.cancelText = partial.cancelText;
}

// Override class names for theming/frameworks.
function setClassNames(partial = {}) {
  CLASSNAMES = {
    ...CLASSNAMES,
    ...partial,
    // Keep function key intact if provided as string
    variant: partial.variant || CLASSNAMES.variant
  };
}

// ------------------------------
// Export
// ------------------------------
export const ui = {
  info,
  error,
  confirm,
  confirmDelete,
  // extensibility hooks
  register,
  setDefaults,
  setClassNames
};