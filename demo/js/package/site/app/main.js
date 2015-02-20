Modulr.define("site:main", [
    "require",
    "jquery",
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

});