/*
 * An addon to save links to look at later.
 * This should help get rid of useless tabs we don't open or click on
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
 * Helps favor .ico urls over .png or whatever
 * To be used when sorting an array of favicon url
 *
 * @param url
 * @returns {number}
 */
function favIconValue(url) {
    return url.endsWith("ico") ? 1 : 0
}

/**
 *
 * @param _document {HTMLDocument}
 * @returns {*}
 */
function getFaviconUrl(_document) {
    var iconUrl = null;
    var heads = _document.getElementsByTagName("head");
    if (heads.length < 1) {
        return iconUrl
    }
    var icons = Array.from(heads[0].childNodes)
    // Try and get urls from elements that seem to contain a favicon
        .map(header => {
            if (header.rel && header.rel.indexOf('icon') >= 0) {
                return header.href
            }
        })
        // Only allow real URLs
        .filter(url => url && new URL(url))
        // Prefer .ico
        .sort((left, right) => favIconValue(right) - favIconValue(left));
    if (icons.length > 0) {
        iconUrl = icons[0];
    }
    return iconUrl;
}

/**
 * Information like the title and favicon
 *
 * Make an AJAX request to build the DOM and get the title that way.
 * Forced to do this because "page-worker.Page" doesn't exist anymore.
 * Love it.
 *
 * @param url
 * @returns {Promise}
 */
function getInformation(url) {
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
                        var _document = xhr.responseXML;
                        if (_document) {
                            var iconUrl = getFaviconUrl(_document);
                            accept({
                                title: _document.title,
                                favicon: iconUrl
                            })
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
function saveLink({srcUrl, linkUrl, pageUrl}) {
    var link = srcUrl || linkUrl || pageUrl;

    /**
     *
     * @param information {Object}
     * @param information.favicon {String=}
     * @param information.title {String=}
     * @returns {Promise<TResult>|*}
     */
    function doSave(information) {
        information = information || {
            favicon: "",
            title: link,
        };
        var linkStore = {};
        linkStore[link] = information;
        return storage.set(linkStore).then(() => {
            updateBadge();
        });
    }

    return getInformation(link).then(doSave, doSave);
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

// Temporary migration step
// TODO remove this before FF 57 is released
storage.get().then((results) => {
    if (Object.keys(results).length === 0) {
        browser.runtime.sendMessage("import-legacy-data")
            .then((reply) => {
                if (reply) {
                    storage.set(reply)
                }
                updateBadge();
            })
    } else {
        updateBadge();
    }
})
