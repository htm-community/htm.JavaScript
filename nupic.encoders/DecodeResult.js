/**
 * Tuple to represent the results of computations in different forms.
 *
 * @author metaware
 * @author Ralf Seliger (port to JavaScript) 
 * @see {@link Encoder}
 */
/**
 * Constructs a new {@code Decode}
 * @param m		Map of field names to {@link RangeList} object
 * @param l		List of comma-separated descriptions for each list of ranges.
 */
var DecodeResult = function(m, l) {
    DecodeTuple.call(this, m, l);
};

DecodeResult.prototype = Object.create(DecodeTuple.prototype);
DecodeResult.prototype.constructor = DecodeResult;

/**
 * Returns the Map of field names to {@link RangeList} object
 * @return
 */
DecodeResult.prototype.getFields = function() { // Map<String, RangeList>(void)
    return this.fields;
};

/**
 * Returns the List of comma-separated descriptions for each list of ranges.
 * @return
 */
DecodeResult.prototype.getDescriptions = function() { // List<String>(void)
    return this.fieldDescriptions;
};

/**
 * Returns the {@link RangeList} associated with the specified field.
 * @param fieldName		the name of the field
 * @return
 */
DecodeResult.prototype.getRanges = function(fieldName) { // RangeList(String)
    return this.fields.get(fieldName);
};

/**
 * Returns a specific range ({@link MinMax}) for the specified field.
 * @param fieldName		the name of the field
 * @param index			the index of the range to return
 * @return
 */
DecodeResult.prototype.getRange = function(fieldName, index) { // MinMax(String, int)
    return this.fields.get(fieldName).getRange(index);
};