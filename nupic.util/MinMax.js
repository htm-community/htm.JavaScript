/**
 * Holds two values, a min and a max. Can later be developed to
 * employ operations on those values (i.e. distance etc.)
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
var MinMax = function() {

    var that = this;

    /**
     * Constructs a new {@code MinMax} instance
     */
    var MinMax_void = function() {}; // MinMax(void)

    /**
     * Constructs a new {@code MinMax} instance
     * 
     * @param min	the minimum or lower bound
     * @param max	the maximum or upper bound
     */
    var MinMax_non_void = function(min, max) { // MinMax(double, double)
        this.min = min;
        this.max = max;
    };

    if (arguments.length === 0) {
        MinMax_void();
    } else {
        MinMax_non_void(arguments[0], arguments[1]);
    }
};

MinMax.prototype = {
    /**
     * Returns the configured min value
     */
    min: function() { // double(void)
        return this.min;
    },

    /**
     * Returns the configured max value
     */
    max: function() { // double(void)
        return this.max;
    },

    toString: function() { // String(void)
        return min + ", " + max;
    }
}