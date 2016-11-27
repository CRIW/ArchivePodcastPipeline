let Item = class{
    constructor(title, link, description, pubDate){
        this.title = title;
        this.link = link;
        this.description = description;
        this.pubDate = pubDate ? pubDate : new Date().toUTCString();
    }

    addMediaEnclosure(url, length, type){
        this.media = {
            'url': url,
            'length': length,
            'type': type
        };
        this.hasM = true;
    }

    hasMedia(){
        return true;
    }

    getMedia(){
        return this.media;
    }
}


module.exports.rssFeed = class{
    constructor(title, link, description){
        this.episodes = [];
        this.title = title;
        this.link = link;
        this.description = description;
    }

    setImage(image){
        this.image = image;
    }

    addItem(title, link, description, date){
        this.episodes.push(new Item(title, link, description, date));
    }

    addEpisode(title, link, description, date, media){
        var item = new Item(title, link, description,date);
        //console.log(`Adding episode (${title},${link},${description},${date},${media})`);
        item.addMediaEnclosure(media.url, media.length, media.mime);
        this.episodes.push(item);
    }

    serializeTXT(){
        var result = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0">';
 
        var openTag = name => `<${name}>`;
        var closeTag = name => `</${name}>`;
        var createTag = (name, content) => openTag(name) + content + closeTag(name);

        result += openTag('channel');
        result += createTag('title', this.title);
        result += createTag('link', this.link);
        result += createTag('description', this.description);
        if(this.image){
            result += openTag('image');
            result += createTag('url', this.image);
            result += createTag('link', this.link);
            result += createTag('title', this.title);
            result += closeTag('image');
        }

        for(var i = 0; i < this.episodes.length; i++){
            result += openTag('item');
            result += createTag('title', this.episodes[i].title);
            result += createTag('description', this.episodes[i].description);
            result += createTag('link', this.episodes[i].link);
            result += createTag('pubDate', this.episodes[i].pubDate);
            if(this.episodes[i].hasMedia){
                var m = this.episodes[i].getMedia();
                result += '<enclosure url="' + m.url +'" length="' + m.length + '" type="' + m.type + '" />';
            }
            result += closeTag('item');
        }
        result += closeTag('channel');
        result += closeTag('rss');

        return result;
    }

    serialize(){
        var env = require('./env.js');
        return env('<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"></rss>',{'parsingMode': 'xml'}).then(window => {
            console.log('env');
            var channel = window.document.createElement('channel');
            console.log(window.documentElement.outerHTML);
            window.document.body.appendChild(channel);
            var addTagToItem = (item, tag, content) => {
                var tag = window.document.createElement(tag);
                tag.appendChild(window.document.createTextNode(content));
                item.appendChild(tag);
            };

            console.log('test');

            addTagToItem(channel, 'title', this.title);
            addTagToItem(channel, 'link', this.link);
            addTagToItem(channel, 'description', this.description);
            
            console.log(`${this.episodes.length} + episodes`);

            var addItem = (item) => {
                var elem = window.document.createElement(tag);
                addTagToItem(elem,'title',item.title);
                addTagToItem(elem,'description', item.description);
                addTagToItem(elem,'link', item.link);
                addTagToItem(elem,'pubDate', item.pubDate);
                console.log("Created elem");
                if(item.media){
                    var enclosure = window.document.createElement('enclosure');
                    enclosure.setAttribute('url', item.media.url);
                    enclosure.setAttribute('length', item.media.length);
                    enclosure.setAttribute('type', item.media.type);
                    elem.appendChild(enclosure);
                    console.log("Created media");
                }
                channel.appendChild(item);
            }
            for(var i = 0; i < this.episodes.length; i++){
                console.log("Serializing");
                addItem(item);
            }

            return require('jsdom').serializeDocument(window);
        });
    }

}