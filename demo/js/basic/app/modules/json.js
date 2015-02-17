Modulr.define("basic:modules/json", [
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

});