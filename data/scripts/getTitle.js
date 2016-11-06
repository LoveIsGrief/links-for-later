var title = document.title;
if(!title){
    var titleTags = document.getElementsByTagName("title");
    if(titleTags.length > 0){
	title = titleTags[0].text;
    }
}
if(title){
    self.port.emit("title", title);
} else{
    self.port.emit("destroy");
}
