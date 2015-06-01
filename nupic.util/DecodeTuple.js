/**
 * Subclass of Tuple to specifically contain the results of an
 * {@link Encoder}'s {@link Encoder#encode(double)}
 * call.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript) 
 *
 * @param <T>	the fieldsMap
 * @param <K>	the fieldsOrder
 */
var DecodeTuple = function(m, l) {
    Tuple.call(this, m, l);
    this.fields = m;
    this.fieldDescriptions = l;
};

DecodeTuple.prototype = Object.create(Tuple.prototype);
DecodeTuple.prototype.constructor = DecodeTuple;