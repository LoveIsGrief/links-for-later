/**
 * Attempt to get information about the page like title and favicon.
 * We loop for a max amount of time trying to get that sweet, sweet information.
 */

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


function getFaviconUrl() {
    var iconUrl = null;
    var heads = document.getElementsByTagName("head");
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

let port = browser.runtime.connect();

// The wait loop
setInterval(() => {
    port.postMessage({
        title: document.title,
        favicon: getFaviconUrl()
    });
}, 100)
