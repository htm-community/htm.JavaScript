/**
 * 
 */
var SparseBinaryMatrix = function(dimensions, useColumnMajorOrdering) {
	SparseMatrix.call(this, dimensions, useColumnMajorOrdering);
	
	this.sparseMap = new Map();

	var rows, cols;	
	if (useColumnMajorOrdering) {
		rows = dimensions[1];
		cols = dimensions[0];
	} else {
		rows = dimensions[0];
		cols = dimensions[1];
	}	
	
	this.backingArray = newArray([rows, cols], 0);
    this.trueCounts = newArray([dimensions[0]], 0);
};

SparseBinaryMatrix.prototype = Object.create(SparseMatrix.prototype);
SparseBinaryMatrix.prototype.constructor = SparseBinaryMatrix;

/**
 * Called during mutation operations to simultaneously set the value
 * on the backing array dynamically.
 * @param val
 * @param coordinates
 */
SparseBinaryMatrix.prototype.back = function(val, coordinates) {	// void(int, int...)
	ArrayUtils.setValue(this.backingArray, val, coordinates);
    //update true counts
    this.trueCounts[coordinates[0]] = ArrayUtils.aggregateArray(this.backingArray[coordinates[0]]);
};

/**
 * Returns the slice specified by the passed in coordinates.
 * The array is returned as an object, therefore it is the caller's
 * responsibility to cast the array to the appropriate dimensions.
 * 
 * @param coordinates	the coordinates which specify the returned array
 * @return	the array specified
 * @throws	IllegalArgumentException if the specified coordinates address
 * 			an actual value instead of the array holding it.
 */
SparseBinaryMatrix.prototype.getSlice = function(coordinates) {	// Object(int...)
	var slice = this.backingArray;
	
	if (Array.isArray(coordinates)) {
		for(var i=0; i<coordinates.length; i++) {
			var s = slice[coordinates[i]];
			slice = Array.isArray(s) ? s : s;
		}
	} else {
		var s = slice[coordinates];
		slice = Array.isArray(s) ? s : s;
	}
	
	//Ensure return value is of type Array
	if (!Array.isArray(slice)) {
		throw new Error("This method only returns the array holding the specified index: " + 
				coordinates.toString());
	}
	
	return slice;
};

/**
 * Fills the specified results array with the result of the 
 * matrix vector multiplication.
 * 
 * @param inputVector		the right side vector
 * @param results			the results array
 */
SparseBinaryMatrix.prototype.rightVecSumAtNZ = function(inputVector, results) {	// void(int[], int[])
	for (var i=0; i<this.dimensions[0]; i++) {
		var slice = (this.dimensions.length > 1 ? this.getSlice(i) : this.backingArray);
		for (var j=0; j<slice.length; j++) {
			results[i] += (inputVector[j] * slice[j]);
		}
	}
};

SparseBinaryMatrix.prototype.set = function() {
	
	var that = this;

	/**
	 * Sets the value at the specified index.
	 * 
	 * @param index     the index the object will occupy
	 * @param object    the object to be indexed.
	 */
	var set1 = function(index, value) {	// SparseBinaryMatrix(int, int)
		var coordinates = that.computeCoordinates(index);
	    return set2(value, coordinates);
	};
	
	/**
	 * Sets the value to be indexed at the index
	 * computed from the specified coordinates.
	 * @param coordinates   the row major coordinates [outer --> ,...,..., inner]
	 * @param object        the object to be indexed.
	 */
	var set2 = function(value, coordinates) {	// SparseBinaryMatrix(int, int...)
	    that.sparseMap.set(that.computeIndex(coordinates), value);
	    that.back(value, coordinates);
	    return that;
	};
	
	/**
	 * Sets the specified values at the specified indexes.
	 * 
	 * @param indexes   indexes of the values to be set
	 * @param values    the values to be indexed.
	 * 
	 * @return this {@code SparseMatrix} implementation
	 */
	var set3 = function(indexes, values) {	// SparseBinaryMatrix(int[], int[])
	    for (var i=0; i<indexes.length; i++) {
	        set1(indexes[i], values[i]);
	    }
	    return that;
	};
	
	/**
	 * Sets the specified values at the specified indexes.
	 * 
	 * @param indexes   indexes of the values to be set
	 * @param values    the values to be indexed.
	 * 
	 * @return this {@code SparseMatrix} implementation
	 */
	var set4 = function(indexes, values, isTest) {	// SparseBinaryMatrix(int[], int[], boolean) 
	    for (var i=0; i<indexes.length; i++) {
	    	if (isTest) {
	    		that.setForTest(indexes[i], values[i]);
	    	} else {
	    		set1(indexes[i], values[i]);
	    	}
	    }
	    return that;
	};
	
	if (arguments.length === 2 && !Array.isArray(arguments[0]) && !Array.isArray(arguments[1])) {
		return set1(arguments[0], arguments[1]);
	} else if (arguments.length === 2 && !Array.isArray(arguments[0]) && Array.isArray(arguments[1])) {
		return set2(arguments[0], arguments[1]);
	} else if (arguments.length === 2 && Array.isArray(arguments[0]) && Array.isArray(arguments[1])) {
		return set3(arguments[0], arguments[1]);
	} else if (arguments.length === 3 && Array.isArray(arguments[0] && Array.isArray(arguments[1]))) {
		return set4(arguments[0], arguments[1], arguments[2]);
	} else if (arguments.length === 3 && !Array.isArray(arguments[0] && !Array.isArray(arguments[1]) && !Array.isArray(arguments[2]))) {
		return set2(arguments[0], [arguments[1], arguments[2]]);
	}
};

/**
 * Sets the value at the specified index skipping the automatic
 * truth statistic tallying of the real method.
 * 
 * @param index     the index the object will occupy
 * @param object    the object to be indexed.
 */
SparseBinaryMatrix.prototype.setForTest = function(index, value) {	// SparseBinaryMatrix(int, int)
    this.sparseMap.set(index, value);         
    return this;
};

/**
 * Returns the count of 1's set on the specified row.
 * @param index
 * @return
 */
SparseBinaryMatrix.prototype.getTrueCount = function(index) {	// int(int)
	return this.trueCounts[index];
};

/**
 * Sets the count of 1's on the specified row.
 * @param index
 * @param count
 */
SparseBinaryMatrix.prototype.setTrueCount = function(index, count) {	// void(int, int)
	this.trueCounts[index] = count;
};

/**
 * Get the true counts for all outer indexes.
 * @return
 */
SparseBinaryMatrix.prototype.getTrueCounts = function() {	// int[](void)
	return this.trueCounts;
};

/**
 * Clears the true counts prior to a cycle where they're
 * being set
 */
SparseBinaryMatrix.prototype.clearStatistics = function(row) {	// void(int)
	var slice = this.backingArray[row];
	slice.fill(0);
	this.trueCounts[row] = 0;
	this.sparseMap.set(row, 0);
};

/**
 * Returns an outer array of T values.
 * @return
 */
SparseBinaryMatrix.prototype.values = function() {	// int[](void)
	return Array.from(this.sparseMap.values());
};

SparseBinaryMatrix.prototype.getIntValue = function() {

	var that = this;
	
	/**
	 * Returns the int value at the index computed from the specified coordinates
	 * @param coordinates   the coordinates from which to retrieve the indexed object
	 * @return  the indexed object
	 */
	var getIntValueByVector = function(coordinates) {	// int(int...)
		return that.sparseMap.get(that.computeIndex(coordinates));
	};
	
	/**
	 * Returns the T at the specified index.
	 * 
	 * @param index     the index of the T to return
	 * @return  the T at the specified index.
	 */
	var getIntValueByScalar = function(index) {	// int(int)
	    return that.sparseMap.get(index);
	};
	
	if (Array.isArray(arguments[0])) {
		return getIntValueByVector(arguments[0])
	} else {
		return getIntValueByScalar(arguments[0]);
	}
};

/**
 * Returns a sorted array of occupied indexes.
 * @return  a sorted array of occupied indexes.
 */
SparseBinaryMatrix.prototype.getSparseIndices = function() {	// int[](void)
    return this.reverse(Array.from(this.sparseMap.keys()));
};

SparseBinaryMatrix.prototype.or = function() {
	
	var that = this;
	
	/**
	 * This {@code SparseBinaryMatrix} will contain the operation of or-ing
	 * the inputMatrix with the contents of this matrix; returning this matrix
	 * as the result.
	 * 
	 * @param inputMatrix   the matrix containing the "on" bits to or
	 * @return  this matrix
	 */
	var orByMatrix = function(inputMatrix) {	// SparseBinaryMatrix(SparseBinaryMatrix)
	    var mask = inputMatrix.getSparseIndices();
	    var ones = newArray([mask.length], 1);
	    return that.set(mask, ones);
	};
	
	/**
	 * This {@code SparseBinaryMatrix} will contain the operation of or-ing
	 * the sparse list with the contents of this matrix; returning this matrix
	 * as the result.
	 * 
	 * @param onBitIndexes  the matrix containing the "on" bits to or
	 * @return  this matrix
	 */
	var orByVector = function(onBitIndexes) {	// SparseBinaryMatrix(TIntCollection) or SparseBinaryMatrix(int[])
	    var ones = newArray([onBitIndexes.length], 1);
	    return that.set(onBitIndexes, ones);
	}
	
	if (arguments[0] instanceof SparseBinaryMatrix) {
		return orByMatrix(arguments[0]);
	} else if (arguments[0] instanceof Array) {
		return orByVector(arguments[0]);
	} else {
		throw new Error("No matching method found for this call to or.");
	}
};

SparseBinaryMatrix.prototype.all = function() {

	var that = this;
	
	/**
	 * Returns true if the on bits of the specified matrix are
	 * matched by the on bits of this matrix. It is allowed that 
	 * this matrix have more on bits than the specified matrix.
	 * 
	 * @param matrix
	 * @return
	 */
	var allByMatrix = function(matrix) {	// boolean(SparseBinaryMatrix)
		var keySet = new Set(that.sparseMap.keys());
		var matrixKeySet = new Set(matrix.sparseMap.keys());
	    
	    for (var key in matrixKeySet) {
	    	if (!keySet.has(key)) {
	    		return false;
	    	}
	    	return true;
	    }
	};
	
	/**
	 * Returns true if the on bits of the specified list are
	 * matched by the on bits of this matrix. It is allowed that 
	 * this matrix have more on bits than the specified matrix.
	 * 
	 * @param matrix
	 * @return
	 */
	var allByVector = function(onBits) {	// boolean(TIntCollection) of boolean(int[])
		var keySet = new Set(that.sparseMap.keys());

		for (var i=0; i<onBits.length; i++){
			if (!keySet.has(onBits[i])) {
				return false;
			}
		}
		return true;
	};

	if (arguments[0] instanceof SparseBinaryMatrix) {
		return allByMatrix(arguments[0]);
	} else if (arguments[0] instanceof Array) {
		return allByVector(arguments[0]);
	} else {
		throw new Error("No matching method found for this call to all.");
	}
};

SparseBinaryMatrix.prototype.any = function() {

	var that = this;
	
	/**
	 * Returns true if any of the on bits of the specified matrix are
	 * matched by the on bits of this matrix. It is allowed that 
	 * this matrix have more on bits than the specified matrix.
	 * 
	 * @param matrix
	 * @return
	 */
	var anyByMatrix = function(matrix) {	// boolean(SparseBinaryMatrix)
		var matrixKeySet = new Set(matrix.sparseMap.keys());

		for (var key in matrixKeySet) {
	        if(that.sparseMap.has(key)) {
	        	return true;
	        }
	    }
	    return false;
	};
	
	/**
	 * Returns true if any of the on bit indexes of the specified matrix are
	 * matched by the on bits of this matrix. It is allowed that 
	 * this matrix have more on bits than the specified matrix.
	 * 
	 * @param matrix
	 * @return
	 */
	var anyByVector = function(onBits) {	// boolean(TIntCollection) of boolean(int[])
	    for (var i=0; i<onBits.length; i++) {
	        if (that.sparseMap.has(onBits[i])) {
	        	return true;
	        }
	    }
	    return false;
	};

	if (arguments[0] instanceof SparseBinaryMatrix) {
		return anyByMatrix(arguments[0]);
	} else if (arguments[0] instanceof Array) {
		return anyByVector(arguments[0]);
	} else {
		throw new Error("No matching method found for this call to any.");
	}
};
