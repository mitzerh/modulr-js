Modulr.define("site:helper", [
    "require",
    "globals:helper"
], function(require){

    // extend globals:helper
    var Helper = require("globals:helper");
    return Helper;

});;Modulr.define("site:main", [
    "require",
    "thejquery",
    "helper"
], function(require, $, Helper){
    
    require([
        "@mods/json",
        "modules/display",
        "@mods/embed"
    ], function(json){

        Helper.status("site:main loaded.");

        json.done(function(){
            Helper.status("site:main json done!");
        });
        
    });

});;Modulr.define("site:models/json.test", [
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

});;Modulr.define("site:modules/display", [
    "require",
    "helper",
    "plugins:@mods/numberComma"
], function(require){

    var Helper = require("helper"),
        comma = require("plugins:@mods/numberComma");

    Helper.status("site:display module.");

    var num = Math.floor(Math.random() * 9999999999) + 999999;
    Helper.status("num: " + num + " | comma: " + comma(num));

});;Modulr.define("site:modules/embed", [
    "require",
    "helper"
], function(require){

    var Helper = require("helper");
    Helper.status("site:embed module.");

});;Modulr.define("site:modules/json", [
    "require",
    "models/json.test",
    "helper"
], function(require){

    var Helper = require("helper"),
        JsonTest = require("models/json.test");

    var exec = function(callback) {
        JsonTest.execute(function(info){
            Helper.status("site:json test done.");
            Helper.log("json test info: ", info);
            callback(info);
        });
    };

    return {
        done: function(callback) {
            exec(callback);
        }
    }

});;(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    var site = Modulr.config({

        instance: "site",

        baseDomain: domain,
        
        baseUrl: path + "/js/package/site/app",

        masterFile: path + "/js/package/master.js",

        packages: [
            "plugins",
            "globals"
        ],

        paths: {
            "@mods": "modules"
        },
        
        shim: {
            // shim the same jquery file, even with a different id, will not load another jquery instance
            "thejquery": {
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
    
    site.require(["main"]);

}());