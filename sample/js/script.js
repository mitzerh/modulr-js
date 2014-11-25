(function(){

    Modulr.config({
        baseUrl: "/test/modulr/sample/js",
        instanceDeps: {
            "MyFoo": "/app2/main"
        }
    });

    Modulr.require(["app1/main"], function(){
        console.log("LOADED");
    });

}());