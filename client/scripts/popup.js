// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)

let newTags = []
let rating = null
// temporary hardcoded USER_ID
const USER_ID = 3

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

  displayingLoadingStatus("Saving bookmark...")
  try {
    const response = await axios.post(CONFIG.API_ENDPOINT + "urluser", {
      user_id: USER_ID, // this should be test user, hardcoded for now  
      user_descr: description,
      rating: rating,
      bookmark: isBookmarkChecked,
      share: isShareChecked,
      custom_title: customBookmarkTitle, 
      url: tabURL,
      url_title: canonicalTitle,
      tags: newTags,
    })

    console.log(response)

    if (isResponseSuccess(response)) {
      await populateUserFeed()
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
  document.getElementById('status-cont').innerHTML = "<span>Bookmark already saved.<span>"
}

let displayErrorStatus = (customErrorStatus=null) => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = `<span>${customErrorStatus ? customErrorStatus : 'F#$!. A bug is afoot.'}</span>`
}

let displayingLoadingStatus = (customLoadingStatus=null) => {
  document.getElementById('status-cont').innerHTML = ''
  document.getElementById('status-cont').innerHTML = `<span>${customLoadingStatus ? customLoadingStatus : "Loading..."}</span>`
}

let awaitTimeout = async(ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let displayStatusClear = async(timeout=null) => {
  if (timeout != null) {
    // setTimeout(function() { document.getElementById('status-cont').innerHTML = '' }, timeout);
    await awaitTimeout(timeout)
    document.getElementById('status-cont').innerHTML = ''
  } else {
    document.getElementById('status-cont').innerHTML = ''
  }
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
  displayingLoadingStatus("Refreshing your bookmarks...")
  try {
    response = await axios.get(`${CONFIG.API_ENDPOINT}users/${USER_ID}`)
    if (response && response.data && response.data.urls) {
      await displayStatusClear(500) //TODO: do i have to make this and others with waiting into async functions and await for it
      return response.data.urls
    } else {
      displayErrorStatus("Failed to refresh bookmarks.")
    }
  } catch (e) {
    displayErrorStatus("Failed to refresh bookmarks.")
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

  // TODO: remove this, just for testing
  // urls = [
  //   {url: {url: 'http://www.google.com'}, created_at: '2021-01-01', document_title: 'Google Website', rating: 3, tags: [{name: 'web3'}, {name: 'crypto'}]},
  //   {url: {url: 'http://www.yahoo.com'}, created_at: '2020-02-15', document_title: 'Yahoo', rating: 1, tags: [{name: 'sports'}, {name: 'finance'}]},
  //   {url: {url: 'http://www.ign.com'}, created_at: '2022-01-02', document_title: 'Random IGN Article', rating: 4, tags: [{name: 'gaming'}, {name: 'gta'}]},
  //   {url: {url: 'http://www.pitchfork.com'}, created_at: '2019-02-01', document_title: 'Music Top 10', rating: null, tags: [{name: 'music'}]}
  // ]

  // create table rows
  if (urls != null) {
    let tableRows = "" 
    for (const url of urls ) {
      // if valid date, set date to month and day if this year, otherwise add year
      let dateStr = '-'
      let dateNum = '-'
      let momentDate = moment(url.created_at)
      if (momentDate.isValid() == true) {
        if (momentDate.format('YYYY') == moment().format('YYYY')) {
          dateStr = moment(url.created_at).format('MMM D')
          dateNum = moment(url.created_at).valueOf()
        } else {
          dateStr = moment(url.created_at).format('MMM D, YY')
          dateNum = moment(url.created_at).valueOf()
        }
      }
      tableRows = tableRows + `
      <tr>
        <td><a class="bookmark-title bookmark-URL-link" href=${getURLLink(url)} target="_blank">${url.custom_title || url.url.title}</a></td>
        <td class="bookmark-tags">${getTagsFromURL(url)}</td>
        <td class="bookmark-rating">${(url.rating == null ? 'None' : url.rating)}</td>
        <td class="bookmark-date">${dateStr}</td>
        <td class="bookmark-date-hidden" style="display: none;">${dateNum}</td>
      </tr>
      ` 
    }

    // insert table rows
    document.getElementById("saved-bookmarks-table-body").innerHTML = tableRows

    let options = {
      valueNames: [ 'bookmark-title', 'bookmark-rating', 'bookmark-date-hidden']
    };
    let savedBookmarksTable = new List('saved-bookmarks-table-cont', options);

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
  // setTimeout(function() { displayStatusClear() }, 2000);
  displayStatusClear(2000)
}

let sortIconElems = document.getElementsByClassName('sort-icon')
for (const elem of sortIconElems) {
  elem.addEventListener('click', (e) => {
	  e.target.style.transform = "rotate(0deg)"
    e.target.style.color = 'red'

    if (e.target.innerText == "arrow_drop_down") {
      e.target.innerText = "arrow_drop_up"
    } else {
      e.target.innerText = "arrow_drop_down"
    }
  })
}

populateUserFeed()
