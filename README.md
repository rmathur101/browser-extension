# Repo Overview
The repo has two main folders: api (backend code) and client (frontend code). For the backend, we plan to use python. For the frontend, undecided if any frameworks will be used - still understanding the browser extensions ecosystem. Browsers have different standards, and different degrees to which they implement the w3c browser extensions standard (annoying!), so still exploring this.

# Running the Extension 
1. In the meantime, if you want to test out the (very basic) functionality on Chrome, do the following:

![image](https://user-images.githubusercontent.com/6148965/188198446-bb8dec7c-73f5-4b8e-b37c-ff9ef301fa4d.png)


2. In the above step, after clicking "Load unpacked" and being prompted to select the "extension directory", choose the "client" folder from this repo (this is where the extension code lives).


3. After this step, you should either see a new icon on your extensions toolbar, or you should see it in the dropdown after clicking the "Extensions" icon. The extension is called "Example". You can pin in to your toolbar if you wish. The icon for the extension should look something like this:

![image](https://user-images.githubusercontent.com/6148965/188199501-037548f3-dca7-40a8-aa50-d491e2a4a2fb.png)


4. Clicking the extension should give you something that looks like this:

![image](https://user-images.githubusercontent.com/6148965/190025630-43269c85-50c8-4022-9249-84a8d5b3a08c.png)


5. And that's it for now! Much more to do. If you have any issues, please make sure you're running the latest version of Chrome (I'm using manifest v3 on Chrome which is new-ish). Or else, feel free to contact me!

# Setting up Frontend for Local Development + Connecting to the Backend

The above section on "Running the Extension" should get the frontend up and running. Once you make changes to the client code, and reload the extension (by simply opening and closing it, or by clicking the reload button on the "Extensions Management" page) you should see your development changes propagate. As far as the backend goes, the connection is established using the `config.js` file that is stored in the `client/config` folder. You'll notice no such file exists in the repo, that's because this file is ignored by git and you'll need to create your own copy for development. See the `client/config/config_template.js` file for information on how to do this. If you look at the `client/scripts/popup.js` file you'll see a constant called `CONFIG.API_ENDPOINT` - this is being read from the `config.js` that you will create. 

When hitting `Submit` or `Done` using the browser extension, you should be able to see a request to the endpoint in the network requests, as well as debug information in the Dev Tools console. At the very least you should see arguments for `shouldBookmark` and `bookmarkURL` (which is the URL you are trying to bookmark) sent to the backend in the request - the request will go to `[YOUR LOCALHOST]/submit_bookmark`. To open up the Dev Tools for the extension so that you can debug, as well as see the network requests, right click the extension and click "inspect". A quick gotcha here - you might find that no request is being made, and that the Dev Tools throws an error about getting `undefined` when trying to get the active tab. This is a gotcha/bug, you might get an error somewhere in this line `let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true});` if you have your Dev Tools open, this is because your Dev Tools becomes your active tab. So, when you have your Dev Tools open, you want to make sure that when you test functionality, you not only click on the extension (which you’ll do anyways to test functionality), but also click on the window of the browser (in an empty space, e.g. in the empty space next to the selected tab at the top of the browser window) - this should correctly put the focus on your browser tab that is running the extension. 
