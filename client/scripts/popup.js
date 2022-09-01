// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)
chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
}, function(tabs) {
  var tab = tabs[0];
  let bookmarkURLElem = document.getElementById("bookmark-url")
  bookmarkURLElem.href = tab.url
  bookmarkURLElem.textContent = tab.url 
});