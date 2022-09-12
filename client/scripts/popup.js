// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)
// NOTE: this is functionality for getting the url, commenting out for now
// chrome.tabs.query({
//   active: true,
//   lastFocusedWindow: true
// }, function(tabs) {
//   var tab = tabs[0];
//   let bookmarkURLElem = document.getElementById("bookmark-url")
//   bookmarkURLElem.href = tab.url
//   bookmarkURLElem.textContent = tab.url 
// });

// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: setPageBackgroundColor,
  });
});

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}