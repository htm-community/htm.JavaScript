/**
 * Container for the results of a classification computation by the
 * {@link CLAClassifier}
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 * @param <T>
 */
var CLAClassifier = function() {

    this.verbosity = 0; // int
    /**
     * The alpha used to compute running averages of the bucket duty
     * cycles for each activation pattern bit. A lower alpha results
     * in longer term memory.
     */
    this.alpha = 0.001; // double
    this.actValueAlpha = 0.3; // double
    /** 
     * The bit's learning iteration. This is updated each time store() gets
     * called on this bit.
     */
    this.learnIteration = 0; // int
    /**
     * This contains the offset between the recordNum (provided by caller) and
     * learnIteration (internal only, always starts at 0).
     */
    this.recordNumMinusLearnIteration = -1; // int
    /**
     * This contains the value of the highest bucket index we've ever seen
     * It is used to pre-allocate fixed size arrays that hold the weights of
     * each bucket index during inference 
     */
    this.maxBucketIdx = 0; // int
    /** The sequence different steps of multi-step predictions */
    this.steps = [];
    /**
     * History of the last _maxSteps activation patterns. We need to keep
     * these so that we can associate the current iteration's classification
     * with the activationPattern from N steps ago
     */
    this.patternNZHistory = null; // Deque<Tuple>
    /**
     * These are the bit histories. Each one is a BitHistory instance, stored in
     * this dict, where the key is (bit, nSteps). The 'bit' is the index of the
     * bit in the activation pattern and nSteps is the number of steps of
     * prediction desired for that bit.
     */
    this.activeBitHistory = new Map(); // new WeakMap() // Map<Tuple, BitHistory>
    /**
     * This keeps track of the actual value to use for each bucket index. We
     * start with 1 bucket, no actual value so that the first infer has something
     * to return
     */
    this.actualValues = []; // List<?>

    this.g_debugPrefix = "CLAClassifier"; // String

    var that = this;

    /**
     * CLAClassifier no-arg constructor with defaults
     */
    var CLAClassifier_void = function() { // (void)
        CLAClassifier_non_void(newArray([1], 1), 0.001, 0.3, 0);
    }

    /**
	 * Constructor for the CLA classifier
	 * 
	 * @param steps				sequence of the different steps of multi-step predictions to learn
	 * @param alpha				The alpha used to compute running averages of the bucket duty
               					cycles for each activation pattern bit. A lower alpha results
               					in longer term memory.
	 * @param actValueAlpha
	 * @param verbosity			verbosity level, can be 0, 1, or 2
	 */
    var CLAClassifier_non_void = function(steps, alpha, actValueAlpha, verbosity) { // (TIntList, double, double, int)
        that.steps = steps;
        that.alpha = alpha;
        that.actValueAlpha = actValueAlpha;
        that.verbosity = verbosity;
        that.actualValues.push(null);
        that.patternNZHistory = new Deque(steps.length + 1);
    }

    if (arguments.length === 0) {
        CLAClassifier_void();
    } else {
        CLAClassifier_non_void(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
};

CLAClassifier.prototype = {
    /**
     * Process one input sample.
     * This method is called by outer loop code outside the nupic-engine. We
     * use this instead of the nupic engine compute() because our inputs and
     * outputs aren't fixed size vectors of reals.
     * 
     * @param recordNum			Record number of this input pattern. Record numbers should
     *           				normally increase sequentially by 1 each time unless there
     *           				are missing records in the dataset. Knowing this information
     *           				insures that we don't get confused by missing records.
     * @param classification	{@link Map} of the classification information:
     *                 			bucketIdx: index of the encoder bucket
     *                 			actValue:  actual value going into the encoder
     * @param patternNZ			list of the active indices from the output below
     * @param learn				if true, learn this sample
     * @param infer				if true, perform inference
     * 
     * @return					dict containing inference results, there is one entry for each
     *           				step in steps, where the key is the number of steps, and
     *           				the value is an array containing the relative likelihood for
     *           				each bucketIdx starting from bucketIdx 0.
     *
     *           				There is also an entry containing the average actual value to
     *           				use for each bucket. The key is 'actualValues'.
     *
     *           				for example:
     *             				{	
     *             					1 :             [0.1, 0.3, 0.2, 0.7],
     *              				4 :             [0.2, 0.4, 0.3, 0.5],
     *              				'actualValues': [1.5, 3,5, 5,5, 7.6],
     *             				}
     */
    compute: function(recordNum, classification, patternNZ, learn, infer) { // <T> ClassifierResult<T>(int, Map<String, Object>, int[], boolean, boolean)
        var retVal = new ClassifierResult();
        var actualValues = this.actualValues;

        // Save the offset between recordNum and learnIteration if this is the first
        // compute
        if (this.recordNumMinusLearnIteration === -1) {
            this.recordNumMinusLearnIteration = recordNum - this.learnIteration;
        }

        // Update the learn iteration
        this.learnIteration = recordNum - this.recordNumMinusLearnIteration;

        if (this.verbosity >= 1) {
            console.log("\n: compute " + this.g_debugPrefix);
            console.log(" recordNum: " + recordNum);
            console.log(" learnIteration: " + this.learnIteration);
            console.log(" patternNZ(" + patternNZ.length + ")" + patternNZ);
            console.log(" classificationIn: " + classification);
        }

        this.patternNZHistory.append(new Tuple(this.learnIteration, patternNZ));

        //------------------------------------------------------------------------
        // Inference:
        // For each active bit in the activationPattern, get the classification
        // votes
        //
        // Return value dict. For buckets which we don't have an actual value
        // for yet, just plug in any valid actual value. It doesn't matter what
        // we use because that bucket won't have non-zero likelihood anyways.
        if (infer) {
            // NOTE: If doing 0-step prediction, we shouldn't use any knowledge
            //		 of the classification input during inference.
            var defaultValue = null;
            if (this.steps[0] === 0) {
                defaultValue = 0;
            } else {
                defaultValue = classification.get("actValue");
            }

            var actValues = newArray([this.actualValues.length], 0);
            for (var i=0; i<this.actualValues.length; i++) {
                actValues[i] = isNullOrUndefined(this.actualValues[i]) ? defaultValue : this.actualValues[i];
            }

            retVal.setActualValues(actValues);

            // For each n-step prediction...
            for (var i=0; i<this.steps.length; i++) {
                var nSteps = this.steps[i];
                // Accumulate bucket index votes and actValues into these arrays
                var sumVotes = newArray([this.maxBucketIdx + 1], 0);
                var bitVotes = newArray([this.maxBucketIdx + 1], 0);

                for (var j=0; j<patternNZ.length; j++) {
                    var bit = patternNZ[j];
                    var key = HashCode.value(new Tuple(bit, nSteps));	// just new Tuple(// just "key = new Tuple(bit, nSteps)" doesn't work) doesn't work, neither does "key = [bit, nSteps]"
                    var history = this.activeBitHistory.get(key);
                    if (isNullOrUndefined(history)) {
                        continue;
                    }

                    history.infer(this.learnIteration, bitVotes);

                    sumVotes = ArrayUtils.d_add(sumVotes, bitVotes);
                }

                // Return the votes for each bucket, normalized
                var total = ArrayUtils.sum(sumVotes);
                if (total > 0) {
                    sumVotes = ArrayUtils.divide(sumVotes, total);
                } else {
                    // If all buckets have zero probability then simply make all of the
                    // buckets equally likely. There is no actual prediction for this
                    // timestep so any of the possible predictions are just as good.
                    if (sumVotes.length > 0) {
                        sumVotes.fill(1);
                        sumVotes = ArrayUtils.divide(sumVotes, sumVotes.length);
                    }
                }

                retVal.setStats(nSteps, sumVotes);
            }
        }

        // ------------------------------------------------------------------------
        // Learning:
        // For each active bit in the activationPattern, store the classification
        // info. If the bucketIdx is None, we can't learn. This can happen when the
        // field is missing in a specific record.
        if (learn && !isNullOrUndefined(classification.get("bucketIdx"))) {
            // Get classification info
            var bucketIdx = Math.floor(classification.get("bucketIdx"));
            var actValue = classification.get("actValue");

            // Update maxBucketIndex
            this.maxBucketIdx = Math.floor(Math.max(this.maxBucketIdx, bucketIdx));

            // Update rolling average of actual values if it's a scalar. If it's
            // not, it must be a category, in which case each bucket only ever
            // sees one category so we don't need a running average.
            while (this.maxBucketIdx > this.actualValues.length - 1) {
                if (actValue instanceof Object) {
					this.actualValues.push(null);
				} else if (typeof actualValue === "string") {
					this.actualValues.push("");
				} else {
					this.actualValues.push(0);
				}
            }
            if (isNullOrUndefined(this.actualValues[bucketIdx]) || this.actualValues[bucketIdx] === "" || this.actualValues[bucketIdx] === 0) {
                this.actualValues[bucketIdx] = actValue;
            } else {
                if (typeof actValue === "number") {
                    var val = (1.0 - this.actValueAlpha) * actualValues[bucketIdx] +
                        this.actValueAlpha * actValue;
                    this.actualValues[bucketIdx] = val;
                } else {
                    this.actualValues[bucketIdx] = actValue;
                }
            }

            // Train each pattern that we have in our history that aligns with the
            // steps we have in steps
            var nSteps = -1;
            var iteration = 0;
            var learnPatternNZ = null;
            for (var i = 0; i < this.steps.length; i++) {
                n = this.steps[i];
                nSteps = n;
                // Do we have the pattern that should be assigned to this classification
                // in our pattern history? If not, skip it
                var found = false;
                var it = this.patternNZHistory.iterator();
                for (;;) {
                    var t = it.next();
                    if (t['done']) {
                        break;
                    }
                    iteration = Math.floor(t['value'].get(0));
                    learnPatternNZ = t['value'].get(1);
                    if (iteration === this.learnIteration - nSteps) {
                        found = true;
                        break;
                    }
                    iteration++;
                }
                if (!found) {
                    continue;
                }

                // Store classification info for each active bit from the pattern
                // that we got nSteps time steps ago.
                for (var i = 0; i < learnPatternNZ.length; i++) {
                    var bit = learnPatternNZ[i];
                    // Get the history structure for this bit and step
                    var key = HashCode.value(new Tuple(bit, nSteps));	// just new Tuple(// just "key = new Tuple(bit, nSteps)" doesn't work) doesn't work, neither does "key = [bit, nSteps]"
                    var history = this.activeBitHistory.get(key);
                    if (isNullOrUndefined(history)) {
                        this.activeBitHistory.set(key, history = new BitHistory(this, bit, nSteps));
                    }
                    history.store(this.learnIteration, bucketIdx);
                }
            }
        }

        if (infer && this.verbosity >= 1) {
            console.log(" inference: combined bucket likelihoods:");
            console.log("   actual bucket values: " + retVal.getActualValues().toString());

            for (var i = 0; i < retVal.stepSet().length; i++) {
                var key = retVal.stepSet[i];
                if (isNullOrUndefined(retVal.getActualValue(key))) {
                    continue;
                }

                var actual = [retVal.getActualValue(key)];
                console.log("  " + key + " steps: " + pFormatArray(actual));
                var bestBucketIdx = retVal.getMostProbableBucketIndex(key);
                console.log("   most likely bucket idx: " + bestBucketIdx + " value:  " +
                    retVal.getActualValue(bestBucketIdx));
            }
        }

        return retVal;
    },

    /**
     * Return a string with pretty-print of an array using the given format
     * for each element
     * 
     * @param arr
     * @return
     */
    pFormatArray: function(arr) { // String(T[])
        if (isNullOrUndefined(arr)) {
            return "";
        }

        var sb = "[ ";
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            sb += t + " ";
        }
        sb += "]";
        return sb;
    },

    serialize: function() { // String(void)
        /*
		String json = null;
		ObjectMapper mapper = new ObjectMapper();
		try {
			json = mapper.writeValueAsString(this);
		}catch(Exception e) {
			e.printStackTrace();
		}
		
		return json;
		*/
        throw new Error("Need to implement CLAClassifier::serialize() after all.");
    },

    deSerialize: function(jsonStrategy) { // CLAClassifier(String)
        /*
		ObjectMapper om = new ObjectMapper();
		CLAClassifier c = null;
		try {
			Object o = om.readValue(jsonStrategy, CLAClassifier.class);
			c = (CLAClassifier)o;
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return c;
		*/
        throw new Error("Need to implement CLAClassifier::deserialize() after all.");
    }
}