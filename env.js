module.exports = function(url, options){
    var jsdom = require('jsdom');
    return new Promise((resolve, reject)=>{
        if(!options){
            jsdom.env(url,(err,window)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(window);
                }
            });
        }else{
            jsdom.env(url,options,(err,window)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(window);
                }
            });
        }
    });
};