/**
* modulr-js v0.1.1 | 2014-11-20
* AMD Development
* by Helcon Mabesa
* MIT license http://opensource.org/licenses/MIT
**/

(function(window, app){

    window.Modulr = app;

}(window,

    (function(DomReady){

        var CONST = {};
        CONST.prefix = "[Modulr]";

        var DOM_READY = false,
            PAGE_READY = false;

        DomReady(function(){
            DOM_READY = true;
        });

        var Modulr = function(CONFIG) {

            CONFIG = CONFIG || {};

            var STACK = {};

            // version
            this.version = "0.1.1";

            var Proto = this;

            /**
             * define
             */
            Proto.define = function(id, deps, factory) {
                if (!isValidId(id)) {
                    throwError("invalid id: '" + id + "'.");
                    return false;
                }

                if (STACK[id]) {
                    throwError("id: '" + id + "': - already exists.");
                    return false;
                }

                deps = deps || [];

                STACK[id] = {
                    executed: false,
                    exports: {},
                    deps: deps, // dependencies
                    factory: factory
                };

            };

            /**
             * execute a factory function
             */
            Proto.require = function(id, callback) {
                
                var req = function() {
                    var ret = null,
                        stack = get(id);

                    if (stack) {
                        ret = stack.exports || stack.factory;
                    }

                    return ret;
                };

                var trigger = function() {
                    var factory = req();

                    if (isFN(callback)) {
                        callback(factory);
                    }

                    return factory;
                };

                if (DOM_READY || PAGE_READY) {
                    return (trigger());
                } else {
                    DomReady(function(){
                        trigger();
                    });
                }

            };

            /**
             * Instantiate a unique Modulr
             */
            Proto.instantiate = function(config) {

                var instance = new Modulr(config);
                delete instance.instantiate; // remote instantiation access

                return instance;
            };

            /**
             * Page ready option
             */
            Proto.ready = function() {
                PAGE_READY = true;
            };

            function get(id) {
                var ret = null;

                if (STACK[id]) {
                    var stack = STACK[id],
                        factory = stack.factory;

                    if (!stack.executed) {
                        stack.executed = true;

                        var deps = getDeps(id, stack.deps);
                        STACK[id].factory = getFactory(stack.factory, deps);

                    }

                    ret = STACK[id];

                }

                return ret;
            }

            function getDeps(modId, deps) {
                var ret = [];

                for (var i = 0; i < deps.length; i++) {
                    var depId = deps[i];

                    if (isArray(depId)) {
                        ret.push(generateArrDeps(depId, modId));
                    } else if (typeof depId === "string") {
                        ret = setDeps(ret, depId, modId);
                    } else {
                        log('dependency:');
                        log(depId);
                        throwError("invalid dependency");
                    }

                }

                return ret;
            }

            function generateArrDeps(arr, modId) {

                var ret = {};

                for (var i = 0; i < arr.length; i++) {
                    var depId = arr[i];

                    if (typeof depId === "string") {
                        ret = setDeps(ret, depId, modId);
                    } else {
                        log('dependency:');
                        log(depId);
                        throwError("invalid dependency");
                    }

                }

                return ret;

            }

            function getSelectors(str, modId) {
                
                var arr = [],
                    patt = str.replace("**", "");

                for (var id in STACK) {

                    if (id.indexOf(patt) === 0) {
                        arr.push(id);
                    }

                }
                
                var ret = generateArrDeps(arr, modId);

                // create stack
                STACK[str] = {
                    executed: true,
                    exports: {},
                    deps: [],
                    factory: ret
                };

                return ret;

            }

            function setDeps(holder, depId, modId) {

                if (isArray(holder)) {

                    if (depId === "define") {
                        holder.push(Proto.define);
                    } else if (depId === "require") {
                        holder.push(Proto.require);
                    } else if (depId === "exports") {
                        holder.push(STACK[modId].exports);
                    } else if (STACK[depId]) {
                        holder.push(get(depId).factory);
                    } else if (isSelector(depId)) {
                        holder.push(getSelectors(depId, modId));
                    } else {
                        holder.push(null);
                    }

                } else if (isObj(holder)) {

                    if (depId === "define") {
                        holder[depId] = Proto.define;
                    } else if (depId === "require") {
                        holder[depId] = Proto.require;
                    } else if (depId === "exports") {
                        holder[depId]= STACK[modId].exports;
                    } else if (STACK[depId]) {
                        holder[depId] = get(depId).factory;
                    } else {
                        holder[depId] = null;
                    }

                }

                return holder;

            }

        }; // Modulr

        function getFactory(factory, deps) {
            var ret = null;
            if (isFN(factory)) {
                ret = factory.apply(factory, deps);
            } else {
                ret = factory;
            }

            return ret;
        }

        function isSelector(str) {

            return (str.indexOf("**") > -1) ? true : false;

        }

        function isFN(val) {
            return (typeof val === "function") ? true : false;
        }

        function isObj(val) {
            return (typeof val === "object" && !isArray(val)) ? true : false;
        }

        function isArray(val) {
            val = val || false;
            return Object.prototype.toString.call(val) === "[object Array]";
        }

        function isValidId(id) {
            var str = (typeof id === "string") ? (id.replace(/\s+/gi, "")) : "";
            return (str.length > 0 && str !== "require" && str !== "define" && str !== "exports" && str.indexOf("**") === -1) ? true : false;
        }

        function log() {
            var args = arguments;
            if (typeof args[0] === "string") {
                args[0] = [CONST.prefix, args[0]].join(" ");
            }

            if (window.console && window.console.log) {
                try {
                    return console.log.apply(console, args);
                } catch(err) {
                    console.log(args);
                }
            }
        }

        function throwError(str) {
            str = [CONST.prefix, str].join(" ");
            throw new Error(str);
        }

        return (new Modulr());
        
    }(

        (function(){
            var domready=function(){function a(a){for(m=1;a=c.shift();)a()}var b,c=[],d=!1,e=document,f=e.documentElement,g=f.doScroll,h="DOMContentLoaded",i="addEventListener",j="onreadystatechange",k="readyState",l=g?/^loaded|^c/:/^loaded|c/,m=l.test(e[k]);return e[i]&&e[i](h,b=function(){e.removeEventListener(h,b,d),a()},d),g&&e.attachEvent(j,b=function(){/^c/.test(e[k])&&(e.detachEvent(j,b),a())}),ready=g?function(a){self!=top?m?a():c.push(a):function(){try{f.doScroll("left")}catch(b){return setTimeout(function(){ready(a)},50)}a()}()}:function(a){m?a():c.push(a)}}();
            return domready;
        }())

    ))

));
