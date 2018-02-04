/**
 * Attempt to get information about the page like title and favicon.
 * We loop for a max amount of time trying to get that sweet, sweet information.
 */

/**
 * How long we'll wait for this script to get information about the page
 *
 * in milliseconds
 *
 * TODO pass this as a param
 * @type {number}
 */
const MAX_WAIT_TIME = 3500;

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
let startMs = Date.now();

// The wait loop
let interval = setInterval(() => {
    let message = {
        title: document.title,
        favicon: getFaviconUrl()
    };
    let elapsed = Date.now() - startMs;
    if (elapsed <= MAX_WAIT_TIME) {
        // Check if we have all the info we want
        for (let key in message) {
            if (!message[key]) {
                return
            }
        }
    }
    clearInterval(interval);
    port.postMessage(message);
}, 100)
