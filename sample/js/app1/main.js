Modulr.define("app1/main", ["require", "app1/main2"], function(require){

    console.log("MAIN YO");

    var main2 = require("app1/main2");
    main2.yo();

});

Modulr.define("app1/main2", ["exports"], function(exports){

    exports.yo = function() {
        console.log("MAIN 2 YO");
    };
    

});