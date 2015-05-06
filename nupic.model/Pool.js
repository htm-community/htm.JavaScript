/**
 * Convenience container for "bound" {@link Synapse} values
 * which can be dereferenced from both a Synapse and the 
 * {@link Connections} object. All Synapses will have a reference
 * to a {@code Pool} to retrieve relevant values. In addition, that
 * same pool can be referenced from the Connections object externally
 * which will update the Synapse's internal reference.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see Synapse
 * @see Connections
 */
var Pool = function(size) {
	this.size = size;
	
	/** Allows fast removal of connected synapse indexes. */
	this.synapseConnections = new Set();	// = new TIntHashSet();
	/** 
	 * Indexed according to the source Input Vector Bit (for ProximalDendrites),
	 * and source cell (for DistalDendrites).
	 */
	this.synapsesBySourceIndex = new Map();	// = TIntObjectHashMap<Synapse>();
};

Pool.prototype = {
	/**
	 * Returns the permanence value for the {@link Synapse} specified.
	 * 
	 * @param s	the Synapse
	 * @return	the permanence
	 */
	getPermanence: function(s) {	// double(Synapse)
		return this.synapsesBySourceIndex.get(s.getInputIndex()).getPermanence();
	},
	
	/**
	 * Sets the specified  permanence value for the specified {@link Synapse}
	 * @param s
	 * @param permanence
	 */
	setPermanence: function(c, s, permanence) {	// void(Connections, Synapse, double)
		this.updatePool(c, s, permanence);
		s.setPermanence(c, permanence);
	},
	
	/**
	 * Updates this {@code Pool}'s store of permanences for the specified {@link Synapse}
	 * @param c				the connections memory
	 * @param s				the synapse who's permanence is recorded
	 * @param permanence	the permanence value to record
	 */
	updatePool: function(c, s, permanence) {	// void(Connections, Synapse, double)
		var inputIndex = s.getInputIndex();
		if (isNullOrUndefined(this.synapsesBySourceIndex.get(inputIndex))) {
			this.synapsesBySourceIndex.set(inputIndex, s);
		}
		if (permanence > c.getSynPermConnected()) {
			this.synapseConnections.add(inputIndex);
		} else {
			this.synapseConnections.delete(inputIndex);
		}
	},
	
	/**
	 * Resets the current connections in preparation for new permanence
	 * adjustments.
	 */
	resetConnections: function() {	// void(void)
		this.synapseConnections.clear();
	},
	
	/**
	 * Returns the {@link Synapse} connected to the specified input bit
	 * index.
	 * 
	 * @param inputIndex	the input vector connection's index.
	 * @return
	 */
	getSynapseWithInput: function(inputIndex) {	// Synapse(int)
		return this.synapsesBySourceIndex.get(inputIndex);
	},
	
	/**
	 * Returns an array of permanence values
	 * @return
	 */
	getSparsePermanences: function() {	// double[](void)
		var retVal = newArray([this.size], 0);
		var keys = Array.from(synapsesBySourceIndex.keys());
		for (var x=0, j=size-1; x<size; x++, j--) {
	    	retVal[j] = this.synapsesBySourceIndex.get(keys[x]).getPermanence();
		}		
		return retVal;
	},
	
	/**
	 * Returns a dense array representing the potential pool permanences
	 * 
	 * Note: Only called from tests for now...
	 * @param c
	 * @return
	 */
	getDensePermanences: function(c) {	// double[](Connections)
		var retVal = newArray([c.getNumInputs()], 0);
		var keys = Array.from(this.synapsesBySourceIndex.keys());
		for (var i=0; i<keys.length; i++) {
			var inputIndex = keys[i];
			retVal[inputIndex] = this.synapsesBySourceIndex.get(inputIndex).getPermanence();
		}
		return retVal;
	},
	
	/**
	 * Returns an array of input bit indexes indicating the index of the source. 
	 * (input vector bit or lateral cell)
	 * @return the sparse array
	 */
	getSparseConnections: function() {	// int[](void)
		var keys = ArrayUtils.reverse(Array.from(this.synapsesBySourceIndex.keys()));
		return keys;
	},
	
	/**
	 * Returns a dense array representing the potential pool bits
	 * with the connected bits set to 1. 
	 * 
	 * Note: Only called from tests for now...
	 * @param c
	 * @return
	 */
	getDenseConnections: function(c) {	// int[](Connections)
		var retVal = newArray([c.getNumInputs()], 0);
		for (var i=0; i<Array.from(this.synapseConnections).length; i++) {
			var inputIndex = Array.from(this.synapseConnections)[i];
			retVal[inputIndex] = 1;
		}
		return retVal;
	}
}
