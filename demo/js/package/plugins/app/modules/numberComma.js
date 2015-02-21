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

});