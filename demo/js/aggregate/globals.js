Modulr.define("globals:modules/inject", [
    "require",
    "jquery",
    "module->resource",
    "helper"
], function(require, $, resource){

    console.log("Module Resource >>", resource);

    console.log("DOM in jQuery >>", $(resource.dom));

    var Helper = require("helper");
    Helper.status("globals:inject module.");

});