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
    Helper.status = function(text) {
        $(".status").append('<li>'+text+'</li>');
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

});;Modulr.define("basic:main", [
    "require",
    "jquery",
    "helper"
], function(require, $){

    var Helper = require("helper"),
        modules = Helper.getModules();

    Helper.status("modules length: " + modules.length);

    require([
        "modules/json",
        "modules/display",
        "modules/embed"
    ], function(){
        Helper.status("main loaded.");
    });

});;Modulr.define("basic:models/json.test", [
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
            Helper.status("loading json..");
            process(callback);
        }
    };

});;Modulr.define("basic:modules/display", [
    "require",
    "helper"
], function(require){

    var Helper = require("helper");
    Helper.status("display module.");

});;Modulr.define("basic:modules/embed", [
    "require",
    "helper"
], function(require){

    var Helper = require("helper");
    Helper.status("embed module.");

});;Modulr.define("basic:modules/json", [
    "require",
    "models/json.test",
    "helper"
], function(require){

    var Helper = require("helper"),
        JsonTest = require("models/json.test");

    JsonTest.execute(function(info){
        Helper.status("json test done.");
        Helper.log("json test info: ", info);
    });

});;(function(){

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
    console.log(basic);
    basic.require(["main"]);

}());