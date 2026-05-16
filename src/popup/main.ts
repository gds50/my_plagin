document.getElementById('open-newtab')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://newtab' });
  window.close();
});

document.getElementById('open-options')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});
