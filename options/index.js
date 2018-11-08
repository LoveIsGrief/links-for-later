let options = {};
let $delayInput = document.querySelector("#delay-input");
$delayInput.addEventListener("change", (event) => {
    options.delay = Number($delayInput.value);
    browser.storage.sync.set({options: options})
})

browser.storage.sync.get("options").then(({options}) => {
    for (var optionName in options) {
        switch (optionName) {
            case "delay":
                $delayInput.value = options[optionName];
                break;
        }
    }
});
