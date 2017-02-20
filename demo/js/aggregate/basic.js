Modulr.define("basic:helper", [
    "require",
    "jquery"
], function(require, $){

    var Helper = {};

    // get modules from query string
    Helper.getModules = function() {
        var search = window.location.search.slice(1),
            match = search.match(/modules=([^&]*)/);

        return (!match) ? [] : match[1].split(",");
    };

    // sample status log in page
    Helper.status = function(text, link) {
        $(".status").append('<li>'+link + text+'</li>');
    };

    Helper.log = function() {
        if (window.console) {
            var args = Array.prototype.slice.call(arguments);
            try {
                return console.log.apply(console, args);
            } catch(err) {
                console.log(args);
            }
        }
    }

    return Helper;

});
;Modulr.define("basic:main", [
    "require",
    "jquery",
    "helper"
], function(require, $){

    var Helper = require("helper"),
        modules = Helper.getModules()
        link = '<a href="/js/basic/app/main.js">main</a>: ';

    Helper.status("modules length: " + modules.length, link);

    require([
        "modules/json",
        "modules/display",
        "modules/embed"
    ], function(){
        Helper.status("main loaded.", link);
    });

});
;Modulr.define("basic:models/json.test", [
    "require",
    "jquery",
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
            var link = '<a href="/js/basic/app/models/json.test.js">models/json.test</a>: ';
            Helper.status("loading json..", link);
            process(callback);
        }
    };

});
;Modulr.define("basic:modules/display", [
    "require",
    "helper"
], function(require){
    var Helper = require("helper"),
        link = '<a href="/js/basic/app/modules/display.js">modules/display</a>: ';
    Helper.status("display module.", link);
});
;Modulr.define("basic:modules/embed", [
    "require",
    "helper"
], function(require){

    var Helper = require("helper"),
        link = '<a href="/js/basic/app/modules/embed.js">modules/embed</a>: ';
    Helper.status("embed module.", link);

});
;Modulr.define("basic:modules/json", [
    "require",
    "models/json.test",
    "helper"
], function(require){

    var Helper = require("helper"),
        JsonTest = require("models/json.test");

    JsonTest.execute(function(info){
        var link = '<a href="/js/basic/app/modules/json.js">modules/json</a>: ';
        Helper.status("json test done.", link);
        Helper.log("json test info: ", info);
    });

});
;(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    var basic = Modulr.config({

        instance: "basic",

        // for cdn, this is very useful
        baseDomain: domain,

        baseUrl: path + "/js/basic/app",
        
        shim: {
            "jquery": {
                src: "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js",
                exports: "jQuery"
            },
            "jquery.cookie": {
                deps: ["jquery"],
                src: "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js",
                exports: "jQuery.cookie"
            }
        }
    });
    
    basic.require(["main"]);

}());