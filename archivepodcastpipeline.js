var env = require('./env.js');

var getMediaLink = (itemid, mime) =>{
    let masterLink = "https://archive.org/download/" + itemid + "/";
    let fileListDownloadString = masterLink + itemid + "_files.xml";
    let format = mime == 'audio/mpeg' ? "MP3" : "Ogg";
    return env(fileListDownloadString).then( window =>{
        var fileTags = window.document.getElementsByTagName('file');
        for(var i = 0; i < fileTags.length; i++){
            var link = masterLink + fileTags[i].getAttribute('name');
            link = link.replace(/ /g,"%20");
            var linkFormat = fileTags[i].getElementsByTagName('format')[0].innerHTML;
            var linkLength = fileTags[i].getElementsByTagName('size')[0] ? fileTags[i].getElementsByTagName('size')[0].innerHTML : 0;
            if(linkFormat.indexOf(format) != -1){
                return {
                    'url': link,
                    'length': linkLength,
                    'mime': mime
                };
            }
        }
    });
};

var getMediaLinkForItem = (item, mime) =>{
    return getMediaLink(item.identifier, mime).then(media => {
        item.media = media;
        return item;
    });
}

var getMP3LinkForItem = (item) => getMediaLinkForItem(item, 'audio/mpeg');


var getEpisodeArray = (subjecttag) =>{
    let requeststring = "https://archive.org/advancedsearch.php?q=creator%3A%28Campusradio+Indiewelle%29+AND+subject%3A%28"+subjecttag+"%29&fl%5B%5D=date&fl%5B%5D=description&fl%5B%5D=downloads&fl%5B%5D=identifier&fl%5B%5D=title&sort%5B%5D=date+desc&sort%5B%5D=&sort%5B%5D=&rows=5000&page=1&callback=callback&output=xml";
    console.log("Requesting episodes for " + subjecttag);
    return env(requeststring).then(window => {
        var docTags = window.document.getElementsByTagName('doc');
        var items = [];
        for(var i = 0; i < docTags.length; i++){
            var strTags = docTags[i].children;
            var item = {};
            for(var j = 0; j < strTags.length; j++){
                item[strTags[j].getAttribute('name')] = strTags[j].innerHTML;
            }
            item.link = "https://archive.org/details/" + items.identifier;
            items.push(item);
        }
        return items;
    });
};

var getAllMediaLinks = (items) =>{
    console.log("Requesting media links for " + items.length + " episodes");
    return Promise.all(items.map(getMP3LinkForItem));
}


var getFeedItems = (subjecttag) => {
    return getEpisodeArray(subjecttag).then(items => getAllMediaLinks(items));
}

var getFeedFromFile = file => {
    var feedfile = JSON.parse(require('fs').readFileSync(file,'utf-8'));
    return getFeedItems(feedfile.tag).then(items =>{
        var rssFeed = require('./feed.js').rssFeed;
        var feed = new rssFeed(feedfile.title, feedfile.link,feedfile.description);
        if(feedfile.image){
            feed.setImage(feedfile.image);
        }
        for(var i = 0; i < items.length; i++){
            feed.addEpisode(items[i].title,items[i].link,items[i].description, items[i].date,items[i].media);
        }
        console.log("Serializing feed");
        return feed.serializeTXT();
    });

}


var fs = require('fs');
var feedFiles = fs.readdirSync("./headers");
console.log(feedFiles);
feedFiles = feedFiles.map(file => {
    return getFeedFromFile('./headers/' + file).then(feed => {
        fs.writeFileSync('./feeds/' + file.replace(/json/,'rss'),feed,'utf-8');
    });
});

Promise.all(feedFiles).then(console.log("All feeds written"));

//getFeedFromFile("./headers/mosho.json","MoSho").then(feed => {require('fs').writeFileSync("MoSho.rss",feed,'utf-8'); console.log("Feed written.")});
//getMP3LinkForItem({"identifier":'OpenMike25112016'}).then(link => console.log(link));