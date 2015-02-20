Modulr.define("site:modules/display", [
    "require",
    "helper",
    "plugins:@mods/numberComma"
], function(require){

    var Helper = require("helper"),
        comma = require("plugins:@mods/numberComma");

    Helper.status("site:display module.");

    var num = Math.floor(Math.random() * 9999999999) + 999999;
    Helper.status("num: " + num + " | comma: " + comma(num));

});