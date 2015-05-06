/**
 * Utilities to match some of the functionality found in Python's Numpy.
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
var ArrayUtils = {
    /** Empty array constant */
    EMPTY_ARRAY: [],
	
    WHERE_1: function(i) {
        return i == 1;
    },

    GREATER_THAN_0: function(i) {
		return i > 0;
	},
	
    INT_GREATER_THAN_0: function(i) {
        return i > 0;
    },
	
    GREATER_OR_EQUAL_0: function(n) {
        return n >= 0;
    },	

    /**
     * Returns an array containing the successive elements of each
     * argument array as in [ first[0], second[0], first[1], second[1], ... ].
     * 
     * Arrays may be of zero length, and may be of different sizes, but may not be null.
     * 
     * @param first     the first array
     * @param second    the second array
     * @return
     */
    interleave: function(first, second) {	// <F, S> Object[](F, S)
        var flen = first.length, slen = second.length;
        var retVal = newArray([flen + slen], 0);
        
        for (var i=0, j=0, k=0; i<flen || j<slen;) {
            if (i < flen) {
                retVal[k++] = first[i++];
            }
            if (j < slen) {
                retVal[k++] = second[j++];
            }
        }
        
        return retVal;
    },
    
    /**
     * Return a new double[] containing the difference of each element and its
     * succeding element.
     * <p/>
     * The first order difference is given by ``out[n] = a[n+1] - a[n]``
     * along the given axis, higher order differences are calculated by using `diff`
     * recursively.
     *
     * @param d
     * @return
     */
    diff: function(d) {	// double[](double[])
        var retVal = newArray([d.length - 1], 0);
        for (var i=0; i<d.length-1; i++) {
            retVal[i] = d[i+1] - d[i];
        }

        return retVal;
    },

    /**
     * Returns a flag indicating whether the container list contains an
     * array which matches the specified match array.
     *
     * @param match     the array to match
     * @param container the list of arrays to test
     * @return true if so, false if not
     */
    contains: function(match, container) {	// boolean(int[], List<int[]>)
        var len = container.length;
        
        for (var i=0; i<len; i++) {
            if (equals(match, container[i])) {
                return true;
            }
        }
        return false;
    },
    
    /**
     * Returns a new array of size first.length + second.length, with the
     * contents of the first array loaded into the returned array starting
     * at the zero'th index, and the contents of the second array appended
     * to the returned array beginning with index first.length.
     * 
     * This method is fail fast, meaning that it depends on the two arrays
     * being non-null, and if not, an exception is thrown.
     *  
     * @param first     the data to load starting at index 0
     * @param second    the data to load starting at index first.length;
     * @return  a concatenated array
     * @throws NullPointerException if either first or second is null
     */
    concat: function(first, second) {	// double[](double[], double[])
		var flen = first.length, slen = second.length;
		var retVal = copyOf(first);
      
        for (var i=flen, j=0; i<flen+slen; i++, j++) {
            retVal[i] = second[j];
        }
        return retVal;
    },

    fromCoordinate: function() {
	   	/**
	     * Utility to compute a flat index from coordinates.
	     *
	     * @param coordinates an array of integer coordinates
	     * @return a flat index
	     */
	    var fromCoordinateWithShape = function(coordinates, shape) {	// int(int[], int[])
	        var localMults = ArrayUtils.initDimensionMultiples(shape);
	        var base = 0;
	        for (var i=0; i<coordinates.length; i++) {
	            base += (localMults[i] * coordinates[i]);
	        }
	        return base;
	    };
	
	    /**
	     * Utility to compute a flat index from coordinates.
	     *
	     * @param coordinates an array of integer coordinates
	     * @return a flat index
	     */
	    var fromCoordinateWithoutShape = function(coordinates) {	// int(int[])
	        var localMults = ArrayUtils.initDimensionMultiples(coordinates);
	        var base = 0;
	        for (var i=0; i<coordinates.length; i++) {
	            base += (localMults[i] * coordinates[i]);
	        }
	        return base;
	    };
	    
	    if (arguments.length === 1) {
	    	return fromCoordinateWithoutShape(arguments[0]);
	    } else if (arguments.length === 2) {
	    	return fromCoordinateWithShape(arguments[0], arguments[1]);
	    } else {
	    	throw new Error("No method found for this call to fromCoordinate");
	    }
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
        var dimensionMultiples = newArray([dimensions.length], 0);
        for (var i=0; i<len; i++) {
            holder *= (i === 0 ? 1 : dimensions[len-i]);
            dimensionMultiples[len-1-i] = holder;
        }
        return dimensionMultiples;
    },

    /**
     * Returns a string representing an array of 0's and 1's
     *
     * @param arr an binary array (0's and 1's only)
     * @return
     */
    bitsToString: function(arr) {	// String(int[])
        s = newArray([arr.length], ".");
        s[0] = "c";
        for (var i=0; i<arr.length; i++) {
            if (arr[i] === 1) {
                s[i+1] = "*";
            }
        }
        return s.toString();
    },

    zip: function() {

    	/**
	     * Return a list of tuples, where each tuple contains the i-th element
	     * from each of the argument sequences.  The returned list is
	     * truncated in length to the length of the shortest argument sequence.
	     *
	     * @param arg1 the first list to be the zero'th entry in the returned tuple
	     * @param arg2 the first list to be the one'th entry in the returned tuple
	     * @return a list of tuples
	     */
	    var zip2 = function(arg1, arg2) {	// List<Tuple>(List<?>, List<?>)
	        var tuples = [];
	        var len = Math.min(arg1.length, arg2.length);
	        for (var i=0; i<len; i++) {
	            tuples.push([arg1[i], arg2[i]]);
	        }
	
	        return tuples;
	    };
	    
	    /**
	     * Return a list of tuples, where each tuple contains the i-th element
	     * from each of the argument sequences.  The returned list is
	     * truncated in length to the length of the shortest argument sequence.
	     *
	     * @param arg1 the first list to be the zero'th entry in the returned tuple
	     * @param arg2 the first list to be the one'th entry in the returned tuple
	     * @return a list of tuples
	     */
	    var zip1 = function(args) {	// List<Tuple>(Object[]...)
	        var tuples = [];
	        var len = args.length;
	        for (var i=0; i<len; i++) {
	            tuples.push(args[i]);
	        }
	
	        return tuples;
	    };
	    
	    if (arguments.length === 1) {	    	
	    	return zip1(arguments[0]);	    	
	    } else if (arguments.length === 2) {	    	
	    	return zip2(arguments[0], arguments[1]);	    
	    } else {
	    	throw new Error("No method found for this call to zip.");
	    }
    },

    /**
     * Returns an array with the same shape and the contents
     * converted to doubles.
     *
     * @param ints an array of ints.
     * @return
     */
    toDoubleArray: function(ints) {	// double[](int[])
        var retVal = newArray([ints.length], 0);
        for (var i=0; i<ints.length; i++) {
            retVal[i] = ints[i];
        }
        return retVal;
    },

    modulo: function() {

    	/**
	     * Performs a modulus operation in Python style.
	     *
	     * @param a
	     * @param b
	     * @return
	     */
	    var moduloScalar = function(a, b) {	// int(int, int)
	        if (b == 0) {
	        	throw new Error("Division by Zero!");
	        }
	        if (a > 0 && b > 0 && b > a) {
	        	return a;
	        }
	        var isMinus = Math.abs(b - (a - b)) < Math.abs(b - (a + b));
	        if (isMinus) {
	            while (a >= b) {
	                a -= b;
	            }
	        } else {
	            if (a % b == 0) return 0;
	
	            while (a + b < b) {
	                a += b;
	            }
	        }
	        return a;
	    };
	
	    /**
	     * Performs a modulus on every index of the first argument using
	     * the second argument and places the result in the same index of
	     * the first argument.
	     *
	     * @param a
	     * @param b
	     * @return
	     */
	    var moduloVector = function(a, b) {	// int[](int[], int)
	        for (var i=0; i<a.length; i++) {
	            a[i] = moduloScalar(a[i], b);
	        }
	        return a;
	    };
	    
	    if (Array.isArray(arguments[0])) {	    	
	    	return moduloVector(arguments[0], arguments[1]);	    
	    } else {	    
	    	return moduloScalar(arguments[0], arguments[1]);	    
	    }	    
    },

    /**
     * Returns an array with the same shape and the contents
     * converted to integers.
     *
     * @param doubs an array of doubles.
     * @return
     */
    toIntArray: function(doubs) {	// int[](double[])
        var retVal = newArray([doubs.length], 0);
        for (var i=0; i<doubs.length; i++) {
            retVal[i] = Math.floor(doubs[i]);
        }
        return retVal;
    },

    /**
     * Returns a double array whose values are the maximum of the value
     * in the array and the max value argument.
     * @param doubs
     * @param maxValue
     * @return
     */
    maximum: function(doubs, maxValue) {	// double[](double[], double)
        var retVal = newArray([doubs.length], 0);
        for (var i=0; i<doubs.length; i++) {
            retVal[i] = Math.max(doubs[i], maxValue);
        }
        return retVal;
    },

    /**
     * Returns an array of identical shape containing the maximum
     * of the values between each corresponding index. Input arrays
     * must be the same length.
     *
     * @param arr1
     * @param arr2
     * @return
     */
    maxBetween: function(arr1, arr2) {	// int[](int[], int[])
        var retVal = newArray([arr1.length], 0);
        for (var i=0; i<arr1.length; i++) {
            retVal[i] = Math.max(arr1[i], arr2[i]);
        }
        return retVal;
    },

    /**
     * Returns an array of identical shape containing the minimum
     * of the values between each corresponding index. Input arrays
     * must be the same length.
     *
     * @param arr1
     * @param arr2
     * @return
     */
    minBetween: function(arr1, arr2) {	// int[](int[], int[])
        var retVal = newArray([arr1.length], 0);
        for (var i=0; i<arr1.length; i++) {
            retVal[i] = Math.min(arr1[i], arr2[i]);
        }
        return retVal;
    },
	    
    /**
     * Returns an array of values that test true for all of the
     * specified {@link Condition}s.
     *
     * @param values
     * @param conditions
     * @return
     */
    retainLogicalAnd: function(values, conditions) {	// int[](int[], Condition<?>[])
        var l = [];
        for (var i=0; i<values.length; i++) {
            var result = true;
            for (var j=0; j<conditions.length && result; j++) {
                result = result && conditions[j](values[i]);
            }
            if (result) {
            	l.push(values[i]);
            }
        }
        return l;
    }, 

    divide: function() {
    	
	    /**
	     * Returns an array whose members are the quotient of the dividend array
	     * values and the divisor array values.
	     *
	     * @param dividend
	     * @param divisor
	     * @param dividend adjustment
	     * @param divisor  adjustment
	     *
	     * @return
	     * @throws IllegalArgumentException if the two argument arrays are not the same length
	     */
	    var divideByVectorWithAdjustments = function(dividend, divisor, dividendAdjustment, divisorAdjustment) {	// double[](double[], double[], double, double)
	
	        if (dividend.length !== divisor.length) {
	            throw new Error("The dividend array and the divisor array must be the same length");
	        }
	        var quotient = newArray([dividend.length], 0);
	        var denom = 1;
	        for (var i=0; i<dividend.length; i++) {
	            quotient[i] = (dividend[i] + dividendAdjustment) /
	                          ((denom = divisor[i] + divisorAdjustment) === 0 ? 1 : denom); //Protect against division by 0
	        }
	        return quotient;
	    };
	
	    /**
	     * Returns an array whose members are the quotient of the dividend array
	     * values and the divisor array values.
	     *
	     * @param dividend
	     * @param divisor
	     * @param dividend adjustment
	     * @param divisor  adjustment
	     *
	     * @return
	     * @throws IllegalArgumentException if the two argument arrays are not the same length
	     */
	    var divideByVector = function(dividend, divisor) {	// double[](int[], int[])
	
	        if (dividend.length !== divisor.length) {
	            throw new Error("The dividend array and the divisor array must be the same length");
	        }
	        var quotient = newArray([dividend.length], 0);
	        var denom = 1;
	        for (var i=0; i<dividend.length; i++) {
	            quotient[i] = (dividend[i]) /
	                          ((denom = divisor[i]) === 0 ? 1 : denom); //Protect against division by 0
	        }
	        return quotient;
	    };
	
	    /**
	     * Returns an array whose members are the quotient of the dividend array
	     * values and the divisor value.
	     *
	     * @param dividend
	     * @param divisor
	     * @param dividend adjustment
	     * @param divisor  adjustment
	     *
	     * @return
	     * @throws IllegalArgumentException if the two argument arrays are not the same length
	     */
	    var divideByScalar = function(dividend, divisor) {	// double[](double[], double)
	        var quotient = newArray([dividend.length], 0);
	        var denom = 1;
	        for (var i=0; i<dividend.length; i++) {
	            quotient[i] = (dividend[i]) /
	                          ((denom = divisor) === 0 ? 1 : denom); //Protect against division by 0
	        }
	        return quotient;
	    };
	    
		if (arguments.length === 4) {			
			return divideByVectorWithAdjustments(arguments[0], arguments[1], arguments[2], arguments[3]);		
		} else if (Array.isArray(arguments[1])) {		
			return divideByVector(arguments[0], arguments[1]);		
		} else if (!Array.isArray(arguments[1])) {		
			return divideByScalar(arguments[0], arguments[1]);		
		} else {
			throw new Error("No matching method found for this call to divide.");
		}
    },
	    
    /**
     * Returns an array whose members are the quotient of the dividend array
     * values and the divisor array values.
     *
     * @param dividend
     * @param divisor
     * @param dividend adjustment
     * @param divisor  adjustment
     * @return
     * @throws IllegalArgumentException if the two argument arrays are not the same length
     */
    roundDivide: function(dividend, divisor, scale) {	// double[](double[], double[], int)

        if (dividend.length !== divisor.length) {
            throw new Error("The dividend array and the divisor array must be the same length");
        }
        var quotient = newArray([dividend.length], 0);
        for (var i=0; i<dividend.length; i++) {
            quotient[i] = (dividend[i]) / (divisor[i] === 0 ? 1 : divisor[i]); //Protect against division by 0
            quotient[i] = Math.round(quotient[i]);
        }
        return quotient;
    },

	multiply: function() {

		/**
	     * Returns an array whose members are the product of the multiplicand array
	     * values and the factor array values.
	     *
	     * @param multiplicand
	     * @param factor
	     * @param multiplicand adjustment
	     * @param factor       adjustment
	     *
	     * @return
	     * @throws IllegalArgumentException if the two argument arrays are not the same length
	     */
	    var multiplyByVectorWithAdjustments = function(multiplicand, factor, multiplicandAdjustment, factorAdjustment) {	// double[](double[], double[], double, double)
	
	        if (multiplicand.length !== factor.length) {
	            throw new Error("The multiplicand array and the factor array must be the same length");
	        }
	        var product = newArray([multiplicand.length], 0);
	        for (var i=0; i<multiplicand.length; i++) {
	            product[i] = (multiplicand[i] + multiplicandAdjustment) * (factor[i] + factorAdjustment);
	        }
	        return product;
	    };
	
	    /**
	     * Returns an array whose members are the product of the multiplicand array
	     * values and the factor array values.
	     *
	     * @param multiplicand
	     * @param factor
	     * @param multiplicand adjustment
	     * @param factor       adjustment
	     *
	     * @return
	     * @throws IllegalArgumentException if the two argument arrays are not the same length
	     */
		var multiplyByVector = function(multiplicand, factor) {	// double[](double[], int[]) {
		    if (multiplicand.length !== factor.length) {
		        throw new Error("The multiplicand array and the factor array must be the same length");
		    }
		    var product = newArray([multiplicand.length]);
		    for (var i=0; i<multiplicand.length; i++) {
		        product[i] = (multiplicand[i]) * (factor[i]);
		    }
		    return product;
		};
		
	    /**
	     * Returns a new array containing the result of multiplying
	     * each index of the specified array by the 2nd parameter.
	     *
	     * @param array
	     * @param d
	     * @return
	     */
	    var multiplyByScalar = function(multiplicand, factor) {	// int[](int[], intd)
	        var product = newArray([multiplicand.length], 0);
	        for (var i=0; i<multiplicand.length; i++) {
	            product[i] = multiplicand[i] * factor;
	        }
	        return product;
	    };
		
		if (arguments.length === 4) {			
			return multiplyByVectorWithAdjustments(arguments[0], arguments[1], arguments[2], arguments[3]);		
		} else if (Array.isArray(arguments[1])) {		
			return multiplyByVector(arguments[0], arguments[1]);		
		} else if (!Array.isArray(arguments[1])) {		
			return multiplyByScalar(arguments[0], arguments[1]);		
		} else {
			throw new Error("No matching method found for this call to multiply.");
		}
	},

	subtract: function() {

		/**
	     * Returns an integer array containing the result of subtraction
	     * operations between corresponding indexes of the specified arrays.
	     *
	     * @param minuend
	     * @param subtrahend
	     * @return
	     */
	    var subtractVector = function(subtrahend, minuend) {	// int[](int[], int[])
	        var retVal = newArray([minuend.length], 0);
	        for (var i=0; i<subtrahend.length; i++) {
	            retVal[i] = subtrahend[i] - minuend[i];
	        }
	        return retVal;
	    };
		
	    /**
	     * Subtracts the contents of the first argument from the last argument's list.
	     *
	     * <em>NOTE: Does not destroy/alter the argument lists. </em>
	     *
	     * @param minuend
	     * @param subtrahend
	     * @return
	     */
	    var subtractFromList = function(subtrahend, minuend) {	// List<Integer>(List<Integer>, List<Integer>)
	        var sList = minuend;
	        for (var i=0; i<subtrahend.length; i++) {
	        	var index = minuend.indexOf(subtrahend[i]);
	        	if (index !== -1) {
	        		sList.splice(index, 1);
	        	}
	        }
	        return sList;
	    };
	    
	    if(arguments[2] === "Array") {		    	
	    	return subtractVector(arguments[0], arguments[1]);	    
	    } else if (arguments[2] === "List") {	    	
	    	return subtractFromList(arguments[0], arguments[1]);	    	
	    } else {
			throw new Error("No matching method found for this call to subtract.");
	    }
	},
	
   /**
     * Returns the average of all the specified array contents.
     * @param arr
     * @return
     */
    average: function(arr) {	// double(double[])
        var sum = 0;
        for (var i=0; i<arr.length; i++) {
            sum += arr[i];
        }
        return sum / arr.length;
    },

    variance: function() {
	    
    	/**
	     * Computes and returns the variance.
	     * @param arr
	     * @param mean
	     * @return
	     */
	    var varianceWithMean = function(arr, mean) {	// double(double[], double)
	        var accum = 0.0;
	        var dev = 0.0;
	        var accum2 = 0.0;
	        for (var i=0; i<arr.length; i++) {
	            dev = arr[i] - mean;
	            accum += dev * dev;
	            accum2 += dev;
	        }
	        
	        var vari = (accum - (accum2 * accum2 / arr.length)) / arr.length;
	        
	        return vari;
	    };
	    
	    /**
	     * Computes and returns the variance.
	     * @param arr
	     * @return
	     */
	    var varianceWithoutMean = function(arr) {	// double(double[])
	        var mean = ArrayUtils.average(arr);
	        
	        var accum = 0.0;
	        var dev = 0.0;
	        var accum2 = 0.0;
	        for (var i=0; i<arr.length; i++) {
	            dev = arr[i] - mean;
	            accum += dev * dev;
	            accum2 += dev;
	        }
	        
	        var vari = (accum - (accum2 * accum2 / arr.length)) / arr.length;
	        
	        return vari;
	    };
	    
	    if (arguments.length === 2) {	    	
	    	return varianceWithMean(arguments[0], arguments[1]);	    	 
	    } else if (arguments.length === 1) {	    	
	    	return varianceWithoutMean(arguments[0]);	    	 
	    } else {
	    	 throw new Error("No method found for this call to variance.");
	    }
	},    

    /**
     * Returns the passed in array with every value being altered
     * by the addition of the specified amount.
     *
     * @param arr
     * @param amount
     * @return
     */
    add: function(arr, amount) {	// int[](int[], int)
        for (var i=0; i<arr.length; i++) {
            arr[i] += amount;
        }
        return arr;
    },

    /**
     * Returns the passed in array with every value being altered
     * by the addition of the specified double amount at the same
     * index
     *
     * @param arr
     * @param amount
     * @return
     */
    i_add: function(arr, amount) {	// int[](int[], int[])
        for (var i=0; i<arr.length; i++) {
            arr[i] += amount[i];
        }
        return arr;
    },

	d_add: function() {    

		/**
	     * Returns the passed in array with every value being altered
	     * by the addition of the specified double amount at the same
	     * index
	     *
	     * @param arr
	     * @param amount
	     * @return
	     */
	    var d_addVector = function(arr, amount) {	// double[](double[], double[])
	       if (arr.length != amount.length) {
	           return;//throw new Error("The arrays must be the same length");
	       }
	       for (var i=0; i<arr.length; i++) {
	            arr[i] += amount[i];
	        }
	        return arr;
	    };
	
	    /**
	     * Returns the passed in array with every value being altered
	     * by the addition of the specified double amount
	     *
	     * @param arr
	     * @param amount
	     * @return
	     */
	    var d_addScalar = function(arr, amount) {	// double[](double[], double)
	        for (var i=0; i<arr.length; i++) {
	            arr[i] += amount;
	        }
	        return arr;
	    };
	    
	    if (!Array.isArray(arguments[1])) {  	
	    	return d_addScalar(arguments[0], arguments[1]);	    
	    } else {	    
	    	return d_addVector(arguments[0], arguments[1]);	    
	    }
	},

    /**
     * Returns the sum of all contents in the specified array.
     * @param array
     * @return
     */
    sum: function(array) {	// int(int[])
        var sum = 0;
        for (var i=0; i<array.length; i++) {
            sum += array[i];
        }
        return sum;
    },
    
    /**
     * Test whether each element of a 1-D array is also present in a second 
     * array.
     *
     * Returns a int array whose length is the number of intersections.
     * 
     * @param ar1   the array of values to find in the second array 
     * @param ar2   the array to test for the presence of elements in the first array.
     * @return  an array containing the intersections or an empty array if none are found.
     */
    in1d: function(ar1, ar2) {	// int[](int[], int[])
        
        var set1 = new Set(ar1);
        var set2 = new Set(ar2);
        
        var retVal = new Set([x for (x of set1) if (set2.has(x))]);
        return [x for (x of retVal)];
    },
    
    /**
     * Sparse or due to the arrays containing the indexes of "on bits",
     * the <em>or</em> of which is equal to the mere combination of the two
     * arguments - eliminating duplicates and sorting.
     *
     * @param arg1
     * @param arg2
     * @return
     */
    sparseBinaryOr: function(arg1, arg2) {	// int[](int[], int[])
    	var t = arg1;
    	for (var i=0; i<arg2.length; i++) {
    		t.push(arg2[i]);
    	}
        return this.unique(t);
    },

    /**
     * Prints the specified array to a returned String.
     *
     * @param aObject the array object to print.
     * @return the array in string form suitable for display.
     */
    print1DArray: function(aObject) {	// String(Object)
        if (Array.isArray(aObject)) {
            return aObject.toString();
        }
        return "[]";
    },

    /**
     * Another utility to account for the difference between Python and Java.
     * Here the modulo operator is defined differently.
     *
     * @param n
     * @param divisor
     * @return
     */
    positiveRemainder: function(n, divisor) {	// double(double, double)
        if (n >= 0) {
            return n % divisor;
        } else {
            var val = divisor + (n % divisor);
            return val === divisor ? 0 : val;
        }
    },

    /**
     * Returns an array which starts from lowerBounds (inclusive) and
     * ends at the upperBounds (exclusive).
     *
     * @param lowerBounds
     * @param upperBounds
     * @return
     */
    range: function(lowerBounds, upperBounds) {	// int[](int, int)
        var ints = [];
        for (var i=lowerBounds; i<upperBounds; i++) {
            ints.push(i);
        }
        return ints;
    },
    
    /**
     * Returns an array which starts from lowerBounds (inclusive) and
     * ends at the upperBounds (exclusive).
     *
     * @param lowerBounds the starting value
     * @param upperBounds the maximum value (exclusive)
     * @param interval    the amount by which to increment the values
     * @return
     */
    arange: function(lowerBounds, upperBounds, interval) {	// double[](double, double, double)
        var doubs = [];
        for (var i=lowerBounds; i<upperBounds; i+=interval) {
            doubs.push(i);
        }
        return doubs;
    },

    /**
     * Returns a sorted unique array of integers
     *
     * @param nums an unsorted array of integers with possible duplicates.
     * @return
     */
    unique: function(nums) {	// int[](int[])
        var set = new Set(nums);
        result = Array.from(set);
        result.sort(function(a, b) {
        	  return a - b;
        });
        return result;
    },
    
    /**
     * Called to merge a list of dimension arrays into a sequential row-major indexed
     * list of coordinates.
     *
     * @param dimensions a list of dimension arrays, each array being a dimension
     *                   of an n-dimensional array.
     * @return a list of n-dimensional coordinates in row-major format.
     */
    dimensionsToCoordinateList: function(dimensions) {	// List<int[]>(List<int[]>)
        var ca = new CoordinateAssembler(dimensions);
    	return ca.assemble();
    },

    /**
	 * Sets the values in the specified values array at the indexes specified,
	 * to the value "setTo".
	 *
	 * @param values  the values to alter if at the specified indexes.
	 * @param indexes the indexes of the values array to alter
	 * @param setTo   the value to set at the specified indexes.
	 */
	setIndexesTo: function(values, indexes, setTo) {	// void(double[], int[], double)
	    for (var i=0; i<indexes.length; i++) {
	        values[indexes[i]] = setTo;
	    }
	},
	
    /**
     * Sets the values in range start to stop to the value specified. If
     * stop < 0, then stop indicates the number of places counting from the
     * length of "values" back.
     *
     * @param values the array to alter
     * @param start  the start index (inclusive)
     * @param stop   the end index (exclusive)
     * @param setTo  the value to set the indexes to
     */
    setRangeTo: function(values, start, stop, setTo) {	// void(int[], int, int, int)
        stop = stop < 0 ? values.length + stop : stop;
        for (var i=start; i<stop; i++) {
            values[i] = setTo;
        }
    },

	sample: function() {

		/**
	     * Returns a random, sorted, and  unique array of the specified sample size of
	     * selections from the specified list of choices.
	     *
	     * @param sampleSize the number of selections in the returned sample
	     * @param choices    the list of choices to select from
	     * @param random     a random number generator
	     * @return a sample of numbers of the specified size
	     */
		var sampleWithChoices = function(sampleSize, choices, random) {	// int[](int, TIntArrayList, Random) {
	        var temp = new Set();	// could be just an array as well
	        var upperBound = choices.length;
	        for (var i=0; i<sampleSize; i++) {
	            var randomIdx = random.nextInt(upperBound);
	            while (temp.has(choices[randomIdx])) {
	                randomIdx = random.nextInt(upperBound);
	            }
	            temp.add(choices[randomIdx]);
	        }
	        var al = Array.from(temp);
	        al.sort(function(a, b) {
	        	  return a - b;
	        });
	        return al;
	    };
	
	    /**
	     * Returns a double[] filled with random doubles of the specified size.
	     * @param sampleSize
	     * @param random
	     * @return
	     */
	    var sampleWithoutChoices = function(sampleSize, random) {	// double[](int, Random)
	        var sample = [];
	        for (var i=0; i<sampleSize; i++) {
	            sample[i] = random.nextDouble();
	        }
	        return sample;
	    };
	    
	    if (arguments.length === 2) {	    	
	    	return sampleWithoutChoices(arguments[0], arguments[1]);	    	
	    } else if (arguments.length === 3) {	    	
	    	return sampleWithChoices(arguments[0], arguments[1], arguments[2]);	    	
	    } else {
			throw new Error("No matching method found for this call to sample.");
	    }
	},


	clip: function() {

		/**
	     * Ensures that each entry in the specified array has a min value
	     * equal to or greater than the specified min and a maximum value less
	     * than or equal to the specified max.
	     *
	     * @param values the values to clip
	     * @param min    the minimum value
	     * @param max    the maximum value
	     */
	    var clipWithScalars = function(values, min, max) {	// double[](double[], double, double)
	        for (var i=0; i<values.length; i++) {
	            values[i] = Math.min(1, Math.max(0, values[i]));
	        }
	        return values;
	    };
	
	    /**
	     * Ensures that each entry in the specified array has a min value
	     * equal to or greater than the min at the specified index and a maximum value less
	     * than or equal to the max at the specified index.
	     *
	     * @param values the values to clip
	     * @param min    the minimum value
	     * @param max    the maximum value
	     */
	    var clipWithVectors = function(values, min, max) { // int[](int[], int[], int[])
	        for (var i=0; i<values.length; i++) {
	            values[i] = Math.max(min[i], Math.min(max[i], values[i]));
	        }
	        return values;
	    };
	
	    /**
	     * Ensures that each entry in the specified array has a min value
	     * equal to or greater than the min at the specified index and a maximum value less
	     * than or equal to the max at the specified index.
	     *
	     * @param values the values to clip
	     * @param max    the minimum value
	     * @param adj    the adjustment amount
	     */
	    var clipWithAdjustment = function(values, max, adj) {	// int[](int[], int[], int)
	        for (var i=0; i<values.length; i++) {
	            values[i] = Math.max(0, Math.min(max[i] + adj, values[i]));
	        }
	        return values;
	    };
	    
	    if (!Array.isArray(arguments[1]) && !Array.isArray(arguments[2])) {	    	
	    	return clipWithScalars(arguments[0], arguments[1], arguments[2]);	    	
	    } else if (Array.isArray(arguments[1]) && Array.isArray(arguments[2])) {	    	
	    	return clipWithVectors(arguments[0], arguments[1], arguments[2]);	    	
	    } else if (Array.isArray(arguments[1]) && !Array.isArray(arguments[2])) {	    	
	    	return clipWithAdjustment(arguments[0], arguments[1], arguments[2]);	    	
	    } else {
	    	throw new Error("No matching method found for this call to clip.");
	    }
	},	    

    /**
     * Returns the count of values in the specified array that are
     * greater than the specified compare value
     *
     * @param compare the value to compare to
     * @param array   the values being compared
     *
     * @return the count of values greater
     */
    valueGreaterCount: function(compare, array) {	// int(double, double[])
        var count = 0;
        for (var i=0; i<array.length; i++) {
            if (array[i] > compare) {
                count++;
            }
        }

        return count;
    },

    /**
     * Returns the count of values in the specified array that are
     * greater than the specified compare value
     *
     * @param compare the value to compare to
     * @param array   the values being compared
     *
     * @return the count of values greater
     */
    valueGreaterCountAtIndex: function(compare, array, indexes) {	// int(double, double[], int[])
        var count = 0;
        for (var i=0; i<indexes.length; i++) {
            if (array[indexes[i]] > compare) {
                count++;
            }
        }

        return count;
    },

    /**
     * Returns an array containing the n greatest values.
     * @param array
     * @param n
     * @return
     */
    nGreatest: function(array, n) {	// int[](double[], int)
        var places = new Map();
        var i;
        var key;
        for (var j=1; j<array.length; j++) {
            key = array[j];	// j starts at 1, so array[0] can never become key
            for (i=j-1; i>=0 && array[i]<key; i--) {
                array[i+1] = array[i];
            }
            array[i+1] = key;			
            places.set(key, j);
        }

        var retVal = newArray([n], 0);
        for (i=0; i<n; i++) {
			if (places.has(array[i])) {	// prevents "undefined" in case the *original* array[0] is called upon
				retVal[i] = places.get(array[i]);
			}
        }
		return retVal;
    },

    raiseValuesBy: function() {	    

    	/**
	     * Raises the values in the specified array by the amount specified
	     * @param amount the amount to raise the values
	     * @param values the values to raise
	     */
	    var raiseValuesByScalar = function(amount, values) {	// void(double, double[])
	        for (var i=0; i<values.length; i++) {
	            values[i] += amount;
	        }
	    };
	
	    /**
	     * Raises the values at the indexes specified by the amount specified.
	     * @param amount the amount to raise the values
	     * @param values the values to raise
	     */
	    var raiseValuesByIndexes = function(amount, values, indexesToRaise) {	//void(double, double[], int[])
	        for (var i=0; i<indexesToRaise.length; i++) {
	            values[indexesToRaise[i]] += amount;
	        }
	    };
	
	    /**
	     * Raises the values at the indexes specified by the amount specified.
	     * @param amount the amount to raise the values
	     * @param values the values to raise
	     */
	    var raiseValuesByVector = function(amounts, values) {	// void(double[], double[])
	        for (var i=0; i<values.length; i++) {
	            values[i] += amounts[i];
	        }
	    };
	    
	    if (!Array.isArray(arguments[0]) && Array.isArray(arguments[1]) && arguments.length === 2) {	    	
	    	return raiseValuesByScalar(arguments[0], arguments[1]);	    	
	    } else if (!Array.isArray(arguments[0]) && Array.isArray(arguments[1]) && arguments.length === 3) {	    	
	    	return raiseValuesByIndexes(arguments[0], arguments[1], arguments[2]);	    	
	    } else if (Array.isArray(arguments[0]) && Array.isArray(arguments[1]) && arguments.length === 2) {	    	
	    	return raiseValuesByVector(arguments[0], arguments[1]);	    	
	    } else {
	    	throw new Error("No matching method found for this call to raiseValuesBy.");
	    }
	},	    

    /**
     * Scans the specified values and applies the {@link Condition} to each
     * value, returning the indexes of the values where the condition evaluates
     * to true.
     *
     * @param values the values to test
     * @param c      the condition used to test each value
     * @return
     */
    where: function(d, c) {	// <T> int[](double[], Condition<T>)
        var retVal = [];
        var len = d.length;
        for (var i=0; i<len; i++) {
            if (c(d[i])) {
                retVal.push(i);
            }
        }
        return retVal;
    },

    /**
     * Makes all values in the specified array which are less than or equal to the specified
     * "x" value, equal to the specified "y".
     * @param array
     * @param x     the comparison
     * @param y     the value to set if the comparison fails
     */
    lessThanOrEqualXThanSetToY: function(array, x, y) {	// void(double[], double, double)
        for (var i=0; i<array.length; i++) {
            if (array[i] <= x) {
            	array[i] = y;
            }
        }
    },

    /**
     * Makes all values in the specified array which are less than the specified
     * "x" value, equal to the specified "y".
     * @param array
     * @param x     the comparison
     * @param y     the value to set if the comparison fails
     */
    lessThanXThanSetToY: function(array, x, y) { // void(double[], double, double)
        for (var i=0; i<array.length; i++) {
            if (array[i] < x) {
            	array[i] = y;
            }
        }
    },

    /**
     * Makes all values in the specified array which are greater than or equal to the specified
     * "x" value, equal to the specified "y".
     * @param array
     * @param x     the comparison
     * @param y     the value to set if the comparison fails
     */
    greaterThanOrEqualXThanSetToY: function(array, x, y) {	// void(double[], double, double)
        for (var i=0; i<array.length; i++) {
            if (array[i] >= x) {
            	array[i] = y;
            }
        }
    },

    /**
     * Makes all values in the specified array which are greater than the specified
     * "x" value, equal to the specified "y".
     *
     * @param array
     * @param x     the comparison
     * @param y     the value to set if the comparison fails
     */
    greaterThanXThanSetToY: function(array, x, y) {	// void(double[], double, double)
        for (var i=0; i<array.length; i++) {
            if (array[i] > x) {
            	array[i] = y;
            }
        }
    },

    /**
     * Returns the index of the max value in the specified array
     * @param array the array to find the max value index in
     * @return the index of the max value
     */
    argmax: function(array) {	// int(int[])
        var index = -1;
        var max = Number.MIN_VALUE;
        for (var i=0; i<array.length; i++) {
            if (array[i] > max) {
                max = array[i];
                index = i;
            }
        }
        return index;
    },
    
    /**
     * Returns the maximum value in the specified array
     * @param array
     * @return
     */
    max: function(array) {	// double(double[])
        var max = Number.MIN_VALUE;
        for (var i=0; i<array.length; i++) {
            if (array[i] > max) {
                max = array[i];
            }
        }
        return max;
    },

	/**
     * Returns a new array containing the items specified from
     * the source array by the indexes specified.
     *
     * @param source
     * @param indexes
     * @return
     */
    sub: function(source, indexes) {	// int[](int[], int[]) or int[][](int[][], int[])
        var retVal = newArray([indexes.length], 0);
        for (var i=0; i<indexes.length; i++) {
            retVal[i] = source[indexes[i]];
        }
        return retVal;
    },
    
    /**
     * Returns the minimum value in the specified array
     * @param array
     * @return
     */
    min: function(array) {	// int(int[])
        var min = Number.MAX_VALUE;
        for (var i=0; i<array.length; i++) {
            if (array[i] < min) {
                min = array[i];
            }
        }
        return min;
    },

    /**
     * Returns a copy of the specified integer array in
     * reverse order
     *
     * @param d
     * @return
     */
    reverse: function(d) {	// int[](int[])
        var ret = newArray([d.length], 0);
        for (var i=0, j=d.length-1; j>=0; i++, j--) {
            ret[i] = d[j];
        }
        return ret;
    },

    /**
     * Returns a new int array containing the or'd on bits of
     * both arg1 and arg2.
     *
     * @param arg1
     * @param arg2
     * @return
     */
    or: function(arg1, arg2) {	// int[](int[], int[])
        var retVal = newArray([Math.max(arg1.length, arg2.length)], 0);
        for (var i=0; i<arg1.length; i++) {
            retVal[i] = arg1[i] > 0 || arg2[i] > 0 ? 1 : 0;
        }
        return retVal;
    },

    /**
     * Returns a new int array containing the or'd on bits of
     * both arg1 and arg2.
     *
     * @param arg1
     * @param arg2
     * @return
     */
    and: function(arg1, arg2) {	// int[](int[], int[])
        var retVal = newArray([Math.max(arg1.length, arg2.length)], 0);
        for (var i=0; i<arg1.length; i++) {
            retVal[i] = arg1[i] > 0 && arg2[i] > 0 ? 1 : 0;
        }
        return retVal;
    },

    /**
     * Copies the passed array <tt>original</tt>  into a new array except first element and returns it
     *
     * @param original the array from which a tail is taken
     * @return a new array containing the tail from the original array
     */
    tail: function(original) {	// int[](int[])
        return original.slice(1);
    },

    /**
     * Set <tt></tt>value for <tt>array</tt> at specified position <tt>indexes</tt>
     *
     * @param array
     * @param value
     * @param indexes
     */
    setValue: function(array, value, indexes) {	// void(Object, int, int...)
        if (indexes.length === 1) {
            array[indexes[0]] = value;
        } else {
            this.setValue(array[indexes[0]], value, this.tail(indexes));
        }
    },

    /**
     *Assigns the specified int value to each element of the specified any dimensional array
     * of ints.
     * @param array
     * @param value
     */
    fillArray: function(array, value) {	// void(Object, int)
    	for (var i=0; i<array.length; i++) {
    		if (Array.isArray(array[i])) {
    			this.fillArray(array[i], value);
    		} else {
    			array[i] = value;
    		}
    	}
    },

    /**
    * Aggregates all element of multi dimensional array of ints
    * @param array
    * @return sum of all array elements
    */
    aggregateArray: function(array, sum) {	// int(Object)
        var sum = 0;
        if (!Array.isArray(array)) {
            return Math.floor(array);
        } else {
        	for (var i=0; i<array.length; i++) {
        		if (Array.isArray(array[i])) {
        			sum += this.aggregateArray(array[i]);
        		} else {
        			sum += array[i];
        		}
        	}
        }
        return sum;
    },

    /**
     * Convert multidimensional array to readable String
     * @param array
     * @return String representation of array
     */
    intArrayToString: function(array){	// String(Object)
        var result = "";
        if (!Array.isArray(array)) {
            return array;
        } else {
        	for (var i=0; i<array.length; i++) {
        		if (Array.isArray(array[i])) {
        			result += "\n" + this.intArrayToString(array[i]);
        		} else {
        			result += " " + array[i];
        		}
        	}
        }
        return result;
    },

    /**
     * Return True if all elements of the  <tt>values</tt> have evaluated to true with <tt>condition</tt>
     * @param values
     * @param condition
     * @param <T>
     * @return
     */
    all: function(values, condition) {	// boolean(final int[], final Condition<T>)
        for (var i=0; i<values.length; i++) {
            if (!condition(values[i])) {
                return false;
            }
        }
        return true;
    },

    /**
     * Concat int arrays
     *
     * @return The concatenated array
     *
     * http://stackoverflow.com/a/784842
     */
    concatAll: function(first) {	// int[](int[], int[]...) or T[](T[], T[]...)
		var result = copyOf(first);
		var i = 1;
		while (!(arguments[i] === undefined)) {
        	result = result.concat(arguments[i++]);
        }       
        return result;
    }
};

/**
 * Helper Class for recursive coordinate assembling
 */
var CoordinateAssembler = function(dimensions) {
    this.position = newArray([dimensions.length], 0);
    this.dimensions = dimensions;
    this.result = [];
};

CoordinateAssembler.prototype = {
    assemble: function() {	// List<int[]>(List<int[]>)	
        this.process(this.dimensions.length);
        return this.result;
    },

    process: function(level) {	// void(int)
        if (level === 0) {	// terminating condition
            var coordinates = new Array(this.position.length);
            coordinates = this.position;
            this.result.push(coordinates.slice(0)); // w/o slice, the complete array is set to the current coordinates
        } else {	// inductive condition
            var index = this.dimensions.length - level;
            var currentDimension = this.dimensions[index];
            for (var i=0; i<currentDimension.length; i++) {
                this.position[index] = currentDimension[i];
                this.process(level - 1);
            }
        }
    }
}
