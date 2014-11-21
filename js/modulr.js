/**
* modulr-js v0.1.1 | 2014-11-20
* AMD Development
* by Helcon Mabesa
* MIT license http://opensource.org/licenses/MIT
**/

(function(window, app){

    window.Modulr = app;

}(window,

    (function(DomReady, LoadAttempt){

        var CONST = {};
        CONST.prefix = "[Modulr]";

        var MODULR_STACK = {},
            DOM_READY = false,
            PAGE_READY = false;

        DomReady(function(){
            DOM_READY = true;
        });

        var Modulr = function(CONFIG) {

            CONFIG = CONFIG || {};
            // default context
            CONFIG.context = CONFIG.context || "Modulr";

            var CONTEXT = CONFIG.context;

            // cannot instantiate same context
            if (MODULR_STACK[CONTEXT]) {
                throwError("cannot instantiate multiple contexts: '"+CONTEXT+"'");
            }

            MODULR_STACK[CONTEXT] = {
                instance: this,
                stack: {}
            };

            var STACK = MODULR_STACK[CONTEXT].stack,
                INSTANCE_INIT = false,
                INSTANCE_READY = false;

            // version
            this.version = "0.1.1";

            var Proto = this;

            /**
             * config setting (post-instantiation)
             */
            Proto.config = function(config) {
                CONFIG = config;
            };

            /**
             * get current instance's config
             */
            Proto.getConfig = function() {
                return CONFIG;
            };

            /**
             * define
             */
            Proto.define = function(id, deps, factory) {
                if (!isValidId(id)) {
                    throwError("invalid id: '" + id + "'.");
                }

                // only define if not yet defined
                if (!STACK[id]) {

                    deps = deps || [];

                    STACK[id] = {
                        executed: false,
                        exports: {},
                        deps: deps, // dependencies
                        factory: factory
                    };

                }

            };

            /**
             * execute a factory function
             */
            Proto.require = function(id, callback) {

                // instantiate on initial require()
                if (!INSTANCE_INIT) {
                    INSTANCE_INIT = true;
                    initializeInstance();
                }
                
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

                    if (isArray(id)) {
                        if (isFN(callback)) {
                            callback();
                        }
                    } else {
                        return factory;
                    }
                    
                };

                if (INSTANCE_READY) {
                    return (trigger());
                } else {

                    DomReady(function(){
                        LoadAttempt(function(){
                            return INSTANCE_READY;
                        }, function(){
                            trigger();
                        });
                    });

                }

            };

            /**
             * Instantiate a unique Modulr
             */
            Proto.instantiate = function(config) {

                if (!config.context) {
                    throwError("instantiation requires a context!");
                }

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

            function initializeInstance() {

                // baseUrl - base instance path
                CONFIG.baseUrl = CONFIG.baseUrl || getRelativeUrl();

                // dependency loader for other instances
                if (CONFIG.instanceDeps) {

                    loadInstanceDependencies(CONFIG.instanceDeps, function(){
                        INSTANCE_READY = true;
                    });

                } else {

                    INSTANCE_READY = true;

                }

                // for each paths, add baseUrl
                // if (CONFIG.paths) {
                //     for (var i in CONFIG.paths) {
                //         CONFIG.paths[i] = setConfigPath(CONFIG.baseUrl, CONFIG.paths[i]);
                //     }
                // }

            }

            /**
             * get module definition
             */
            function get(id) {
                var ret = null;

                if (isArray(id)) {

                    generateArrDeps(id);

                } else {

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

                }

                

                return ret;
            }

            /**
             * get dependencies
             */
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

            /**
             * genrate array dependencies
             */
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

            /**
             * set module selectors
             */
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

            /**
             * set module dependencies
             */
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

            function loadInstanceDependencies(deps, callback) {

                var arr = [];
                for (var name in deps) {
                    arr.push(deps[name]);
                }

                var next = true;

                LoadAttempt(function(){

                    var len = arr.length;

                    if (next && len > 0) {
                        next = true;
                        loadInstanceScript(setConfigPath(CONFIG.baseUrl, arr.shift()) + ".js", function(){
                            next = true;
                        });
                    }

                    return (len === 0) ? true : false;

                }, function(){

                    callback();

                });


            }

            function loadInstanceScript(src, callback) {

                var loaded = false,
                    script = document.createElement("script");

                script.setAttribute("data-modulr-context", CONTEXT);
                script.type = "text/javascript";
                script.async = true;
                script.src = src;
                script.onload = script.onreadystatechange = function() {
                    if (!loaded && (!this.readyState || this.readyState === "complete")) {
                      loaded = true;
                      callback();
                    }
                };
                document.getElementsByTagName("head")[0].appendChild(script);

            }


        }; // Modulr

        /**
         * modulr shared functions
         */
    
        /**
         * get module
         */
        function getFactory(factory, deps) {
            var ret = null;
            if (isFN(factory)) {
                ret = factory.apply(factory, deps);
            } else {
                ret = factory;
            }

            return ret;
        }

        /**
         * validate module id
         */
        function isValidId(id) {
            var str = (typeof id === "string") ? (id.replace(/\s+/gi, "")) : "";
            return (str.length > 0 && str !== "require" && str !== "define" && str !== "exports" && str.indexOf("**") === -1) ? true : false;
        }

        /**
         * check if instance exists
         */
        function isInstanceFound(context) {
            return (MODULR_STACK[context]) ? true : false;
        }

        /**
         * config functions
         */
        function getRelativeUrl() {
            var loc = window.location,
                path = loc.pathname.split("/");
            path.pop();
            path = path.join("/") + "/";
            return loc.protocol + "//" + (loc.host || loc.hostname) + path;
        }

        function setConfigPath(baseUrl, path) {
            baseUrl = rtrimSlash(baseUrl);
            path = trimSlash(path);
            return [baseUrl, path].join("/");
        }

        /**
         * helper functions
         */
        function cloneArr(arr) {
            var ret = [];
            for (var i  = 0; i < arr.length; i++) {
                ret.push(arr[i]);
            }
            return ret;
        }

        function trimSlash(val) {
            val = rtrimSlash(ltrimSlash(val));
            return val;
        }

        function ltrimSlash(val) {
            return (val.charAt(0) === "/") ? val.slice(1) : val;
        }

        function rtrimSlash(val) {
            return (val.charAt(val.length - 1) === "/") ? val.slice(0, val.length - 1) : val;
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
        }()),

        (function(){
            var LoadAttempt=function(){function a(a){return"number"==typeof a?!0:!1}function b(a){return"function"==typeof a?!0:!1}var c={attempts:999,timeout:500},d=arguments,e=!1;a(d[0])&&a(d[1])&&b(d[2])&&b(d[3])?e={attempts:d[0],timeout:d[1],check:d[2],success:d[3],expires:b(d[4])?d[4]:!1}:a(d[0])&&b(d[1])&&b(d[2])?e={attempts:d[0],timeout:c.timeout,check:d[1],success:d[2],expires:b(d[3])?d[3]:!1}:b(d[0])&&b(d[1])&&(e={attempts:c.attempts,timeout:c.timeout,check:d[0],success:d[1],expires:b(d[2])?d[2]:!1});var f,g=!1,h=function(){g?(clearTimeout(f),e.expires("aborted")):e.check()?(e.success(),clearTimeout(f)):e.attempts>0?f=setTimeout(function(){h()},e.timeout):e.expires("expired"),e.attempts--};return h(),{abort:function(){g=!0}}};
            return LoadAttempt;
        }())

    ))

));
