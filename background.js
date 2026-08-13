// background.js — Decifra
// Reaplica configurações ao navegar para novas páginas (RS02, RS03)

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    browser.storage.local.get('decifraSettings').then(result => {
      if (result.decifraSettings && result.decifraSettings.enabled) {
        browser.tabs.sendMessage(tabId, {
          type: 'DECIFRA_UPDATE',
          settings: result.decifraSettings
        }).catch(() => {
          // Página pode ainda não ter o content script — ignorar silenciosamente
        });
      }
    });
  }
});
