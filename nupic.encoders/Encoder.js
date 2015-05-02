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
};

Encoder.prototype = {
}