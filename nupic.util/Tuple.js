/**
 * An immutable fixed data structure whose values are retrieved
 * via a given index. This data structure emulates multiple method
 * return values possible in Python.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
/**
 * Instantiates a new {@code Tuple}
 * @param objects
 */
var Tuple = function() { // Tuple(Object...)
    /** The internal container array */
    this.container = newArray([arguments.length]);

    for (var i = 0; i < arguments.length; i++) {
        this.container[i] = arguments[i];
    }
};

Tuple.prototype = {
    /**
     * Returns the object previously inserted into the
     * specified index.
     * 
     * @param index    the index representing the insertion order.
     * @return
     */
    get: function(index) { // Object(int) {
        return this.container[index];
    },

    /**
     * {@inheritDoc}
     */
    toString: function() { // String(void) {
        var str = "[\n";
        for (var i = 0; i < this.container.length; i++) {
            str += "\t{";
            for (var key in this.container[i]) {
                str += key.toString() + ": " + this.container[i][key].toString() + ", ";
            }
            str = str.substr(0, str.length - 2);
            if (i < this.container.length - 1) {
                str += "},\n";
            } else {
                str += "}\n";
            }
        }
        return str + "]";
    },

    /**
     * {@inheritDoc}
     */
    hashCode: function() { // int(void)
        var prime = 31;
        var result = 1;
        result = prime * result + HashCode.value(this.container);
        return result;
    },

    /**
     * {@inheritDoc}
     */
    equals: function(obj) { // boolean(Object)
        if (this === obj)
            return true;
        if (obj === null)
            return false;
        if (typeof this !== typeof obj)
            return false;
        var other = obj;
        if (!equals(this.container, other.container))
            return false;
        return true;
    }
}