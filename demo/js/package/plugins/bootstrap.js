(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    Modulr.config({

        instance: "plugins",

        baseDomain: domain,

        baseUrl: path + "/js/package/plugins/app",

        paths: {
            "@mods": "/modules"
        },
        
        shim: {
            "jquery": {
                src: "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js",
                exports: "jQuery"
            }
        }
    });

}());