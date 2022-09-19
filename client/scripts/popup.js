// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)

async function getActiveTabURL() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true});
  // TODO: need to handle the case where we are not able to find the tab (active: true, etc.)
  return tab.url 
}

function getIsBookmarkCheckedBool() {
 let elem = document.getElementById("bookmark-checkbox-input") 
 if (elem.checked == true) {
  return true
 } else {
  return false
 }
}

function getIsShareCheckedBool() {
 let elem = document.getElementById("share-checkbox-input") 
 if (elem.checked == true) {
  return true
 } else {
  return false
 }
}

function getShareInfo() {}

function getTagInfo() {}

let submitBtn = document.getElementById("submit-btn");
submitBtn.addEventListener("click", async () => {
  let tabURL = await getActiveTabURL()
  let isBookmarkChecked = getIsBookmarkCheckedBool() 
  let isShareChecked = getIsShareCheckedBool()
  console.log("bookmarkURL")
  console.log(tabURL)
  console.log("shouldBookmark")
  console.log(isBookmarkChecked)
  console.log("shouldShare")
  console.log(isShareChecked)
  try {
    const response = await axios.post(CONFIG.API_ENDPOINT + "url", {
      url: tabURL,
      bookmark: isBookmarkChecked,
      share: isShareChecked,
      user_id: "425839636787495169", // this should be test user, firecat@email.com
      tags: ["test100", "test200"],
    })
    console.log(response)
  } catch (error) {
    console.log(error)
  }
})


// BELOW CODE IS CHROME EXTENSION TUTORIAL -------------------------------------------------------------------------

// Initialize button with user's preferred color
// let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

// When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener("click", async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     func: setPageBackgroundColor,
//   });
// });

// The body of this function will be executed as a content script inside the
// current page
// function setPageBackgroundColor() {
//   chrome.storage.sync.get("color", ({ color }) => {
//     document.body.style.backgroundColor = color;
//   });
// }