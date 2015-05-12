/**
 * DOCUMENTATION TAKEN DIRECTLY FROM THE PYTHON VERSION:
 *
 * A scalar encoder encodes a numeric (floating point) value into an array
 * of bits. The output is 0's except for a contiguous block of 1's. The
 * location of this contiguous block varies continuously with the input value.
 *
 * The encoding is linear. If you want a nonlinear encoding, just transform
 * the scalar (e.g. by applying a logarithm function) before encoding.
 * It is not recommended to bin the data as a pre-processing step, e.g.
 * "1" = $0 - $.20, "2" = $.21-$0.80, "3" = $.81-$1.20, et as this
 * removes a lot of information and prevents nearby values from overlapping
 * in the output. Instead, use a continuous transformation that scales
 * the data (a piecewise transformation is fine).
 *
 *
 * Parameters:
 * -----------------------------------------------------------------------------
 * w --        The number of bits that are set to encode a single value - the
 *             "width" of the output signal
 *             restriction: w must be odd to avoid centering problems.
 *
 * minval --   The minimum value of the input signal.
 *
 * maxval --   The upper bound of the input signal
 *
 * periodic -- If true, then the input value "wraps around" such that minval = maxval
 *             For a periodic value, the input must be strictly less than maxval,
 *             otherwise maxval is a true upper bound.
 *
 * There are three mutually exclusive parameters that determine the overall size of
 * of the output. Only one of these should be specifed to the constructor:
 *
 * n      --      The number of bits in the output. Must be greater than or equal to w
 * radius --      Two inputs separated by more than the radius have non-overlapping
 *                representations. Two inputs separated by less than the radius will
 *                in general overlap in at least some of their bits. You can think
 *                of this as the radius of the input.
 * resolution --  Two inputs separated by greater than, or equal to the resolution are guaranteed
 *                 to have different representations.
 *
 * Note: radius and resolution are specified w.r.t the input, not output. w is
 * specified w.r.t. the output.
 *
 * Example:
 * day of week.
 * w = 3
 * Minval = 1 (Monday)
 * Maxval = 8 (Monday)
 * periodic = true
 * n = 14
 * [equivalently: radius = 1.5 or resolution = 0.5]
 *
 * The following values would encode midnight -- the start of the day
 * monday (1)   -> 11000000000001
 * tuesday(2)   -> 01110000000000
 * wednesday(3) -> 00011100000000
 * ...
 * sunday (7)   -> 10000000000011
 *
 * Since the resolution is 12 hours, we can also encode noon, as
 * monday noon  -> 11100000000000
 * monday midnight-> 01110000000000
 * tuesday noon -> 00111000000000
 * et
 *
 *
 * It may not be natural to specify "n", especially with non-periodic
 * data. For example, consider encoding an input with a range of 1-10
 * (inclusive) using an output width of 5.  If you specify resolution =
 * 1, this means that inputs of 1 and 2 have different outputs, though
 * they overlap, but 1 and 1.5 might not have different outputs.
 * This leads to a 14-bit representation like this:
 *
 * 1 ->  11111000000000  (14 bits total)
 * 2 ->  01111100000000
 * ...
 * 10->  00000000011111
 * [resolution = 1; n=14; radius = 5]
 *
 * You could specify resolution = 0.5, which gives
 * 1   -> 11111000... (22 bits total)
 * 1.5 -> 011111.....
 * 2.0 -> 0011111....
 * [resolution = 0.5; n=22; radius=2.5]
 *
 * You could specify radius = 1, which gives
 * 1   -> 111110000000....  (50 bits total)
 * 2   -> 000001111100....
 * 3   -> 000000000011111...
 * ...
 * 10  ->                           .....000011111
 * [radius = 1; resolution = 0.2; n=50]
 *
 *
 * An N/M encoding can also be used to encode a binary value,
 * where we want more than one bit to represent each state.
 * For example, we could have: w = 5, minval = 0, maxval = 1,
 * radius = 1 (which is equivalent to n=10)
 * 0 -> 1111100000
 * 1 -> 0000011111
 *
 *
 * Implementation details:
 * --------------------------------------------------------------------------
 * range = maxval - minval
 * h = (w-1)/2  (half-width)
 * resolution = radius / w
 * n = w * range/radius (periodic)
 * n = w * range/radius + 2 * h (non-periodic)
 *
 * @author metaware
 * @author Ralf Seliger (port to JavaScript)
 */
var ScalarEncoder = function() {
    Encoder.call(this);
};

ScalarEncoder.prototype = Object.create(Encoder.prototype);
ScalarEncoder.prototype.constructor = Encoder;

/**
 * Returns a builder for building ScalarEncoders.
 * This builder may be reused to produce multiple builders
 *
 * @return a {@code ScalarEncoder.Builder}
 */
ScalarEncoder.prototype.builder = function() { // Encoder.Builder<ScalarEncoder.Builder, ScalarEncoder>(void)
    return new ScalarEncoder.Builder();
};

/**
 * Returns true if the underlying encoder works on deltas
 */
ScalarEncoder.prototype.isDelta = function() { // boolean(void)
    return false;
};

/**
 * w -- number of bits to set in output
 * minval -- minimum input value
 * maxval -- maximum input value (input is strictly less if periodic == True)
 *
 * Exactly one of n, radius, resolution must be set. "0" is a special
 * value that means "not set".
 *
 * n -- number of bits in the representation (must be > w)
 * radius -- inputs separated by more than, or equal to this distance will have non-overlapping
 * representations
 * resolution -- inputs separated by more than, or equal to this distance will have different
 * representations
 *
 * name -- an optional string which will become part of the description
 *
 * clipInput -- if true, non-periodic inputs smaller than minval or greater
 * than maxval will be clipped to minval/maxval
 *
 * forced -- if true, skip some safety checks (for compatibility reasons), default false
 */
ScalarEncoder.prototype.init = function() { // void(void)
    if (this.getW() % 2 == 0) {
        throw new Error(
            "W must be an odd number (to eliminate centering difficulty)");
    }

    this.setHalfWidth((this.getW() - 1) / 2);

    // For non-periodic inputs, padding is the number of bits "outside" the range,
    // on each side. I.e. the representation of minval is centered on some bit, and
    // there are "padding" bits to the left of that centered bit; similarly with
    // bits to the right of the center bit of maxval
    this.setPadding(this.isPeriodic() ? 0 : this.getHalfWidth());

    if (!Number.isNaN(this.getMinVal()) && !Number.isNaN(this.getMaxVal())) {
        if (this.getMinVal() >= this.getMaxVal()) {
            throw new Error("maxVal must be > minVal");
        }
        this.setRangeInternal(this.getMaxVal() - this.getMinVal());
    }

    // There are three different ways of thinking about the representation. Handle
    // each case here.
    this.initEncoder(this.getW(), this.getMinVal(), this.getMaxVal(), this.getN(), this.getRadius(), this.getResolution());

    //nInternal represents the output area excluding the possible padding on each side
    this.setNInternal(this.getN() - 2 * this.getPadding());

    if (isNullOrUndefined(this.getName())) {
        if ((this.getMinVal() % this.getMinVal()) > 0 ||
            (this.getMaxVal() % this.getMaxVal()) > 0) {
            this.setName("[" + this.getMinVal() + ":" + this.getMaxVal() + "]");
        } else {
            this.setName("[" + parseInt(this.getMinVal()) + ":" + parseInt(this.getMaxVal()) + "]");
        }
    }

    //Checks for likely mistakes in encoder settings
    if (!this.isForced()) {
        this.checkReasonableSettings();
    }
    var name = this.getName();
    var val = name === "None" ? "[" + parseInt(this.getMinVal()) + ":" + parseInt(this.getMaxVal()) + "]" : name;
    this.description.push(new Tuple(val, 0));
};

/**
 * There are three different ways of thinking about the representation.
 * Handle each case here.
 *
 * @param c
 * @param minVal
 * @param maxVal
 * @param n
 * @param radius
 * @param resolution
 */
ScalarEncoder.prototype.initEncoder = function(w, minVal, maxVal, n, radius, resolution) { // void(int, double, double, int, double, double)
    if (n !== 0) {
        if (!NUmber.isNaN(minVal) && !Number.isNaN(maxVal)) {
            if (!this.isPeriodic()) {
                this.setResolution(this.getRangeInternal() / (this.getN() - this.getW()));
            } else {
                this.setResolution(this.getRangeInternal() / this.getN());
            }

            this.setRadius(this.getW() * this.getResolution());

            if (this.isPeriodic()) {
                this.setRange(this.getRangeInternal());
            } else {
                this.setRange(this.getRangeInternal() + this.getResolution());
            }
        }
    } else {
        if (radius !== 0) {
            this.setResolution(this.getRadius() / w);
        } else if (resolution !== 0) {
            this.setRadius(this.getResolution() * w);
        } else {
            throw new Error(
                "One of n, radius, resolution must be specified for a ScalarEncoder");
        }

        if (this.isPeriodic()) {
            this.setRange(this.getRangeInternal());
        } else {
            this.setRange(this.getRangeInternal() + this.getResolution());
        }

        var nFloat = w * (this.getRange() / this.getRadius()) + 2 * this.getPadding();
        this.setN(Math.ceil(nFloat));
    }
};

/**
 * Return the bit offset of the first bit to be set in the encoder output.
 * For periodic encoders, this can be a negative number when the encoded output
 * wraps around.
 *
 * @param c			the memory
 * @param input		the input data
 * @return			an encoded array
 */
ScalarEncoder.prototype.getFirstOnBit = function(input) { // Integer(double)
    if (input === this.SENTINEL_VALUE_FOR_MISSING_DATA) {
        return null;
    } else {
        if (input < this.getMinVal()) {
            if (this.clipInput() && !this.isPeriodic()) {
                this.LOGGER.info("Clipped input " + this.getName() + "=" + input + " to minval " + this.getMinVal());
                input = this.getMinVal();
            } else {
                throw new Error("input (" + input + ") less than range (" +
                    this.getMinVal() + " - " + this.getMaxVal());
            }
        }
    }

    if (this.isPeriodic()) {
        if (input >= getMaxVal()) {
            throw new IllegalStateException("input (" + input + ") greater than periodic range (" +
                getMinVal() + " - " + getMaxVal());
        }
    } else {
        if (input > this.getMaxVal()) {
            if (this.clipInput()) {
                this.LOGGER.info("Clipped input " + this.getName() + "=" + input + " to maxval " + this.getMaxVal());
                input = this.getMaxVal();
            } else {
                throw new Error("input (" + input + ") greater than periodic range (" +
                    this.getMinVal() + " - " + this.getMaxVal());
            }
        }
    }

    var centerbin;
    if (this.isPeriodic()) {
        centerbin = (input - this.getMinVal()) * this.getNInternal() / this.getRange() + this.getPadding();
    } else {
        centerbin = (input - this.getMinVal() + this.getResolution() / 2) / this.getResolution() + this.getPadding();
    }

    return centerbin - this.getHalfWidth();
};

/**
 * Check if the settings are reasonable for the SpatialPooler to work
 * @param c
 */
ScalarEncoder.prototype.checkReasonableSettings = function() { // void(void)
    if (this.getW() < 21) {
        throw new Error(
            "Number of bits in the SDR must be greater than 2, and recommended >= 21 (use forced=True to override)");
    }
};

/**
 * {@inheritDoc}
 */
ScalarEncoder.prototype.getDecoderOutputFieldTypes = function() { // List<FieldMetaType>(void)
    return ["float"];
};

/**
 * Should return the output width, in bits.
 */
ScalarEncoder.prototype.getWidth = function() { // int(void)
    return this.getN();
};

/**
 * {@inheritDoc}
 * NO-OP
 */
ScalarEncoder.prototype.getBucketIndices = function(input) { // int[](Striing) 
    return null;
};

/**
 * Returns the bucket indices.
 *
 * @param	input
 */
ScalarEncoder.prototype.getBucketIndices = function(input) { // int[](double)
    var minbin = this.getFirstOnBit(input);

    //For periodic encoders, the bucket index is the index of the center bit
    var bucketIdx;
    if (this.isPeriodic()) {
        bucketIdx = minbin + this.getHalfWidth();
        if (bucketIdx < 0) {
            bucketIdx += this.getN();
        }
    } else { //for non-periodic encoders, the bucket index is the index of the left bit
        bucketIdx = minbin;
    }

    return [bucketIdx];
};

/**
 * Encodes inputData and puts the encoded value into the output array,
 * which is a 1-D array of length returned by {@link Connections#getW()}.
 *
 * Note: The output array is reused, so clear it before updating it.
 * @param inputData Data to encode. This should be validated by the encoder.
 * @param output 1-D array of same length returned by {@link Connections#getW()}
 */
ScalarEncoder.prototype.encodeIntoArray = function(input, output) { // void(Double, int[])
    if (Number.isNaN(input)) {
        output.fill(0);
        return;
    }

    var bucketVal = this.getFirstOnBit(input);
    if (!isNullOrUndefined(bucketVal)) {
        var bucketIdx = bucketVal;
        output.fill(0);
        var minbin = bucketIdx;
        var maxbin = minbin + 2 * this.getHalfWidth();
        if (this.isPeriodic()) {
            if (maxbin >= this.getN()) {
                var bottombins = maxbin - this.getN() + 1;
                var range = ArrayUtils.range(0, bottombins);
                ArrayUtils.setIndexesTo(output, range, 1);
                maxbin = this.getN() - 1;
            }
            if (minbin < 0) {
                var topbins = -minbin;
                ArrayUtils.setIndexesTo(
                    output, ArrayUtils.range(this.getN() - topbins, this.getN()), 1);
                minbin = 0;
            }
        }

        ArrayUtils.setIndexesTo(output, ArrayUtils.range(minbin, maxbin + 1), 1);
    }

    this.LOGGER.trace("");
    this.LOGGER.trace("input: " + input);
    this.LOGGER.trace("range: " + this.getMinVal() + " - " + this.getMaxVal());
    this.LOGGER.trace("n:" + this.getN() + "w:" + this.getW() + "resolution:" + this.getResolution() +
        "radius:" + this.getRadius() + "periodic:" + this.isPeriodic());
    this.LOGGER.trace("output: " + output.toString());
    this.LOGGER.trace("input desc: " + this.decode(output, ""));
};

/**
 * Returns a {@link DecodeResult} which is a tuple of range names
 * and lists of {@link RangeLists} in the first entry, and a list
 * of descriptions for each range in the second entry.
 *
 * @param encoded			the encoded bit vector
 * @param parentFieldName	the field the vector corresponds with
 * @return
 */
ScalarEncoder.prototype.decode = function(encoded, parentFieldName) { // DecodeResult(int[], String)
    // For now, we simply assume any top-down output greater than 0
    // is ON. Eventually, we will probably want to incorporate the strength
    // of each top-down output.
    if (isNullOrUndefined(encoded) || encoded.length < 1) {
        return null;
    }
    var tmpOutput = copyOf(encoded);

    // ------------------------------------------------------------------------
    // First, assume the input pool is not sampled 100%, and fill in the
    //  "holes" in the encoded representation (which are likely to be present
    //  if this is a coincidence that was learned by the SP).

    // Search for portions of the output that have "holes"
    var maxZerosInARow = this.getHalfWidth();
    for (var i = 0; i < this.maxZerosInARow; i++) {
        var searchStr = newArray(i + 3, 1);
        ArrayUtils.setRangeTo(searchStr, 1, -1, 0);
        var subLen = searchStr.length;

        // Does this search string appear in the output?
        if (this.isPeriodic()) {
            for (var j = 0; j < this.getN(); j++) {
                var outputIndices = ArrayUtils.range(j, j + subLen);
                outputIndices = ArrayUtils.modulo(outputIndices, this.getN());
                if (equals(searchStr, ArrayUtils.sub(tmpOutput, outputIndices))) {
                    ArrayUtils.setIndexesTo(tmpOutput, outputIndices, 1);
                }
            }
        } else {
            for (var j = 0; j < this.getN() - subLen + 1; j++) {
                if (equals(searchStr, ArrayUtils.sub(tmpOutput, ArrayUtils.range(j, j + subLen)))) {
                    ArrayUtils.setRangeTo(tmpOutput, j, j + subLen, 1);
                }
            }
        }
    }

    this.LOGGER.trace("raw output:" + ArrayUtils.sub(encoded, ArrayUtils.range(0, this.getN())).toString());
    this.LOGGER.trace("filtered output:" + tmpOutput.toString());

    // ------------------------------------------------------------------------
    // Find each run of 1's.
    var nz = ArrayUtils.where(tmpOutput, function {
        return n > 0;
    });
    var runs = []; //will be tuples of (startIdx, runLength)
    nz.sort(function(a, b) {
        return a - b;
    });
    var run = [nz[0], 1];
    var i = 1;
    while (i < nz.length) {
        if (nz[i] === run[0] + run[1]) {
            run[1] += 1;
        } else {
            runs.push(new Tuple(run[0], run[1]));
            run = [nz[i], 1];
        }
        i += 1;
    }
    runs.push(new Tuple(run[0], run[1]));

    // If we have a periodic encoder, merge the first and last run if they
    // both go all the way to the edges
    if (this.isPeriodic() && runs.length > 1) {
        var l = runs.length - 1;
        if (runs[0].get(0) === 0 && runs[l].get(0) + runs[l].get(1) === this.getN()) {
            runs[l] = new Tuple(runs[l].get(0),
                runs[l].get(1) + runs[0].get(1));
            runs = runs.slice(1, runs.length);
        }
    }

    // ------------------------------------------------------------------------
    // Now, for each group of 1's, determine the "left" and "right" edges, where
    // the "left" edge is inset by halfwidth and the "right" edge is inset by
    // halfwidth.
    // For a group of width w or less, the "left" and "right" edge are both at
    // the center position of the group.
    var left = 0;
    var right = 0;
    var ranges = [];
    for (var tupleRun in runs) {
        var start = tupleRun.get(0);
        var runLen = tupleRun.get(1);
        if (runLen <= this.getW()) {
            left = right = start + runLen / 2;
        } else {
            left = start + this.getHalfWidth();
            right = start + runLen - 1 - this.getHalfWidth();
        }

        var inMin, inMax;
        // Convert to input space.
        if (!this.isPeriodic()) {
            inMin = (left - this.getPadding()) * this.getResolution() + this.getMinVal();
            inMax = (right - this.getPadding()) * this.getResolution() + this.getMinVal();
        } else {
            inMin = (left - this.getPadding()) * this.getRange() / this.getNInternal() + this.getMinVal();
            inMax = (right - this.getPadding()) * this.getRange() / this.getNInternal() + this.getMinVal();
        }
        // Handle wrap-around if periodic
        if (this.isPeriodic()) {
            if (inMin >= this.getMaxVal()) {
                inMin -= this.getRange();
                inMax -= this.getRange();
            }
        }

        // Clip low end
        if (inMin < this.getMinVal()) {
            inMin = this.getMinVal();
        }
        if (inMax < this.getMinVal()) {
            inMax = this.getMinVal();
        }

        // If we have a periodic encoder, and the max is past the edge, break into
        // 	2 separate ranges
        if (this.isPeriodic() && inMax >= this.getMaxVal()) {
            ranges.push(new MinMax(inMin, this.getMaxVal()));
            ranges.push(new MinMax(this.getMinVal(), inMax - this.getRange()));
        } else {
            if (inMax > this.getMaxVal()) {
                inMax = this.getMaxVal();
            }
            if (inMin > this.getMaxVal()) {
                inMin = this.getMaxVal();
            }
            ranges.push(new MinMax(inMin, inMax));
        }
    }

    var desc = this.generateRangeDescription(ranges);
    var fieldName;
    // Return result
    if (!isNullOrUndefined(parentFieldName) && !(parentFieldName.length === 0)) {
        fieldName = parentFieldName + "." + this.getName();
    } else {
        fieldName = this.getName();
    }

    var inner = new RangeList(ranges, desc);
    var fieldsDict = new Map(); // new WeakMap();
    fieldsDict.put(fieldName, inner);

    return new DecodeResult(fieldsDict, [fieldName]);
};

/**
 * Generate description from a text description of the ranges
 *
 * @param	ranges		A list of {@link MinMax}es.
 */
ScalarEncoder.prototype.generateRangeDescription = function(ranges) { // String(List<MinMax>)
    var desc = "";
    var numRanges = ranges.length;
    for (var i = 0; i < numRanges; i++) {
        if (ranges[i].min() != ranges[i].max()) {
            desc += ranges[i].min() + "-" + ranges[i].max();
        } else {
            desc += ranges[i].min();
        }
        if (i < numRanges - 1) {
            desc += ", ";
        }
    }
    return desc;
};

/**
 * Return the internal topDownMapping matrix used for handling the
 * bucketInfo() and topDownCompute() methods. This is a matrix, one row per
 * category (bucket) where each row contains the encoded output for that
 * category.
 *
 * @param c		the connections memory
 * @return		the internal topDownMapping
 */
ScalarEncoder.prototype.getTopDownMapping: function() { // SparseObjectMatrix<int[]>(void)

    if (isNullOrUndefined(this.topDownMapping)) {
        //The input scalar value corresponding to each possible output encoding
        if (this.isPeriodic()) {
            this.setTopDownValues(
                ArrayUtils.arange(this.getMinVal() + this.getResolution() / 2.0,
                    this.getMaxVal(), this.getResolution()));
        } else {
            //Number of values is (max-min)/resolutions
            this.setTopDownValues(
                ArrayUtils.arange(this.getMinVal(), this.getMaxVal() + this.getResolution() / 2.0,
                    this.getResolution()));
        }
    }

    //Each row represents an encoded output pattern
    var numCategories = this.getTopDownValues().length;
    var topDownMapping = new SparseObjectMatrix([numCategories]);
    this.setTopDownMapping(topDownMapping);

    var topDownValues = this.getTopDownValues();
    var outputSpace = newArray(this.getN(), 0);
    var minVal = this.getMinVal();
    var maxVal = this.getMaxVal();
    for (var i = 0; i < numCategories; i++) {
        var value = topDownValues[i];
        value = Math.max(value, minVal);
        value = Math.min(value, maxVal);
        this.encodeIntoArray(value, outputSpace);
        this.topDownMapping.set(i, copyOf(outputSpace, outputSpace.length));
    }

    return topDownMapping;
};

/**
 * {@inheritDoc}
 *
 * @param <S>	the input value, in this case a double
 * @return	a list of one input double
 */
ScalarEncoder.prototype.getScalars = function(d) { // <S> TDoubleList(S)
    var retVal = [];
    retVal.push(d);
    return retVal;
};

/**
 * Returns a list of items, one for each bucket defined by this encoder.
 * Each item is the value assigned to that bucket, this is the same as the
 * EncoderResult.value that would be returned by getBucketInfo() for that
 * bucket and is in the same format as the input that would be passed to
 * encode().
 *
 * This call is faster than calling getBucketInfo() on each bucket individually
 * if all you need are the bucket values.
 *
 * @param	returnType 		class type parameter so that this method can return encoder
 * 							specific value types
 *
 * @return list of items, each item representing the bucket value for that
 *        bucket.
 */
ScalarEncoder.prototype.getBucketValues = function(t) { // <S> List<S>(Class<S>)
    if (isNullOrUndefined(bucketValues)) {
        var topDownMapping = this.getTopDownMapping();
        var numBuckets = topDownMapping.getMaxIndex() + 1;
        bucketValues = [];
        for (var i = 0; i < numBuckets; i++) {
            bucketValues.push(this.getBucketInfo([i])[0].get(1));
        }
    }
    return bucketValues;
};

/**
 * {@inheritDoc}
 */
ScalarEncoder.prototype.getBucketInfo = function(buckets) { // List<EncoderResult>(int[])
    var topDownMapping = this.getTopDownMapping();

    //The "category" is simply the bucket index
    var category = buckets[0];
    var encoding = this.topDownMapping.getObject(category);

    //Which input value does this correspond to?
    var inputVal;
    if (this.isPeriodic()) {
        inputVal = this.getMinVal() + this.getResolution() / 2 + category * this.getResolution();
    } else {
        inputVal = this.getMinVal() + category * this.getResolution();
    }

    return new EncoderResult(inputVal, inputVal, encoding);
};

/**
 * {@inheritDoc}
 */
ScalarEncoder.prototype.topDownCompute = function(encoded) { // List<EncoderResult>(int[])
    //Get/generate the topDown mapping table
    var topDownMapping = this.getTopDownMapping();

    // See which "category" we match the closest.
    var category = ArrayUtils.argmax(this.rightVecProd(topDownMapping, encoded));

    return this.getBucketInfo([category]);
};

/**
 * Returns a list of {@link Tuple}s which in this case is a list of
 * key value parameter values for this {@code ScalarEncoder}
 *
 * @return	a list of {@link Tuple}s
 */
ScalarEncoder.prototype.dict = function() { // List<Tuple>(void)
    var l = [];
    l.push(new Tuple("maxval", this.getMaxVal()));
    l.push(new Tuple("bucketValues", this.getBucketValues("double")));
    l.push(new Tuple("nInternal", this.getNInternal()));
    l.push(new Tuple("name", this.getName()));
    l.push(new Tuple("minval", this.getMinVal()));
    l.push(new Tuple("topDownValues", this.getTopDownValues.toString()));
    l.push(new Tuple("clipInput", this.clipInput()));
    l.push(new Tuple("n", this.getN()));
    l.push(new Tuple("padding", this.getPadding()));
    l.push(new Tuple("range", this.getRange()));
    l.push(new Tuple("periodic", this.isPeriodic()));
    l.push(new Tuple("radius", this.getRadius()));
    l.push(new Tuple("w", this.getW()));
    l.push(new Tuple("topDownMappingM", this.getTopDownMapping()));
    l.push(new Tuple("halfwidth", this.getHalfWidth()));
    l.push(new Tuple("resolution", this.getResolution()));
    l.push(new Tuple("rangeInternal", this.getRangeInternal()));

    return l;
};

/**
 * Returns a {@link EncoderBuilder} for constructing {@link ScalarEncoder}s
 *
 * The base class architecture is put together in such a way where boilerplate
 * initialization can be kept to a minimum for implementing subclasses, while avoiding
 * the mistake-proneness of extremely long argument lists.
 *
 * @see ScalarEncoder.Builder#setStuff(int)
 */
var Builder = function() {
    Encoder.Builder.call(this);
};

Builder.prototype = Object.create(Encoder.Builder.prototype);
Builder.prototype.constructor = Builder;

Builder.prototype.build = function() {
    //Must be instantiated so that super class can initialize
    //boilerplate variables.
    this.encoder = new ScalarEncoder();

    //Call super class here
    Encoder.Builder.build();

    ////////////////////////////////////////////////////////
    //  Implementing classes would do setting of specific //
    //  vars here together with any sanity checking       //
    ////////////////////////////////////////////////////////

    this.encoder.init();
    return this.encoder;
};