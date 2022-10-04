let discordLoginBtn = document.getElementById("discord-login-btn")
discordLoginBtn.addEventListener('mouseover', () => {
  discordLoginBtn.style.transform = 'scale(1.3)';
});

discordLoginBtn.addEventListener('mouseleave', () => {
  discordLoginBtn.style.transform = 'scale(1)';
});

discordLoginBtn.addEventListener("click", async() => {
  // chrome.tabs.create({url: 'views/test.html'}) 
  chrome.runtime.sendMessage({ message: 'login' }, async(response) => {
    if (response.success === true ) {
      if (!response.code) {
        alert("no response code sent from oauth redirect uri!")
      } else {
        console.log("login message success")
        console.log("code")
        console.log(response.code)
        console.log(USER_ID)
        try {
          const response2 = await axios.post(CONFIG.API_ENDPOINT + "discord" + `?user_id=${USER_ID}&code=${response.code}`, {
            // user_id: USER_ID, // THESE SHOULD BE IN POST!!!, not as queries
            // code: response.code
          })
        } catch (error) {
          console.log(error)
        }
      }
    } 
  });

})