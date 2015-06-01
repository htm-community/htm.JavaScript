/*/
 **
 * Tuple to represent the results of computations in different forms.
 *
 * @author metaware
 * @author Ralf Seliger (port to JavaScript) 
 * @see {@link Encoder}
 */
/**
 * Constructs a new {@code EncoderResult}
 *
 * @param value    A representation of the encoded value in the same format as the input
 *                 (i.e. float for scalars, string for categories)
 * @param scalar   A representation of the encoded value as a number. All encoded values
 *                 are represented as some form of numeric value before being encoded
 *                 (e.g. for categories, this is the internal index used by the encoder)
 * @param encoding The bit-string representation of the value
 */
var EncoderResult = function(value, scalar, encoding) {
    Tuple.call(this, "EncoderResult", value, scalar, encoding);
};

EncoderResult.prototype = Object.create(Tuple.prototype);
EncoderResult.prototype.constructor = EncoderResult;

EncoderResult.prototype.toString = function() { // String(void)
    return "EncoderResult(value=" + this.get(1) + ", scalar=" + this.get(2) +
        ", encoding=" + this.get(3);
};

/**
 * Returns a representation of the encoded value in the same format as the input.
 *
 * @return the encoded value
 */
EncoderResult.prototype.getValue = function() { // Object(void)
    return this.get(1);
};

/**
 * Returns the encoded value as a number.
 *
 * @return
 */
EncoderResult.prototype.getScalar = function() { // Number(void)
    return this.get(2);
};

/**
 * Returns the bit-string encoding of the value
 *
 * @return
 */
EncoderResult.prototype.getEncoding = function() { // int[](void)
    return this.get(3);
};

EncoderResult.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj) {
        return true;
    }
    if (isNullOrUndefined(obj)) {
        return false;
    }
    if (!(obj instanceof EncoderResult)) {
        return false;
    }
    var other = obj;
    if (!this.getScalar() === other.getScalar()) {
        return false;
    }
    if (!this.getValue() === other.getValue()) {
        return false;
    }
    if (!equals(this.getEncoding(), other.getEncoding())) {
        return false;
    }
    return true;
};