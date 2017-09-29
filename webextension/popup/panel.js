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
 * @param {String} linkObjects.favicon
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
            src: url.favicon,
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
        let linkInformation = storageLinks[link];
        urlObjects.push(Object.assign({
            href: link,
            domain: (new URL(link)).hostname
        }, linkInformation));
    }
    return urlObjects
}


storage.get().then((links) => {
    var body = $("body");
    body.empty();
    buildPanelItems(linksToUrlObjects(links))
})


