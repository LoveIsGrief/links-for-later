/**
 * Makes sure the badge shows how many links we've saved
 */
function updateBadge() {
    browser.storage.local.get().then((links)=>{
        var text = Object.keys(links).length || "";
        text = "" + text;
        browser.browserAction.setBadgeText({text})
    })
}