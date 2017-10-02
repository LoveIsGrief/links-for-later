var storage = browser.storage.local;


/**
 * Opens the url of the panel item in a background tab.
 *
 * @param $node
 * @returns {Function}
 */
function createOnClick($node) {
    return function (event) {
        var url = $node.data("url");
        var promise;
        // Ctrl click won't remove the node
        if (event.button === 1) {
            promise = new Promise(accept => accept());
        } else if (event.button === 2) {
            event.stopPropagation();
            event.preventDefault();
            event.preventBubble();
        } else {
            promise = storage.remove(url).then(() => {
                $node.remove();
                updateNotice();
                updateBadge();
            });
        }
        promise.then(() => {
            browser.tabs.create({
                active: event.ctrlKey,
                url: url
            });
        });
    }
}

function updateNotice() {
    var $notice = $("#notice")
    if ($(".link").length > 0) {
        $notice.text("Hold Ctrl to keep in list after opening");
    } else {
        $notice.text("Add some links :)");
    }
}

/**
 *
 * @param {Object[]} linkObjects
 * @param {String} linkObjects.href
 * @param {String} linkObjects.domain
 * @param {String} linkObjects.title
 */
function buildPanelItems(linkObjects) {
    var body = $("body");
    var $notice = $("<span>", {id: "notice"});
    body.append($notice);
    for (let url of linkObjects) {
        var p = $("<p>", {
            class: "link",
            data: {
                url: url.href
            }
        });
        p.on("click", createOnClick(p));
        var img = $("<img>", {
            src: "https://www.google.com/s2/favicons?domain=" + url.domain,
            width: 16,
            height: 16
        });
        var span = $("<span>", {
            href: url.href,
            html: url.title
        });

        p.append(img, span);
        body.append(p);
    }
    updateNotice();
    updateBadge();
}

/**
 *
 * @param {Object} storageLinks - <url>: <title>
 * @returns {Array}
 */
function linksToUrlObjects(storageLinks) {
    var urlObjects = [];
    for (let link in storageLinks) {
        urlObjects.push({
            href: link,
            domain: (new URL(link)).hostname,
            // title: storage.urlObjects[link] || link
            title: storageLinks[link] || link
        });
    }
    return urlObjects
}


storage.get().then((links) => {
    var body = $("body");
    body.empty();
    $(document).on("click", (event) => {
        if (event.button === 2) {
            event.preventDefault();
            event.stopPropagation();
        }
    });
    buildPanelItems(linksToUrlObjects(links))
})


