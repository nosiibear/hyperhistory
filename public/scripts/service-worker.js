console.log("start of service-worker.js")

chrome.runtime.onInstalled.addListener(() => {
  console.log("installed")
});

let tabs = new Map();

function cleanseURL(str) {
  const url = new URL(str)
  let params = url.searchParams;
  //console.log("    Inside cleanseURL")
  //console.log("    url:")
  //console.log(url)
  //console.log("    params:")
  //for(const param of params) {
  //  console.log(param)
  //}
  let hostname = url.hostname;
  let allowedParams = [];
  let returnParams = new URLSearchParams();
  /*if(url.hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }*/

  if(hostname == "www.google.com") {
    allowedParams = ["q", "tbm", "tbs"]
  } else if(hostname == "www.bing.com") {
    allowedParams = ["q", "filters", "qft"]
  }

  for(const paramStr of allowedParams) {
    if(params.has(paramStr)) {
      returnParams.set(paramStr, params.get(paramStr))
    }
  }
  let returnUrl = url.origin + url.pathname + "?"
  for(const param of returnParams) {
    returnUrl += param[0] + "=" + param[1] + "&";
  }
  returnUrl = encodeURI(returnUrl).slice(0, -1);
  //console.log("returnUrl:")
  //console.log(returnUrl)
  return returnUrl;
}

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
    console.log("%cClicked", 'background-color: black; color: red; font-size: 18px')
    console.log(message.click)
    return true;
  }
  if (message.auxClick) {
    console.log("%cAux clicked", 'background-color: black; color: red; font-size: 18px')
    console.log(message.auxClick)
    return true;
  }
  if (message.bodyClick) {
    console.log("%cBody clicked", 'background-color: black; color: red; font-size: 18px')
    return true;
  }
  if (message.bodyAuxClick) {
    console.log("%cBody aux clicked", 'background-color: black; color: red; font-size: 18px')
    return true;
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log("%cIn service worker, tab created", "background: black; color: white")
  console.log(tab)
  const url = cleanseURL(tab.pendingUrl);
  tabs.set(tab.id, url);
  if(url !== "chrome://newtab/") {
    console.log("New tab opened from another page")
    chrome.runtime.sendMessage({newTabBranched: {tabId: tab.id, openerTabId: tab.openerTabId, url: url, title: tab.title}})
  } else {
    console.log("New tab opened with ctrl + T")
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(changeInfo.status === 'complete') chrome.runtime.sendMessage({pageLoaded: tabId});
  console.log("%cIn service worker, tab changed", "background: black; color: yellow")
  console.log("Everything not null:")
  for(const [key, value] of Object.entries(changeInfo)) {
    if(changeInfo[key] != null) console.log(`${key}: ${value}`)
  }
  //console.log("id: " + tabId + ", changeInfo title: " + changeInfo.title)
  //console.log("id: " + tabId + ", changeInfo url: " + changeInfo.url)
  console.log("id: " + tabId + ", tab title: " + tab.title)
  console.log("id: " + tabId + ", tab url: " + tab.url)
  const url = cleanseURL(tab.url)
  //if(tabId in tabs.keys()) {
    if(changeInfo.url) {
      console.log("Tab changed url")
      if(url !== "chrome://newtab/" /*&& changeInfo.url in tabs.values()*/) {
        console.log("Changing url is not a new tab, could be legit new tab")
        console.log(tabs)
        if(tabs.get(tabId) === "chrome://newtab/") {
          console.log("Changing from blank tab into real new tab, should send newTab to vispage")
          console.log(tabs.get(tabId) === "chrome://newtab/")
          chrome.runtime.sendMessage({newTab: {tabId, url: url, title: tab.title}})
          tabs.set(tab.id, url);
        } else /*if(!tabId in tabs.keys())*/ {
          console.log("Not changing from blank tab to first page, but should still update anyway")
          chrome.runtime.sendMessage({changedTab: {tabId, url: url, title: tab.title}})
          tabs.set(tab.id, url);
        }
      }
    } else {
      if(changeInfo.title) {
        console.log("Tab did not update url, updating title instead")
        chrome.runtime.sendMessage({updatedTab: {tabId, title: tab.title}})
      }
      if(changeInfo.favIconUrl) {
        console.log("Updating tab favIconUrl")
        chrome.runtime.sendMessage({updatedTabFavicon: {tabId, favIconUrl: tab.favIconUrl}})
      }
    }
      
  //} else {
  //  console.log("Changed tab was not created during session")
  //}
})