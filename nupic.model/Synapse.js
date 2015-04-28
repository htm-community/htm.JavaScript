/**
 * Represents a connection with varying strength which when above 
 * a configured threshold represents a valid connection. 
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
 * 
 * @author Chetan Surpur
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * 
 * @see DistalDendrite
 * @see TemporalMemory.Connections
 */
var Synapse = function(c, sourceCell, segment, pool, index, inputIndex) {	// Synapse(Connections, Cell, Segment, Pool, int, int) 
    /**
     * Constructs a new {@code Synapse}
     * 
     * @param c             the connections state of the temporal memory
     * @param sourceCell    the {@link Cell} which will activate this {@code Synapse}
     * @param segment       the owning dendritic segment
     * @param pool		    this {@link Pool} of which this synapse is a member
     * @param index         this {@code Synapse}'s index
     * @param inputIndex	the index of this {@link Synapse}'s input; be it a Cell or InputVector bit.
     */
    this.sourceCell = sourceCell;
    this.segment = segment;
    this.pool = pool;
    this.synapseIndex = index;
    this.inputIndex = inputIndex;
    this.permanence = 0;
        
    // If this isn't a synapse on a proximal dendrite
    if(!isNullOrUndefined(sourceCell)) {
     	sourceCell.addReceptorSynapse(c, this);
    }
};
    
Synapse.prototype = {    /**
     * Returns this {@code Synapse}'s index.
     * @return
     */
    getIndex: function() {	// int(void)
    	return this.synapseIndex;
    },
    
    /**
     * Returns the index of this {@code Synapse}'s input item
     * whether it is a "sourceCell" or inputVector bit.
     * @return
     */
    getInputIndex: function() {	// int(void)
    	return this.inputIndex;
    },
    
    /**
     * Returns this {@code Synapse}'s degree of connectedness.
     * @return
     */
    getPermanence: function() {	// double(void)
        return this.permanence;
    },
    
    /**
     * Sets this {@code Synapse}'s degree of connectedness.
     * @param perm
     */
    setPermanence: function(c, perm) {	// void(Connections, double)
        this.permanence = perm;
        this.pool.updatePool(c, this, perm);
    },
    
    /**
     * Returns the owning dendritic segment
     * @return
     */
    getSegment: function() {	// Segment(void)
        return this.segment;
    },
    
    /**
     * Returns the containing {@link Cell} 
     * @return
     */
    getSourceCell: function() {	// Cell(void)
        return this.sourceCell;
    },
    
    /**
     * {@inheritDoc}
     */
    toString: function() {	// String(void)
        return "" + this.synapseIndex;
    }
}
