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

            var CONTEXT = CONFIG.context || "Modulr";

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
            this.version = "${version}";

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
                //         CONFIG.paths[i] = setConfigPaths(CONFIG.baseUrl, CONFIG.paths[i]);
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

            function loadInstanceScript(id, src, callback) {

                var loaded = false,
                    script = document.createElement("script");

                script.type = "text/javascript";
                script.async = true;
                script.src = src;
                script.onload = script.onreadystatechange = function() {
                    if (!loaded && (!this.readyState || this.readyState === "complete")) {
                      loaded = true;
                      callback();
                    }
                };
                document.getElementsByTagName("head")[0].appendChild(s);

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

        function setConfigPaths(baseUrl, path) {
            baseUrl = rtrimSlash(baseUrl);
            path = trimSlash(path);
            return [baseUrl, path].join("/");
        }

        /**
         * helper functions
         */
        
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
            //inclue:${domready}
            return domready;
        }()),

        (function(){
            //inclue:${loadAttempt}
            return LoadAttempt;
        }())

    ))

));
