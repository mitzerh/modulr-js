Modulr.define("app1/main", ["require", "app1/main2", "modernizr"], function(require){

    console.log("MAIN YO");

    console.log("Modernizr", require("modernizr"))

    var main2 = require("app1/main2");
    main2.yo();

});

Modulr.define("app1/main2", ["exports", "require", "jquery", "MyFoo:foobar"], function(exports, require){

    var $ = require("jquery");
    console.log("JQUERY", $)

    exports.yo = function() {
        console.log("MAIN 2 YO");
    };
    

});