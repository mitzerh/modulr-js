Modulr.define("basic:main", [
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
