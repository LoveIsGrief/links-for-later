/*
 * An addon to save links to look at later.
 * This should help get rid of useless tabs we don't open or click on
 *
 * Hint: If we wanna hava a context-menu for tabs, we need to use the `viewFor` function
 * which tabs have.
 */

var storage = browser.storage.local;

//Get the title of a link and save it
function saveLink({srcUrl, pageUrl}) {
    var link = srcUrl || pageUrl;
    var linkStore = {};
    linkStore[link] = link;
    storage.set(linkStore).then(()=>{
        updateBadge();
    });
    // TODO get page title
    // var page = Page({
    //     contentScriptFile: "./scripts/getTitle.js",
    //     contentURL: link
    // });
    // page.port.on("title", function (title) {
    //     console.log("caching title ", title, "for", link);
    //     storage.links[link] = title;
    //     page.contentURL = "about:blank";
    //     updateBadge();
    // });
    // page.port.on("destroy", function () {
    //     page.destroy();
    // });
}


/**
 * Depending on the type of item clicked, we should change the title
 *
 * TODO move this to the content script
 * @param context {Object}
 */
function predicate(context) {
    console.log("predicate context:", context);
    menuItem.data = context.linkURL;
    if (context.linkURL) {
        menuItem.label = "Save link for later";
    } else {
        menuItem.label = "Save page for later";
    }
    return true
}

updateBadge();

var menuItemId = browser.contextMenus.create({
        id: "save-link",
        title: "Save link",
        contexts: [
            "link",
            "page",
            "tab"
        ],
        onclick: saveLink,
    },
    console.log
);