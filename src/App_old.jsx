/*global chrome*/
import { useState } from 'react'
function App() {
  const tabs = new Map()

  /*button.addEventListener("click", async () => {
    chrome.action.setBadgeText({
      text: "ON",
    });
  });*/

  let currentTab;
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    currentTab = tabs
    chrome.runtime.sendMessage({newVispage: currentTab})
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.click) {
      console.log("Clicked, inside vispage")
      console.log(message.click.link)
      //console.log(message.click.href)
      return true;
    }
    if (message.auxClick) {
      console.log("Aux clicked, inside vispage")
      console.log(message.auxClick.link)
      //console.log(message.auxClick.href)
      return true;
    }

    if(message.newTab) {
      console.log("New tab")
      console.log(message.newTab)
      console.log(message.newTab.id)
      console.log(message.newTab['id'])
      const tabElem = createDomElement(`
        <div>
          <h3>${message.newTab.id}</h3>
          <div id="${message.newTab.id}" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center">
            <div class="click0" style="width: 200px; background-color: gray">
              <h1 class="title">${message.newTab.title}</h2>
              <h2 class="pathname">${message.newTab.pendingUrl}</h1>
            <div>
          </div>
        </div>
      `)
      document.body.append(tabElem)
      tabs.set(message.newTab.id, 0)
    }

    if(message.changedTab) {
      console.log("Changed tab")
      console.log(message.changedTab)
      const id = message.changedTab[0]
      const parentTab = document.getElementById(id)
      console.log(parentTab)
      console.log(typeof(parentTab))
      console.log(typeof(document))
      console.log(typeof(parentTab.getElementById))
      console.log(typeof(document.querySelector))
      const currentEndTab = parentTab.querySelector(".click" + tabs.get(id))
      console.log(tabs.get(id))
      console.log("tab" + tabs.get(id))
      console.log(currentEndTab)
      if(currentEndTab.querySelector(".pathname").textContent != message.changedTab[1]) {
        currentEndTab.style.backgroundColor = "transparent";
        tabs.set(id, tabs.get(id) + 1)
        const tabElem = createDomElement(`
          <div class="click${tabs.get(id)}" style="width: 200px; background-color: silver">
            <h1 class="title">${message.changedTab[2]}</h2>
            <h2 class="pathname">${message.changedTab[1]}</h1>
          <div>
        `)
        parentTab.append(tabElem)
      }
    }

    if(message.updatedTab) {
      console.log("Updated tab")
      console.log(message.updatedTab)
      const id = message.updatedTab[0]
      const parentTab = document.getElementById(id)
      const currentEndTab = parentTab.querySelector(".click" + tabs.get(id))
      currentEndTab.style.backgroundColor = "darkgray";
      currentEndTab.querySelector(".title").textContent = message.updatedTab[1];
    }
  });

  function createDomElement(html) {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    return dom.body.firstElementChild;
  }

  return (
    <>
      <h1>Hyper History</h1>
      <button onClick={() => chrome.action.setBadgeText({text: "ON",})}>Start HyperHistory</button>
    </>
  )
}

export default App
