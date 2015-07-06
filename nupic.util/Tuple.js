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
function Tuple(...objects) { // Tuple(Object...)	// This form instead of "var Tuple = function(..." ensures that this.constructor property remains unique
    /** The internal container array */
    this.container = newArray([objects.length]);

    this.hashCode = this._hashCode();

    for (var i = 0; i < objects.length; i++) {
        this.container[i] = objects[i];
    }
};

/**
 * Returns the object previously inserted into the
 * specified index.
 * 
 * @param index    the index representing the insertion order.
 * @return
 */
Tuple.prototype.get = function(index) { // Object(int) {
    return this.container[index];
};

/**
 * {@inheritDoc}
 */
Tuple.prototype.toString = function() { // String(void) {
    var str = "[\n";
    for (var i = 0; i < this.container.length; i++) {
        str += "\t{";
        if (this.container[i] instanceof Set) {
            var index = 0;
            for (var key of this.container[i]) {
                str += index.toString() + ": " + key.toString() + ", ";
                index++;
            }
        } else if (this.container[i] instanceof Map) {
            for (var key of this.container[i].keys()) {
                str += key.toString() + ": " + this.container[i].get(key).toString() + ", ";
            }
        } else if (this.container[i] instanceof Array) {
            for (var j = 0; j < this.container[i].length; j++) {
                str += j.toString() + ": " + this.container[i][j].toString() + ", ";
            }
        } else {
            for (var key in this.container[i]) {
                str += key.toString() + ": " + this.container[i][key].toString() + ", ";
            }
        }
        str = str.substr(0, str.length - 2);
        if (i < this.container.length - 1) {
            str += "},\n";
        } else {
            str += "}\n";
        }
    }
    return str + "]";
};

/**
 * {@inheritDoc}
 */
Tuple.prototype._hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + HashCode.value(this.container);
    return result;
};

/**
 * {@inheritDoc}
 */
Tuple.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj)
        return true;
    if (obj === null)
        return false;
    if (this.constructor !== obj.constructor)
        return false;
    var other = obj;
    if (this.hashCode !== other.hashCode)
        return false;
    return true;
};