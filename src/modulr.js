var Modulr = (function(window, app){

    // do not override existing Modulr declaration
    return window.Modulr || app;

}(window,

    (function(DomReady){

        var CONST = {};
        CONST.prefix = "[Modulr]";

        var MODULR_STACK = {},
            MODULR_STACK_QUEUE = {},
            LOADED_SCRIPTS = {},
            LOADED_SCRIPTS_QUEUE = {},
            LOADED_INSTANCE_INCLUDES = {},
            LOADED_INSTANCE_INCLUDES_STACK_QUEUE = {},
            INSTANCE_LIST = {},
            INSTANCE_LIST_READY = false,
            MASTER_FILE = false,
            SHIM_QUEUE = {},
            DOM_READY = false,
            READY_QUEUE = [],
            GLOBAL_CACHE_PARAM_VAR = null;

        var executeReadyState = function() {
            DOM_READY = true;
            while (READY_QUEUE.length > 0) {
                var fn = READY_QUEUE.shift();
                fn();
            }
        };

        DomReady(function(){
            if (!DOM_READY) {
                executeReadyState();
            }
        });

        var isOpera = (typeof opera !== 'undefined' && opera.toString() === '[object Opera]') ? true : false,
            readyRegExp = /^(complete|loaded)$/;

        var Modulr = function(CONFIG) {

            CONFIG = CONFIG || {};
            // default context
            CONFIG.context = CONFIG.instance || CONFIG.context || "_";
            // wait for DOM or PAGE ready (true default)
            CONFIG.wait = (typeof CONFIG.wait === "boolean") ? CONFIG.wait : true;

            var CONTEXT = CONFIG.context;

            // validate context
            if (!isValidContextId(CONTEXT)) {
                throwError("invalid context: '"+CONTEXT+"'");
            }

            // cannot instantiate same context
            if (MODULR_STACK[CONTEXT]) {
                log("WARNING: attempt to instantiate the same context: " + CONTEXT + "\n. No configuration changes, returning instance instead..");
                return MODULR_STACK[CONTEXT].instance;
            }

            // create context object
            MODULR_STACK[CONTEXT] = {
                instance: this,
                stack: {}
            };

            var STACK = MODULR_STACK[CONTEXT].stack,
                INSTANCE_INIT = false,
                INSTANCE_READY = false;

            var Proto = this;

            // version
            Proto.version = "${version}";

            /**
             * get current instance's config
             */
            Proto.getConfig = function() {
                return CONFIG;
            };

            /**
             * get a specific instance via context
             */
            Proto.getInstance = function(context) {
                return (MODULR_STACK[context]) ? MODULR_STACK[context].instance : null;
            };

            /**
             * get externally loaded scripts - useful for managing aggregates
             * to see what else needs to be included in the aggregate
             * so you don't load these scripts individually
             */
            Proto.getLoadedScripts = function() {
                var scripts = {};

                for (var item in LOADED_SCRIPTS) {

                    var sp = item.split("||"),
                        context = sp[0],
                        url = sp[1] || "";

                    if (context && url) {
                        if (!scripts[context]) { scripts[context] = []; }

                        scripts[context].push(url);
                    }

                }
                return scripts;
            };

            /**
             * define
             */
            Proto.define = function(id, deps, factory) {
                // if invalid id
                if (!isValidId(id)) { throwError("invalid id: '" + id + "'."); }

                // id and factory only
                if (arguments.length === 2 && !isArray(deps)) {
                    factory = deps;
                    deps = [];
                }

                id = processDepsPath(id);

                var ext = isExtendedInstance(id);

                // extended module definition
                if (ext) {
                    if (MODULR_STACK[ext.context]) {
                        var instance = MODULR_STACK[ext.context].instance;
                        instance.define(ext.id, deps, factory);
                    } else {
                        // queue up if context has not been instantiated yet
                        if (!MODULR_STACK_QUEUE[ext.context]) {
                            MODULR_STACK_QUEUE[ext.context] = [];
                        }

                        MODULR_STACK_QUEUE[ext.context].push({ ext:ext, deps:deps, factory:factory });
                    }
                } else {
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
                }
            };

            /**
             * execute a factory function
             */
            Proto.require = function(deps, callback) {
                // if deps is string, it's called from a factory
                if (typeof deps === "string") {
                    return getDefinedModule(deps);
                } else if (isArray(deps)) {
                    var getDeps = function() {
                        // get dependencies
                        MODULE.get(null, deps, function(args){
                            getFactory(callback, args);
                        });
                    };

                    var trigger = function() {
                        // initialize the first time
                        if (!INSTANCE_INIT) {
                            INSTANCE_INIT = true;

                            initializeInstance(function(){
                                getDeps();
                            });
                        } else {
                            getDeps();
                        }
                    };

                    if (!CONFIG.wait) {
                        trigger();
                    } else {
                        if (DOM_READY) {
                            trigger();
                        } else {
                            READY_QUEUE.push(trigger);
                        }
                    }
                }
            };

            /**
             * Instantiate a unique Modulr
             */
            Proto.config = function(config) {
                if (!config.context && !config.instance) {
                    if (INSTANCE_INIT) {
                        log("WARNING: Instance '"+config.instance+"' already exists! no configuration changes, returning instance instead..");
                        return Proto.getInstance(config.instance);
                    } else {
                        CONFIG = config;
                    }
                } else {
                    var instance = new Modulr(config);

                    if (instance.config) {
                        delete instance.config; // remote instantiation access
                    }

                    if (instance.getInstance) {
                        delete instance.getInstance; // remove call from instances
                    }

                    if (instance.loadPackageList) {
                        delete instance.loadPackageList; // remove pacakge list loader - this is only for pre-run
                    }

                    if (instance.setGlobalCacheParam) {
                        delete instance.setGlobalCacheParam; // remove setter - only for pre-run
                    }

                    // add custom package loader
                    instance.loadPackage = function(packages, callback) {
                        if (typeof callback !== "function") {
                            throwError("loadPackage() requires a callback!");
                        }
                        if (!isArray(packages) && typeof packages === "object") {
                            loadPackages(packages, callback.apply(callback, Proto.require));
                        } else {
                            throwError("cannot load package list.");
                        }
                    };


                    return instance;
                }
            };

            /**
             * external module execution
             */
            Proto.execModule = function(id, callback) {
                var module = getStack(id);

                if (typeof callback !== "function") { return false; }

                if (!module) {
                    callback(null);
                } else {
                    if (module.executed) {
                        callback(MODULE.getModuleFactory(module));
                    } else {
                        MODULE.execModule(null, null, id, function(factory){
                            callback(factory);
                        });
                    }
                }
            };

            /**
             * load the package/instances
             */
            Proto.loadPackageList = function(packages) {
                if (!isArray(packages) && typeof packages === "object") {
                    for (var id in packages) {
                        if (!INSTANCE_LIST[id]) {
                            INSTANCE_LIST[id] = packages[id];
                        }
                    }
                } else {
                    throwError("cannot load package list.");
                }
            };

            /**
             * set a global static cache parameter
             */
            Proto.setGlobalCacheParam = function(val) {
                if (typeof val === "string" || typeof val === "number") {
                    GLOBAL_CACHE_PARAM_VAR = val;
                }
            };

            Proto.getPackageListInfo = function() {
                return {
                    master: MASTER_FILE,
                    instances: INSTANCE_LIST
                };
            };

            /**
             * set ready callback for in-page execution if you don't want to use DOM_READY
             */
            Proto.setReady = function() {
                executeReadyState();
            };

            /**
             * load the module definitions waiting for
             * this instance to be configured
             */
            loadInstanceQueue();

            /**
             * set shim definitions
             */
            setShim();


            /**
             * get stack from require
             */
            function getDefinedModule(id) {
                id = processDepsPath(id);

                var stack = null,
                    type = "module",
                    ext = isExtendedInstance(id);
                // if extended instance call
                if (ext) {
                    if (ext.type === "module") {
                        stack = MODULR_STACK[ext.context].stack[ext.id];
                    } else if (ext.type === "instance") {
                        stack = MODULR_STACK[ext.context].instance;
                        type = "instance";
                    }
                } else {
                    stack = STACK[id];
                }

                if (type === "module") {
                    if (stack && !stack.executed) {
                        throwError("module not yet executed: '"+id+"'");
                    }
                    stack = (stack) ? (typeof stack.factory !== "undefined") ? stack.factory : stack.exports : null;
                }

                return stack;
            }

            function initializeInstance(callback) {
                // base domain
                CONFIG.baseDomain = addProtocol(CONFIG.baseDomain) || getDomain();
                // baseUrl - base instance path
                CONFIG.baseUrl = CONFIG.baseUrl || getRelativePath();

                var isReady = function() {
                    INSTANCE_READY = true;
                    callback();
                };

                // load master file
                loadMasterFile(function(){
                    // load other modulr packages
                    loadPackages(CONFIG.packages, function(){
                        isReady();
                    });
                });

            }

            // load other included instances
            function loadInstanceQueue() {
                if (MODULR_STACK_QUEUE[CONTEXT]) {
                    var instance = MODULR_STACK[CONTEXT].instance;

                    while (MODULR_STACK_QUEUE[CONTEXT].length > 0) {
                        var item = MODULR_STACK_QUEUE[CONTEXT].shift();
                        instance.define(item.ext.id, item.deps, item.factory);
                    }
                }
            }

            // process config paths
            function processDepsPath(deps) {
                if (CONFIG.paths) {
                    for (var i in CONFIG.paths) {
                        deps = deps.replace(i, CONFIG.paths[i]);
                    }
                }

                // replace double slash, remove prefix slash
                deps = deps.replace(/\/\//g, "/").replace(/^\//, '');
                return deps;
            }

            // process shim
            function processShimQueue(id) {
                if (SHIM_QUEUE[id]) {
                    while (SHIM_QUEUE[id].length > 0) {
                        var fn = SHIM_QUEUE[id].shift();
                        fn();
                    }
                }
            }

            // module functions
            var MODULE = (function(){

                var App = function() {
                    var self = this;

                    self.get = function(moduleId, deps, callback) {
                        var next = true,
                            args = [],
                            arr;

                        if (deps) {
                            arr = cloneArr(deps);
                        } else if (moduleId && STACK[moduleId]) {
                            arr = cloneArr(STACK[moduleId].deps);
                        }

                        var getDeps = function() {
                            if (arr.length === 0) {
                                callback(args);
                            } else {
                                var id = processDepsPath(arr.shift()),
                                    module = getStack(id),
                                    ext = isExtendedInstance(id);

                                if (ext) { // if extended calls (calls to other packages/instances)
                                    if (ext.type === "module") {
                                        // extended modules are existing contexts
                                        getExtendedModule(id, function(extFactory){
                                            args.push((typeof extFactory !== "undefined") ? extFactory : null);
                                            getDeps();
                                        });
                                    } else if (ext.type === "instance") { // if calling for the instance
                                        args.push(getExtendedInstance(ext.context));
                                        getDeps();
                                    }
                                } else if (id === "require") {
                                    args.push(Proto.require);
                                    getDeps();
                                } else if (id === "define") {
                                    args.push(Proto.define);
                                    getDeps();
                                } else if (id === "exports") {
                                    args.push(STACK[moduleId].exports);
                                    getDeps();
                                } else if (module  && !isShimModuleId(id)) { // module, but not a shim-defined module
                                    if (module.executed) {
                                        args.push(self.getModuleFactory(module));
                                        getDeps();
                                    } else {
                                        self.execModule(null, null, id, function(factory){
                                            args.push(factory);
                                            getDeps();
                                        });
                                    }
                                } else if (isShimModuleId(id)) { // shim module definition
                                    var shimInfo = CONFIG.shim[id];

                                    self.loadShim(id, shimInfo, function(factory){
                                        args.push(factory);
                                        getDeps();
                                    });

                                } else { // might be an external script..
                                    // try to load external script
                                    var src = self.getModulePath(id);

                                    loadScript(src, id, function(){
                                        self.execModule("load", src, id, function(factory){
                                            args.push(factory);
                                            getDeps();
                                        });
                                    });
                                }
                            }
                        };

                        getDeps();
                    };

                    self.loadShim = function(id, info, callback) {
                        var src = setPathSrc(info.src),
                            module = getStack(id);

                        if (isExportsDefined(info.exports)) {
                            module.executed = true;
                            module.factory = getShimExport(info.exports);
                            callback(module.factory);
                        } else if (SHIM_QUEUE[src]) {
                            SHIM_QUEUE[src].push(function(){
                                self.execModule("shim", null, id, function(factory){
                                    callback(factory);
                                });
                            });
                        } else {
                            SHIM_QUEUE[src] = [function(){
                                self.execModule("shim", null, id, function(factory){
                                    callback(factory);
                                });
                            }];

                            loadScript(src, id, function(){
                                if (!isExportsDefined(info.exports)) {
                                    throwError("shim export not found for: '"+id+"'");
                                } else {
                                    processShimQueue(src);
                                }
                            }, null, info.noCacheString || null);
                        }
                    };

                    self.execModule = function(type, src, id, callback) {
                        var module = getStack(id);

                        if (module) {
                            // if not yet executed
                            if (!module.executed) {
                                // create queue
                                if (!self._execQueue) { self._execQueue = {}; }
                                if (!self._execQueue[id]) { self._execQueue[id] = []; }

                                // if still executing, queue
                                if (!module.executing) {
                                    module.executing = true;

                                    // push to queue
                                    self._execQueue[id].push(callback);

                                    self.get(id, module.deps, function(args){
                                        module.factory = getFactory(module.factory, args);
                                        module.executed = true;
                                        module.executing = false;
                                        self.runCallbackQueue(id, self.getModuleFactory(module));
                                    });
                                } else { // if already executing, wait and put to stack
                                    self._execQueue[id].push(callback);
                                }
                            } else {
                                // if already executed return factory
                                callback(self.getModuleFactory(module));
                            }

                        } else {
                            log("loading external source: " + src);

                            callback({
                                id: id,
                                src: src,
                                type: "external-script"
                            });
                        }
                    };

                    self.runCallbackQueue = function(id, factory) {
                        var queue = self._execQueue[id] || [];

                        while (queue.length > 0) {
                            var fn = queue.shift();
                            fn(factory);
                        }
                    };

                    self.getModuleFactory = function(module){
                        return (module.factory !== null) ? module.factory : module.exports;
                    };

                    self.getModulePath = function(id) {
                        // base url - base instance path
                        var base = getContextBasePath(),
                            url = setConfigPath(base,id) + ".js";
                        return url;
                    };

                };

                return (new App());

            }());

            function getStack(id) {
                return STACK[id] || false;
            }

            function getContextBasePath() {
                return [rtrimSlash(CONFIG.baseDomain || getDomain()), ltrimSlash(CONFIG.baseUrl || getRelativePath())].join("/");
            }

            function loadInstanceDeps(depsObj, callback) {
                var arr = [];

                for (var id in depsObj) {
                    arr.push({
                        id: id,
                        path: depsObj[id]
                    });
                }

                var getDeps = function() {

                    if (arr.length === 0) {
                        callback();
                    } else {
                        var obj = arr.shift(),
                            path = obj.path,
                            src = MODULE.getModulePath(obj.path);

                        loadScript(src, null, function(){
                            getDeps();
                        });
                    }

                };

                getDeps();
            }

            function getExtendedModule(id, callback) {
                var sp = id.split(":"),
                    context = sp[0] || false,
                    moduleId = sp[1] || false;

                if (context && moduleId && MODULR_STACK[context]) {
                    var instance = MODULR_STACK[context].instance;

                    // if module already defined
                    if (MODULR_STACK[context].stack[moduleId]) {
                        instance.execModule(moduleId, function(factory){
                            callback(factory);
                        });
                    } else {
                        // attempt to load module
                        instance.require([moduleId], function(){
                            instance.execModule(moduleId, function(factory){
                                callback(factory);
                            });
                        });
                    }
                } else {
                    log(["Not initialized >> CONTEXT: ", context, " | module: ", moduleId].join(""));
                    callback(null);
                }
            }

            function getExtendedInstance(context) {
                if (MODULR_STACK[context]) {
                    return MODULR_STACK[context].instance;
                } else {
                    throwError("Error getting instance: " + context);
                }
            }

            function isExtendedInstance(id) {
                var found = (id.indexOf(":") > -1) ? true : false,
                    sp = id.split(":"),
                    context = sp[0] || false,
                    moduleId = sp[1] || false,
                    ret = false;

                if (found) {
                    // check if instance
                    if (context === "getInstance" && moduleId) {
                        ret = {
                            type: "instance",
                            context: moduleId
                        };
                    } else if (context && moduleId) {
                        ret = {
                            type: "module",
                            context: context,
                            id: moduleId
                        };
                    }
                }

                return ret;
            }

            function setShim() {
                if (!CONFIG.shim) { return false; }
                var arr = [];

                for (var sid in CONFIG.shim) {
                    arr.push({
                        id: sid,
                        info: CONFIG.shim[sid]
                    });
                }

                var setDefinition = function(obj) {
                    var id = obj.id,
                        info = obj.info,
                        src = setPathSrc(info.src),
                        deps = info.deps || [];

                    Proto.define(id, deps, function(){
                        return getShimExport(info.exports);
                    });
                };

                while (arr.length > 0) {
                    setDefinition(arr.shift());
                }
            }

            function loadMasterFile(callback) {

                if (!CONFIG.masterFile) {

                    callback();

                } else {

                    var src = setPathSrc(CONFIG.masterFile);
                    // allow multiple master files
                    if (!MASTER_FILE) {
                        MASTER_FILE = [];
                    }

                    if (MASTER_FILE.indexOf(src) === -1) {
                        MASTER_FILE.push(src);
                        loadScript(src, null, function(){
                            callback();
                        });
                    } else {
                        callback();
                    }
                    
                }
            }

            // load other included instances
            function loadPackages(packages, callback) {
                if (!packages) {
                    callback();
                } else {
                    var arr = [];

                    var setPackageObj = function(obj) {
                        for (var uid in obj) {
                            // add to instance list
                            if (!INSTANCE_LIST[uid]) {
                                // no more logs
                                // log("please add this instance to the master package file: " + uid);
                                INSTANCE_LIST[uid] = obj[uid];
                            }
                            arr.push({ uid:uid, src:obj[uid] });
                        }
                    };

                    // new - using package list master file
                    if (isArray(packages)) {
                        for (var i = 0; i < packages.length; i++) {
                            var item = packages[i];

                            if (typeof item === "string" && INSTANCE_LIST[item]) {
                                arr.push({ uid:item, src:INSTANCE_LIST[item] });
                            } else if (typeof item === "object" && !isArray(item)) {
                                setPackageObj(item);
                            } else {
                                throwError("cannot find package named: " + item);
                            }
                        }
                    } else { // legacy
                        setPackageObj(packages);
                    }

                    // load the instance stack that has the same queue
                    var loadInstanceStackQueue = function(srcId) {
                        var queue = LOADED_INSTANCE_INCLUDES_STACK_QUEUE[srcId];

                        while (queue.length > 0) {
                            var exec_queue = queue.shift();
                            exec_queue();
                        }

                        delete LOADED_INSTANCE_INCLUDES_STACK_QUEUE[srcId];
                    };

                    var getInstance = function() {
                        if (arr.length === 0) {
                            callback();
                        } else {
                            var obj = arr.shift(),
                                uid = obj.uid,
                                src = setPathSrc(obj.src);

                            if (MODULR_STACK[uid]) {
                                getInstance();
                            } else {
                                if (!LOADED_INSTANCE_INCLUDES[src]) {
                                    LOADED_INSTANCE_INCLUDES[src] = uid;

                                    loadScript(src, uid, function(){
                                        getInstance();
                                        if (LOADED_INSTANCE_INCLUDES_STACK_QUEUE[src]) {
                                            loadInstanceStackQueue(src);
                                        }
                                    }, "instance");
                                } else {
                                    if (!LOADED_INSTANCE_INCLUDES_STACK_QUEUE[src]) { LOADED_INSTANCE_INCLUDES_STACK_QUEUE[src] = []; }

                                    LOADED_INSTANCE_INCLUDES_STACK_QUEUE[src].push(function(){
                                        getInstance();
                                    });
                                }
                            }
                        }
                    };

                    getInstance();
                }
            }

            // set source with domain
            function setPathSrc(src) {
                var ret = src;

                if (src.indexOf("http") !== 0) {
                    if (src.indexOf("//") === 0) {
                        ret = addProtocol(src);
                    } else {
                        ret = CONFIG.baseDomain + ((src.charAt(0) !== "/") ? "/" : "") + src;
                    }
                }

                return ret;
            }

            // is a shim id
            function isShimModuleId(id) {
                return (CONFIG.shim && CONFIG.shim[id]) ? true : false;
            }

            // shim export
            function getShimExport(scope) {
                 return window[scope.split(".")[0]];
            }

            /**
             * loadScript
             * Credit to partial implementation: RequireJS
             */
            function loadScript(src, id, callback, specType, noBrowserCache) {
                var loaded = false,
                    script = document.createElement("script"),
                    scriptId = [CONTEXT || "", src].join("||");

                var onLoad = function(evt) {
                    //Using currentTarget instead of target for Firefox 2.0's sake. Not
                    //all old browsers will be supported, but this one was easy enough
                    //to support and still makes sense.
                    if (!loaded && evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {

                        loaded = true;
                        // execute queue
                        while (LOADED_SCRIPTS_QUEUE[scriptId].length > 0) {
                            var fn = LOADED_SCRIPTS_QUEUE[scriptId].shift();
                            fn();
                        }

                        delete LOADED_SCRIPTS_QUEUE[scriptId];
                        removeScriptListener();
                    }

                };

                var onError = function() {
                    throwError("error loading script: " + src);
                };

                var removeScriptListener = function() {
                    removeListener(script, onLoad, "load", "onreadystatechange");
                    removeListener(script, onError, "error");
                };

                if (id) {
                    var idAttrName = "data-modulr-module";

                    if (specType) {
                        idAttrName = "data-modulr-loaded-inst";
                    }

                    script.setAttribute(idAttrName, id);
                }

                script.setAttribute("data-modulr-context", CONTEXT);

                // load once
                if (LOADED_SCRIPTS[scriptId]) {
                    LOADED_SCRIPTS_QUEUE[scriptId].push(function(){
                        callback(id);
                    });
                    return false;
                }

                LOADED_SCRIPTS[scriptId] = true;
                LOADED_SCRIPTS_QUEUE[scriptId] = [function(){
                    callback(id);
                }];

                script.type = "text/javascript";
                script.charset = "utf-8";
                script.async = true;

                if (script.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(script.attachEvent.toString && script.attachEvent.toString().indexOf("[native code") < 0) &&
                    !isOpera) {

                    script.attachEvent("onreadystatechange", onLoad);
                } else {
                    script.addEventListener("load", onLoad, false);
                    script.addEventListener("error", onError, false);
                }

                script.src = (function(src){
                    var ret = src;
                    if ((CONFIG && CONFIG.cacheParam || GLOBAL_CACHE_PARAM_VAR) && !noBrowserCache) {
                        // if global cache var defined, used "v", if no custom param
                        var param = (typeof CONFIG.cacheParam === "string") ? CONFIG.cacheParam : (GLOBAL_CACHE_PARAM_VAR) ? "v" : "";
                        // browser cache buster
                        var cb = GLOBAL_CACHE_PARAM_VAR || (function(){
                            var c = new Date(),
                                secs = c.getSeconds(),
                                ret = [c.getFullYear(), c.getMonth() + 1, c.getDate(), c.getHours(), c.getMinutes()].join("");
                            ret = ret + ((secs <= 30) ? 30 : 01);
                            return ret;
                        }());
                        ret = src + ((src.indexOf("?") > -1) ? "&" : "?") + ((param) ? (param + "=") : "") + cb;
                    }
                    return ret;
                }(src));
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

            if (typeof factory === "function") {
                ret = factory.apply(factory, deps);
            } else {
                ret = factory;
            }

            return ret;
        }
        /**
         * check if shim exports is defined
         */
        function isExportsDefined(exports) {
            var ex = exports.split("."),
                tmp = window[ex.shift()],
                ret = false;

            if (typeof tmp !== "undefined") {
                ret = true;

                if (ex.length > 0) {
                    while (ex.length > 0) {
                        tmp = tmp[ex.shift()];
                        if (typeof tmp === "undefined") {
                            ret = false;
                            break;
                        }
                    }
                }
            }

            return ret;
        }

        /**
         * validate module id
         */
        function isValidId(id) {
            var str = (typeof id === "string") ? (id.replace(/\s+/gi, "")) : "";
            return (str.length > 0 && str !== "require" && str !== "define" && str !== "exports") ? true : false;
        }

        /**
         * validate context uid
         */
        function isValidContextId(id) {
            var invalid = /[^A-Za-z0-9_\-\.]/g.test(id);
            return (typeof id === "string" && !invalid) ? true : false;
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
        function getRelativePath() {
            var loc = window.location,
                path = loc.pathname.split("/");
            path.pop();
            path = path.join("/") + "/";
            return getDomain()+ path;
        }

        /**
         * get the current domain host
         */
        function getDomain() {
            var loc = window.location;
            return loc.protocol + "//" + (loc.host || loc.hostname);
        }

        /**
         * clean up the path
         */
        function setConfigPath(baseUrl, path) {
            baseUrl = rtrimSlash(baseUrl);
            path = trimSlash(path);
            return [baseUrl, path].join("/");
        }

        /**
         * add http/s protocol
         */
        function addProtocol(domain) {
            var ret = domain,
                protocol = window.location.protocol;
            if (domain.indexOf("http") !== 0) {
                ret = protocol + ((domain.indexOf("//") !== 0) ? "//" : "") + domain;
            }
            return ret;
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

        // from requirejs
        function removeListener(node, func, name, ieName) {
            if (node.detachEvent && !isOpera) {
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
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
        }())

    ))

));
