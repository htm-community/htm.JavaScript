/**
 * A CLA classifier accepts a binary input from the level below (the
 * "activationPattern") and information from the sensor and encoders (the
 * "classification") describing the input to the system at that time step.
 *
 * When learning, for every bit in activation pattern, it records a history of the
 * classification each time that bit was active. The history is weighted so that
 * more recent activity has a bigger impact than older activity. The alpha
 * parameter controls this weighting.
 *
 * For inference, it takes an ensemble approach. For every active bit in the
 * activationPattern, it looks up the most likely classification(s) from the
 * history stored for that bit and then votes across these to get the resulting
 * classification(s).
 *
 * This classifier can learn and infer a number of simultaneous classifications
 * at once, each representing a shift of a different number of time steps. For
 * example, say you are doing multi-step prediction and want the predictions for
 * 1 and 3 time steps in advance. The CLAClassifier would learn the associations
 * between the activation pattern for time step T and the classifications for
 * time step T+1, as well as the associations between activation pattern T and
 * the classifications for T+3. The 'steps' constructor argument specifies the
 * list of time-steps you want.
 * 
 * @author Numenta
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see BitHistory
 */
function ClassifierResult() {
    /** Array of actual values */
    this.actualValues = null; // T[];

    /** Map of step count -to- probabilities */
    this.probabilities = new Map(); // TIntObjectMap<double[]> probabilities = new TIntObjectHashMap<double[]>();
};

/**
 * Utility method to copy the contents of a ClassifierResult.
 * 
 * @return  a copy of this {@code ClassifierResult} which will not be affected
 * by changes to the original.
 */
ClassifierResult.prototype.copy = function() { // ClassifierResult<T>(void)
    var retVal = new ClassifierResult();
    retVal.actualValues = copyOf(this.actualValues, "array");
    retVal.probabilities = copyOf(this.probabilities, "map"); // new TIntObjectHashMap<double[]>(probabilities);

    return retVal;
};

/**
 * Returns the actual value for the specified bucket index
 * 
 * @param bucketIndex
 * @return
 */
ClassifierResult.prototype.getActualValue = function(bucketIndex) { // T(int)
    if (isNullOrUndefined(this.actualValues) || this.actualValues.length < bucketIndex + 1) {
        return null;
    }
    return this.actualValues[bucketIndex];
};

/**
 * Returns all actual values entered
 * 
 * @return  array of type &lt;T&gt;
 */
ClassifierResult.prototype.getActualValues = function() { // T[](void)
    return this.actualValues;
};

/**
 * Sets the array of actual values being entered.
 * 
 * @param values
 * @param &lt;T&gt;[]	the value array type
 */
ClassifierResult.prototype.setActualValues = function(values) { // void(T[])
    this.actualValues = values;
};

/**
 * Returns a count of actual values entered
 * @return
 */
ClassifierResult.prototype.getActualValueCount = function() { // int(void)
    return this.actualValues.length;
};

/**
 * Returns the probability at the specified index for the given step
 * @param step
 * @param bucketIndex
 * @return
 */
ClassifierResult.prototype.getStat = function(step, bucketIndex) { // double(int, int)
    return this.probabilities.get(step)[bucketIndex];
};

/**
 * Sets the array of probabilities for the specified step
 * @param step
 * @param votes
 */
ClassifierResult.prototype.setStats = function(step, votes) { // void(int, double[])
    this.probabilities.set(step, votes);
};

/**
 * Returns the probabilities for the specified step
 * @param step
 * @return
 */
ClassifierResult.prototype.getStats = function(step) { // double(int)
    return this.probabilities.get(step);
};

/**
 * Returns the input value corresponding with the highest probability
 * for the specified step.
 * 
 * @param step		the step key under which the most probable value will be returned.
 * @return
 */
ClassifierResult.prototype.getMostProbableValue = function(step) { // T(int)
    var idx = -1;
    if (isNullOrUndefined(this.probabilities.get(step)) || (idx = this.getMostProbableBucketIndex(step)) === -1) {
        return null;
    }
    return this.getActualValue(idx);
};

/**
 * Returns the bucket index corresponding with the highest probability
 * for the specified step.
 * 
 * @param step		the step key under which the most probable index will be returned.
 * @return			-1 if there is no such entry
 */
ClassifierResult.prototype.getMostProbableBucketIndex = function(step) { // int(int)
    if (isNullOrUndefined(this.probabilities.get(step))) {
        return -1;
    }

    var max = 0;
    var bucketIdx = -1;
    var ds = this.probabilities.get(step);
    for (var i = 0; i < ds.length; i++) {
        if (ds[i] > max) {
            max = ds[i];
            bucketIdx = i;
        }
    }
    return bucketIdx;
};

/**
 * Returns the count of steps
 * @return
 */
ClassifierResult.prototype.getStepCount = function() { // int(void)
    return this.probabilities.size;
};

/**
 * Returns the count of probabilities for the specified step
 * @param	the step indexing the probability values
 * @return
 */
ClassifierResult.prototype.getStatCount = function(step) { // int(int)
    return this.probabilities.get(step).length;
};

/**
 * Returns a set of steps being recorded.
 * @return
 */
ClassifierResult.prototype.stepSet = function() { // int[](void)
    return Array.from(this.probabilities.keys());
};

ClassifierResult.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + HashCode.value(this.actualValues);
    result = prime * result + (isNullOrUndefined(this.probabilities) ? 0 : HashCode.value(this.probabilities));
    return result;
};

ClassifierResult.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj) {
        return true;
    }
    if (isNullOrUndefined(obj)) {
        return false;
    }
    if (this.constructor !== obj.constructor) {
        return false;
    }
    var other = obj;
    if (!equals(this.actualValues, other.actualValues)) {
        return false;
    }
    if (isNullOrUndefined(this.probabilities)) {
        if (!isNullOrUndefined(other.probabilities)) {
            return false;
        }
    } else if (!equals(this.probabilities, other.probabilities)) {
        return false;
    }
    return true;
};