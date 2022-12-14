const DISCORD_URI_ENDPOINT = 'https://discord.com/api/oauth2/authorize';

// josca's app's client id
const CLIENT_ID = encodeURIComponent('1023480020729090058');

// firecat's app's client id
// const CLIENT_ID = encodeURIComponent('1025143058116911144');

const RESPONSE_TYPE = encodeURIComponent('code');
const REDIRECT_URI = encodeURIComponent('https://ibldghmofcjajbnjofakcemodnlmnfnf.chromiumapp.org');
const SCOPE = encodeURIComponent('identify email');
const STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

let user_signed_in = false;

function create_auth_endpoint() {
  let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

let endpoint_url =
    `${DISCORD_URI_ENDPOINT}
?client_id=${CLIENT_ID}
&redirect_uri=${REDIRECT_URI}
&response_type=${RESPONSE_TYPE}
&scope=${SCOPE}
&nonce=${nonce}`;

  return endpoint_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'login') {
      chrome.identity.launchWebAuthFlow({
          url: create_auth_endpoint(),
          interactive: true
      }, function (redirect_uri) {
          if (chrome.runtime.lastError || redirect_uri.includes('access_denied')) {
              console.log("Could not authenticate.");
              sendResponse({success: false});
              return true
          } else {
              user_signed_in = true;
              console.log("Redirect URI after authentiction: " + redirect_uri)
              let params = getQueryParams(redirect_uri)
              sendResponse({success: true, code: params.code});
              return true
          }
      });
      return true
  } else if (request.message === 'logout') {
      user_signed_in = false;
      sendResponse({success: true});
  }
});

// get query params, used to get params from redirect uri above
function getQueryParams(url) {
  const paramArr = url.slice(url.indexOf('?') + 1).split('&');
  const params = {};
  paramArr.map(param => {
      const [key, val] = param.split('=');
      params[key] = decodeURIComponent(val);
  })
  return params;
}