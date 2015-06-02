/**
 * Stores an activationPattern bit history.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see CLAClassifier
 */
var BitHistory = function() {
    /** Store reference to the classifier */
    this.classifier = null; // CLAClassifier
    /** Form our "id" */
    this.id = ""; // String
    /**
     * Dictionary of bucket entries. The key is the bucket index, the
     * value is the dutyCycle, which is the rolling average of the duty cycle
     */
    this.stats = null; // TDoubleList
    /** lastUpdate is the iteration number of the last time it was updated. */
    this.lastTotalUpdate = -1; // int

    // This determines how large one of the duty cycles must get before each of the
    // duty cycles are updated to the current iteration.
    // This must be less than float32 size since storage is float32 size
    this.DUTY_CYCLE_UPDATE_INTERVAL = 2147483647; // Integer.MAX_VALUE;

    var that = this;

    /**
     * Package protected constructor for serialization purposes.
     */
    var BitHistory_void = function() {}; // (void)

    /**
     * Constructs a new {@code BitHistory}
     * 
     * @param classifier	instance of the {@link CLAClassifier} that owns us
     * @param bitNum		activation pattern bit number this history is for,
     *                  	used only for debug messages
     * @param nSteps		number of steps of prediction this history is for, used
     *                  	only for debug messages
     */
    var BitHistory_non_void = function(classifier, bitNum, nSteps) { // (CLAClassifier, int, int)
        that.classifier = classifier;
        that.id = bitNum + "[" + nSteps + "]";
        that.stats = [];
    }

    if (arguments.length === 0) {
        BitHistory_void();
    } else {
        BitHistory_non_void(arguments[0], arguments[1], arguments[2]);
    }
};

BitHistory.prototype = {
    /**
     * Store a new item in our history.
     * <p>
     * This gets called for a bit whenever it is active and learning is enabled
     * <p>
     * Save duty cycle by normalizing it to the same iteration as
     * the rest of the duty cycles which is lastTotalUpdate.
     * <p>
     * This is done to speed up computation in inference since all of the duty
     * cycles can now be scaled by a single number.
     * <p>
     * The duty cycle is brought up to the current iteration only at inference and
     * only when one of the duty cycles gets too large (to avoid overflow to
     * larger data type) since the ratios between the duty cycles are what is
     * important. As long as all of the duty cycles are at the same iteration
     * their ratio is the same as it would be for any other iteration, because the
     * update is simply a multiplication by a scalar that depends on the number of
     * steps between the last update of the duty cycle and the current iteration.
     * 
     * @param iteration		the learning iteration number, which is only incremented
     *             			when learning is enabled
     * @param bucketIdx		the bucket index to store
     */
    store: function(iteration, bucketIdx) { // void(int, int)
        // If lastTotalUpdate has not been set, set it to the current iteration.
        if (this.lastTotalUpdate === -1) {
            this.lastTotalUpdate = iteration;
        }

        // Get the duty cycle stored for this bucket.
        var statsLen = this.stats.length - 1;
        if (bucketIdx > statsLen) {
            for (var i = 0; i < bucketIdx - statsLen; i++) {
                this.stats.push(0);
            }
        }

        // Update it now.
        // duty cycle n steps ago is dc{-n}
        // duty cycle for current iteration is (1-alpha)*dc{-n}*(1-alpha)**(n)+alpha
        var dc = this.stats[bucketIdx];

        // To get the duty cycle from n iterations ago that when updated to the
        // current iteration would equal the dc of the current iteration we simply
        // divide the duty cycle by (1-alpha)**(n). This results in the formula
        // dc'{-n} = dc{-n} + alpha/(1-alpha)**n where the apostrophe symbol is used
        // to denote that this is the new duty cycle at that iteration. This is
        // equivalent to the duty cycle dc{-n}
        var denom = Math.pow((1.0 - this.classifier.alpha), (iteration - this.lastTotalUpdate));

        var dcNew = 0;
        if (denom > 0) {
            dcNew = dc + (this.classifier.alpha / denom);
        }

        // This is to prevent errors associated with infinite rescale if too large
        if (denom === 0 || dcNew > this.DUTY_CYCLE_UPDATE_INTERVAL) {
            var exp = Math.pow((1.0 - this.classifier.alpha), (iteration - this.lastTotalUpdate));
            var dcT = 0;
            for (var i = 0; i < this.stats.length; i++) {
                dcT *= exp;
                this.stats[i] = dcT;
            }

            // Reset time since last update
            this.lastTotalUpdate = iteration;

            // Add alpha since now exponent is 0
            dc = this.stats[bucketIdx] + this.classifier.alpha;
        } else {
            dc = dcNew;
        }

        this.stats[bucketIdx] = dc;
        if (this.classifier.verbosity >= 2) {
            console.log("updated DC for " + id + ",  bucket " + bucketIdx + " to " + dc);
        }
    },

    /**
     * Look up and return the votes for each bucketIdx for this bit.
     * 
     * @param iteration		the learning iteration number, which is only incremented
     *             			when learning is enabled
     * @param votes			array, initialized to all 0's, that should be filled
     *             			in with the votes for each bucket. The vote for bucket index N
     *             			should go into votes[N].
     */
    infer: function(iteration, votes) { // void(int double[])
        // Place the duty cycle into the votes and update the running total for
        // normalization
        var total = 0;
        for (var i = 0; i < this.stats.length; i++) {
            var dc = this.stats[i];
            if (dc > 0) {
                votes[i] = dc;
                total += dc;
            }
        }

        // Experiment... try normalizing the votes from each bit
        if (total > 0) {
            var temp = ArrayUtils.divide(votes, total);
            for (var i = 0; i < temp.length; i++) {
                votes[i] = temp[i];
            }
        }

        if (this.classifier.verbosity >= 2) {
            console.log("bucket votes for " + id + ": " + this.pFormatArray(votes));
        }
    },

    /**
     * Return a string with pretty-print of an array using the given format
     * for each element
     * 
     * @param arr
     * @return
     */
    pFormatArray: function(arr) { // String(double[])
        var sb = "[ ";
        for (var i = 0; i < arr.length; i++) {
            var d = arr[i];
            sb += d + " ";
        }
        sb += " ]";
        return sb;
    }
}