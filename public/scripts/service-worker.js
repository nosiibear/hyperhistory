console.log("start of service-worker.js")

chrome.runtime.onInstalled.addListener(() => {
  console.log("installed")
});

let tabs = new Map();

/*chrome.browserAction.onClicked.addEventListener("click", async () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("./index.html") });
});*/

chrome.action.onClicked.addListener(async (tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("./index.html") });
  console.log("inside click listener");
  console.log(tab)
});

/*chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command: ${command}`);
  if(command == "test") {
    console.log("command is test")
    const url = await chrome.runtime.getURL("pages/vispage.html")
    console.log("url: " + url)
    const tab = await chrome.tabs.query({url: chrome.runtime.getURL("pages/vispage.html")})
    console.log(tab)
    if(tab.length > 0) {
      console.log("tab > 0")
    } else {
      console.log("tab = 0")
      chrome.tabs.create({ url: chrome.runtime.getURL("./pages/vispage.html") });
    }
  }
});*/

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.click) {
    console.log("Clicked")
    console.log(message.click)
    console.log(message.click.href)
    return true;
  }
  if (message.auxClick) {
    console.log("Aux clicked")
    console.log(message.auxClick)
    console.log(message.auxClick.href)
    return true;
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log("In service worker, tab created")
  console.log(tab)
  tabs.set(tab.id, tab.pendingUrl);
  //chrome.storage.local.set({tabId: url});
  if(tab.pendingUrl !== "chrome://newtab/") {
    //chrome.runtime.sendMessage({newTab: {tabId: tab.id, nodeId: `${Date.now()}`, url: tab.pendingUrl}})
    console.log("New tab opened from another page <><><>")
    //chrome.runtime.sendMessage({newTab: {tabId: tab.id, url: tab.pendingUrl, title: tab.title}})
  } else {
    console.log("New tab opened with ctrl + T")
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("In service worker, tab changed")
  console.log("Everything not null:")
  for(const [key, value] of Object.entries(changeInfo)) {
    if(changeInfo[key] != null) console.log(`!- ${key}: ${value}`)
  }
  //console.log("id: " + tabId + ", changeInfo title: " + changeInfo.title)
  //console.log("id: " + tabId + ", changeInfo url: " + changeInfo.url)
  console.log("id: " + tabId + ", tab title: " + tab.title)
  console.log("id: " + tabId + ", tab url: " + tab.url)
  if(changeInfo.url) {
    console.log("Tab changed url")
    if(changeInfo.url !== "chrome://newtab/") {
      console.log("Changing url is not a new tab, could be legit new tab")
      console.log(tabs)
      if(tabs.get(tabId) === "chrome://newtab/") {
        console.log("Changing from blank tab into real new tab, should send newTab to vispage")
        console.log(tabs.get(tabId) === "chrome://newtab/")
        chrome.runtime.sendMessage({newTab: {tabId, url: tab.url, title: tab.title}})
        tabs.set(tab.id, tab.url);
      } else {
        console.log("Not changing from blank tab to first page, but should still update anyway")
        chrome.runtime.sendMessage({changedTab: {tabId, url: tab.url, title: tab.title}})
        tabs.set(tab.id, tab.url);
      }
    }
    /*if(tabs.get(tabId) === "chrome://newtab/") {
      if(changeInfo.url !== "chrome://newtab/") {
        console.log("Current url at tab ID is new tab, changeInfo.url is not new tab, so we're putting new tab on graph <><><>")
        //chrome.runtime.sendMessage({newTab: {tabId, url: tab.url, title: tab.title}})
      } else {
        console.log("Not creating new tab or updating")
      }
    } else {
      console.log("Updating tab instead")
      chrome.runtime.sendMessage({changedTab: {tabId, url: tab.url, title: tab.title}})
    }*/
  } else if(changeInfo.title) {
    console.log("Tab did not update url, updating title instead")
    chrome.runtime.sendMessage({updatedTab: {tabId, title: tab.title, url: tab.url}})
  }
})