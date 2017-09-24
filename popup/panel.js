var storage = browser.storage.local;


/**
 * Opens the url of the panel item in a background tab.
 *
 * @param $node
 * @returns {Function}
 */
function createOnClick($node) {
    return function () {
        var url = $node.data("url");
        console.log("opening", url);
        storage.remove(url).then(() => {
            $node.remove();
            updateBadge();
            browser.tabs.create({
                active: false,
                url: url
            });
        });
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
    for (let url of linkObjects) {
        var p = $("<p>", {
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
    console.log("got urlObjects", urlObjects);
    return urlObjects
}


storage.get().then((links) => {
    var body = $("body");
    body.empty();
    buildPanelItems(linksToUrlObjects(links))
})


