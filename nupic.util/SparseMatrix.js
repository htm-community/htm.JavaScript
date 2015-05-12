/**
 * Allows storage of array data in sparse form, meaning that the indexes
 * of the data stored are maintained while empty indexes are not. This allows
 * savings in memory and computational efficiency because iterative algorithms
 * need only query indexes containing valid data. The dimensions of matrix defined
 * at construction time and immutable - matrix fixed size data structure.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 * @param <T>
 */
/**
 * Constructs a new {@code SparseMatrix} object to be configured with specified
 * dimensions and major ordering.
 * 
 * @param dimensions				the dimensions of this sparse array	
 * @param useColumnMajorOrdering	flag indicating whether to use column ordering or
 * 									row major ordering. if false (the default), then row
 * 									major ordering will be used. If true, then column major
 * 									ordering will be used.
 */
var SparseMatrix = function(dimensions, useColumnMajorOrdering) {

    dimensions = dimensions || [];
    useColumnMajorOrdering = useColumnMajorOrdering || false;

    this.dimensions = dimensions;
    this.numDimensions = dimensions.length;
    this.dimensionMultiples = this.initDimensionMultiples(
        useColumnMajorOrdering ? this.reverse(dimensions) : dimensions);
    this.isColumnMajor = useColumnMajorOrdering;
};

SparseMatrix.prototype = {
    /**
     * Returns the utility array which holds the multiples used
     * to calculate indexes.
     * 
     * @return  the utility multiples array.
     */
    getDimensionMultiples: function() { // int[](void)
        return this.dimensionMultiples;
    },

    /**
     * Returns the array describing the dimensionality of the configured array.
     * @return  the array describing the dimensionality of the configured array.
     */
    getDimensions: function() { // int[](void)
        return this.dimensions;
    },

    /**
     * Returns the configured number of dimensions.
     * 
     * @return  the configured number of dimensions.
     */
    getNumDimensions: function() { // int(void)
        return this.numDimensions;
    },

    /**
     * Returns an array of all the flat indexes that can be 
     * computed from the current configuration.
     * @return
     */
    get1DIndexes: function() { // int[](void)
        // Alternative begin (To change remove/add "//")
        //var results = newArray([this.getMaxIndex() + 1], 0);
        var results = [];
        // Alternative end
        this.visit(this.dimensions, 0, new Array(this.numDimensions), results);
        return results;
    },

    /**
     * Recursively loops through the matrix dimensions to fill the results
     * array with flattened computed array indexes.
     * 
     * @param bounds
     * @param currentDimension
     * @param p
     * @param results
     */
    visit: function(bounds, currentDimension, p, results) { // void(int[], int, int[], TIntList)
        for (var i = 0; i < bounds[currentDimension]; i++) {
            p[currentDimension] = i;
            if (currentDimension === p.length - 1) {
                results.push(this.computeIndex(p));
            } else {
                this.visit(bounds, currentDimension + 1, p, results);
            }
        }
    },

    /**
     * Returns the maximum accessible flat index.
     * @return  the maximum accessible flat index.
     */
    getMaxIndex: function() { // int(void)
        return this.dimensions[0] * Math.max(1, this.dimensionMultiples[0]) - 1;
    },

    /**
     * Uses the specified {@link TypeFactory} to return an array
     * filled with the specified object type, according this {@code SparseMatrix}'s 
     * configured dimensions
     * 
     * @param factory   a factory to make a specific type
     * @return  the dense array
     */
    asDense: function(factory) { // T[](TypeFactory<T>)
        var retVal = fill(factory, 0, this.dimensions, this.dimensions[0], []);
        return retVal;
    },

    /**
     * Uses reflection to create and fill a dynamically created multidimensional array.
     * 
     * @param f                 the {@link TypeFactory}
     * @param dimensionIndex    the current index into <em>this class's</em> configured dimensions array
     *                          <em>*NOT*</em> the dimensions used as this method's argument    
     * @param dimensions        the array specifying remaining dimensions to create
     * @param count             the current dimensional size
     * @param arr               the array to fill
     * @return a dynamically created multidimensional array
     */
    fill: function(f, dimensionIndex, dimensions, count, arr) { // Object[](TypeFactory<T>, int, int[], int, Object[])		
        if (dimensions[dimensionIndex + 1] === undefined) {
            return arr;
        }

        arr = new Array(dimensions[dimensionIndex]);

        for (var i = 0; i < dimensions[dimensionIndex]; i++) {
            arr[i] = new Array(dimensions[dimensionIndex + 1]);
            arr[i] = fill(f, dimensionIndex + 1, dimensions, count, arr[i]);
        }

        return arr;
    },

    /**
     * Utility method to shrink a single dimension array by one index.
     * @param array the array to shrink
     * @return
     */
    copyInnerArray: function(array) { // int[](int[])
        if (array.length === 1) {
            return array;
        }

        var retVal = new Array(array.length - 1);
        retVal = array.slice(1);
        return retVal;
    },

    /**
     * Reverses the specified array.
     * @param input
     * @return
     */
    reverse: function(input) { // int[](int[])
        var retVal = newArray([input.length], 0);
        for (var i = input.length - 1, j = 0; i >= 0; i--, j++) {
            retVal[j] = input[i];
        }
        return retVal;
    },

    /**
     * Initializes internal helper array which is used for multidimensional
     * index computation.
     * 
     * @param dimensions
     * @return
     */
    initDimensionMultiples: function(dimensions) { // int[](int[])
        var holder = 1;
        var len = dimensions.length;
        var dimensionMultiples = newArray([this.numDimensions], 0);
        for (var i = 0; i < len; i++) {
            holder *= (i === 0 ? 1 : dimensions[len - i]);
            dimensionMultiples[len - 1 - i] = holder;
        }
        return dimensionMultiples;
    },

    computeIndex: function() {

        var that = this;

        /**
         * Assumes row-major ordering. For a 3 dimensional array, the
         * indexing expected is [depth, height, width] or [slice, row, column].
         * 
         * @param coordinates
         * @return
         */
        var computeIndex1 = function(coordinates) { // int(int[])
            return computeIndex2(coordinates, true);
        };

        /**
         * Assumes row-major ordering. For a 3 dimensional array, the
         * indexing expected is [depth, height, width] or [slice, row, column].
         * 
         * @param coordinates
         * @param doCheck           won't validate bounds if false
         * @return
         */
        var computeIndex2 = function(coordinates, doCheck) { // int(int[], boolean)
            if (doCheck) {
                that.checkDims(coordinates);
            }

            var localMults = that.isColumnMajor ? reverse(that.dimensionMultiples) : that.dimensionMultiples;
            var base = 0;
            for (var i = 0; i < coordinates.length; i++) {
                base += (localMults[i] * coordinates[i]);
            }
            return base;
        };

        if (arguments.length === 1) {
            return computeIndex1(arguments[0]);
        } else if (arguments.length === 2) {
            return computeIndex2(arguments[0], arguments[1]);
        } else {
            throw new Error("No method found for this call to computeIndex.");
        }
    },

    /**
     * Returns an integer array representing the coordinates of the specified index
     * in terms of the configuration of this {@code SparseMatrix}.
     * 
     * @param index     the flat index to be returned as coordinates
     * @return
     */
    computeCoordinates: function(index) { // int[](int)
        var returnVal = newArray([this.numDimensions], 0);
        var base = index;
        for (var i = 0; i < this.dimensionMultiples.length; i++) {
            var quotient = Math.floor(base / this.dimensionMultiples[i]);
            base %= this.dimensionMultiples[i];
            returnVal[i] = quotient;
        }
        return this.isColumnMajor ? reverse(returnVal) : returnVal;
    },

    /**
     * Checks the indexes specified to see whether they are within the
     * configured bounds and size parameters of this array configuration.
     * 
     * @param index the array dimensions to check
     */
    checkDims: function(index) { // void(int[])
        if (index.length != this.numDimensions) {
            throw new Error("Specified coordinates exceed the configured array dimensions " +
                "input dimensions: " + index.length + " > number of configured dimensions: " + this.numDimensions);
        }
        for (var i = 0; i < index.length - 1; i++) {
            if (index[i] >= this.dimensions[i]) {
                throw new Error("Specified coordinates exceed the configured array dimensions " +
                    print1DArray(index) + " > " + print1DArray(dimensions));
            }
        }
    },

    /**
     * Prints the specified array to a returned String.
     * 
     * @param aObject   the array object to print.
     * @return  the array in string form suitable for display.
     */
    print1DArray: function(aObject) { // String(Object)
        if (Array.isArray(aObject)) {
            return aObject.toString();
        }
        return "[]";
    }
};