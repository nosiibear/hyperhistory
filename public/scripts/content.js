const links = document.querySelectorAll("a");
console.log("links: ");
console.log([...links].map((link) => link.href));
console.log(location.href)
console.log(typeof(location.href))
for (const link of links) {
  console.log(link)
  link.addEventListener("click", async () => {
    //chrome.storage.local.set({location.href: link.href})
    console.log("A href: " + link.href)
    console.log("A attributes: " + link.attributes)
    console.log("A children: " + link.children)
    chrome.runtime.sendMessage({click: [link.href, link.attributes, link.children]})
  });
  link.addEventListener("auxClick", async () => {
    //chrome.storage.local.set({location.href: link.href})
    chrome.runtime.sendMessage({auxClick: [link.href, link.attributes, link.children]})
  });
}