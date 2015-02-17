Modulr.define("site:modules/json", [
    "require",
    "models/json.test",
    "helper"
], function(require){

    var Helper = require("helper"),
        JsonTest = require("models/json.test");

    var exec = function(callback) {
        JsonTest.execute(function(info){
            Helper.status("site:json test done.");
            Helper.log("json test info: ", info);
            callback(info);
        });
    };

    return {
        done: function(callback) {
            exec(callback);
        }
    }

});