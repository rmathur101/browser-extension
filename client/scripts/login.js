// TODO we can't just expect to have a user id here, we have to require the discord login so that we can have the ability to have a user, we get a response back from the server, and then we can go ahead and associate the discord id stuff with the user that was created
const USER_ID = 2

let discordLoginBtn = document.getElementById("discord-login-btn")
// just button styling / animation
discordLoginBtn.addEventListener('mouseover', () => {
  discordLoginBtn.style.transform = 'scale(1.3)';
});
discordLoginBtn.addEventListener('mouseleave', () => {
  discordLoginBtn.style.transform = 'scale(1)';
});

discordLoginBtn.addEventListener("click", async() => {
  chrome.runtime.sendMessage({ message: 'login' }, async(response) => {
    if (response.success === true ) {
      if (!response.code) {
        alert("no response code sent from oauth redirect uri!")
      } else {
        console.log("message: 'login': success!")
        console.log("Discord code to be sent to backend: " + response.code)
        console.log("User ID to be sent to backend along with code: " + USER_ID)
        try {
          // TODO: in the future I'm thinking that we won't send the user_id, instead we'll just use the request to send enough information to the backend for them to check that the user exists or create them; but for now the route requires the user_id param so keeping as is
          const response2 = await axios.post(CONFIG.API_ENDPOINT + "discord", {
            user_id: USER_ID,  
            code: response.code
          })
          // NOTE: this is the response where I imagine that we will get the user_id back from the API in the response, this will either be the user_id of the logged in user, or a new user id if a new one was created
          console.log('response from /discord route')
          console.log(response2)
          // if (getUserIdFromResponse(response2)) {
          if (true) {
            // TODO: this is hardcoded for now, need to fix with getting the getUserIdFromResponse
            let userId = 2
            // TODO: put the userId into google chrome local storage
            chrome.storage.local.set({userId: userId}, function() {
              console.log('Value is set to ' + userId);
            })
          }
        } catch (error) {
          console.log(error)
        }
      }
    } 
  });
})