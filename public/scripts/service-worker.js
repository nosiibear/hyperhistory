console.log("start of service-worker.js")

chrome.runtime.onInstalled.addListener(() => {
  console.log("installed")
});

let vispageId, vispageWinId = null;
let vispageActive = false
//let vispageBlacklist = []
let tabs = new Map();
let deactivatedTabs = new Map();
let urlInfoPools = new Map();
let urlsWaiting = new Map();
let messageQueue = []

/*chrome.browserAction.onClicked.addEventListener("click", async () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("./index.html") });
});*/

chrome.action.onClicked.addListener(async (tab) => {
  console.log("inside click listener");
  console.log("vispageId");
  console.log(vispageId)
  console.log("vispageWinId");
  console.log(vispageWinId)
  if(vispageId) {
    chrome.tabs.update(vispageId, {'active': true}, () => console.log("Opened existing vispage"))
  } else {
    console.log("Opening new vispage")
    const url = chrome.runtime.getURL("index.html")
    let tab = await chrome.tabs.create({url: url});
    vispageId = tab.id
    vispageWinId = tab.windowId
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("Inside onActive listener")
  if(activeInfo.tabId == vispageId) {
    console.log("Hyper History is active, sending trigger message")
    vispageActive = true
    vispageWinId = activeInfo.windowId
    sendMsg()
  } else {
    if(activeInfo.windowId == vispageWinId) {
      console.log("Hyper History is no longer active")
      vispageActive = false
    }
  }
  console.log("vispageActive:")
  console.log(vispageActive)
});

function sendMsg(msg) {
  console.log("messageQueue")
  console.log(messageQueue)
  if(msg) {
    console.log("msg")
    console.log(msg)
    const newSize = messageQueue.push(msg)
    console.log("new messageQueue length")
    console.log(newSize)
    console.log("messageQueue after push")
    console.log(messageQueue)
  }
  if(vispageActive && messageQueue.length > 0) {
    msg = messageQueue.shift();
    console.log("sending message:")
    console.log(msg)
    chrome.runtime.sendMessage(msg)
  }
}

function cleanseURL(str) {
  const url = new URL(str)
  let params = url.searchParams;
  console.log("    Inside cleanseURL")
  console.log("    url:")
  console.log(url)
  console.log("    params:")
  for(const param of params) {
    console.log(param)
  }
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
  let returnUrl = url.origin + url.hash + url.pathname
  let paramStr = "?"
  for(const param of returnParams) {
    paramStr += param[0] + "=" + param[1] + "&";
  }
  returnUrl += encodeURI(paramStr).slice(0, -1);
  console.log("returnUrl:")
  console.log(returnUrl)
  return returnUrl;
}

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
  if (message.clearTabs) {
    console.log("Clearing tabs");
    deactivatedTabs = new Map(JSON.parse(JSON.stringify([...tabs])))
    tabs.clear();
  }
  if (message.nodeReady) {
    const url = message.nodeReady;
    //console.log(`%cNode ready, tab id: ${tabId}`, 'background-color: green; color: white')
    console.log(`%cNode ready, tab url: ${url}`, 'background-color: green; color: white')
    //chrome.runtime.sendMessage({updatedTabInfo: {tabId, data: tabInfoPools.get(message.nodeReady)}})
    //chrome.runtime.sendMessage({updatedTabInfo: {url: url, data: urlInfoPools.get(message.nodeReady)}})
    sendMsg({updatedTabInfo: {url: url, data: urlInfoPools.get(message.nodeReady)}});
    urlsWaiting.delete(message.nodeReady);
    urlInfoPools.delete(message.nodeReady);
  }
  if (message.nextInput) {
    console.log("got signal for next input, url: " + message.nextInput.url)
    sendMsg();
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log("%cIn service worker, tab created", "background: black; color: white")
  console.log(tab)
  const url = cleanseURL(tab.pendingUrl);
  tabs.set(tab.id, url);
  if(!url.startsWith("chrome")) {
    console.log("%cNew tab opened from another page, sending to vis page", "background: black; color: white")
    //chrome.runtime.sendMessage({newTabBranched: {tabId: tab.id, openerTabId: tab.openerTabId, url: url, title: tab.title}})
    sendMsg({newTabBranched: {tabId: tab.id, openerTabId: tab.openerTabId, url: url, title: tab.title}})
  } else {
    console.log("New tab opened with ctrl + T, or other chrome page")
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("%cIn service worker, tab changed", "background: black; color: yellow")
  console.log("Everything not null:")
  for(const [key, value] of Object.entries(changeInfo)) {
    if(changeInfo[key] != null) console.log(`${key}: ${value}`)
  }
  console.log("id: " + tabId + ", tab title: " + tab.title)
  console.log("id: " + tabId + ", tab url: " + tab.url)
  const cleanUrl = cleanseURL(tab.url)
  console.log("cleanURL:")
  console.log(cleanUrl)
  if(!cleanUrl.startsWith("chrome")) {
    if(changeInfo.url) {
      console.log("Tab changed url")
      console.log("Changing url is not a new tab, could be legit new tab")
      console.log(tabs)

      if(tabs.get(tabId) === "chrome://newtab/") {
        console.log("%cChanging from blank new tab to real new tab, sending to vis page", "background: black; color: white")
        sendMsg({newTab: {tabId, url: cleanUrl, title: tab.title}})

      } else if(deactivatedTabs.has(tabId)) {
        console.log('Turning a "cleared" tab back into a real one')
        sendMsg({newTab: {tabId, url: cleanUrl, title: tab.title}})
        deactivatedTabs.delete(tab.id);

      } else {
        console.log("Tab is changing urls, sending to vis page")
        sendMsg({changedTab: {tabId, url: cleanUrl, title: tab.title}})
      }
      tabs.set(tab.id, cleanUrl);
      urlsWaiting.set(cleanUrl, true);
    } else {
      if(changeInfo.status == 'loading' && deactivatedTabs.has(tab.id)) {
        console.log('Turning a "cleared" tab back into a real one, probably via f5')
        //chrome.runtime.sendMessage({newTab: {tabId, url: url, title: tab.title}})
        sendMsg({newTab: {tabId, url: cleanUrl, title: tab.title}})
        deactivatedTabs.delete(tab.id);
        tabs.set(tab.id, cleanUrl);
      // If we aren't sending a new tab or changed tab to vispage, then we're updating
      // info instead; because making a new node takes a while, we have to stash all of the
      // changed info, waiting for a signal back that the node is finished being made
      } else {
        console.log("Tab changed, but we're only updating tab info");
        const {url, status, ...leftoverInfo} = changeInfo;
        if(urlsWaiting.has(cleanUrl)) {
          console.log("Tab is waiting, adding info to pool instead of sending");
          if(!urlInfoPools.has(cleanUrl)) {
            urlInfoPools.set(cleanUrl, {});
          }
          urlInfoPools.set(cleanUrl, {...urlInfoPools.get(cleanUrl), ...leftoverInfo})
          console.log("urlInfoPools")
          console.log(urlInfoPools)
          console.log("urlsWaiting")
          console.log(urlsWaiting)
        } else {
          console.log("Tab is not waiting, sending update info instead");
          //chrome.runtime.sendMessage({updatedTabInfo: {tabId, data: leftoverInfo}});
          sendMsg({updatedTabInfo: {url: cleanUrl, data: leftoverInfo}});
        }
      }
    }
  }
      
  //} else {
  //  console.log("Changed tab was not created during session")
  //}
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("%cIn service worker, tab removed", "background: black; color: orange")
  if(tabId == vispageId) {
    vispageId = null
    vispageWinId = null
    //vispageBlacklist.push(tabId)
  }
});

//chrome.windows.onCreated.addListener((window) => {
//  if(tabId == vispageId) {
//    vispageWinId = window.id
//  }
//})