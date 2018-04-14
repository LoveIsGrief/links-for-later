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
        return $scope.links.length ? "Hold Ctrl or middle click to keep in list after opening" : "Add links to get started :)"
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
                updateBadge().then(accept);
            }).catch(reject);
        })

    }


    /**
     * @param link {LinkObject}
     * @param backgroundTab {Boolean} -
     *          opening in a foreground tab will also close the panel
     *          opening in a background tab won't remove the link
     */
    function openLink(link, backgroundTab = false) {
        const url = link.href;
        let promise;
        // Ctrl click won't remove the node
        if (backgroundTab) {
            promise = new Promise(accept => accept());
        } else {
            promise = removeLink(link);
        }
        promise.then(() => {
            browser.tabs.create({
                active: !backgroundTab,
                url: url
            });
        });

        // Foreground tabs close the panel
        if (!backgroundTab) {
            promise.then(() => {
                window.close()
            })
        }
    }

    /**
     * Opens the url of the panel item in a background tab.
     *
     * @param event {Event}
     * @param link {LinkObject}
     * @returns {Function}
     */
    $scope.onLinkClicked = function (event, link) {
        openLink(link, event.ctrlKey || event.button === 1)
    }

    $scope.removeLink = removeLink;

    // Track which element is active
    $scope.selectedIndex = -1;
    $scope.activeLink = null;
    function scrollToSelectedLink(){
        let $scrollTo = document.querySelector(`#link-${$scope.selectedIndex}`);
        if($scrollTo){
            $scrollTo.scrollIntoView();
        }
    }
    $scope.onKeyPressed = function (event) {
        console.log(event);
        switch (event.key) {
            case "ArrowUp":
                $scope.selectedIndex--;
                scrollToSelectedLink();
                break
            case "ArrowDown":
                $scope.selectedIndex++;
                scrollToSelectedLink();
                break
            case "Enter":
                if ($scope.activeLink) {
                    openLink($scope.activeLink, event.ctrlKey)
                }
                break
        }
    }

    /**
     *
     * @param link {LinkObject} - Might become the active link if selected
     * @param index {Number} -
     * @param first {Boolean} - is first element in the list
     * @param last {Boolean} - last element in the list
     * @returns {string} The class to be applied
     */
    $scope.getLinkClass = function (link, index, first, last) {
        if (first && $scope.selectedIndex < 0) {
            $scope.selectedIndex = 0;
        } else if (last && $scope.selectedIndex > index) {
            $scope.selectedIndex = index
        }

        if ($scope.selectedIndex === index) {
            $scope.activeLink = link;
            return "link active"
        } else {
            return "link"
        }
    }
});
