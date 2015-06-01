/**
 * Abstraction of both an input bit and a columnal collection of
 * {@link Cell}s which have behavior associated with membership to
 * a given {@code Column}
 * 
 * @author Chetan Surpur
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 */
var Column = function(numCells, index) {
    /**
     * Constructs a new {@code Column}
     * 
     * @param numCells      number of cells per column
     * @param index         the index of this column
     */
    /** The flat non-topological index of this column */
    this.index = index; // int
    /** Configuration of cell count */
    this.numCells = numCells; // int

    this.cells = newArray([numCells], null); // Cell[]
    for (var i = 0; i < numCells; i++) {
        this.cells[i] = new Cell(this, i);
    }

    /** Connects {@link SpatialPooler} input pools */
    this.proximalDendrite = new ProximalDendrite(index); // ProximalDendrite
};

Column.prototype = {
    /**
     * Returns the {@link Cell} residing at the specified index.
     * 
     * @param index     the index of the {@link Cell} to return.
     * @return          the {@link Cell} residing at the specified index.
     */
    getCell: function(index) { // Cell(int)
        return this.cells[index];
    },

    /**
     * Returns a {@link List} view of this {@code Column}'s {@link Cell}s.
     * @return
     */
    getCells: function() { // List<Cell>(void)
        return this.cells;
    },

    /**
     * Returns the index of this {@code Column}
     * @return  the index of this {@code Column}
     */
    getIndex: function() { // int(void)
        return this.index;
    },

    /**
     * Returns the configured number of cells per column for
     * all {@code Column} objects within the current {@link TemporalMemory}
     * @return
     */
    getNumCellsPerColumn: function() { // int(void)
        return this.numCells;
    },

    /**
     * Returns the {@link Cell} with the least number of {@link DistalDendrite}s.
     * 
     * @param c         the connections state of the temporal memory
     * @param random
     * @return
     */
    getLeastUsedCell: function(c, random) { //Cell(Connections c, Random random)		
        var cells = this.getCells();
        var leastUsedCells = [];
        var minNumSegments = Number.MAX_VALUE;

        for (var i = 0; i < cells.length; i++) {
            var numSegments = cells[i].getSegments(c).length;

            if (numSegments < minNumSegments) {
                minNumSegments = numSegments;
                leastUsedCells.length = 0;
            }

            if (numSegments === minNumSegments) {
                leastUsedCells.push(cells[i]);
            }
        }

        var index = random.nextInt(leastUsedCells.length);

        leastUsedCells.sort(function(a, b) {
            return a.compareTo(b);
        });

        return leastUsedCells[index];
    },

    /**
     * Returns this {@code Column}'s single {@link ProximalDendrite}
     * @return
     */
    getProximalDendrite: function() { // ProximalDendrite(void)
        return this.proximalDendrite;
    },

    /**
     * Delegates the potential synapse creation to the one {@link ProximalDendrite}.
     * 
     * @param c						the {@link Connections} memory
     * @param inputVectorIndexes	indexes specifying the input vector bit
     */
    createPotentialPool: function(c, inputVectorIndexes) { // public Pool(Connectionsc, int[])
        return this.proximalDendrite.createPool(c, inputVectorIndexes);
    },

    /**
     * Sets the permanences on the {@link ProximalDendrite} {@link Synapse}s
     * 
     * @param c				the {@link Connections} memory object
     * @param permanences	floating point degree of connectedness
     */
    setProximalPermanences: function(c, permanences) { // void(onnections, double[])
        this.proximalDendrite.setPermanences(c, permanences);
    },

    /**
     * Sets the permanences on the {@link ProximalDendrite} {@link Synapse}s
     * 
     * @param c				the {@link Connections} memory object
     * @param permanences	floating point degree of connectedness
     */
    setProximalPermanencesSparse: function(c, permanences, indexes) { // void(Connections, double[], int[])
        this.proximalDendrite.setPermanencesWithInputIndexes(c, permanences, indexes);
    },

    /**
     * Delegates the call to set synapse connected indexes to this 
     * {@code Column}'s {@link ProximalDendrite}
     * @param c
     * @param connections
     */
    setProximalConnectedSynapsesForTest: function(c, connections) { // void(Connections, int[])
        this.proximalDendrite.setConnectedSynapsesForTest(c, connections);
    },

    /**
     * {@inheritDoc}
     */
    toString: function() { // String toString(void)
        return "Column: idx=" + this.index;
    }
}