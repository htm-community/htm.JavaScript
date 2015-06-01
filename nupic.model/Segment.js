/**
 * Base class which handles the creation of {@link Synapses} on behalf of
 * inheriting class types.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see DistalDendrite
 * @see ProximalDendrite
 */
var Segment = function() {};

Segment.prototype = {
    /**
     * Creates and returns a newly created {@link Synapse} with the specified
     * source cell, permanence, and index.
     * 
     * IMPORTANT: 	For DistalDendrites, there is only one synapse per pool, so the
     * 				synapse's index doesn't really matter (in terms of tracking its
     * 				order within the pool. In that case, the index is a global counter
     * 				of all distal dendrite synapses.
     * 
     * 				For ProximalDendrites, there are many synapses within a pool, and in
     * 				that case, the index specifies the synapse's sequence order within
     * 				the pool object, and may be referenced by that index.
     * 
     * @param c             the connections state of the temporal memory
     * @param sourceCell    the source cell which will activate the new {@code Synapse}
     * @param pool		    the new {@link Synapse}'s pool for bound variables.
     * @param index         the new {@link Synapse}'s index.
     * @param inputIndex	the index of this {@link Synapse}'s input (source object); be it a Cell or InputVector bit.
     * 
     * @return
     */
    createSynapse: function(c, syns, sourceCell, pool, index, inputIndex) { // Synapse(Connections, List<Synapse>, Cell, Pool, int, int)
        var s = new Synapse(c, sourceCell, this, pool, index, inputIndex);
        syns.push(s);
        return s;
    }
}