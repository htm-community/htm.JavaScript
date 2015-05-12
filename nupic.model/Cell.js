/**
 * Software implementation of a neuron in the neocortical region.
 * 
 * @author Chetan Surpur
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
var Cell = function(column, index) {
    /**
     * Constructs a new {@code Cell} object
     * @param column    the parent {@link Column}
     * @param index     this {@code Cell}'s index
     */
    /** The owning {@link Column} */
    this.parentColumn = column;
    /** This cell's index */
    this.index = column.getIndex() * column.getNumCellsPerColumn() + index;
};

Cell.prototype = {
    /**
     * Returns this {@code Cell}'s index.
     * @return
     */
    getIndex: function() { // int(void)
        return this.index;
    },

    /**
     * Returns the column within which this cell resides
     * @return
     */
    getParentColumn: function() { // Column(void)
        return this.parentColumn;
    },

    /**
     * Adds a {@link Synapse} which is the receiver of signals
     * from this {@code Cell}
     * 
     * @param c     the connections state of the temporal memory
     * @param s
     */
    addReceptorSynapse: function(c, s) { // void(Connections, Synapse)
        c.getReceptorSynapses(this).add(s);
    },

    /**
     * Returns the Set of {@link Synapse}s which have this cell
     * as their source cells.
     *  
     * @param   c       the connections state of the temporal memory
     * @return  the Set of {@link Synapse}s which have this cell
     *          as their source cells.
     */
    getReceptorSynapses: function(c) { // Set<Synapse>(Connections)
        return c.getReceptorSynapses(this);
    },

    /**
     * Returns a newly created {@link DistalDendrite}
     * 
     * @param   c       the connections state of the temporal memory
     * @param index     the index of the new {@link DistalDendrite}
     * @return           a newly created {@link DistalDendrite}
     */
    createSegment: function(c, index) { // DistalDendrite(Connections, int)
        var dd = new DistalDendrite(this, index);
        c.getSegments(this).push(dd);

        return dd;
    },

    /**
     * Returns a {@link List} of this {@code Cell}'s {@link DistalDendrite}s
     * 
     * @param   c   the connections state of the temporal memory
     * @return  a {@link List} of this {@code Cell}'s {@link DistalDendrite}s
     */
    getSegments: function(c) { // List<DistalDendrite>(Connections)
        return c.getSegments(this);
    },

    /**
     * {@inheritDoc}
     */
    toString: function() { // String(void)
        return "Cell: col=" + this.parentColumn.getIndex() + ", idx=" + index;
    },

    /**
     * {@inheritDoc}
     * 
     * <em> Note: All comparisons use the cell's index only </em>
     */
    compareTo: function(arg0) { // int(Cell)
        // this.index > arg0.getIndex() ? +1 : this.index < arg0.getIndex() ? -1 : 0;
        if (this.index > arg0.getIndex()) {
            return 1;
        } else if (this.index < arg0.getIndex()) {
            return -1;
        }
        return 0;
    }
}