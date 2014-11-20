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
            this.version = "${version}";

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

                    if (stack && stack.factory) {
                        ret = stack.factory;
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

                        var deps = getDeps(stack.deps);
                        STACK[id].factory = getFactory(stack.factory, deps);

                    }

                    ret = STACK[id];

                }

                return ret;
            }

            function getDeps(deps) {
                var ret = [];

                for (var i = 0; i < deps.length; i++) {
                    var id = deps[i];

                    if (isArray(id)) {
                        ret.push(generateArrDeps(id));
                    } else if (typeof id === "string") {
                        ret = setDeps(ret, id);
                    } else {
                        log('dependency:');
                        log(id);
                        throwError("invalid dependency");
                    }

                }

                return ret;
            }

            function generateArrDeps(arr) {

                var ret = {};

                for (var i = 0; i < arr.length; i++) {
                    var id = arr[i];

                    if (typeof id === "string") {
                        ret = setDeps(ret, id);
                    } else {
                        log('dependency:');
                        log(id);
                        throwError("invalid dependency");
                    }

                }

                return ret;

            }

            function getSelectors(str) {
                
                var arr = [],
                    patt = str.replace("**", "");

                for (var id in STACK) {

                    if (id.indexOf(patt) === 0) {
                        arr.push(id);
                    }

                }
                
                var ret = generateArrDeps(arr);

                // create stack
                STACK[str] = {
                    executed: true,
                    deps: [],
                    factory: ret
                };

                return ret;

            }

            function setDeps(holder, id) {

                if (isArray(holder)) {

                    if (id === "define") {
                        holder.push(Proto.define);
                    } else if (id === "require") {
                        holder.push(Proto.require);
                    } else if (STACK[id]) {
                        holder.push(get(id).factory);
                    } else if (isSelector(id)) {
                        holder.push(getSelectors(id));
                    } else {
                        holder.push(null);
                    }

                } else if (isObj(holder)) {

                    if (id === "define") {
                        holder[id] = Proto.define;
                    } else if (id === "require") {
                        holder[id] = Proto.require;
                    } else if (STACK[id]) {
                        holder[id] = get(id).factory;
                    } else {
                        holder[id] = null;
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
            return (str.length > 0 && (str !== "require" || str !== "define") && str.indexOf("**") === -1) ? true : false;
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
