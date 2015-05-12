/**
 * 
 */
var ProximalDendrite = function(index) {
    Segment.call(this);

    this.pool = null;

    /**
     * 
     * @param index     this {@code ProximalDendrite}'s index.
     */
    this.index = index;
};

ProximalDendrite.prototype = Object.create(Segment.prototype);
ProximalDendrite.prototype.constructor = ProximalDendrite;

/**
 * Creates the pool of {@link Synapse}s representing the connection
 * to the input vector.
 * 
 * @param c					the {@link Connections} memory
 * @param inputIndexes		indexes specifying the input vector bit
 */
ProximalDendrite.prototype.createPool = function(c, inputIndexes) { // Pool(Connections, int[])
    this.pool = new Pool(inputIndexes.length);
    for (var i = 0; i < inputIndexes.length; i++) {
        var synCount = c.getSynapseCount();
        this.pool.setPermanence(c, Segment.prototype.createSynapse.call(this, c, c.getSynapses(this), null, this.pool, synCount, inputIndexes[i]), 0);
        c.setSynapseCount(synCount + 1);
    }
    return this.pool;
}

ProximalDendrite.prototype.clearSynapses = function(c) { // void(Connections)
    c.getSynapses(this).length = 0;
}

/**
 * Returns this {@link ProximalDendrite}'s index.
 * @return
 */
ProximalDendrite.prototype.getIndex = function() { // int(void)
    return this.index;
}

ProximalDendrite.prototype.setPermanences = function() {

    var that = this;

    /**
     * Sets the permanences for each {@link Synapse}. The number of synapses
     * is set by the potentialPct variable which determines the number of input
     * bits a given column will be "attached" to which is the same number as the
     * number of {@link Synapse}s
     * 
     * @param c			the {@link Connections} memory
     * @param perms		the floating point degree of connectedness
     */
    var setPermanencesWithoutInputIndexes = function(c, perms) { // void(Connections, double[])
        that.pool.resetConnections();
        c.getConnectedCounts().clearStatistics(that.index);
        var synapses = c.getSynapses(that);
        for (var i = 0; i < synapses.length; i++) {
            var s = synapses[i];
            s.setPermanence(c, perms[s.getInputIndex()]);
            if (perms[s.getInputIndex()] >= c.getSynPermConnected()) {
                c.getConnectedCounts().set(1, that.index, s.getInputIndex());
            }
        }
    };

    /**
     * Sets the permanences for each {@link Synapse} specified by the indexes
     * passed in which identify the input vector indexes associated with the
     * {@code Synapse}. The permanences passed in are understood to be in "sparse"
     * format and therefore require the int array identify their corresponding
     * indexes.
     * 
     * Note: This is the "sparse" version of this method.
     * 
     * @param c			the {@link Connections} memory
     * @param perms		the floating point degree of connectedness
     */
    var setPermanencesWithInputIndexes = function(c, perms, inputIndexes) { // void(Connections, double[], int[])
        that.pool.resetConnections();
        c.getConnectedCounts().clearStatistics(that.index);
        for (var i = 0; i < inputIndexes.length; i++) {
            that.pool.setPermanence(c, that.pool.getSynapseWithInput(inputIndexes[i]), perms[i]);
            if (perms[i] >= c.getSynPermConnected()) {
                c.getConnectedCounts().set(1, that.index, i);
            }
        }
    };

    if (arguments.length === 2) {
        return setPermanencesWithoutInputIndexes(arguments[0], arguments[1]);
    } else if (arguments.length === 3) {
        return setPermanencesWithInputIndexes(arguments[0], arguments[1], arguments[2]);
    } else {
        throw new Error("No method found for this call to setPermanences.");
    }
}

/**
 * Sets the input vector synapse indexes which are connected (>= synPermConnected)
 * @param c
 * @param connectedIndexes
 */
ProximalDendrite.prototype.setConnectedSynapsesForTest = function(c, connectedIndexes) { //void(Connections, int[])
    var pool = createPool(c, connectedIndexes);
    c.getPotentialPools().set(this.index, pool);
}

/**
 * Returns an array of synapse indexes as a dense binary array.
 * @param c
 * @return
 */
ProximalDendrite.prototype.getConnectedSynapsesDense = function(c) { // int[](Connections)
    return c.getPotentialPools().getObject(this.index).getDenseConnections(c);
}

/**
 * Returns an sparse array of synapse indexes representing the connected bits.
 * @param c
 * @return
 */
ProximalDendrite.prototype.getConnectedSynapsesSparse = function(c) { // int[](Connections)
    return c.getPotentialPools().getObject(this.index).getSparseConnections();
}