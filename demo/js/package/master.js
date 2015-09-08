// load packages
(function(Modulr){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/');

    Modulr.loadPackageList({
        "site": path + "/js/package/site/bootstrap.js",
        "globals": path + "/js/package/globals/bootstrap.js",
        "plugins": path + "/js/package/plugins/bootstrap.js"
    });

}(window.Modulr));

