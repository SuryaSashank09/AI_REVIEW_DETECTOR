// Review Guardian — passive listener only (popup uses executeScript directly)
(function(){
  if(window.__reviewGuardianLoaded) return;
  window.__reviewGuardianLoaded = true;
  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if(req.action === 'ping') sendResponse({ok:true});
    return true;
  });
})();
