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

    Modulr.require(["app1/main"], function(){
        console.log("LOADED");
    });

}());