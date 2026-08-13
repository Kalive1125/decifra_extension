// popup.js — Decifra

const DEFAULT_SETTINGS = {
  enabled: false,
  fontSize: 100,
  letterSpacing: 0,
  lineHeight: 1.5,
  dyslexiaFont: false,
  theme: 'normal',
  simplify: false,
  ruler: false
};

let settings = { ...DEFAULT_SETTINGS };

// ── Elementos ──────────────────────────────────────────
const masterToggle     = document.getElementById('masterToggle');
const fontSizeRange    = document.getElementById('fontSize');
const fontSizeVal      = document.getElementById('fontSizeVal');
const letterSpacingR   = document.getElementById('letterSpacing');
const letterSpacingVal = document.getElementById('letterSpacingVal');
const lineHeightR      = document.getElementById('lineHeight');
const lineHeightVal    = document.getElementById('lineHeightVal');
const dyslexiaFont     = document.getElementById('dyslexiaFont');
const simplify         = document.getElementById('simplify');
const ruler            = document.getElementById('ruler');
const btnReset         = document.getElementById('btnReset');
const contrastBtns     = document.querySelectorAll('.contrast-btn');

// ── Carrega configurações salvas ───────────────────────
browser.storage.local.get('decifraSettings').then(result => {
  if (result.decifraSettings) {
    settings = { ...DEFAULT_SETTINGS, ...result.decifraSettings };
  }
  applyToUI();
});

// ── Aplica na UI ───────────────────────────────────────
function applyToUI() {
  masterToggle.checked       = settings.enabled;
  fontSizeRange.value        = settings.fontSize;
  fontSizeVal.textContent    = settings.fontSize + '%';
  letterSpacingR.value       = settings.letterSpacing;
  letterSpacingVal.textContent = settings.letterSpacing + 'px';
  lineHeightR.value          = settings.lineHeight;
  lineHeightVal.textContent  = settings.lineHeight;
  dyslexiaFont.checked       = settings.dyslexiaFont;
  simplify.checked           = settings.simplify;
  ruler.checked              = settings.ruler;
  document.body.classList.toggle('disabled', !settings.enabled);

  contrastBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
  });
}

// ── Salva e envia para content.js ─────────────────────
function save() {
  browser.storage.local.set({ decifraSettings: settings });
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { type: 'DECIFRA_UPDATE', settings })
        .catch(() => {
          // Content script ainda não carregou — injeta manualmente
          browser.tabs.executeScript(tabs[0].id, { file: 'content.js' }).then(() => {
            browser.tabs.insertCSS(tabs[0].id, { file: 'content.css' }).then(() => {
              browser.tabs.sendMessage(tabs[0].id, { type: 'DECIFRA_UPDATE', settings });
            });
          });
        });
    }
  });
}

// ── Event Listeners ────────────────────────────────────
masterToggle.addEventListener('change', () => {
  settings.enabled = masterToggle.checked;
  document.body.classList.toggle('disabled', !settings.enabled);
  save();
});

fontSizeRange.addEventListener('input', () => {
  settings.fontSize = parseInt(fontSizeRange.value);
  fontSizeVal.textContent = settings.fontSize + '%';
  save();
});

letterSpacingR.addEventListener('input', () => {
  settings.letterSpacing = parseFloat(letterSpacingR.value);
  letterSpacingVal.textContent = settings.letterSpacing + 'px';
  save();
});

lineHeightR.addEventListener('input', () => {
  settings.lineHeight = parseFloat(lineHeightR.value);
  lineHeightVal.textContent = settings.lineHeight;
  save();
});

dyslexiaFont.addEventListener('change', () => {
  settings.dyslexiaFont = dyslexiaFont.checked;
  save();
});

simplify.addEventListener('change', () => {
  settings.simplify = simplify.checked;
  save();
});

ruler.addEventListener('change', () => {
  settings.ruler = ruler.checked;
  save();
});

contrastBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    settings.theme = btn.dataset.theme;
    contrastBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    save();
  });
});

btnReset.addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS };
  applyToUI();
  save();
});
