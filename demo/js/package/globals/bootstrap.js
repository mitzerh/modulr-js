(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    var instance = Modulr.config({

        instance: "globals",

        baseDomain: domain,

        baseUrl: path + "/js/package/globals/app",

        packages: {
            "plugins": path + "/js/package/plugins/bootstrap.js"
        },
        
        shim: {
            "jquery": {
                src: "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js",
                exports: "jQuery"
            }
        }
    });

    instance.require(["main"]);

}());