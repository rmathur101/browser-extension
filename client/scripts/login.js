const USER_ID = 1

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
          const response2 = await axios.post(CONFIG.API_ENDPOINT + "discord" + `?user_id=${USER_ID}&code=${response.code}`, {
            // user_id: USER_ID, // TODO: THESE SHOULD BE IN POST!!!, not as query params
            // code: response.code
          })
        } catch (error) {
          console.log(error)
        }
      }
    } 
  });

})