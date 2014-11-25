(function(){

    Modulr.define("main", ["require", "foo", "jquery"], function(require){

        var foo = require("foo"),
            $ = require("jquery");

        console.log("FOO", foo)

    });

    Modulr.define("foo", ["require", "exports", "jquery"], function(require, exports){

        exports.foo = function(){ console.log("bar");};

    });

    Modulr.define("jquery", [], function(){
        return window.jQuery;
    });

    Modulr.config({
        baseUrl: 'http://static.nyc.foxnews.dev/mabesah/test/modulr/',
        instanceDeps: {
            'MyFoo': '/js/instance/foo',
            'MyBar': '/js/instance/bar'
        }
        
    });

    console.log(Modulr.getConfig());

    Modulr.require(["main"], function(){
        console.log("ARGS", arguments)
    });

    

}());