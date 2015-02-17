Modulr.define("basic:main", [
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

});