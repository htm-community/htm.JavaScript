/**
 * Subclasses the {@link Tuple} utility class to constrain 
 * the number of arguments and argument types to those specifically
 * related to the {@link Encoder} functionality.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript) 
 *
 * @param <L>
 * @param <S>
 */
/**
 * Instantiates a {@code RangeTuple}
 * @param l
 * @param s
 */
var RangeTuple = function(l, s) {
    Tuple.call(this, l, s);
    this.l = l;
    this.desc = s;
};

RangeTuple.prototype = Object.create(Tuple.prototype);
RangeTuple.prototype.constructor = RangeTuple;