/**
 * <pre>
 * An encoder takes a value and encodes it with a partial sparse representation
 * of bits.  The Encoder superclass implements:
 * - encode() - returns an array encoding the input; syntactic sugar
 *   on top of encodeIntoArray. If pprint, prints the encoding to the terminal
 * - pprintHeader() -- prints a header describing the encoding to the terminal
 * - pprint() -- prints an encoding to the terminal
 *
 * Methods/properties that must be implemented by subclasses:
 * - getDecoderOutputFieldTypes()   --  must be implemented by leaf encoders; returns
 *                                      [`nupic.data.fieldmeta.FieldMetaType.XXXXX`]
 *                                      (e.g., [nupic.data.fieldmetaFieldMetaType.float])
 * - getWidth()                     --  returns the output width, in bits
 * - encodeIntoArray()              --  encodes input and puts the encoded value into the output array,
 *                                      which is a 1-D array of length returned by getWidth()
 * - getDescription()               --  returns a list of (name, offset) pairs describing the
 *                                      encoded output
 * </pre>
 *
 * <P>
 * Typical usage is as follows:
 * <PRE>
 * CategoryEncoder.Builder builder =  ((CategoryEncoder.Builder)CategoryEncoder.builder())
 *      .w(3)
 *      .radius(0.0)
 *      .minVal(0.0)
 *      .maxVal(8.0)
 *      .periodic(false)
 *      .forced(true);
 *
 * CategoryEncoder encoder = builder.build();
 *
 * <b>Above values are <i>not</i> an example of "sane" values.</b>
 *
 * </PRE>
 * @author Numenta
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
var Encoder = function() {
    this.LOGGER = LoggerFactory.getLogger(); // Logger

    /** Value used to represent no data */
    this.SENTINEL_VALUE_FOR_MISSING_DATA = NaN; // double
    this.description = []; // List<Tuple>

    /** The number of bits that are set to encode a single value - the
     * "width" of the output signal
     */
    this.w = 0; // int
    /** number of bits in the representation (must be >= w) */
    this.n = 0; // int
    /** the half width value */
    this.halfWidth; // int
    /**
     * inputs separated by more than, or equal to this distance will have non-overlapping
     * representations
     */
    this.radius = 0; // double
    /** inputs separated by more than, or equal to this distance will have different representations */
    this.resolution = 0; // double
    /**
     * If true, then the input value "wraps around" such that minval = maxval
     * For a periodic value, the input must be strictly less than maxval,
     * otherwise maxval is a true upper bound.
     */
    this.periodic = true; // boolean
    /** The minimum value of the input signal.  */
    this.minVal = 0; // double
    /** The maximum value of the input signal. */
    this.maxVal = 0; // double
    /** if true, non-periodic inputs smaller than minval or greater
            than maxval will be clipped to minval/maxval */
    this.clipInput; // boolean
    /** if true, skip some safety checks (for compatibility reasons), default false */
    this.forced; // boolean
    /** Encoder name - an optional string which will become part of the description */
    this.name = ""; // String
    this.padding; // int
    this.nInternal; // int
    this.rangeInternal; // double
    this.range; // double
    this.encLearningEnabled; // boolean
    this.flattenedFieldTypeList; // List<FieldMetaType>
    this.decoderFieldTypes; // Map<Tuple, List<FieldMetaType>>
    /**
     * This matrix is used for the topDownCompute. We build it the first time
     * topDownCompute is called
     */
    this.topDownMapping; // SparseObjectMatrix<int[]>
    this.topDownValues; // double[]
    this.bucketValues; // List<?>
    this.encoders; // LinkedHashMap<EncoderTuple, List<EncoderTuple>>
    this.scalarNames; // List<String>
};

Encoder.prototype = {
        /**
         * Sets the "w" or width of the output signal
         * <em>Restriction:</em> w must be odd to avoid centering problems.
         * @param w
         */
        setW: function(w) { // void(int)
            this.w = w;
        },

        /**
         * Returns w
         * @return
         */
        getW: function() { // int(void)
            return this.w;
        },

        /**
         * Half the width
         * @param hw
         */
        setHalfWidth: function(hw) { // void(int)
            this.halfWidth = hw;
        },

        /**
         * For non-periodic inputs, padding is the number of bits "outside" the range,
         * on each side. I.e. the representation of minval is centered on some bit, and
         * there are "padding" bits to the left of that centered bit; similarly with
         * bits to the right of the center bit of maxval
         *
         * @param padding
         */
        setPadding: function(padding) { // void(int)
            this.padding = padding;
        },

        /**
         * For non-periodic inputs, padding is the number of bits "outside" the range,
         * on each side. I.e. the representation of minval is centered on some bit, and
         * there are "padding" bits to the left of that centered bit; similarly with
         * bits to the right of the center bit of maxval
         *
         * @return
         */
        getPadding: function() { // int(void)
            return this.padding;
        },

        /**
         * Sets rangeInternal
         * @param r
         */
        setRangeInternal: function(r) { // void(double)
            this.rangeInternal = r;
        },

        /**
         * Returns the range internal value
         * @return
         */
        getRangeInternal: function() { // double(void)
            return this.rangeInternal;
        },

        /**
         * Sets the range
         * @param range
         */
        setRange: function(range) { // void(double)
            this.range = range;
        },

        /**
         * Returns the range
         * @return
         */
        getRange: function() { // double(void)
            return this.range;
        },

        /**
         * nInternal represents the output area excluding the possible padding on each side
         *
         * @param n
         */
        setNInternal: function(n) { // void(int)
            this.nInternal = n;
        },

        /**
         * nInternal represents the output area excluding the possible padding on each
         * side
         * @return
         */
        getNInternal: function() { // int(void)
            return this.nInternal;
        },

        /**
         * This matrix is used for the topDownCompute. We build it the first time
         * topDownCompute is called
         *
         * @param sm
         */
        setTopDownMapping: function(sm) { // void(SparseObjectMatrix<int[]>)
            this.topDownMapping = sm;
        },

        /**
         * Range of values.
         * @param values
         */
        setTopDownValues: function(values) { // void(double[])
            this.topDownValues = values;
        },

        /**
         * Returns the top down range of values
         * @return
         */
        getTopDownValues: function() { // double[](void)
            return this.topDownValues;
        },

        /**
         * Return the half width value.
         * @return
         */
        getHalfWidth: function() { // int(void)
            return this.halfWidth;
        },

        /**
         * The number of bits in the output. Must be greater than or equal to w
         * @param n
         */
        setN: function(n) { // void(int)
            this.n = n;
        },

        /**
         * Returns n
         * @return
         */
        getN: function() { // int(void) {
            return this.n;
        },

        /**
         * The minimum value of the input signal.
         * @param minVal
         */
        setMinVal: function(minVal) { // void(double)
            this.minVal = minVal;
        },

        /**
         * Returns minval
         * @return
         */
        getMinVal: function() { // double(void)
            return this.minVal;
        },

        /**
         * The maximum value of the input signal.
         * @param maxVal
         */
        setMaxVal: function(maxVal) { // void(double)
            this.maxVal = maxVal;
        },

        /**
         * Returns maxval
         * @return
         */
        getMaxVal: function() { // double(void)
            return this.maxVal;
        },

        /**
         * inputs separated by more than, or equal to this distance will have non-overlapping
         * representations
         *
         * @param radius
         */
        setRadius: function(radius) { // void(double)
            this.radius = radius;
        },

        /**
         * Returns the radius
         * @return
         */
        getRadius: function() { // double(void)
            return this.radius;
        },

        /**
         * inputs separated by more than, or equal to this distance will have different
         * representations
         *
         * @param resolution
         */
        setResolution: function(resolution) { // void(double)
            this.resolution = resolution;
        },

        /**
         * Returns the resolution
         * @return
         */
        getResolution: function() { // double(void)
            return this.resolution;
        },

        /**
         * If true, non-periodic inputs smaller than minval or greater
         * than maxval will be clipped to minval/maxval
         * @param b
         */
        setClipInput: function(b) { // void(boolean)
            this.clipInput = b;
        },

        /**
         * Returns the clip input flag
         * @return
         */
        clipInput: function() { // boolean(void)
            return this.clipInput;
        },

        /**
         * If true, then the input value "wraps around" such that minval = maxval
         * For a periodic value, the input must be strictly less than maxval,
         * otherwise maxval is a true upper bound.
         *
         * @param b
         */
        setPeriodic: function(b) { // void(boolean)
            this.periodic = b;
        },

        /**
         * Returns the periodic flag
         * @return
         */
        isPeriodic: function() { // boolean(void)
            return this.periodic;
        },

        /**
         * If true, skip some safety checks (for compatibility reasons), default false
         * @param b
         */
        setForced: function(b) { // void(boolean)
            this.forced = b;
        },

        /**
         * Returns the forced flag
         * @return
         */
        isForced: function() { // boolean(void)
            return this.forced;
        },

        /**
         * An optional string which will become part of the description
         * @param name
         */
        setName: function(name) { // void(String)
            this.name = name;
        },

        /**
         * Returns the optional name
         * @return
         */
        getName: function() { // String(void)
            return this.name;
        },

        /**
         * Adds a the specified {@link Encoder} to the list of the specified
         * parent's {@code Encoder}s.
         *
         * @param parent	the parent Encoder
         * @param name		Name of the {@link Encoder}
         * @param e			the {@code Encoder}
         * @param offset	the offset of the encoded output the specified encoder
         * 					was used to encode.
         */
        addEncoder: function(parent, name, child, offset) { // void(Encoder<T>, String, Encoder<T>, int)
            if (isNullOrUndefined(this.encoders)) {
                this.encoders = new Map(); //new WeakMap();
            }

            var key = this.getEncoderTuple(parent);
            // Insert a new Tuple for the parent if not yet added.
            if (isNullOrUndefined(key)) {
                key = new EncoderTuple("", this, 0);
                this.encoders.set(key, []);
            }

            var childEncoders = this.encoders.get(key);
            if (isNullOrUndefined(childEncoders)) {
                childEncoders = [];
                this.encoders.set(key, childEncoders);
            }
            childEncoders.push(new EncoderTuple(name, child, offset));
        },

        /**
         * Returns the {@link Tuple} containing the specified {@link Encoder}
         * @param e		the Encoder the return value should contain
         * @return		the {@link Tuple} containing the specified {@link Encoder}
         */
        getEncoderTuple: function(e) { // EncoderTuple(Encoder<T>)
            if (isNullOrUndefined(this.encoders)) {
                this.encoders = new Map(); //new WeakMap();
            }

            for (var tuple in this.encoders.keys()) {
                if (tuple.getEncoder().equals(e)) {
                    return tuple;
                }
            }
            return null;
        },

        getEncoders: function() {

            var that = this;

            /**
             * Returns the list of child {@link Encoder} {@link Tuple}s
             * corresponding to the specified {@code Encoder}
             *
             * @param e		the parent {@link Encoder} whose child Encoder Tuples are being returned
             * @return		the list of child {@link Encoder} {@link Tuple}s
             */
            var getEncodersFromEncoder = function(e) { // List<EncoderTuple>(Encoder<T>)
                return that.getEncoders().get(that.getEncoderTuple(e));
            };

            /**
             * Returns the list of {@link Encoder}s
             * @return
             */
            var getEncodersFromVoid = function() { // Map<EncoderTuple, List<EncoderTuple>>(void)
                if (isNullOrUndefined(that.encoders)) {
                    that.encoders = new Map(); // new WeakMap();
                }
                return that.encoders;
            };

            if (arguments.length === 1) {
                return getEncodersFromEncoder(arguments[0]);
            } else {
                return getEncodersFromVoid();
            }
        },

        /**
         * Sets the encoder flag indicating whether learning is enabled.
         *
         * @param	encLearningEnabled	true if learning is enabled, false if not
         */
        setLearningEnabled: function(encLearningEnabled) { // void(boolean)
            this.encLearningEnabled = encLearningEnabled;
        },

        /**
         * Returns a flag indicating whether encoder learning is enabled.
         */
        isEncoderLearningEnabled: function() { // boolean(void)
            return this.encLearningEnabled;
        },

        /**
         * Returns the list of all field types of the specified {@link Encoder}.
         *
         * @return	List<FieldMetaType>
         */
        getFlattenedFieldTypeList: function(e) { // List<FieldMetaType>(Encoder<T>)
            if (isNullOrUndefined(this.decoderFieldTypes)) {
                this.decoderFieldTypes = new Map(); // new WeakMap();
            }

            var key = this.getEncoderTuple(e);
            var fieldTypes = this.decoderFieldTypes.get(key);
            if ((isNullOrUndefined(fieldTypes)) {
                    fieldTypes = [];
                    this.decoderFieldTypes.set(key, fieldTypes);
                }
                return fieldTypes;
            },

            /**
             * Returns the list of all field types of a parent {@link Encoder} and all
             * leaf encoders flattened in a linear list which does not retain any parent
             * child relationship information.
             *
             * @return	List<FieldMetaType>
             */
            getFlattenedFieldTypeList: function() { // List<FieldMetaType>(void)
                    return this.flattenedFieldTypeList;
                },

                /**
                 * Sets the list of flattened {@link FieldMetaType}s
                 *
                 * @param l		list of {@link FieldMetaType}s
                 */
                setFlattenedFieldTypeList: function(l) { // void(List<FieldMetaType>)
                    this.flattenedFieldTypeList = l;
                },

                /**
                 * Returns the names of the fields
                 *
                 * @return	the list of names
                 */
                getScalarNames: function() { // List<String>(void)
                    return this.scalarNames;
                },

                /**
                 * Sets the names of the fields
                 *
                 * @param names	the list of names
                 */
                setScalarNames: function(names) { // void(List<String>)
                    this.scalarNames = names;
                },

                ///////////////////////////////////////////////////////////

                /**
                 * Should return the output width, in bits.
                 */
                getWidth: function() { // int(void)
                    throw new Error("getWidth must be overloaded.");
                },

                /**
                 * Returns true if the underlying encoder works on deltas
                 */
                isDelta: function() { // boolean(void)
                    throw new Error("isDelta must be overloaded.");
                },

                /**
                 * Encodes inputData and puts the encoded value into the output array,
                 * which is a 1-D array of length returned by {@link #getW()}.
                 *
                 * Note: The output array is reused, so clear it before updating it.
                 * @param inputData Data to encode. This should be validated by the encoder.
                 * @param output 1-D array of same length returned by {@link #getW()}
                 *
                 * @return
                 */
                encodeIntoArray: function(inputData, output) { // void(T, output)
                    throw new Error("encodeIntoArray must be overloaded.");
                },

                /**
                 * Set whether learning is enabled.
                 * @param 	learningEnabled		flag indicating whether learning is enabled
                 */
                setLearning: function(learningEnabled) { // void(boolean)
                    this.setLearningEnabled(learningEnabled);
                },

                /**
                 * This method is called by the model to set the statistics like min and
                 * max for the underlying encoders if this information is available.
                 * @param	fieldName			fieldName name of the field this encoder is encoding, provided by
                 *     							{@link MultiEncoder}
                 * @param	fieldStatistics		fieldStatistics dictionary of dictionaries with the first level being
                 *     							the fieldName and the second index the statistic ie:
                 *     							fieldStatistics['pounds']['min']
                 */
                setFieldStats: function(fieldName, fieldStatistics) { // void(String, Map<String, Double>)
                    throw new Error("setFieldStats must be overloaded.");
                },

                /**
                 * Convenience wrapper for {@link #encodeIntoArray(double, int[])}
                 * @param inputData		the input scalar
                 *
                 * @return	an array with the encoded representation of inputData
                 */
                encode: function(inputData) { // int[](T)
                    var output = newArray(this.getN(), 0);
                    this.encodeIntoArray(inputData, output);
                    return output;
                },

                /**
                 * Return the field names for each of the scalar values returned by
                 * .
                 * @param parentFieldName	parentFieldName The name of the encoder which is our parent. This name
                 *     						is prefixed to each of the field names within this encoder to form the
                 *      					keys of the dict() in the retval.
                 *
                 * @return
                 */
                getScalarNames: function(parentFieldName) { // List<String>(String)
                    var names = [];
                    if (!isNullOrUndefined(this.getEncoders()) {
                            var encoders = this.getEncoders(this);
                            for (var tuple in encoders) {
                                var subNames = tuple.get(1)).getScalarNames(this.getName());
                            var hierarchicalNames = [];
                            if (!isNullOrUndefined(parentFieldName)) {
                                for (var name in subNames) {
                                    hierarchicalNames.push(parentFieldName + "." + name));
                            }
                        }
                        for (var name in hierarchicalNames) {
                            names.push(name);
                        }
                    }
                } else {
                    if (!isNullOrUndefined(parentFieldName)) {
                        names.push(parentFieldName);
                    } else {
                        names.push(this.getEncoderTuple(this).get(0));
                    }
                }

            return names;
        },

        /**
         * Returns a sequence of field types corresponding to the elements in the
         * decoded output field array.  The types are defined by {@link FieldMetaType}
         *
         * @return
         */
        getDecoderOutputFieldTypes: function() { // List<FieldMetaType>(void)
            if (!isNullOrUndefined(this.getFlattenedFieldTypeList()) {
                    return this.getFlattenedFieldTypeList();
                }

                var retVal = [];
                for (var t in this.getEncoders(this)) {
                    var subTypes = t.get(1).getDecoderOutputFieldTypes();
                    for (var type in subTypes) {
                        retVal.push(type);
                    }
                }
                this.setFlattenedFieldTypeList(retVal);
                return retVal;
            },

            /**
             * Gets the value of a given field from the input record
             * @param inputObject	input object
             * @param fieldName		the name of the field containing the input object.
             * @return
             */
            getInputValue: function(inputObject, fieldName) { // Object(Object, String)
                    //if(Map.class.isAssignableFrom(inputObject.getClass())) {
                    var map = inputObject;
                    if (!map.has(fieldName)) {
                        throw new Error("Unknown field name " + fieldName +
                            " known fields are: " + map.keys() + ". ");
                    }
                    return map.get(fieldName);
                    //}
                    //return null;
                },

                /**
                 * Returns a reference to each sub-encoder in this encoder. They are
                 * returned in the same order as they are for getScalarNames() and
                 * getScalars()
                 *
                 * @return
                 */
                getEncoderList: function() { // List<Encoder<T>>(void)
                    var encoders = [];

                    var registeredList = this.getEncoders(this);
                    if (!isNullOrUndefined(registeredList) && registeredList.length !== 0) {
                        for (var t in registeredList) {
                            var subEncoders = t.get(1)).getEncoderList();
                        for (var subEncoder in subEncoders) {
                            encoders.push(subEncoder);
                        }
                    }
                } else {
                    encoders.push(this);
                }
            return encoders;
        },

        /**
         * Returns an {@link TDoubleList} containing the sub-field scalar value(s) for
         * each sub-field of the inputData. To get the associated field names for each of
         * the scalar values, call getScalarNames().
         *
         * For a simple scalar encoder, the scalar value is simply the input unmodified.
         * For category encoders, it is the scalar representing the category string
         * that is passed in.
         *
         * TODO This is not correct for DateEncoder:
         *
         * For the datetime encoder, the scalar value is the
         * the number of seconds since epoch.
         *
         * The intent of the scalar representation of a sub-field is to provide a
         * baseline for measuring error differences. You can compare the scalar value
         * of the inputData with the scalar value returned from topDownCompute() on a
         * top-down representation to evaluate prediction accuracy, for example.
         *
         * @param <S>  the specifically typed input object
         *
         * @return
         */
        getScalars: function(d) { // <S> TDoubleList(S)
            var retVals = [];
            var inputData = d;
            var encoders = this.getEncoders(this);
            if (!isNullOrUndefined(encoders)) {
                for (var t in encoders) {
                    values = t.getEncoder().getScalars(inputData);
                    for (var value in values) {
                        retVals.push(value);
                    }
                }
            }
            return retVals;
        },

        /**
         * Returns the input in the same format as is returned by topDownCompute().
         * For most encoder types, this is the same as the input data.
         * For instance, for scalar and category types, this corresponds to the numeric
         * and string values, respectively, from the inputs. For datetime encoders, this
         * returns the list of scalars for each of the sub-fields (timeOfDay, dayOfWeek, etc.)
         *
         * This method is essentially the same as getScalars() except that it returns
         * strings
         * @param <S> 	The input data in the format it is received from the data source
         *
         * @return A list of values, in the same format and in the same order as they
         * are returned by topDownCompute.
         *
         * @return	list of encoded values in String form
         */
        getEncodedValues: function(inputData) { // <S> List<String>(S)
            var retVals = [];
            var encoders = this.getEncoders();
            if (!isNullOrUndefined(encoders) && encoders.length > 0) {
                for (var t in encoders.keys()) {
                    for (var v in t.getEncoder().getEncodedValues(inputData)
                        retVals.push(v);
                    }
                }
            } else {
                retVals.push(inputData);
            }

            return retVals;
        },

        /**
         * Returns an array containing the sub-field bucket indices for
         * each sub-field of the inputData. To get the associated field names for each of
         * the buckets, call getScalarNames().
         * @param  	input 	The data from the source. This is typically a object with members.
         *
         * @return 	array of bucket indices
         */
        getBucketIndices: function(input) { // int[](String) or int[](double)
            var l = [];
            var encoders = this.getEncoders();
            if (!isNullOrUndefined(encoders) && encoders.length > 0) {
                for (var t in encoders.keys()) {
                    for (var v in t.getEncoder().getBucketIndices(input)) {
                        l.push(v));
                }
            }
        } else {
            throw new Error("Should be implemented in base classes that are not " +
                "containers for other encoders");
        }
        return l;
    },

    /**
     * Return a pretty print string representing the return values from
     * getScalars and getScalarNames().
     * @param scalarValues 	input values to encode to string
     * @param scalarNames 	optional input of scalar names to convert. If None, gets
     *                  	scalar names from getScalarNames()
     *
     * @return string representation of scalar values
     */
    scalarsToStr: function(scalarValues, scalarNames) { // String(List<?>, List<String>)
        if (isNullOrUndefined(scalarNames) || scalarNames.length === 0) {
            scalarNames = this.getScalarNames("");
        }

        desc = "";
        for (var t in ArrayUtils.zip(scalarNames, scalarValues)) {
            if (desc.length > 0) {
                desc += ", " + t.get(0) + ":" + t.get(1);
            } else {
                desc += t.get(0) + ":" + t.get(1);
            }
        }
        return desc;
    },

    /**
     * This returns a list of tuples, each containing (name, offset).
     * The 'name' is a string description of each sub-field, and offset is the bit
     * offset of the sub-field for that encoder.
     *
     * For now, only the 'multi' and 'date' encoders have multiple (name, offset)
     * pairs. All other encoders have a single pair, where the offset is 0.
     *
     * @return		list of tuples, each containing (name, offset)
     */
    getDescription: function() { // List<Tuple>(void)
        return this.description;
    },


    /**
     * Return a description of the given bit in the encoded output.
     * This will include the field name and the offset within the field.
     * @param bitOffset  	Offset of the bit to get the description of
     * @param formatted     If True, the bitOffset is w.r.t. formatted output,
     *                     	which includes separators
     *
     * @return tuple(fieldName, offsetWithinField)
     */
    encodedBitDescription: function(bitOffset, formatted) { // Tuple(int, boolean)
        //Find which field it's in
        var description = this.getDescription();
        var len = description.length;
        var prevFieldName = null;
        var prevFieldOffset = -1;
        var offset = -1;
        for (var i = 0; i < len; i++) {
            var t = description[i]; //(name, offset)
            if (formatted) {
                offset = t.get(1)) + 1;
            if (bitOffset === offset - 1) {
                prevFieldName = "separator";
                prevFieldOffset = bitOffset;
            }
        }
        if (bitOffset < offset) {
            break;
        }
    }
    // Return the field name and offset within the field
    // return (fieldName, bitOffset - fieldOffset)
var width = formatted ? this.getDisplayWidth() : this.getWidth();

if (prevFieldOffset === -1 || bitOffset > this.getWidth()) {
    throw new Error("Bit is outside of allowable range: " +
        "[0 - " + width + "]");
}
return new Tuple(prevFieldName, bitOffset - prevFieldOffset);
},

/**
 * Pretty-print a header that labels the sub-fields of the encoded
 * output. This can be used in conjunction with {@link #pprint(int[], String)}.
 * @param prefix
 */
pprintHeader: function(prefix) { // void(String)
        this.LOGGER.info(isNullOrUndefined(prefix) ? "" : prefix);

        var description = this.getDescription();
        description.push(new Tuple("end", this.getWidth()));

        var len = description.length - 1;
        for (var i = 0; i < len; i++) {
            var name = description[i].get(0);
            var width = description[i + 1].get(1);

            var pname = name;

            this.LOGGER.info(pname);
        }

        len = this.getWidth() + (this.description.length - 1) * 3 - 1;
        var hyphens = "";
        for (var i = 0; i < len; i++) {
            hyphens += "-";
        }
        this.LOGGER.info(hyphens);
    },

    /**
     * Pretty-print the encoded output using ascii art.
     * @param output
     * @param prefix
     */
    pprint: function(output, prefix) { // void(int[], String)
        this.LOGGER.info(isNullOrUndefined(prefix) ? "" : prefix);

        var description = this.getDescription();
        description.push(new Tuple("end", this.getWidth()));

        var len = description.length - 1;
        for (var i = 0; i < len; i++) {
            var offset = description[i].get(1);
            var nextOffset = description[i + 1].get(1);

            this.LOGGER.info(
                ArrayUtils.bitsToString(
                    ArrayUtils.sub(output, ArrayUtils.range(offset, nextOffset)))));
    }
},

/**
 * Takes an encoded output and does its best to work backwards and generate
 * the input that would have generated it.
 *
 * In cases where the encoded output contains more ON bits than an input
 * would have generated, this routine will return one or more ranges of inputs
 * which, if their encoded outputs were ORed together, would produce the
 * target output. This behavior makes this method suitable for doing things
 * like generating a description of a learned coincidence in the SP, which
 * in many cases might be a union of one or more inputs.
 *
 * If instead, you want to figure the *most likely* single input scalar value
 * that would have generated a specific encoded output, use the topDownCompute()
 * method.
 *
 * If you want to pretty print the return value from this method, use the
 * decodedToStr() method.
 *
 *************
 * OUTPUT EXPLAINED:
 *
 * fieldsMap is a {@link Map} where the keys represent field names
 * (only 1 if this is a simple encoder, > 1 if this is a multi
 * or date encoder) and the values are the result of decoding each
 * field. If there are  no bits in encoded that would have been
 * generated by a field, it won't be present in the Map. The
 * key of each entry in the dict is formed by joining the passed in
 * parentFieldName with the child encoder name using a '.'.
 *
 * Each 'value' in fieldsMap consists of a {@link Tuple} of (ranges, desc),
 * where ranges is a list of one or more {@link MinMax} ranges of
 * input that would generate bits in the encoded output and 'desc'
 * is a comma-separated pretty print description of the ranges.
 * For encoders like the category encoder, the 'desc' will contain
 * the category names that correspond to the scalar values included
 * in the ranges.
 *
 * The fieldOrder is a list of the keys from fieldsMap, in the
 * same order as the fields appear in the encoded output.
 *
 * Example retvals for a scalar encoder:
 *
 *   {'amount':  ( [[1,3], [7,10]], '1-3, 7-10' )}
 *   {'amount':  ( [[2.5,2.5]],     '2.5'       )}
 *
 * Example retval for a category encoder:
 *
 *   {'country': ( [[1,1], [5,6]], 'US, GB, ES' )}
 *
 * Example retval for a multi encoder:
 *
 *   {'amount':  ( [[2.5,2.5]],     '2.5'       ),
 *   'country': ( [[1,1], [5,6]],  'US, GB, ES' )}
 * @param encoded      		The encoded output that you want decode
 * @param parentFieldName 	The name of the encoder which is our parent. This name
 *      					is prefixed to each of the field names within this encoder to form the
 *    						keys of the {@link Map} returned.
 *
 * @returns Tuple(fieldsMap, fieldOrder)
 */
decode: function(encoded, parentFieldName) { // Tuple(int[], String)
    var fieldsMap = new Map(); // new WeakMap();
    var fieldsOrder = [];

    var parentName = isNullOrUndefined(parentFieldName) || parentFieldName.length === 0 ?
        this.getName() : parentFieldName + "." + this.getName());

var encoders = this.getEncoders(this);
var len = encoders.length;
for (var i = 0; i < len; i++) {
    var threeFieldsTuple = encoders[i];
    var nextOffset = 0;
    if (i < len - 1) {
        nextOffset = encoders[i + 1].get(2);
    } else {
        nextOffset = this.getW();
    }

    var fieldOutput = ArrayUtils.sub(encoded, ArrayUtils.range(parseInt(threeFieldsTuple.get(2)), nextOffset));

    var result = threeFieldsTuple.get(1)).decode(fieldOutput, parentName);

for (var key in result.get(0)) {
    fieldsMap.put(key, result.get(0).get(key));
}
for (var v in result.get(1)) {
    fieldsOrder.push(v));
}
}

return new Tuple(fieldsMap, fieldsOrder);
},

/**
 * Return a pretty print string representing the return value from decode().
 *
 * @param decodeResults
 * @return
 */
decodedToStr: function(decodeResults) { // String(Tuple)
        var desc = "";
        var fieldsDict = decodeResults.get(0);
        var fieldsOrder = decodeResults.get(1);
        for (var fieldName in fieldsOrder) {
            var ranges = fieldsDict.get(fieldName);
            if (desc.length > 0) {
                desc += ", " + fieldName + ":";
            } else {
                desc += fieldName + ":";
            }
            desc += "[" + ranges.get(1) + "]";
        }
        return desc;
    },

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
     * @return  list of items, each item representing the bucket value for that
     *          bucket.
     */
    getBucketValues: function(returnType) { // <S> List<S>(Class<S>)
        throw new Error("getBucketValues must be overloaded.");
    },

    /**
     * Returns a list of {@link EncoderResult}s describing the inputs for
     * each sub-field that correspond to the bucket indices passed in 'buckets'.
     * To get the associated field names for each of the values, call getScalarNames().
     * @param buckets 	The list of bucket indices, one for each sub-field encoder.
     *              	These bucket indices for example may have been retrieved
     *              	from the getBucketIndices() call.
     *
     * @return A list of {@link EncoderResult}s. Each EncoderResult has
     */
    getBucketInfo: function(buckets) { // List<EncoderResult>(int[])
        //Concatenate the results from bucketInfo on each child encoder
        var retVals = [];
        var bucketOffset = 0;
        for (var encoderTuple in this.getEncoders(this)) {
            var nextBucketOffset = -1;
            var childEncoders = this.getEncoders(encoderTuple.getEncoder());
            if (!isNullOrUndefined(childEncoders)) {
                nextBucketOffset = bucketOffset + childEncoders.length;
            } else {
                nextBucketOffset = bucketOffset + 1;
            }
            var bucketIndices = ArrayUtils.sub(buckets, ArrayUtils.range(bucketOffset, nextBucketOffset));
            var values = encoderTuple.getEncoder().getBucketInfo(bucketIndices);

            for (var value in values) {
                retVals.push(value);
            }

            bucketOffset = nextBucketOffset;
        }

        return retVals;
    },

    /**
     * Returns a list of EncoderResult named tuples describing the top-down
     * best guess inputs for each sub-field given the encoded output. These are the
     * values which are most likely to generate the given encoded output.
     * To get the associated field names for each of the values, call
     * getScalarNames().
     * @param encoded The encoded output. Typically received from the topDown outputs
     *              from the spatial pooler just above us.
     *
     * @returns A list of EncoderResult named tuples. Each EncoderResult has
     *        three attributes:
     *
     *        -# value:         This is the best-guess value for the sub-field
     *                          in a format that is consistent with the type
     *                          specified by getDecoderOutputFieldTypes().
     *                          Note that this value is not necessarily
     *                          numeric.
     *
     *        -# scalar:        The scalar representation of this best-guess
     *                          value. This number is consistent with what
     *                          is returned by getScalars(). This value is
     *                          always an int or float, and can be used for
     *                          numeric comparisons.
     *
     *        -# encoding       This is the encoded bit-array
     *                          that represents the best-guess value.
     *                          That is, if 'value' was passed to
     *                          encode(), an identical bit-array should be
     *                          returned.
     */
    topDownCompute: function(encoded) { // List<EncoderResult>(int[])
        var retVals = [];

        var encoders = this.getEncoders(this);
        var len = encoders.length;
        for (var i = 0; i < len; i++) {
            var offset = parseInt(encoders[i].get(2));
            var encoder = encoders[i].get(1);

            var nextOffset;
            if (i < len - 1) {
                //Encoders = List<Encoder> : Encoder = EncoderTuple(name, encoder, offset)
                nextOffset = parseInt(encoders[i + 1].get(2));
            } else {
                nextOffset = this.getW();
            }

            var fieldOutput = ArrayUtils.sub(encoded, ArrayUtils.range(offset, nextOffset));
            var values = encoder.topDownCompute(fieldOutput);

            for (var value in values) {
                retVals.push(value);
            }
        }

        return retVals;
    },

    closenessScores: function(expValues, actValues, fractional) { // TDoubleList(TDoubleList, TDoubleList, boolean)
        var retVal = [];

        //Fallback closenss is a percentage match
        var encoders = this.getEncoders(this);
        if (isNullOrUndefined(encoders) || encoders.length < 1) {
            var err = Math.abs(expValues[0] - actValues[0]);
            var closeness = -1;
            if (fractional) {
                var denom = Math.max(expValues[0], actValues[0]);
                if (denom === 0) {
                    denom = 1.0;
                }

                closeness = 1.0 - err / denom;
                if (closeness < 0) {
                    closeness = 0;
                }
            } else {
                closeness = err;
            }

            retVal.push(closeness);
            return retVal;
        }

        var scalarIdx = 0;
        for (var res in this.getEncoders(this)) {
            var values = res.getEncoder().closenessScores(
                expValues.slice(scalarIdx, expValues.length), actValues.slice(scalarIdx, actValues.length), fractional);

            scalarIdx += values.length;
            for (var value in values) {
                retVal.push(value);
            }
        }

        return retVal;
    },

    /**
     * Returns an array containing the sum of the right
     * applied multiplications of each slice to the array
     * passed in.
     *
     * @param encoded
     * @return
     */
    rightVecProd: function(matrix, encoded) { // int[](SparseObjectMatrix<int[]>, int[])
        var retVal = newArray([matrix.getMaxIndex() + 1], 0);
        for (var i = 0; i < retVal.length; i++) {
            var slice = matrix.getObject(i);
            for (var j = 0; j < slice.length; j++) {
                retVal[i] += (slice[j] * encoded[j]);
            }
        }
        return retVal;
    },

    /**
     * Calculate width of display for bits plus blanks between fields.
     *
     * @return	width
     */
    getDisplayWidth: function() { // int(void)
        return this.getWidth() + this.getDescription().length - 1;
    },

    /**
     * Base class for {@link Encoder} builders
     * @param <T>
     */
    Builder: function {
        this.encoder = null;
    },

    Builder.prototype.build: function() {
        if (isNullOrUndefined(encoder)) {
            throw new Error("Subclass did not instantiate builder type " +
                "before calling this method!");
        }
        this.encoder.setN(this.N);
        this.encoder.setW(this.W);
        this.encoder.setMinVal(this.MinVal);
        this.encoder.setMaxVal(this.MaxVal);
        this.encoder.setRadius(this.Radius);
        this.encoder.setResolution(this.Resolution);
        this.encoder.setPeriodic(this.Periodic);
        this.encoder.setClipInput(this.ClipInput);
        this.encoder.setForced(this.Forced);
        this.encoder.setName(this.Name);

        return this.encoder;
    },

    Builder.prototype.n: function(N) {
        this.N = N;
        return this;
    },

    Builder.prototype.w: function(W) {
        this.W = W;
        return this;
    },

    Builder.prototype.minVal: function(MinVal) {
        this.MinVal = MinVal;
        return this;
    },

    Builder.prototype.maxVal: function(MaxVal) {
        this.MaxVal = MaxVal;
        return this;
    },

    Builder.prototype.radius: function(Radius) {
        this.Radius = Radius;
        return this;
    },

    Builder.prototype.resolution: function(Resolution) {
        this.Resolution = Resolution;
        return this;
    },

    Builder.prototype.periodic: function(Periodic) {
        this.Periodic = Periodic;
        return this;
    },

    Builder.prototype.clipInput: function(ClipInput) {
        this.ClipInput = ClipInput;
        return this;
    },

    Builder.prototype.forced: function(Forced) {
        this.Forced = Forced;
        return this;
    },

    Builder.prototype.name: function(Name) {
        this.Name = Name;
        return this;
    }
}