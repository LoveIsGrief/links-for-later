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
        if (event.ctrlKey) {
            promise = new Promise(accept => accept());
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
 * @param {String} linkObjects.favicon
 */
function buildPanelItems(linkObjects) {
    var body = $("body");
    var $notice = $("<span>", {id: "notice"});
    let $ul = $("<ul>");
    let $filter = $(`<input type="text" id="filter">`);
    $filter.filterList();

    body.append($notice, $filter, $ul);

    for (let url of linkObjects) {
        var $li = $("<li>", {
            class: "link",
            title: url.title,
            data: {
                url: url.href,
                favicon: url.favicon
            }
        });
        $li.attr("data-favicon", url.favicon);
        $li.text(url.title);
        $li.on("click", createOnClick($li));
        var img = $("<img>", {
            src: url.favicon,
            width: 16,
            height: 16
        });
        $li.prepend(img);
        $ul.append($li);
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


