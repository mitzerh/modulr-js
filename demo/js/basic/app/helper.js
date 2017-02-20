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
