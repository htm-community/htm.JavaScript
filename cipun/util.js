String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length === 0) {
        return hash;
	}
    for (var i=0; i<this.length; i++) {
        var _char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + _char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

var isNullOrUndefined = function(o) {
    if (o === null || o === undefined || typeof o === undefined) {
        return true;
    }
    return false;
}

/*
 * Replace characters from position index in str by s
 */
var replaceAt = function(str, index, s) {
    return str.substr(0, index) + s + str.substr(index + s.length);
}

/*
 * Deep copies map/set/array from org to cpy
 */
var copyOf = function(org, type) {
    var cpy = null;
    if (type === "map") {
        cpy = new Map();
        var keys = Array.from(org.keys());
        for (var i = 0; i < keys.length; i++) {
            cpy.set(keys[i], org.get(keys[i]));
        }
    } else if (type === "set") {
        cpy = new Set();
        var entries = Array.from(org.entries());
        for (var i = 0; i < entries.length; i++) {
            cpy.add(entries[i]);
        }
    } else if (type === "array") {
        cpy = [];
        for (var i = 0; i < org.length; i++) {
            cpy[i] = org[i];
        }
    } else {
        throw new Error("copyOf: Original must be either map, set, or array.");
    }
    return cpy;
}

/*
 * Compares arrays of arbitrary dimensionalities. At the deepest level arrays may contain
 * numbers, strings, sets, maps, or plain key/value objects
 */
var equals = function(a1, a2) {

    if (!Array.isArray(a1) || !Array.isArray(a2)) {
        throw new Error("Arguments to function equals(a1, a2) must be arrays.");
    }

    if (a1.length !== a2.length) {
        return false;
    }

    for (var i = 0; i < a1.length; i++) {
        if (Array.isArray(a1[i]) && Array.isArray(a2[i])) {
            if (equals(a1[i], a2[i])) {
                continue;
            } else {
                return false;
            }
        } else { // from here on we are not dealing with arrays anymore
            if (typeof a1[i] !== typeof a2[i]) {
                return false;
            }
            if (typeof a1[i] === "number" || typeof a1[i] === "string") {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            } else if (typeof a1[i] === "object") {
                try {
                    if (a1[i] instanceof Set && a2[i] instanceof Set) {
                        if (a1[i].size !== a2[i].size) {
                            return false;
                        }
                        for (var el of a1[i]) {
                            if (!a2[i].has(el)) {
                                return false;
                            }
                        }
                        return true;
                    } else if (a1[i] instanceof Map && a2[i] instanceof Map) {
                        if (a1[i].size !== a2[i].size) {
                            return false;
                        }
                        for (var key of a1[i].keys()) {
                            if (a1[i][key] !== a2[i][key]) {
                                return false;
                            }
                        }
                        return true;
                    } else {
                        for (var el in a1[i]) {
                            if (a1[i][el] !== a2[i][el]) {
                                return false;
                            }
                        }
                        for (var el in a2[i]) {
                            if (a2[i][el] !== a1[i][el]) {
                                return false;
                            }
                        }
                        return true;
                    }
                } catch (e) {
                    throw new Error("Don't know how to compare a1[i] and a2[i].");
                }
            } else {
                throw new Error("Cannot compare a1[i] and a2[i].");
            }
        }
    }

    return true;
};

/*
 * Just to be syntactically consistent with htm.java,
 * might be specialized in the future ...
 */
var LoggerFactory = {
    getLogger: function() {
        return new Logger();
    }
};

var Logger = function() {
    this.trace = function(arg) {
        console.log(arg);
    };

    this.info = function(arg) {
        console.log(arg);
    }
	
    this.debug = function(arg) {
        console.log(arg);
    }	
};

/*
 * Returns an array of arbitrary dimensionality
 * Examples: var a = makeArray([10]);	// returns 1D-Array, 10 empty slots
 *           var a = makeArray([10], -1);	// returns 1D-Array, initialized to -1
 *           var a = makeArray([2, 3, 4, 5]);	// returns 2x3x4x5 Array
 */
var newArray = function(dims, init, arr) {

    if (dims[1] === undefined) {
        var a = new Array(dims[0]);
        if (init !== undefined) {
            a.fill(init);
        }
        return a;
    }

    arr = new Array(dims[0]);

    for (var i = 0; i < dims[0]; i++) {
        arr[i] = new Array(dims[1]);
        arr[i] = newArray(dims.slice(1), init, arr[i]);
    }

    return arr;
}

/*
 * To better mimic class Deque
 */
var LinkedBlockingDeque = function() {
    this.l = [];
};

LinkedBlockingDeque.prototype = {
    addFirst: function(el) {
        this.l.splice(0, 0, el);
    },

    addLast: function(el) {
        this.l.push(el);
    },

    removeFirst: function() {
        return this.l.shift();
    },

    removeLast: function() {
        return this.l.pop();
    },

    takeFirst: function() {
        return this.l.shift();
    },

    takeLast: function() {
        return this.l.pop();
    },

    peekFirst: function() {
        if (this.l.length === 0) {
            return null;
        }
        return this.l[0];
    },

    peekLast: function() {
        if (this.l.length === 0) {
            return null;
        }
        return this.l[this.length - 1];
    },

    clear: function() {
        this.l.length = 0;
        this.l = [];
    },

    iterator: function() {
        return this.l[Symbol.iterator]();
    },

    hashCode: function() {
        return HashCode.value(this);
    },

    toArray: function() {
        return this.l;
    },

    toString: function() {
        return this.l.toString();
    }
}

/**
 * Javascript HashCode v1.0.0
 * This function returns a hash code (MD5) based on the argument object.
 * http://pmav.eu/stuff/javascript-hash-code
 *
 * Example:
 *  var s = "my String";
 *  alert(HashCode.value(s));
 *
 * pmav, 2010
 */
var HashCode = function() {

    var serialize = function(object) {
        // Private
        var type, serializedCode = "";

        type = typeof object;

        if (type === 'object') {
            var element;

            if (object instanceof Set || object instanceof Map) {
                for (element of object) {
                    if (object[element]) {
                        serializedCode += "[" + type + ":" + element + serialize(object[element]) + "]";
                    } else {
                        serializedCode += "[" + type + ":" + element + serialize(element) + "]";
                    }
                }
            } else {
                for (element in object) {
                    serializedCode += "[" + type + ":" + element + serialize(object[element]) + "]";
                }
            }

        } else if (type === 'function') {
            serializedCode += "[" + type + ":" + object.toString() + "]";
        } else {
            serializedCode += "[" + type + ":" + object + "]";
        }

        return serializedCode.replace(/\s/g, "");
    };

    // Public, API
    return {
        value: function(object) {
            return MD5(serialize(object));
        }
    };
}();