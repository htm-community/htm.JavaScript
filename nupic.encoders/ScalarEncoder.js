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

