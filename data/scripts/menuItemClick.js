
self.on("click", function (node, data) {
    var url = data || window.location.href;
    if(url){
	self.postMessage(url);
    }
})
