Modulr.define("site:models/json.test", [
    "require",
    "thejquery",
    "helper"
], function(require, $){

    var Helper = require("helper");

    // http://jsfiddle.net/mitzerh/yofwd1ax/
    
    var urls = [
        "http://echo.jsontest.com/site/google/type/search",
        "http://echo.jsontest.com/site/yahoo/type/search",
        "http://echo.jsontest.com/site/duckduckgo/type/search",
        "http://echo.jsontest.com/site/foxnews/type/news",
        "http://echo.jsontest.com/site/cnn/type/news",
        "http://echo.jsontest.com/site/nbc/type/news",
        "http://echo.jsontest.com/site/cbs/type/news"
    ];

    // wehere i'll store the end data
    var info = {};

    // get ajax feed
    function getFeed(url, callback) {
        
        // wow, they allow cross-domain calls! Understandable since it's for testing
        $.ajax({
            url: url,
        }).done(function(data){
            callback(data);
        }).error(function(){
            callback(false);
        });
        
    };

    // my 'defer' function
    function process(callback) {
        
        if (urls.length > 0) {
            var url = urls.shift();
            
            getFeed(url, function(data){
                if (data) {
                    // if type not yet defined in the object
                    if (!info[data.type]) { info[data.type] = []; }
                    info[data.type].push(data.site);
                    // or if we want to pass the whole data
                    // info[data.type].push(data);
                    
                }
                // the 'promise' call
                process(callback);
            });
        } else {
            callback(info);
        }
        
    }

    return {
        execute: function(callback) {
            Helper.status("loading json..");
            process(callback);
        }
    };

});