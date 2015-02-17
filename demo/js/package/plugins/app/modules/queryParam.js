Modulr.define("plugins:queryParam", [], function(){

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

});