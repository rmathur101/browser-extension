// TODO: need to look at firefox implementation / web standard to see if I can generalize
// TODO: and / or need to see if I can avoid callbacks (in favor of promises)

let newTags = []
let rating = null
let userId

// NOTE: if there is no value for userId, then we need to show that they are forced to login or sign up, and then we'll only show them one button to do so; we can show or hide the entire container or not based on this value, until then it should just be hidden
chrome.storage.local.get(["userId"]).then((result) => {
  console.log("userId value from storage.local: " + result.userId);
  // TODO: change this back, for now just going to the not signed in content 
  if (false && result.userId) {
    document.getElementById("signed-in-content").style.display = "block"
    userId = result.userId

    // NOTE: gets the bookmarks of the user and populates it on the "Saved" tab
    // TODO: probably should rename to "populateUserBookmarks" or something 
    populateUserFeed()

    // NOTE: gets the channels that user has access to and displays them
    getAndShowBroadcastChannels(document.getElementById("share-select"))

    // TODO: should probably just do this all inside the function for both share-select and bi-share-select, but for now just doing it here
    getAndShowBroadcastChannels(document.getElementById("bi-share-select"))
  } else {
    document.getElementById("not-signed-in-content").style.display = "block"
  }
});


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

function getIsShareCheckedBool(elemId) {
 let elem = document.getElementById(elemId) 
 if (elem.checked == true) {
  return true
 } else {
  return false
 }
}

let shareCheckboxListener = (checkboxElem, selectElem, e) => {
  if (checkboxElem.checked == true) {
    selectElem.style.display = "inline"

    // get bi-share-btn elem and display inline if this is the modal view
    if (checkboxElem.id == 'bi-share-checkbox-input') {
      let biShareBtn = document.getElementById("bi-share-btn")
      biShareBtn.style.display = "inline"
    }
  } else {
    selectElem.style.display = "none"

    // get bi-share-btn elem and display none if this is the modal view
    if (checkboxElem.id == 'bi-share-checkbox-input') {
      let biShareBtn = document.getElementById("bi-share-btn")
      biShareBtn.style.display = "none"
    }
  }
}

// NOTE: display appropriate UI elements based on share options
let shareCheckboxInput = document.getElementById("share-checkbox-input") 
let shareSelectElem = document.getElementById("share-select")
shareCheckboxInput.addEventListener("click", shareCheckboxListener.bind(null, shareCheckboxInput, shareSelectElem))

let biShareCheckboxInput = document.getElementById("bi-share-checkbox-input")
let biShareSelectElem = document.getElementById("bi-share-select")
biShareCheckboxInput.addEventListener("click", shareCheckboxListener.bind(null, biShareCheckboxInput, biShareSelectElem))

// NOTE: get the channels and display them for the share component
let getAndShowBroadcastChannels = async(selectElem) => {
  let channels = await getUserChannels()
  if (channels && channels.length > 0) {
    for (const channel of channels) {
      let option = `<option value="${channel.id}">${channel.name}</option>`
      selectElem.insertAdjacentHTML('beforeend', option)
    }

    // NOTE: the share-input-cont is hidden by default
    if (selectElem.id == "share-select") {
      document.getElementById("share-input-cont").style.display = "inline"
    } else if (selectElem.id == "bi-share-select") {
      document.getElementById("bi-share-input-cont").style.display = "inline"
    }
  }
}

function getDescription() {
  // if bookmark descript value elem exists 
  let elem = document.getElementById("bookmark-description-value")
  if (elem) {
    return elem.value
  } else {
    return null
  }
}

function getShareInfo() {}

function getTagInfo() {}


let shouldShare = (checkboxElem, selectElem) => {
  if (checkboxElem.checked == true && selectElem.value) {
    return true
  } else {
    return false
  }

}
let getShareValue = (checkboxElem, selectElem) => {
  if (shouldShare(checkboxElem, selectElem)) {
    // TODO: share value hardcoded (#general) for now until Josca makes the fix to change BigInts to strings
    return "1000691190074703905"
    return selectElem.value
  } else {
    return null
  }
}

function getBookmarkTitle() {
  return document.getElementById("bookmark-title-input").value
}

let submitBtn = document.getElementById("submit-btn");
submitBtn.addEventListener("click", async () => {
  let tabURL = await getActiveTabURL()
  let isBookmarkChecked = getIsBookmarkCheckedBool() 
  let isShareChecked = getIsShareCheckedBool("share-checkbox-input")
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
      user_id: getUserId(),  
      // user_descr: description,
      // rating: rating,
      bookmark: isBookmarkChecked,
      share: getShareValue(shareCheckboxInput, shareSelectElem),
      custom_title: customBookmarkTitle, 
      url: tabURL,
      url_title: canonicalTitle,
      tags: newTags
    })

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

let removeTagBtnMouseOver = async(e) => { 
  e.target.parentElement.classList.add("remove-tag-hover")
}
let removeTagBtnMouseOut = async(e) => {
  e.target.parentElement.classList.remove("remove-tag-hover")
}

function renderDisplayNewTags() {
  let elem = document.getElementById("new-tags-display-cont")
  elem.innerHTML = ""
  for (const tag of newTags) {
    let span = `<span class="new-tag"><span class="tag-name" ">${tag}</span><span class="material-symbols-outlined remove-tag-btn">close</span></span>`
    elem.insertAdjacentHTML('beforeend', span) 
  }

  let removeTagBtns = document.querySelectorAll('.remove-tag-btn')
  for (const elem of removeTagBtns) {
    elem.removeEventListener("click", removeTagBtnClick)
    elem.addEventListener("mouseover", removeTagBtnMouseOver)
    elem.addEventListener("mouseout", removeTagBtnMouseOut)
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

// ignore rating stars for now
// let bookmarkSubmitRatingStarsCont = document.getElementById("bookmark-submit-rating-stars-cont")
// bookmarkSubmitRatingStarsCont.addEventListener("mouseout", async(e) => {
//   clearSubmitBookmarkRatingStars()
//   fillSubmitBookmarkRatingStarsBasedOnRating()
// })

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
    tabElem.classList.remove("unselected-tab")
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.add("unselected-tab")
    tabElem.classList.remove("selected-tab")
  }
}

function toggleViewFeedTab(on=true) {
  let tabContElem = document.getElementById('view-feed-cont')
  let tabElem = document.getElementById('view-feed-tab')

  if (on) {
    tabContElem.style.display = ""
    tabElem.classList.add("selected-tab")
    tabElem.classList.remove("unselected-tab")
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.add("unselected-tab")
    tabElem.classList.remove("selected-tab")
  }
}

function toggleViewBookmarksTab(on=true) {
  let tabContElem = document.getElementById('view-bookmarks-cont')
  let tabElem = document.getElementById('view-bookmarks-tab')

  if (on) {
    tabContElem.style.display = ""
    tabElem.classList.add('selected-tab') 
    tabElem.classList.remove("unselected-tab")
  } else {
    tabContElem.style.display = "none"
    tabElem.classList.add("unselected-tab")
    tabElem.classList.remove('selected-tab') 
  }
}


function showCreateBookmarkTab() {
  displayStatusClear()

  toggleViewBookmarksTab(false)
  toggleViewFeedTab(false)
  toggleCreateBookmarkTab(true)

  let e = document.getElementById('popup-container')
  // we revert to the default height of the popup, but we set the minHeight so it can grow if needed, and then remove the explicit height
  e.style.height = '280px'
  e.style.minHeight = '280px'
  e.style.height = ''
}

function showViewFeedTab() {
  displayStatusClear()

  toggleViewBookmarksTab(false)
  toggleCreateBookmarkTab(false)
  toggleViewFeedTab(true)

  let e = document.getElementById('popup-container')
  e.style.minHeight = '500px'
  e.style.maxHeight = '500px'
}

function showViewBooksmarksTab() {
  displayStatusClear()

  toggleCreateBookmarkTab(false)
  toggleViewFeedTab(false)
  toggleViewBookmarksTab(true)

  let e = document.getElementById('popup-container')
  e.style.minHeight = '500px'
  e.style.maxHeight = '500px'
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

// only show btn if element is on dom 
let loginPageBtn = document.getElementById("login-page-btn")
if (loginPageBtn) {
  loginPageBtn.addEventListener("click", async() => {
    chrome.tabs.create({url: 'views/login.html'}) 
  })
}

let getUserUrls = async() => {

  let response = null
  displayingLoadingStatus("Refreshing your bookmarks...")

  try {
    response = await axios.get(`${CONFIG.API_ENDPOINT}users/${getUserId()}`)

    console.log('response from GET /users/[userId]:')
    console.log(response)
    console.log('\n')

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
    console.log('\n')
  }
  return response
}

// NOTE: JSON object where the key is the URLID and the value is object with bookmark data (we'll use this to retrieve info about the bookmarks, e.g. in bookmark info modal)
let bookmarksData = {}

// TODO: to abstract to any table, should probably pass in the table id
// need to create functions for getting the data from the url object
let populateUserFeed = async(selectedOption=null) => {

  let getTagsFromURL = (url) => {
    if (url && url.tags && url.tags.length > 0) {
      let returnStr = ''
      for (const tag of url.tags) {
        returnStr = returnStr + `<span class="table-tag">${tag.name}</span>`
      }
      return returnStr
    } else {
      return '<span>None</span>'
    }
  }

  let getURLLink = (url) => {
    return url.url.url
  }

  // easy flag to see if we should shorten the title
  let shouldShortenTitleFlag = true 
  let getShortTitle = (url) => {
    let title = url.custom_title || url.url.title

    if (!shouldShortenTitleFlag) {
      return title
    } else {
      if (title.length > 40) {
        title = title.substring(0, 36)
        title = title + '...'
      }
      return title
    }
  }

  let getFullTitle = (url) => {
    let title = url.custom_title || url.url.title
    return title
  }

  let getURLID = (url) => {
    return url.url_id + ""
  }

  let urls = await getUserUrls()

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
      bookmarksData[getURLID(url)] = {
        url: url.url.url,
        title: getFullTitle(url),
        tags: url.tags,
        rating: url.rating,
        created_at: url.created_at,
        bookmark: url.bookmark,
        user_descr: url.user_descr,
        custom_title: url.custom_title
      }

      // filtering logic
      if (selectedOption == null || selectedOption == 'bookmarks') {
        // ignore bookmarks that have been archived 
        if (!url.bookmark) {
          continue
        }

      } else if (selectedOption == 'archived') {
          // ignore bookmarks that have not been archived 
          if (url.bookmark == true) {
            continue
          }
      }


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

      let fullTitle = getFullTitle(url)
      let shortTitle = getShortTitle(url)

      tableRows = tableRows + `
      <tr class="saved-bookmark-row">
        <td style="text-align: center;"><span class="material-symbols-outlined saved-bookmark-info-icon noselect" data-urlid="${getURLID(url)}">info</span></td>
        <td class="bookmark-title-data-cell"><a data-full-title="${fullTitle}" data-short-title="${shortTitle}" class="bookmark-title bookmark-URL-link" href=${getURLLink(url)} target="_blank">${shortTitle}</a><span class="material-symbols-outlined saved-bookmark-trash-icon" data-urlid="${getURLID(url)}">delete_forever</span></td>
        <td style="display: none;"><a href=${getURLLink(url)} target="_blank">${url.custom_title || url.url.title}</a></td>
        ${null/*<td class="bookmark-tags">${getTagsFromURL(url)}</td>*/}
        ${null/*<td class="bookmark-rating">${(url.rating == null ? 'None' : url.rating)}</td>*/}
        <td class="bookmark-date">${dateStr}</td>
        <td class="bookmark-date-hidden" style="display: none">${dateNum}</td>
      </tr>
      ` 
    }

    // what we'll use for the edit icon (later)
    {/* <span class="material-symbols-outlined bookmark-name-edit-icon">edit</span> */}

    // insert table rows
    document.getElementById("saved-bookmarks-table-body").innerHTML = tableRows

    // removing pagination for now...
    let options = {
      valueNames: [ 'bookmark-title', 'bookmark-rating', 'bookmark-date-hidden'],
      // page: 6,
      // pagination: true
    };
    let savedBookmarksTable = new List('saved-bookmarks-table-cont', options);
    savedBookmarksTable.sort('bookmark-date-hidden', { order: "desc" });

    // add click listeners to all the links
    let bookmarkURLLinks = document.getElementsByClassName('bookmark-URL-link')
    for (const bookmarkURLLink of bookmarkURLLinks) {
      bookmarkURLLink.addEventListener('click', openBookmarkOnClick)
    } 
    
    // NOTE: we've commented this out for now, we've moved to a design where we have the info icon that will be used to expand the bookmark info modal - leaving this here just in case
    // add listeners to expand and collapse the title
    // let bookmarkTitleDataCells = document.getElementsByClassName('bookmark-title-data-cell')
    // for (const bookmarkTitleDataCell of bookmarkTitleDataCells) {
    //   bookmarkTitleDataCell.addEventListener('mouseover', displayTitleTooltip)
    //   bookmarkTitleDataCell.addEventListener('mouseout', hideTitleTooltip)
    // }

    // add listeners to delete the bookmark
    let savedBookmarkTrashIcons = document.getElementsByClassName('saved-bookmark-trash-icon')
    for (const savedBookmarkTrashIcon of savedBookmarkTrashIcons) {
      savedBookmarkTrashIcon.addEventListener('click', deleteBookmarkOnClick)
    }

    addSavedBookmarkInfoIconListeners()

    // for now we're not doing this, but this is for hiding / appearing on table row hover
    // let savedBookmarkRows = document.getElementsByClassName('saved-bookmark-row')
    // for (const SBR of savedBookmarkRows) {
    //   SBR.addEventListener('mouseover', displayTitleTooltip)
    //   SBR.addEventListener('mouseout', hideTitleTooltip)
    // }

  } else {
    console.log("Not able to retrieve urls from API!")
    alert("Not able to retrieve urls from API!")
  }

  console.log('bookmarks data')
  console.log(bookmarksData)
}

let openBookmarkOnClick = async(e) => {
  displayOpeningBookmarkInNewTabStatus() 
  e.preventDefault()
  chrome.tabs.create({url: e.target.href, active: false})
  // setTimeout(function() { displayStatusClear() }, 2000);
  await displayStatusClear(2000)
}

let displayTitleTooltip = (e) => {
  let cellElem = e.currentTarget
  let titleElem = cellElem.children[0] 
  let fullTitle = titleElem.dataset.fullTitle
  titleElem.innerText = fullTitle

  let trashElem = cellElem.children[1]
  trashElem.style.setProperty("display", "inline", "important")
}

let hideTitleTooltip = (e) => {
  let titleElem = e.currentTarget.children[0]
  let shortTitle = titleElem.dataset.shortTitle
  titleElem.innerText = shortTitle

  let trashElem = e.currentTarget.children[1]
  trashElem.style.setProperty("display", "none", "important")
 }

let deleteBookmarkOnClick = async(e) => {
  let savedBookmarkTrashIcon = e.currentTarget
  let urlid = savedBookmarkTrashIcon.dataset.urlid 

  // make post request to /urluser to delete the url using axios
  let response = await axios.post(CONFIG.API_ENDPOINT + "urluser/" + urlid, {
    user_id: getUserId(),
    bookmark: false
  })

  await populateUserFeed()
}


let sortIconElems = document.getElementsByClassName('sort-icon')
let toggledSortIconElem = document.getElementById('default-toggled-sort-icon') 
for (const elem of sortIconElems) {
  elem.addEventListener('click', (e) => {

    if (toggledSortIconElem && toggledSortIconElem != e.target) {
      toggledSortIconElem.innerText = "swap_vert"
    }

    toggledSortIconElem = e.target

    if (e.target.innerText == "south") {
      e.target.innerText = "north"
    } else {
      e.target.innerText = "south"
    }
  })
}

document.getElementById('bookmark-title-input').focus()
document.getElementById('bookmark-title-input').addEventListener('focus', (e) => {
  e.target.select()
})

// tab switches focus to checkbox
document.getElementById('bookmark-title-input').addEventListener('keydown', (e) => {
  if (e.key == 'Tab') {
    e.preventDefault()
    // focus on bookmark checkbox input
    document.getElementById('bookmark-description-value').focus()
    // document.getElementById('bookmark-checkbox-input').focus()
  }
})

document.getElementById('bookmark-checkbox-input').addEventListener('focus', (e) => {
  e.target.classList.add('checkbox-input-focus')
})

document.getElementById('bookmark-checkbox-input').addEventListener('focusout', (e) => {
  e.target.classList.remove('checkbox-input-focus')
})

// on keydown of bookmark checkbox input, if enter toggle checkbox
document.getElementById('bookmark-checkbox-input').addEventListener('keydown', (e) => {
  if (e.key == 'Enter') {
    e.preventDefault()
    e.target.checked = !e.target.checked
  }
})

let getUserId = () => {
  return userId;
}

let getUserChannels = async() => {

  let response = await axios.get(CONFIG.API_ENDPOINT + "discord/" + getUserId())

  console.log('response from GET /discord:')
  console.log(response)
  console.log('\n');

  if (response.status == 200) {
    return response.data
  } else {
    console.log("Not able to retrieve channels from API!")
    alert("Not able to retrieve channels from API!")
  }
}

let savedBookmarksSelect = document.getElementById('saved-bookmarks-select')
savedBookmarksSelect.addEventListener('change', (e) => {
  let selectedOption = e.target.value
  populateUserFeed(selectedOption)
})

let showBookmarkInfo = (URLID, shouldPin=false) => {
  let bookmarkInfo = document.getElementById('bookmark-info')
  bookmarkInfo.classList.remove('hidden')

  // NOTE: we remove this class to remove styling from previously pinned bookmark info (this is necessary for the case in which we are showing the bookmark info but not pinning it yet)
  if (shouldPin) {
    bookmarkInfo.classList.add('modal-pinned')
  } else {
    bookmarkInfo.classList.remove('modal-pinned')
  }

  populateBookmarkInfo(URLID)
}

let hideBookmarkInfo = (e) => {
  let bookmarkInfo = document.getElementById('bookmark-info')
  bookmarkInfo.classList.add('hidden')
}

let pinnedBookMarkInfoIcon = null
let setPinnedBookMarkInfoIcon = (elem) => {
  pinnedBookMarkInfoIcon = elem 
}

let pinnedBookMarkInfoURLID = null
let setPinnedBookMarkInfo = (URLID) => {
  pinnedBookMarkInfoURLID = URLID 
}

let unpinBookmarkInfo = (elem) => {
  elem.classList.remove('saved-bookmark-info-icon-filled')

  setPinnedBookMarkInfoIcon(null)
  setPinnedBookMarkInfo(null)

  hideBookmarkInfo()
  hideBackgroundOverlay() 
}

let pinBookmarkInfo = (e) => {
  // NOTE: this is the URLID of the bookmark info
  let URLID = e.currentTarget.dataset.urlid

  // if the bookmark info is already pinned, unpin it
  if (URLID == pinnedBookMarkInfoURLID) {
    unpinBookmarkInfo(e.currentTarget)
    return
  }

  // if the bookmark info is not already pinned, but there is already a pinned one 
  if (pinnedBookMarkInfoURLID != null && pinnedBookMarkInfoURLID != e.currentTarget.dataset.urlid) {
    unpinBookmarkInfo(pinnedBookMarkInfoIcon)
  }

  // make icon filled 
  e.currentTarget.classList.add('saved-bookmark-info-icon-filled')

  // set the pinned element
  setPinnedBookMarkInfoIcon(e.currentTarget)
  // get the URLID and set it
  setPinnedBookMarkInfo(URLID)

  // show the modal (with the overlay)
  showBookmarkInfo(URLID, true)
  showBackgroundOverlay()
}

let showBackgroundOverlay = (e) => {
  let backgroundOverlay = document.getElementById('background-overlay')
  backgroundOverlay.classList.remove('hidden')
}

let hideBackgroundOverlay = (e) => {
  let backgroundOverlay = document.getElementById('background-overlay')
  backgroundOverlay.classList.add('hidden')
}

let getTitleFromBookmarksData = (URLID) => {
  return bookmarksData[URLID].title
}

let getURLFromBookmarksData = (URLID) => {
  return bookmarksData[URLID].url
}

let getDateFromBookmarksData = (URLID) => {
  let dateStr = ''
  let createdAt =  bookmarksData[URLID].created_at 
  let momentDate = moment(createdAt)
  if (momentDate.isValid()) {
    if (momentDate.format('YYYY') == moment().format('YYYY')) {
      dateStr = moment(createdAt).format('MMM D')
    } else {
      dateStr = moment(createdAt).format('MMM D, YY')
    }
  }
  return dateStr
}

let getTagsHTMLFromBookmarksData = (URLID) => {
  let tags = bookmarksData[URLID].tags
  if (tags && tags.length > 0) {
    let returnStr = ''
    for (const tag of tags) {
      returnStr += `<span class="new-tag bi-tag">${tag.name}</span>`
    }
    return returnStr
  } else {
    return ''
  }
}

let getBookmarkStatusFromBookmarksData = (URLID) => {
  if (bookmarksData[URLID].bookmark) {
    return 'bookmarked'
  } else if (bookmarksData[URLID].bookmark == false) {
    return 'archived'
  }
}

let populateBookmarkInfo = (URLID) => {
  let title = getTitleFromBookmarksData(URLID)
  let url = getURLFromBookmarksData(URLID) 
  let tags = getTagsHTMLFromBookmarksData(URLID)
  let date = getDateFromBookmarksData(URLID)
  document.getElementById('bi-title').innerHTML = `<a class="bookmark-URL-link" href="${url}" target="_blank">${title}</a>`
  document.getElementById('bi-date').innerHTML = 'Bookmarked: ' + date
  document.getElementById('bi-tags').innerHTML = tags
  document.getElementById('bi-status-select').value = getBookmarkStatusFromBookmarksData(URLID)
}

let addSavedBookmarkInfoIconListeners = () => {
  
  let savedBookmarkInfoIcons = document.getElementsByClassName('saved-bookmark-info-icon')

  // remove listener from all saved-bookmark-info-icon elements to display popup on hover
  for (const savedBookmarkInfoIcon of savedBookmarkInfoIcons) {
    savedBookmarkInfoIcon.removeEventListener('mouseover', (e) => {})
    savedBookmarkInfoIcon.removeEventListener('mouseout', (e) => {})
    savedBookmarkInfoIcon.removeEventListener('click', (e) => {})
  }

  for (const savedBookmarkInfoIcon of savedBookmarkInfoIcons) {
    // add listener to all saved-bookmark-info-icon elements to display popup on hover
    savedBookmarkInfoIcon.addEventListener('mouseover', (e) => {
      // NOTE: only show the bookmark info if there is no pinned bookmark info
      if (pinnedBookMarkInfoURLID == null) {
        e.currentTarget.classList.add('saved-bookmark-info-icon-filled')
        let URLID = e.currentTarget.dataset.urlid
        showBookmarkInfo(URLID)
        console.log('mouseover')
      }
    })
    // add listener to all saved-bookmark-info-icon elements to hide popup on mouseout 
    savedBookmarkInfoIcon.addEventListener('mouseout', (e) => {
      if (pinnedBookMarkInfoURLID == null) {
        e.currentTarget.classList.remove('saved-bookmark-info-icon-filled')
        hideBookmarkInfo()
        console.log('mouseout')
      }
    })
    // add listener on click to all saved-bookmark-info-icon elements
    savedBookmarkInfoIcon.addEventListener('click', pinBookmarkInfo)
  }
}

// add listener to close-bookmark-info-btn on click
document.getElementById('close-bookmark-info-btn').addEventListener('click', (e) => {
  hideBookmarkInfo()
  hideBackgroundOverlay()
  setPinnedBookMarkInfo(null)

  // remove filled class from pinned bookmark info icon
  if (pinnedBookMarkInfoIcon != null) {
    pinnedBookMarkInfoIcon.classList.remove('saved-bookmark-info-icon-filled')
  }
})

let getCurrentSavedBookmarksFilterValue = () => {
  let filterValue = document.getElementById('saved-bookmarks-select').value
  return filterValue
}

// NOTE: basically you've implemented a basic version of this, works at some level, but you need to mind about what happens to the pinned id and pinned element when you changed the status (archived / bookmark), at the very least because you are re-populating you should likely change the pinned element value because the element would not be accurate anymore, right? this is why we're setting the icon to null (but we are keeping the pinned id the same)
// add listener to bi-status-select on change
document.getElementById('bi-status-select').addEventListener('change', async(e) => {
  let URLID = pinnedBookMarkInfoURLID
  // for now a false value implies archived
  let newVal = e.currentTarget.value == 'bookmarked' ? true : false
  const response = await axios.post(CONFIG.API_ENDPOINT + 'urluser/' + URLID, {
    bookmark: newVal,
    user_id: getUserId()
  })
  await populateUserFeed(getCurrentSavedBookmarksFilterValue())
  setPinnedBookMarkInfoIcon(null)
  // console.log('this is the response from the post after select value changes');
  // console.log(response)
  // console.log(pinnedBookMarkInfoIcon)
  // console.log(pinnedBookMarkInfoURLID)
})

document.getElementById('bi-share-btn').addEventListener('click', async(e) => {
  let URLID = pinnedBookMarkInfoURLID 
  const response = await axios.post(CONFIG.API_ENDPOINT + 'urluser/' + URLID, {
    user_id: getUserId(),
    share: getShareValue(biShareCheckboxInput, biShareSelectElem)
  })
  console.log('this is the response from the post after select value changes');
  console.log(response)
})