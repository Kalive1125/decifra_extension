// popup.js — Decifra

const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

// ── Presets de Configuração ────────────────────────────
const FONT_SIZE_PRESETS = [
  { value: 'disabled', label: 'Padrão' },
  { value: 90, label: '+5%' },
  { value: 100, label: '+10%' },
  { value: 105, label: '+15%' }
];

const LETTER_SPACING_PRESETS = [
  { value: 'disabled', label: 'Padrão' },
  { value: '0.05em', label: '+5%' },
  { value: '0.1em', label: '+10%' },
  { value: '0.15em', label: '+15%' }
];

const LINE_HEIGHT_PRESETS = [
  { value: 'disabled', label: 'Padrão' },
  { value: 1.4, label: '1.4' },
  { value: 1.7, label: '1.7' },
  { value: 2.0, label: '2.0' }
];

const DEFAULT_SETTINGS = {
  enabled: true,
  fontSize: 'disabled',
  letterSpacing: 'disabled',
  lineHeight: 'disabled',
  dyslexiaFont: false,
  theme: 'normal',
  simplify: false,
  ruler: false,
  hideImages: false
};

let settings = { ...DEFAULT_SETTINGS };

// ── Elementos do DOM ───────────────────────────────────
const btnCloseWindow = document.getElementById('btnCloseWindow');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const settingsOverlay = document.getElementById('settingsOverlay');
const toggleDyslexiaFont = document.getElementById('toggleDyslexiaFont');
const toggleSimplify = document.getElementById('toggleSimplify');
const btnResetAll = document.getElementById('btnResetAll');

const btnCardFontSize = document.getElementById('btnCardFontSize');
const btnCardContrast = document.getElementById('btnCardContrast');
const btnCardLetterSpacing = document.getElementById('btnCardLetterSpacing');
const btnCardRuler = document.getElementById('btnCardRuler');
const btnCardHideImages = document.getElementById('btnCardHideImages');
const btnCardLineHeight = document.getElementById('btnCardLineHeight');

const dashesFontSize = document.getElementById('dashesFontSize');
const dashesLetterSpacing = document.getElementById('dashesLetterSpacing');
const dashesRuler = document.getElementById('dashesRuler');
const dashesLineHeight = document.getElementById('dashesLineHeight');

// ── Normalização de Configurações ──────────────────────
function normalizeSettings(s) {
  if (!s) return { ...DEFAULT_SETTINGS };

  const validFontSize = FONT_SIZE_PRESETS.some(p => p.value === s.fontSize);
  if (!validFontSize) s.fontSize = 'disabled';

  const validLetterSpacing = LETTER_SPACING_PRESETS.some(p => p.value === s.letterSpacing);
  if (!validLetterSpacing) s.letterSpacing = 'disabled';

  const validLineHeight = LINE_HEIGHT_PRESETS.some(p => p.value === s.lineHeight);
  if (!validLineHeight) s.lineHeight = 'disabled';

  if (!['normal', 'dark'].includes(s.theme)) {
    s.theme = 'normal';
  }

  s.enabled = true;
  s.ruler = !!s.ruler;
  s.hideImages = !!s.hideImages;
  s.dyslexiaFont = !!s.dyslexiaFont;
  s.simplify = !!s.simplify;

  return s;
}

// ── Atualização dos Traços Indicadores (Dashes) ───────
function updateDashes(container, activeCount) {
  if (!container) return;
  const dashes = container.querySelectorAll('.dash');
  dashes.forEach((dash, idx) => {
    dash.classList.toggle('active', idx < activeCount);
  });
}

// ── Aplica as Configurações na Interface do Popup ─────
function applyToUI() {
  // 1. Aumentar texto
  const fontIdx = FONT_SIZE_PRESETS.findIndex(p => p.value === settings.fontSize);
  const isFontActive = fontIdx > 0;
  btnCardFontSize.classList.toggle('active', isFontActive);
  updateDashes(dashesFontSize, isFontActive ? fontIdx : 0);

  // 2. Contraste
  const isContrastActive = settings.theme === 'dark';
  btnCardContrast.classList.toggle('active', isContrastActive);

  // 3. Espaçamento de texto
  const spacingIdx = LETTER_SPACING_PRESETS.findIndex(p => p.value === settings.letterSpacing);
  const isSpacingActive = spacingIdx > 0;
  btnCardLetterSpacing.classList.toggle('active', isSpacingActive);
  updateDashes(dashesLetterSpacing, isSpacingActive ? spacingIdx : 0);

  // 4. Régua de leitura
  btnCardRuler.classList.toggle('active', !!settings.ruler);
  updateDashes(dashesRuler, settings.ruler ? 2 : 0);

  // 5. Ocultar imagens
  btnCardHideImages.classList.toggle('active', !!settings.hideImages);

  // 6. Altura da linha
  const lineHIdx = LINE_HEIGHT_PRESETS.findIndex(p => p.value === settings.lineHeight);
  const isLineHActive = lineHIdx > 0;
  btnCardLineHeight.classList.toggle('active', isLineHActive);
  updateDashes(dashesLineHeight, isLineHActive ? lineHIdx : 0);

  // Configurações do Drawer
  if (toggleDyslexiaFont) toggleDyslexiaFont.checked = !!settings.dyslexiaFont;
  if (toggleSimplify) toggleSimplify.checked = !!settings.simplify;
}

// ── Injeção de Segurança caso Content Script não esteja ativo ─
function injectAndSend(tabId) {
  if (!extApi || !extApi.tabs) return;
  try {
    if (extApi.tabs.executeScript) {
      extApi.tabs.executeScript(tabId, { file: 'content.js' }, () => {
        if (extApi.tabs.insertCSS) {
          extApi.tabs.insertCSS(tabId, { file: 'content.css' }, () => {
            extApi.tabs.sendMessage(tabId, { type: 'DECIFRA_UPDATE', settings });
          });
        }
      });
    }
  } catch (e) {
    console.warn('Script injection:', e);
  }
}

// ── Salva e envia para a página ativa ─────────────────
function save() {
  settings.enabled = true;

  if (extApi && extApi.storage && extApi.storage.local) {
    try {
      extApi.storage.local.set({ decifraSettings: settings });
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  if (extApi && extApi.tabs && extApi.tabs.query) {
    try {
      const q = extApi.tabs.query({ active: true, currentWindow: true });
      const handleTabs = (tabs) => {
        if (!tabs || !tabs[0]) return;
        const tabId = tabs[0].id;
        try {
          const sendP = extApi.tabs.sendMessage(tabId, { type: 'DECIFRA_UPDATE', settings });
          if (sendP && typeof sendP.catch === 'function') {
            sendP.catch(() => injectAndSend(tabId));
          }
        } catch (e) {
          injectAndSend(tabId);
        }
      };

      if (q && typeof q.then === 'function') {
        q.then(handleTabs).catch(() => { });
      } else {
        extApi.tabs.query({ active: true, currentWindow: true }, handleTabs);
      }
    } catch (e) {
      console.warn('Tabs query error:', e);
    }
  }
}

// ── Carrega configurações salvas ───────────────────────
if (extApi && extApi.storage && extApi.storage.local) {
  try {
    const p = extApi.storage.local.get('decifraSettings');
    const handleStored = (result) => {
      if (result && result.decifraSettings) {
        settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...result.decifraSettings });
      }
      applyToUI();
    };

    if (p && typeof p.then === 'function') {
      p.then(handleStored).catch(() => applyToUI());
    } else {
      extApi.storage.local.get('decifraSettings', handleStored);
    }
  } catch (e) {
    applyToUI();
  }
} else {
  applyToUI();
}

// ── Event Listeners dos Cartões ────────────────────────

// 1. Aumentar texto (ciclo de níveis)
btnCardFontSize.addEventListener('click', () => {
  const currentIdx = FONT_SIZE_PRESETS.findIndex(p => p.value === settings.fontSize);
  const nextIdx = (currentIdx + 1) % FONT_SIZE_PRESETS.length;
  settings.fontSize = FONT_SIZE_PRESETS[nextIdx].value;
  applyToUI();
  save();
});

// 2. Contraste (alterna normal e dark)
btnCardContrast.addEventListener('click', () => {
  settings.theme = settings.theme === 'dark' ? 'normal' : 'dark';
  applyToUI();
  save();
});

// 3. Espaçamento de texto (ciclo de níveis)
btnCardLetterSpacing.addEventListener('click', () => {
  const currentIdx = LETTER_SPACING_PRESETS.findIndex(p => p.value === settings.letterSpacing);
  const nextIdx = (currentIdx + 1) % LETTER_SPACING_PRESETS.length;
  settings.letterSpacing = LETTER_SPACING_PRESETS[nextIdx].value;
  applyToUI();
  save();
});

// 4. Régua de leitura (toggle)
btnCardRuler.addEventListener('click', () => {
  settings.ruler = !settings.ruler;
  applyToUI();
  save();
});

// 5. Ocultar imagens (toggle)
btnCardHideImages.addEventListener('click', () => {
  settings.hideImages = !settings.hideImages;
  applyToUI();
  save();
});

// 6. Altura da linha (ciclo de níveis)
btnCardLineHeight.addEventListener('click', () => {
  const currentIdx = LINE_HEIGHT_PRESETS.findIndex(p => p.value === settings.lineHeight);
  const nextIdx = (currentIdx + 1) % LINE_HEIGHT_PRESETS.length;
  settings.lineHeight = LINE_HEIGHT_PRESETS[nextIdx].value;
  applyToUI();
  save();
});

// ── Botão Fechar Janela ────────────────────────────────
if (btnCloseWindow) {
  btnCloseWindow.addEventListener('click', () => {
    window.close();
  });
}

// ── Painel Modal de Configurações ──────────────────────
if (btnOpenSettings && settingsOverlay) {
  btnOpenSettings.addEventListener('click', () => {
    settingsOverlay.classList.add('open');
  });
}

if (btnCloseSettings && settingsOverlay) {
  btnCloseSettings.addEventListener('click', () => {
    settingsOverlay.classList.remove('open');
  });
}

if (settingsOverlay) {
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.remove('open');
    }
  });
}

// Toggle Fonte para Dislexia no painel
if (toggleDyslexiaFont) {
  toggleDyslexiaFont.addEventListener('change', () => {
    settings.dyslexiaFont = toggleDyslexiaFont.checked;
    save();
  });
}

// Toggle Simplificação Visual no painel
if (toggleSimplify) {
  toggleSimplify.addEventListener('change', () => {
    settings.simplify = toggleSimplify.checked;
    save();
  });
}

// Redefinir Tudo
if (btnResetAll) {
  btnResetAll.addEventListener('click', () => {
    settings = { ...DEFAULT_SETTINGS };
    applyToUI();
    save();
    if (settingsOverlay) {
      settingsOverlay.classList.remove('open');
    }
  });
}
