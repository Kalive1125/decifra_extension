// content.js — Decifra

(function () {
  'use strict';

  // Evita inicialização dupla
  if (window.__decifraLoaded) return;
  window.__decifraLoaded = true;

  // ── Estado ────────────────────────────────────────────
  let currentSettings = null;
  let rulerEl = null;
  let styleEl = null;
  let overlayEl = null;

  // ── CSS principal injetado via <style> ─────────────────
  function getStyleEl() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = '__decifra_style__';
      document.head.appendChild(styleEl);
    }
    return styleEl;
  }

  // ── Temas de contraste ────────────────────────────────
  const THEMES = {
    normal: {
      bg: '',
      color: '',
      filter: ''
    },
    dark: {
      bg: '#1a1a2e !important',
      color: '#e8e8ff !important',
      filter: 'invert(0)'
    }
  };

  // ── Fonte para dislexia (OpenDyslexic via CDN) ─────────
  function ensureDyslexicFont() {
    const id = '__decifra_font__';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
      document.head.appendChild(link);
    }
  }

  const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  // ── Aplica todas as configurações ─────────────────────
  function applySettings(s) {
    const el = getStyleEl();

    if (!s) {
      el.textContent = '';
      removeRuler();
      removeOverlay();
      return;
    }

    const theme = THEMES[s.theme] || THEMES.normal;

    // Regras de texto dinâmicas (apenas aplica o que estiver ativo)
    let textRules = [];

    if (s.fontSize && s.fontSize !== 'disabled') {
      textRules.push(`font-size: ${s.fontSize}% !important;`);
    }

    if (s.letterSpacing && s.letterSpacing !== 'disabled') {
      textRules.push(`letter-spacing: ${s.letterSpacing} !important;`);
    }

    if (s.lineHeight && s.lineHeight !== 'disabled') {
      textRules.push(`line-height: ${s.lineHeight} !important;`);
    }

    if (s.dyslexiaFont) {
      ensureDyslexicFont();
      textRules.push(`font-family: "OpenDyslexic", Arial, sans-serif !important;`);
    }

    let css = '';
    if (textRules.length > 0) {
      css += `
        html, body, p, span, div, li, td, th, h1, h2, h3, h4, h5, h6,
        article, section, main, aside, header, footer, a, label, input, textarea {
          ${textRules.join('\n          ')}
        }
      `;
    }

    if (theme.bg) {
      css += `
        html, body {
          background: ${theme.bg};
          color: ${theme.color};
          filter: ${theme.filter};
        }
        * {
          background-color: ${theme.bg};
          color: ${theme.color};
        }
        img, video, canvas, svg {
          background-color: transparent !important;
          filter: ${theme.filter || 'none'};
        }
      `;
    }

    // Ocultar imagens para evitar sobrecarga visual
    if (s.hideImages) {
      css += `
        img, picture, video, canvas, figure, [style*="background-image"] {
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `;
    }

    // Simplificação visual
    if (s.simplify) {
      css += `
        /* Remove banners, sidebars, ads e elementos decorativos */
        [class*="banner"], [class*="sidebar"], [class*="widget"],
        [class*="popup"], [class*="modal"], [class*="overlay"],
        [class*="ad-"], [class*="-ad"], [id*="ad-"], [id*="-ad"],
        [class*="advertisement"], [class*="promo"],
        nav[class*="secondary"], aside, .cookie-banner,
        [class*="newsletter"], [class*="subscribe"] {
          display: none !important;
        }
        /* Aumenta área de leitura */
        article, main, [role="main"], .content, #content, .post, .entry {
          max-width: 760px !important;
          margin: 0 auto !important;
          padding: 20px !important;
        }
      `;
    }

    el.textContent = css;

    // Régua de leitura
    if (s.ruler) {
      createRuler();
    } else {
      removeRuler();
    }
  }

  // ── Régua de leitura ──────────────────────────────────
  function createRuler() {
    if (rulerEl) return;

    rulerEl = document.createElement('div');
    rulerEl.id = '__decifra_ruler__';
    rulerEl.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      width: 100% !important;
      height: 36px !important;
      background: rgba(92, 74, 228, 0.12) !important;
      border-top: 2px solid rgba(92, 74, 228, 0.4) !important;
      border-bottom: 2px solid rgba(92, 74, 228, 0.4) !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      transition: top 0.06s linear !important;
      top: -100px;
    `;
    document.body.appendChild(rulerEl);

    document.addEventListener('mousemove', onMouseMove);
  }

  function onMouseMove(e) {
    if (!rulerEl) return;
    const hasLineH = currentSettings && currentSettings.lineHeight && currentSettings.lineHeight !== 'disabled';
    const lineH = hasLineH ? currentSettings.lineHeight * 18 : 30;
    const half = Math.max(lineH, 28) / 2;
    rulerEl.style.top = (e.clientY - half) + 'px';
    rulerEl.style.height = (half * 2) + 'px';
  }

  function removeRuler() {
    if (rulerEl) {
      rulerEl.remove();
      rulerEl = null;
    }
    document.removeEventListener('mousemove', onMouseMove);
  }

  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }

  // ── Ouve mensagens do popup ───────────────────────────
  if (extApi && extApi.runtime && extApi.runtime.onMessage) {
    extApi.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'DECIFRA_UPDATE') {
        currentSettings = msg.settings;
        applySettings(msg.settings);
      }
    });
  }

  // ── Carrega configurações salvas ao abrir a página ────
  if (extApi && extApi.storage && extApi.storage.local) {
    try {
      const getRes = extApi.storage.local.get('decifraSettings');
      if (getRes && typeof getRes.then === 'function') {
        getRes.then(result => {
          if (result && result.decifraSettings) {
            currentSettings = result.decifraSettings;
            applySettings(result.decifraSettings);
          }
        });
      } else {
        extApi.storage.local.get('decifraSettings', (result) => {
          if (result && result.decifraSettings) {
            currentSettings = result.decifraSettings;
            applySettings(result.decifraSettings);
          }
        });
      }
    } catch (e) {
      console.warn('Decifra storage access:', e);
    }
  }

})();