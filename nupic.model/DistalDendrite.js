/**
 * Represents a proximal or distal dendritic segment.
 * Segments are owned by {@link Cell}s and in turn own {@link Synapse}s
 * which are obversely connected to by a "source cell", which is the {@link Cell}
 * which will activate a given {@link Synapse} owned by this {@code Segment}.
 * 
 * @author Chetan Surpur
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
var DistalDendrite = function(cell, index) {
    Segment.call(this);

    this.cell = cell;
    this.index = index;
    this.EMPTY_SYNAPSE_SET = new Set();
};

DistalDendrite.prototype = Object.create(Segment.prototype);
DistalDendrite.prototype.constructor = DistalDendrite;

/**
 * Returns the owner {@link Cell} 
 * @return
 */
DistalDendrite.prototype.getParentCell = function() { // Cell(void)
    return this.cell;
}

/**
 * Creates and returns a newly created {@link Synapse} with the specified
 * source cell, permanence, and index.
 * 
 * @param c             the connections state of the temporal memory
 * @param sourceCell    the source cell which will activate the new {@code Synapse}
 * @param permanence    the new {@link Synapse}'s initial permanence.
 * @param index         the new {@link Synapse}'s index.
 * 
 * @return
 */
DistalDendrite.prototype.createSynapse = function(c, sourceCell, permanence, index) { // Synapse(Connections, Cell, double, int)
    var pool = new Pool(1);
    var s = Segment.prototype.createSynapse.call(this, c, c.getSynapses(this), sourceCell, pool, index, sourceCell.getIndex());
    pool.setPermanence(c, s, permanence);
    return s;
}

/**
 * Returns all {@link Synapse}s
 * 
 * @param   c   the connections state of the temporal memory
 * @return
 */
DistalDendrite.prototype.getAllSynapses = function(c) { // List<Synapse>(Connections)
    return c.getSynapses(this);
}

/**
 * Returns the synapses on a segment that are active due to lateral input
 * from active cells.
 * 
 * @param activeSynapsesForSegment
 * @param permanenceThreshold
 * @return
 */
DistalDendrite.prototype.getConnectedActiveSynapses = function(activeSynapsesForSegment, permanenceThreshold) { // Set<Synapse>(Map<DistalDendrite, Set<Synapse>>, double)
    var connectedSynapses = null;

    if (!activeSynapsesForSegment.has(this)) {
        return this.EMPTY_SYNAPSE_SET;
    }

    for (var s of activeSynapsesForSegment.get(this)) {
        if (s.getPermanence() >= permanenceThreshold) {
            if (isNullOrUndefined(connectedSynapses)) {
                connectedSynapses = new Set();
            }
            connectedSynapses.add(s);
        }
    }
    return isNullOrUndefined(connectedSynapses) ? this.EMPTY_SYNAPSE_SET : connectedSynapses;
}

/**
 * Called for learning {@code Segment}s so that they may
 * adjust the permanences of their synapses.
 * 
 * @param c                     the connections state of the temporal memory
 * @param activeSynapses        a set of active synapses owned by this {@code Segment} which
 *                              will have their permanences increased. All others will have their
 *                              permanences decreased.
 * @param permanenceIncrement   the increment by which permanences are increased.
 * @param permanenceDecrement   the increment by which permanences are decreased.
 */
DistalDendrite.prototype.adaptSegment = function(c, activeSynapses, permanenceIncrement, permanenceDecrement) { // void(Connections, Set<Synapse>, double, double)
    for (var i = 0; i < c.getSynapses(this).length; i++) {
        var synapse = c.getSynapses(this)[i];
        var permanence = synapse.getPermanence();
        if (activeSynapses.has(synapse)) {
            permanence += permanenceIncrement;
        } else {
            permanence -= permanenceDecrement;
        }

        permanence = Math.max(0, Math.min(1.0, permanence));

        synapse.setPermanence(c, permanence);
    }
}

/**
 * Returns a {@link Set} of previous winner {@link Cell}s which aren't already attached to any
 * {@link Synapse}s owned by this {@code Segment}
 * 
 * @param   c               the connections state of the temporal memory
 * @param numPickCells      the number of possible cells this segment may designate
 * @param prevWinners       the set of previous winner cells
 * @param random            the random number generator
 * @return                  a {@link Set} of previous winner {@link Cell}s which aren't already attached to any
 *                          {@link Synapse}s owned by this {@code Segment}
 */
DistalDendrite.prototype.pickCellsToLearnOn = function(c, numPickCells, prevWinners, random) { // Set<Cell>(Connections, int, Set<Cell>, Random)
    //Create a list of cells that aren't already synapsed to this segment
    var candidates = new Set(prevWinners);
    for (var i = 0; i < c.getSynapses(this).length; i++) {
        var synapse = c.getSynapses(this)[i];
        var sourceCell = synapse.getSourceCell();
        if (candidates.has(sourceCell)) {
            candidates.delete(sourceCell);
        }
    }

    numPickCells = Math.min(numPickCells, candidates.size);
    var cands = Array.from(candidates);
    cands.sort(function(a, b) {
        return a.compareTo(b);
    });

    var cells = new Set();
    for (var x = 0; x < numPickCells; x++) {
        var i = random.nextInt(cands.length);
        cells.add(cands[i]);
        cands.splice(i, 1);
    }

    return cells;
}

/**
 * {@inheritDoc}
 */
DistalDendrite.prototype.toString = function() { // String(void)
    return "" + this.index;
}