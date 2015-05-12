/**
 * Allows storage of array data in sparse form, meaning that the indexes
 * of the data stored are maintained while empty indexes are not. This allows
 * savings in memory and computational efficiency because iterative algorithms
 * need only query indexes containing valid data.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 * @param <T>
 */
/**
 * Constructs a new {@code SparseObjectMatrix}
 * @param dimensions					the dimensions of this array
 * @param useColumnMajorOrdering		where inner index increments most frequently
 */
var SparseObjectMatrix = function(dimensions, useColumnMajorOrdering) {
    SparseMatrix.call(this, dimensions, useColumnMajorOrdering);

    this.sparseMap = new Map();
};

SparseObjectMatrix.prototype = Object.create(SparseMatrix.prototype);
SparseObjectMatrix.prototype.constructor = SparseObjectMatrix;

SparseObjectMatrix.prototype.set = function() {

    var that = this;

    /**
     * Sets the object to occupy the specified index.
     * 
     * @param index     the index the object will occupy
     * @param object    the object to be indexed.
     */
    var setScalar = function(index, object) { // <S extends SparseMatrix<T>> S(int, T)
        that.sparseMap.set(index, object);
        return that;
    };

    /**
     * Sets the specified object to be indexed at the index
     * computed from the specified coordinates.
     * @param object        the object to be indexed.
     * @param coordinates   the row major coordinates [outer --> ,...,..., inner]
     */
    var setVector = function(coordinates, object) { // S(int[], T)
        setScalar(that.computeIndex(coordinates), object);
        return that;
    };

    if (Array.isArray(arguments[0])) {
        return setVector(arguments[0], arguments[1]);
    } else {
        return setScalar(arguments[0], arguments[1]);
    }
};

/**
 * Returns an outer array of T values.
 * @return
 */
SparseObjectMatrix.prototype.values = function() { // T[](void)
    return Array.from(this.sparseMap.values());
};

/**
 * Returns the T at the specified index.
 * 
 * @param index     the index of the T to return
 * @return  the T at the specified index.
 */
SparseObjectMatrix.prototype.getObject = function(index) { // T(int)
    return this.sparseMap.get(index);
};

/**
 * Returns the T at the index computed from the specified coordinates
 * @param coordinates   the coordinates from which to retrieve the indexed object
 * @return  the indexed object
 */
SparseObjectMatrix.prototype.get = function(coordinates) { // T(int...)
    return this.sparseMap.get(this.computeIndex(coordinates));
};

/**
 * Returns a sorted array of occupied indexes.
 * @return  a sorted array of occupied indexes.
 */
SparseObjectMatrix.prototype.getSparseIndices = function() { // int[](void)
    return this.reverse(Array.from(this.sparseMap.keys()));
};

/**
 * {@inheritDoc}
 */
SparseObjectMatrix.prototype.toString = function() { // String(void)
    return this.dimensions.toString();
};