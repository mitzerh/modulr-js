Modulr.define("plugins:modules/numberComma", [], function(){

    var App = function(val) {
        if (isNaN(val)) { return val; }
        val = parseFloat(val);
        var x, str = val.toString(), sp = str.split("."), whole = sp[0].split(""), dec = (sp[1]) ? ("." + sp[1]) : "";
        whole.reverse(); // reverse
        for (x = 0; x < whole.length; x++) {
            if (x !== 0 && (x+1)%3===0 && whole[x+1]) { whole[x] = "," + whole[x]; }
        }
        whole.reverse(); // reverse back
        return whole.join("") + dec;
    };
    
    return App;

});;Modulr.define("plugins:queryParam", [], function(){

    var App = function() {

    };

    var Proto = App.prototype;
    
    // get specific query param value
    Proto.getVal = function(name) {
        var self = this,
            queryObj = self.getAll();

        return (queryObj && queryObj[name]) ? decodeURIComponent(queryObj[name]) : false;

    };
    
    // get all query values
    Proto.getAll = function() {
        var self = this,
            ret = {},
            query = window.location.search.substr(1) || "",
            vals = query.split("&");

        for (var x = 0; x < vals.length; x++) {
            var sp = vals[x].split("="),
                name = sp[0] || false,
                value = sp[1] || false;

            if (name && value) {
                ret[name] = (decodeURIComponent(value)).toString();
            }
        }

        return ret;

    };
    
    // translate a to string you can use on building your query url
    Proto.setToString = function(queryObj) {
        var ret = [];

        for (var i in queryObj) {
            ret.push(i + "=" + queryObj[i]);
        }

        ret = ret.join("&");
        return ret;

    };

    return (new App);

});;(function(){

    var path = window.location.pathname.split('/').reverse().slice(1).reverse().join('/'),
        domain = window.location.origin;

    Modulr.config({

        instance: "plugins",

        baseDomain: domain,

        baseUrl: path + "/js/package/plugins/app",

        masterFile: path + "/js/package/master.js",

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