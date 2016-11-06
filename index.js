/*
 * An addon to save links to look at later.
 * This should help get rid of useless tabs we don't open or click on
 *
 * Hint: If we wanna hava a context-menu for tabs, we need to use the `viewFor` function
 * which tabs have.
 */

var contextMenu = require("sdk/context-menu");
var buttons = require('sdk/ui/button/toggle');
var Page = require("sdk/page-worker").Page;
var panels = require("sdk/panel");
var self = require("sdk/self");
var storage = require("sdk/simple-storage").storage;
var tabs = require("sdk/tabs");
var urls = require("sdk/url");

// Init storage if necessary
if(!storage.links){
    storage.links = [];
}

//Cache all titles
var titles = {};
function cacheTitle(link){
    var page = Page({
	contentScriptFile: "./scripts/getTitle.js",
	contentURL: link
    });
    page.port.on("title", function(title){
	console.log("caching title ", title, "for", link);
	titles[link] = title;
	page.contentURL = "about:blank";
    });
    page.port.on("destroy", function(){
	page.destroy();
    });
}

storage.links.forEach(cacheTitle);

function handleHide(){
    button.state("window", {checked: false});
}

function getLinks(){
    var links = [];
    storage.links.forEach(function(link){
	links.push({
	    href: link,
	    domain: urls.URL(link).host,
	    title: titles[link] || link
	});
    });
    console.log("got links", links);
    return links;
};

var panel = panels.Panel({
    contentURL: "./html/panel.html",
    contentScriptFile: [ 
	"./scripts/jquery.min.js",
	"./scripts/panel.js" 
    ],
    onHide: handleHide
});

panel.port.on("openLink", function(url){
    console.log("opening", url);
    storage.links.splice(storage.links.indexOf(url), 1);
    button.badge = storage.links.length || "";
    tabs.open(url);
});

var button = buttons.ToggleButton({
  id: "mozilla-link",
  label: "Visit Mozilla",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
    onChange: handleOnChange
});
button.badge = storage.links.length || "";

function handleOnChange(state){
    if(state.checked){
	panel.port.emit("show", getLinks());
	panel.show({ 
	    position: button,
	});
    }
}

var menuItem;
/**
 * Depending on the type of item clicked, we should change the title
 * 
 * TODO move this to the content script
 * @param context {Object}
 */
function predicate(context){
    console.log("predicate context:", context);
    menuItem.data = context.linkURL;
    if(context.linkURL){
	menuItem.label = "Save link for later";
    } else {
	menuItem.label = "Save page for later";
    }
    return true
}

/**
 * TODO Save the link to the db
 *
 * @param url {String}
 */
function saveLinkForLater(url){
    if(!storage.links.includes(url)){
	storage.links.push(url);
	cacheTitle(url);
	button.badge = storage.links.length;
    }
}

menuItem = contextMenu.Item({
  label: "Watch link later",
  context: contextMenu.PredicateContext(predicate),
  contentScriptFile: "./scripts/menuItemClick.js",
  image: self.data.url("icon-16.png"),
  onMessage: saveLinkForLater
});
