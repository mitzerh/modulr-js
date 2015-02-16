Modulr.define("site:modules/display", [
    "require",
    "helper",
    "plugins:numberComma"
], function(require){

    var Helper = require("helper"),
        comma = require("plugins:numberComma");

    Helper.status("site:display module.");

    var num = 49523461232;
    Helper.status("num: " + num + " | comma: " + comma(num));

});