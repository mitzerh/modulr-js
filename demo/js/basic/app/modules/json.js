Modulr.define("basic:modules/json", [
    "require",
    "models/json.test",
    "helper"
], function(require){

    var Helper = require("helper"),
        JsonTest = require("models/json.test");

    JsonTest.execute(function(info){
        var link = '<a href="/js/basic/app/modules/json.js">modules/json</a>: ';
        Helper.status("json test done.", link);
        Helper.log("json test info: ", info);
    });

});
