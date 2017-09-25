/*
 * An addon to save links to look at later.
 * This should help get rid of useless tabs we don't open or click on
 *
 * Hint: If we wanna hava a context-menu for tabs, we need to use the `viewFor` function
 * which tabs have.
 */

var storage = browser.storage.local;

/**
 * Taken from https://stackoverflow.com/questions/15532791/getting-around-x-frame-options-deny-in-a-chrome-extension
 * @param url
 */
function allowCORS(url) {
    let listener = function (info) {
        var headers = info.responseHeaders;
        for (var i = headers.length - 1; i >= 0; --i) {
            var header = headers[i].name.toLowerCase();
            if (header === 'x-frame-options'
                || header === 'frame-options'
                || header === 'x-xss-protection'
            ) {
                headers.splice(i, 1); // Remove header
            }
        }

        headers.push({
            name: "Access-Control-Allow-Origin",
            value: "*"
        })
        return {responseHeaders: headers};
    };
    browser.webRequest.onHeadersReceived.addListener(
        listener,
        {
            urls: [url],
            types: ['sub_frame']
        },
        ['blocking', 'responseHeaders']
    );

    return listener;
}

/**
 * Gets the window title of an url
 *
 * Make an AJAX request to build the DOM and get the title that way.
 * Forced to do this because "page-worker.Page" doesn't exist anymore.
 * Love it.
 *
 * @param url
 * @returns {Promise}
 */
function getTitle(url) {
    return new Promise((accept, reject) => {
        // Make sure we can request any damn thing we want
        var listener = allowCORS(url);
        var timeoutId = setTimeout(() => {
            reject();
        }, 5000);

        function _finalize() {
            if (listener) {
                browser.webRequest.onHeadersReceived.removeListener(listener);
            }
            clearTimeout(timeoutId);
        }

        var xhr = new XMLHttpRequest();
        xhr.responseType = "document";
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    try {
                        var doc = xhr.responseXML;
                        if (doc) {
                            accept(doc.title)
                        } else {
                            reject();
                        }
                    } catch (anything) {
                        reject();
                    }
                } else {
                    _finalize();
                    reject()
                }
            }
        }
        xhr.open("GET", url);
        xhr.send();
    });
}

/**
 * Params are from https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/menus/OnClickData
 */
function saveLink({srcUrl, linkUrl, pageUrl}, tab) {
    var link = srcUrl || linkUrl || pageUrl;

    function doSave(title) {
        title = title || link;
        var linkStore = {};
        linkStore[link] = title;
        storage.set(linkStore).then(() => {
            updateBadge();
        });
    }

    getTitle(link).then(doSave, doSave);
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