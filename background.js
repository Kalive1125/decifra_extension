// background.js — Decifra
// Reaplica configurações ao navegar para novas páginas (RS02, RS03)

const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

if (extApi && extApi.tabs && extApi.tabs.onUpdated) {
  extApi.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      try {
        const p = extApi.storage.local.get('decifraSettings');
        const handleSettings = (result) => {
          const s = result ? result.decifraSettings : null;
          if (s) {
            try {
              const sendP = extApi.tabs.sendMessage(tabId, {
                type: 'DECIFRA_UPDATE',
                settings: s
              });
              if (sendP && typeof sendP.catch === 'function') {
                sendP.catch(() => {});
              }
            } catch (err) {}
          }
        };

        if (p && typeof p.then === 'function') {
          p.then(handleSettings).catch(() => {});
        } else {
          extApi.storage.local.get('decifraSettings', handleSettings);
        }
      } catch (e) {}
    }
  });
}

