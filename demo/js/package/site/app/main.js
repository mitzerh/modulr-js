Modulr.define("site:main", [
    "require",
    "jquery",
    "helper"
], function(require, $, Helper){
    
    require([
        "modules/json",
        "modules/display",
        "modules/embed"
    ], function(json){

        Helper.status("site:main loaded.");

        json.done(function(){
            Helper.status("site:main json done!");
        });
        
    });

});