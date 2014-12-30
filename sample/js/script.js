(function(){

    Modulr.config({
        baseUrl: "/test/modulr/sample/js",
        paths: {
            "@original-son": "app1/"
        },
        shim: {
            "jquery": {
                deps: ["modernizr"],
                src: "//global.fncstatic.com/static/v/all/js/ag.jquery.js",
                exports: "jQuery.ready"
            },
            "modernizr": {
                src: "//global.fncstatic.com/static/v/all/js/modernizr/modernizr.js",
                exports: "Modernizr"
            }
        }
    });

    Modulr.require(["require", "@original-son/main", "someExternalScript", "MyFoo:foobar", "getInstance:MyFoo"], function(require){

        console.log("GET INSTANCE HERE");
        console.log(require("getInstance:MyFoo"))

        console.log("LOADED SON");
        console.log(window.foo_bear);

    });



}());