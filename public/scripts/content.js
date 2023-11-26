document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded');
});

document.addEventListener('readystatechange', event => { 
  // When HTML/DOM elements are ready:
  if (event.target.readyState === "interactive") {   //does same as:  ..addEventListener("DOMContentLoaded"..
    console.log("hi 1");
    console.log("i never trigger just like the DomContentLoaded event");
  }
  // When window loaded ( external resources are loaded too- `css`,`src`, etc...) 
  if (event.target.readyState === "complete") {
    console.log("hi 2");
  }
});

window.onload = function() { 
  console.log("hi 3")
  setTimeout(listenize, "500");
}

//window.addEventListener("load", listenize, false);

//const links = document.querySelectorAll("a");
//const links = document.links;
//console.log("link hrefs: ");
//console.log([...links].map((link) => link.href));
//console.log(location.href)

document.body.addEventListener("click", bodyClick, {passive: true});

document.body.addEventListener("auxClick", bodyAuxClick, {passive: true});

function listenize() {
  console.log("here");
  const links = document.getElementsByTagName('a');
  console.log("links");
  console.log(links)
  let counter = 0;
  for (const link of links) {
    counter += 1;
    console.log(link)
    console.log(link.href)
    link.addEventListener("click", click, {passive: true});
    //link.addEventListener("click", bodyClick(link.href));
    //const clickListener = () => {click(link.href)}    
    //link.addEventListener("click", clickListener);
    
    link.addEventListener("auxClick", auxClick, {passive: true});
    //link.addEventListener("auxClick", auxClick(link.href));
    //const auxClickListener = () => {auxClick(link.href)}    
    //link.addEventListener("auxClick", auxClickListener);
  }
  console.log("Counting done")
  console.log(counter)
}

function click(evt) {
  const anchor = evt.target.closest("a");
  console.log("link clicked, inside click function, anchor.href:")
  console.log(anchor.href)
  chrome.runtime.sendMessage({click: anchor.href});
  console.log("also, re-listenizing:")
  setTimeout(listenize, "500");
}

function auxClick(evt) {
  const anchor = evt.target.closest("a");
  console.log("link clicked, inside click function, anchor.href:")
  console.log(anchor.href)
  chrome.runtime.sendMessage({auxClick: anchor.href});
  console.log("also, re-listenizing:")
  setTimeout(listenize, "500");
}

function bodyClick() {
  console.log("body was clicked");
  chrome.runtime.sendMessage({bodyClick: "here"})
}

function bodyAuxClick() {
  console.log("body was auxClicked");
  chrome.runtime.sendMessage({bodyAuxClick: "here"})
}
