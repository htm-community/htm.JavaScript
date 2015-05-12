function isNullOrUndefined(o) {
    if (o === null || o === undefined || typeof o === undefined) {
        return true;
    }
    return false;
}

/*
 * Replace characters from position index in str by s
 */
function replaceAt(str, index, s) {
    return str.substr(0, index) + s + str.substr(index + s.length);
}

/*
 * Deep copies array org to cpy
 */
var copyOf = function(org) {
    var cpy = [];

    for (var i = 0; i < org.length; i++) {
        cpy[i] = org[i];
    }

    return cpy;
}

/*
 * Compares arbitrary arrays
 */
function equals(a1, a2) {

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
        } else {
            if (typeof a1[i] === "number" || typeof a1[i] === "string") {
                if (a1[i] !== a2[i]) {
                    return false;
                }
            } else if (typeof a1[i] === "object") {
                for (var key in a1[i]) {
                    if (a1[i][key] !== a2[i][key]) {
                        return false;
                    }
                }
            } else {
                throw new Error("Cannot compare a1[i] and a2[i].");
            }
        }
    }

    return true;
}

/*
 * Returns an array of arbitrary dimensionality
 * Examples: var a = makeArray([10]);	// returns 1D-Array, 10 empty slots
 *           var a = makeArray([10], -1);	// returns 1D-Array, initialized to -1
 *           var a = makeArray([2, 3, 4, 5]);	// returns 2x3x4x5 Array
 */
function newArray(dims, init, arr) {

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

            for (element in object) {
                serializedCode += "[" + type + ":" + element + serialize(object[element]) + "]";
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