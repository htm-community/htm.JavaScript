/**
 * Subclass of {@link Tuple} specialized to hold the 3-value contents 
 * of an "encoder tuple". Each {@code EncoderTuple} holds a name, encoder and offset
 * in that order. Also, every EncoderTuple's size == 3.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see Tuple
 */
/**
 * Constructs a new {@code EncoderTuple}
 * 
 * @param name		the {@link Encoder}'s name
 * @param e			the {@link Encoder}
 * @param offset	the offset within the input (first on bit) that this 
 * 					encoder encodes/decodes. (see  {@link ScalarEncoder#getFirstOnBit(
 * 						org.numenta.nupic.research.Connections, double)})
 */
var EncoderTuple = function(name, e, offset) { // EncoderTuple(String, Encoder<?>, int)
    Tuple.call(this, [name, e, offset]);

    if (isNullOrUndefined(name)) {
        throw new Error("Can't instantiate an EncoderTuple " +
            " with a null or undefined Name");
    }
    if (isNullOrUndefined(e)) {
        throw new Error("Can't instantiate an EncoderTuple " +
            " with a null or undefined Encoder");
    }
};

EncoderTuple.prototype = Object.create(Tuple.prototype);
EncoderTuple.prototype.constructor = EncoderTuple;

/**
 * Returns the {@link Encoder}'s name
 * @return
 */
EncoderTuple.prototype.getName = function() { // String(void)
    return this.get(0);
};

/**
 * Returns this {@link Encoder}
 * @return
 */
EncoderTuple.prototype.getEncoder = function() { // Encoder<?>(void)
    return this.get(1);
};

/**
 * Returns the index of the first on bit (offset)
 * the {@link Encoder} encodes.
 * @return
 */
EncoderTuple.prototype.getOffset = function() { // int(void)
    return this.get(2);
};