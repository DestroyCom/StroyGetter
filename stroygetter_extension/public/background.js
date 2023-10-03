/* eslint-disable no-undef */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log(activeInfo);

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = tabs[0].url;
    console.log(url);

    if (url.includes("youtube.com")) {
      chrome.action.setIcon({
        path: "./icon64.png",
        tabId: activeInfo.tabId,
      });
      chrome.action.setPopup({
        popup: "./index.html",
        tabId: activeInfo.tabId,
      });
    } else {
      chrome.action.setIcon({
        path: "./disabled.png",
        tabId: activeInfo.tabId,
      });
      chrome.action.setPopup({
        popup: "",
        tabId: activeInfo.tabId,
      });
    }
  });
});
