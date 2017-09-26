const webExtension = require("sdk/webextension");
const storage = require("sdk/simple-storage").storage;

// Init storage if necessary
if (!storage.links) {
    storage.links = {};
}

// Start the embedded webextension.
webExtension.startup().then(api => {
    const {browser} = api;
    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
        if (msg === "import-legacy-data") {
            // When the embedded webextension asks for the legacy data,
            // dump the data which needs to be preserved and send it back to the
            // embedded extension.
            sendReply(storage.links);
        }
    });
});