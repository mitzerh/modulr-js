(function(){

    Modulr.config({
        baseUrl: "/test/modulr/sample/js",
        shim: {
            "jquery": {
                deps: ["modernizr"],
                src: "//global.fncstatic.com/static/v/all/js/ag.jquery.js",
                exports: "jQuery"
            },
            "modernizr": {
                src: "//global.fncstatic.com/static/v/all/js/modernizr/modernizr.js",
                exports: "Modernizr"
            }
        }
    });

    Modulr.require(["require", "app1/main", "someExternalScript", "MyFoo:foobar", "getInstance:MyFoo"], function(require){

        console.log("GET INSTANCE HERE");
        console.log(require("getInstance:MyFoo"))

        console.log("LOADED SON");
        console.log(window.foo_bear);

    });



}());