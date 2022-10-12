// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)

let newTags = []
let rating = null
// temporary hardcoded USER_ID
const USER_ID = 1

async function getActiveTabURL() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true});
  // TODO: need to handle the case where we are not able to find the tab (active: true, etc.)
  return tab.url 
}

async function getActiveTabTitle() {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true});
  return tab.title 
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

function getDescription() {
  return document.getElementById("bookmark-description-value").value
}

function getShareInfo() {}

function getTagInfo() {}

function getBookmarkTitle() {
  return document.getElementById("bookmark-title-input").value
}

let submitBtn = document.getElementById("submit-btn");
submitBtn.addEventListener("click", async () => {
  let tabURL = await getActiveTabURL()
  let isBookmarkChecked = getIsBookmarkCheckedBool() 
  let isShareChecked = getIsShareCheckedBool()
  let description = getDescription() 

  let bookmarkTitleInputVal = getBookmarkTitle()
  let canonicalTitle = await getActiveTabTitle()
  let customBookmarkTitle = null
  if (canonicalTitle != bookmarkTitleInputVal) {
    customBookmarkTitle = bookmarkTitleInputVal
  }

  let isResponseSuccess = (response) => {
    if (response && response.status == 200) {
      return true
    } else {
      return false
    }
  }

  let isResponseBookmarkDuplicate = (response) => {
    if (response && response.data && response.data.detail && (typeof response.data.detail == "string") && response.data.detail.includes("already exists")) {
      return true
    } else {
      return false
    }
  }

  displayingLoadingStatus()
  try {
    const response = await axios.post(CONFIG.API_ENDPOINT + "url", {
      url: tabURL,
      bookmark: isBookmarkChecked,
      share: isShareChecked,
      user_id: USER_ID, // this should be test user, firecat@email.com
      tags: newTags,
      user_descr: description,
      rating: rating,
      document_title: canonicalTitle,
      custom_title: customBookmarkTitle 
    })

    console.log(response)

    if (isResponseSuccess(response)) {
      displayBookmarkSavedStatus()
    } else if (isResponseBookmarkDuplicate(response)) {
      displayBookmarkDuplicateStatus()
    } else {
      displayErrorStatus()
    }
  } catch (error) {
    
    console.log(error)

    // note it looks like response is part of the error, as opposed to success case where response is top level
    if (isResponseSuccess(error.response)) {
      displayBookmarkSavedStatus()
    } else if (isResponseBookmarkDuplicate(error.response)) {
      displayBookmarkDuplicateStatus()
    } else {
      displayErrorStatus()
    }
  }
})

let displayBookmarkSavedStatus = () => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = "<span>Bookmark saved.<span>" 
}

let displayBookmarkDuplicateStatus = () => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = "<span>This bookmark is already saved.<span>"
}

let displayErrorStatus = () => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = "<span>F#$!. A bug is afoot.</span>"
}

let displayingLoadingStatus = () => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = "<span>Loading...</span>"
}

let displayStatusClear = () => {
  document.getElementById('status-cont').innerHTML = ''
}

let displayOpeningBookmarkInNewTabStatus = () => {
  displayStatusClear()
  document.getElementById('status-cont').innerHTML = "<span>Opening in new tab...</span>"
}

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
      elem.innerHTML = '(None)'
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

// get title after extension loads and set it to input
document.addEventListener("DOMContentLoaded", async(e) => {
  let bookmarkTitleInputElem = document.getElementById("bookmark-title-input")
  let title = await getActiveTabTitle()
  bookmarkTitleInputElem.value = title 
});

function toggleCreateBookmarkTab(on=true) {
  let tabContElem = document.getElementById('create-bookmark-cont')
  let tabElem = document.getElementById('create-bookmark-tab')

  if (on) {
    tabContElem.style.display = ""
    tabElem.classList.add("selected-tab")
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.remove("selected-tab")
  }
}

function toggleViewFeedTab(on=true) {
  let tabContElem = document.getElementById('view-feed-cont')
  let tabElem = document.getElementById('view-feed-tab')

  if (on) {
    tabContElem.style.display = ""
    tabElem.classList.add("selected-tab")
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.remove("selected-tab")
  }
}

function toggleViewBookmarksTab(on=true) {
  let tabContElem = document.getElementById('view-bookmarks-cont')
  let tabElem = document.getElementById('view-bookmarks-tab')

  if (on) {
    tabContElem.style.display = ""
    tabElem.classList.add('selected-tab') 
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.remove('selected-tab') 
  }
}


function showCreateBookmarkTab() {
  displayStatusClear()

  toggleViewBookmarksTab(false)
  toggleViewFeedTab(false)
  toggleCreateBookmarkTab(true)
}

function showViewFeedTab() {
  displayStatusClear()

  toggleViewBookmarksTab(false)
  toggleCreateBookmarkTab(false)
  toggleViewFeedTab(true)
}

function showViewBooksmarksTab() {
  displayStatusClear()

  toggleCreateBookmarkTab(false)
  toggleViewFeedTab(false)
  toggleViewBookmarksTab(true)
}

let bookmarkTabElem = document.getElementById("create-bookmark-tab")
bookmarkTabElem.addEventListener("click", async() => {
  showCreateBookmarkTab()
})
let feedTabElem = document.getElementById("view-feed-tab")
feedTabElem.addEventListener("click", async() => {
  showViewFeedTab()
})
document.getElementById("view-bookmarks-tab").addEventListener("click", async() => {
  showViewBooksmarksTab()
})

let loginPageBtn = document.getElementById("login-page-btn")
loginPageBtn.addEventListener("click", async() => {
  chrome.tabs.create({url: 'views/login.html'}) 
})

let getUserUrls = async() => {
  let response = null
  try {
    response = await axios.get(`${CONFIG.API_ENDPOINT}users/${USER_ID}`)
    if (response && response.data && response.data.urls) {
      return response.data.urls
    }
  } catch (e) {
    console.log('error caught in getUserUrls(): ')
    console.log(e)
  }
  console.log('response from request in getUserUrls():')
  console.log(response)
  return response
}

// TODO: to abstract to any table, should probably pass in the table id
// need to create functions for getting the data from the url object
let populateUserFeed = async() => {
  let getTagsFromURL = (url) => {
    if (url && url.tags && url.tags.length > 0) {
      let returnStr = ''
      for (const tag of url.tags) {
        returnStr = returnStr + tag.name + ' '
      }
      return returnStr
    } else {
      return 'None'
    }
  }

  let getURLLink = (url) => {
    return url.url.url
  }

  let urls = await getUserUrls()
  console.log("urls from response of getUserUrls():")
  console.log(urls)

  // create table rows
  if (urls != null) {
    let tableRows = "" 
    for (const url of urls ) {
     tableRows = tableRows + `
      <tr>
        <td><a class="bookmark-URL-link" href=${getURLLink(url)} target="_blank">${url.custom_title || url.document_title}</a></td>
        <td>${getTagsFromURL(url)}</td>
        <td>${(url.rating == null ? 'None' : url.rating)}</td>
        <td>${moment(url.created_at).isValid() ? moment(url.created_at).format('MMM D YY') : '-'}</td>
      </tr>
     ` 
    }

    // insert table rows
    document.getElementById("bookmarks-table-body").innerHTML = tableRows

    // add click listeners to all the links
    let bookmarkURLLinks = document.getElementsByClassName('bookmark-URL-link')
    for (const bookmarkURLLink of bookmarkURLLinks) {
     bookmarkURLLink.addEventListener('click', openBookmarkOnClick) 
    } 
  } else {
    console.log("Not able to retrieve urls from API!")
    alert("Not able to retrieve urls from API!")
  }
}

let openBookmarkOnClick = (e) => {
  displayOpeningBookmarkInNewTabStatus() 
  e.preventDefault()
  chrome.tabs.create({url: e.target.href, active: false})
  setTimeout(function() { displayStatusClear() }, 3000);
}

populateUserFeed()
