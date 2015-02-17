(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    var basic = Modulr.config({

        instance: "basic",

        // for cdn, this is very useful
        baseDomain: domain,

        baseUrl: path + "/js/basic/app",
        
        shim: {
            "jquery": {
                src: "//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js",
                exports: "jQuery"
            },
            "jquery.cookie": {
                deps: ["jquery"],
                src: "//cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js",
                exports: "jQuery.cookie"
            }
        }
    });
    
    basic.require(["main"]);

}());