Modulr.define("globals:helper", [
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

});;Modulr.define("globals:main", [
    "require",
    "jquery",
    "helper"
], function(require, $, Helper){
        
    Helper.status("globals:main loaded.");

});;(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    var instance = Modulr.config({

        instance: "globals",

        baseDomain: domain,

        baseUrl: path + "/js/package/globals/app",

        packages: {
            "plugins": path + "/js/package/plugins/bootstrap.js"
        },
        
        shim: {
            "jquery": {
                src: "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js",
                exports: "jQuery"
            }
        }
    });

    instance.require(["main"]);

}());