let storage = browser.storage.local;

/**
 * @typedef {Object} LinkObject
 * @field {String} href
 * @field {String} domain
 * @field {String} title
 * @field {String} favicon

 */

/**
 *
 * @param {Object} storageLinks - <url>: <title>
 * @returns {Array}
 */
function linksToUrlObjects(storageLinks) {
    let urlObjects = [];
    for (let link in storageLinks) {
        let linkInformation = storageLinks[link];
        urlObjects.push(Object.assign({
            href: link,
            domain: (new URL(link)).hostname
        }, linkInformation));
    }
    return urlObjects
}


angular.module("PanelApp", []).controller("PanelController", function ($scope) {
    $scope.links = [];
    $scope.searchText = '';
    this.searchRegex = new RegExp('');

    $scope.$watch('searchText', (search) => {
        this.searchRegex = new RegExp(search.split("").join(".*"), 'i');
    })

    storage.get().then((links) => {
        $scope.$apply(() => {
            $scope.links = linksToUrlObjects(links);
        })
    })

    /**
     * @param link {LinkObject}
     * @returns {boolean}
     */
    $scope.searchFuzzily = (link) => {
        return this.searchRegex.test(link.href) || this.searchRegex.test(link.title)
    }

    $scope.notice = function () {
        return $scope.links.length ? "Hold Ctrl to keep in list after opening" : "Add links to get started :)"
    }

    /**
     * @param link {LinkObject}
     * @returns Promise
     */
    function removeLink(link) {
        const index = $scope.links.indexOf(link);
        return new Promise((accept, reject) => {
            storage.remove(link.href).then(() => {
                $scope.$apply(() => {
                    $scope.links.splice(index, 1);
                })
                updateBadge();
                accept();
            }).catch(reject);
        })

    }

    /**
     * Opens the url of the panel item in a background tab.
     *
     * @param event {Event}
     * @param link {LinkObject}
     * @param index {Number}
     * @returns {Function}
     */
    $scope.onSelectLink = function (event, link) {
        const url = link.href;
        let promise;
        // Ctrl click won't remove the node
        if (event.ctrlKey || event.button === 1) {
            promise = new Promise(accept => accept());
        } else {
            promise = removeLink(link)
        }
        promise.then(() => {
            browser.tabs.create({
                active: event.ctrlKey,
                url: url
            });
        });
    }

    $scope.removeLink = removeLink;
});
