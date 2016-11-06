function createOnClick($node){
    return function(){
	self.port.emit("openLink", $node.data("url"));
	$node.remove();
    }
}

self.port.on("show", function(urlObjects) {
    var body = $("body");
    body.empty();
    for(let url of urlObjects){
	var p = $("<p>",{
	 data: {
	    url: url.href
	 }   
	});
	p.on("click", createOnClick(p));
	var img = $("<img>", {
	    src: "http://www.google.com/s2/favicons?domain=" + url.domain,
	    width: 16,
	    height: 16
	});
	var a = $("<span>", {
	    href: url.href,
	    html: url.title   
	});

	p.append(img, a);
	body.append(p);
    }
});

