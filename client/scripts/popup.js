// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)

let newTags = []
let rating = null

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
      user_id: 2, // this should be test user, firecat@email.com
      tags: newTags,
    })
    console.log(response)
  } catch (error) {
    console.log(error)
  }
})

let newTagCancelBtn = document.getElementById("new-tag-cancel-btn")
newTagCancelBtn.addEventListener("click", async() => {
  let newTagInput = document.getElementById("new-tag-input")
  newTagInput.value = ""
  hideNewTagCont()
})

let showNewTagContainer = () => {
  document.getElementById("new-tag-cont").style.display = "inline"
}

let hideNewTagCont = () => {
  document.getElementById("new-tag-cont").style.display = "none"
}

let addTagBtn = document.getElementById("add-tag-btn");
addTagBtn.addEventListener("click", async () => {
  showNewTagContainer()
  document.getElementById("new-tag-input").focus()
})

let newTagDoneBtn = document.getElementById("new-tag-done-btn")
newTagDoneBtn.addEventListener("click", async () => {
  let elem = document.getElementById("new-tag-input")
  let newTagText = elem.value
  if (newTagText.length > 0) {
    newTags.push(newTagText.toUpperCase())
    elem.value = ""
    hideNewTagCont()
    renderDisplayNewTags()
  }
})

let removeTagBtnClick = async(e) => {
  let removeTagBtnElem = e.target
  let tagElem = removeTagBtnElem.previousElementSibling
  let tagName = tagElem.innerHTML
  let tagIndex = newTags.indexOf(tagName)
  if (tagIndex > -1) {
    newTags.splice(tagIndex, 1)
    renderDisplayNewTags()
  }
}

function renderDisplayNewTags() {
  let elem = document.getElementById("new-tags-display-cont")
  elem.innerHTML = ""
  for (const tag of newTags) {
    let span = `<span><span class="tag-name" style="vertical-align: middle;">${tag}</span><span class="material-symbols-outlined remove-tag-btn" style="font-size: 11px; vertical-align: middle; color: red;">close</span></span>`
    elem.insertAdjacentHTML('beforeend', span) 
  }

  let removeTagBtns = document.querySelectorAll('.remove-tag-btn')
  for (const elem of removeTagBtns) {
    elem.removeEventListener("click", removeTagBtnClick)
    elem.addEventListener("click", removeTagBtnClick)
  }
}


function clearSubmitBookmarkRatingStars() {
    let starNumber = 5 // TODO: need to get this dynamically based on the greatest one probs
    while (starNumber > 0) {
      let elem = document.querySelector(`[data-submit-rating-star="${starNumber}"]`)
      elem.classList.remove("rating-star-filled")
      starNumber = starNumber - 1
    }
}

function fillSubmitBookmarkRatingStarsBasedOnRating() {
  let starNumber = rating
  while (starNumber != null && starNumber > 0) {
    let elem = document.querySelector(`[data-submit-rating-star="${starNumber}"]`)
    elem.classList.add("rating-star-filled")
    starNumber = starNumber - 1
  }
}

let bookmarkSubmitRatingStars = document.getElementsByClassName("bookmark-submit-rating-star")
for (const star of bookmarkSubmitRatingStars) {

  star.addEventListener("mouseover", async (e) => {
    clearSubmitBookmarkRatingStars()
    let starNumber = e.target.dataset.submitRatingStar
    while (starNumber > 0) {
      let elem = document.querySelector(`[data-submit-rating-star="${starNumber}"]`)
      elem.classList.add("rating-star-filled")
      starNumber = starNumber - 1
    }
  })


  star.addEventListener("click", async(e) => {
    let starNumber = e.target.dataset.submitRatingStar
    let elem = document.getElementById("bookmark-submit-rating")
    // if the choose the same rating as they already have, clear all ratings
    if (starNumber == rating) {
      rating = null
      elem.innerHTML = ''
    } else {
      rating = parseInt(starNumber)
      elem.innerHTML = `(${rating}/5)`
    }

  })
} 

let bookmarkSubmitRatingStarsCont = document.getElementById("bookmark-submit-rating-stars-cont")
bookmarkSubmitRatingStarsCont.addEventListener("mouseout", async(e) => {
  clearSubmitBookmarkRatingStars()
  fillSubmitBookmarkRatingStarsBasedOnRating()
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