/*
 * An addon to save links to look at later.
 * This should help get rid of useless tabs we don't open or click on
 */

var storage = browser.storage.local;

/**
 * Information like the title and favicon
 *
 * Create a new inactive tab with the URL in order to compile information about it.
 * Forced to do this because "page-worker.Page" doesn't exist anymore.
 * Love it...
 *
 * @param url
 * @returns {Promise}
 */
function getInformation(url) {
    return new Promise((accept, reject) => {
        var timeoutId = setTimeout(() => {
            _finalize();
            reject();
        }, 5000);
        let tabId;
        let cookiestoreId;

        function _finalize() {
            clearTimeout(timeoutId);
            if (tabId) {
                browser.tabs.remove(tabId);
            }
            if (cookiestoreId) {
                browser.contextualIdentities.remove(cookiestoreId);
                console.log("removed cookiestore")
            }
        }

        function onInformation(message) {
            _finalize();
            accept(message);
        }

        function onError(error) {
            _finalize();
            console.error("getInformationError:", error);
            reject();
        }

        // Use a temporary context for the tab
        browser.contextualIdentities.create({
            name: "tmp_links_for_later",
            color: "pink",
            icon: "fingerprint"
        }).then((context) => {
            cookiestoreId = context.cookieStoreId;
            browser.tabs.create({
                url: url,
                active: false,
                cookieStoreId: cookiestoreId
            }).then((tab) => {
                tabId = tab.id;
                // Work around for https://bugzilla.mozilla.org/show_bug.cgi?id=1397667
                // absolutely balls that the object tab isn't accessible yet >_>
                setTimeout(() => {
                    // low-key mute the tab
                    browser.tabs.update(tab.id,{ muted: true})

                    // Wait for async response from getInformation.js
                    function onConnect(port) {
                        if(port.sender.tab.id !== tab.id){
                            return
                        }
                        port.onMessage.addListener(onInformation);
                        browser.runtime.onConnect.removeListener(this);
                    }
                    browser.runtime.onConnect.addListener(onConnect);
                    browser.tabs.executeScript(tab.id, {
                        file: "content-scripts/getInformation.js"
                    }).catch(onError);
                }, 500);

            }).catch(onError)
        }).catch(onError);

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
                    for (let key in reply) {
                        saveLink({srcUrl: key})
                    }
                }
                updateBadge();
            })
    } else {
        // Migrate from 1.0.0
        for (let url in results) {
            if (typeof results[url] !== "object") {
                saveLink({srcUrl: url})
            }
        }
        updateBadge();
    }
})
