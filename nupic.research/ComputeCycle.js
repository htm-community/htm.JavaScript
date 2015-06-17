/**
 * Contains a snapshot of the state attained during one computational
 * call to the {@link TemporalMemory}. The {@code TemporalMemory} uses
 * data from previous compute cycles to derive new data for the current cycle
 * through a comparison between states of those different cycles, therefore
 * this state container is necessary.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript) 
 */
var ComputeCycle = function() {
    this.activeCells = new Set();
    this.winnerCells = new Set();
    this.predictiveCells = new Set();
    this.successfullyPredictedColumns = new Set();
    this.activeSegments = new Set();
    this.learningSegments = new Set();
    this.activeSynapsesForSegment = new Map();

    var that = this;

    /**
     * Constructs a new {@code ComputeCycle}
     */
    var ComputeCycle_void = function() {};

    /**
     * Constructs a new {@code ComputeCycle} initialized with
     * the connections relevant to the current calling {@link Thread} for
     * the specified {@link TemporalMemory}
     * 
     * @param   c       the current connections state of the TemporalMemory
     */
    var ComputeCycle_non_void = function(c) {
        that.activeCells = new Set(c.getActiveCells());
        that.winnerCells = new Set(c.getWinnerCells());
        that.predictiveCells = new Set(c.getPredictiveCells());
        that.successfullyPredictedColumns = new Set(c.getSuccessfullyPredictedColumns());
        that.activeSegments = new Set(c.getActiveSegments());
        that.learningSegments = new Set(c.getLearningSegments());
        that.activeSynapsesForSegment = copyOf(c.getActiveSynapsesForSegment(), "map"); // new LinkedHashMap<DistalDendrite, Set<Synapse>>(c.getActiveSynapsesForSegment());
    };

    if (arguments.length === 0) {
        ComputeCycle_void();
    } else {
        ComputeCycle_non_void(arguments[0]);
    }
};

ComputeCycle.prototype = {
    /**
     * Returns the current {@link Set} of active cells
     * 
     * @return  the current {@link Set} of active cells
     */
    _activeCells: function() { // Set<Cell>(void)
        return this.activeCells;
    },

    /**
     * Returns the current {@link Set} of winner cells
     * 
     * @return  the current {@link Set} of winner cells
     */
    _winnerCells: function() { // Set<Cell>(void)
        return this.winnerCells;
    },

    /**
     * Returns the {@link Set} of predictive cells.
     * @return
     */
    _predictiveCells: function() { // Set<Cell>(void)
        return this.predictiveCells;
    },

    /**
     * Returns the {@link Set} of columns successfully predicted from t - 1.
     * 
     * @return  the current {@link Set} of predicted columns
     */
    _successfullyPredictedColumns: function() { // Set<Column>(void)
        return this.successfullyPredictedColumns;
    },

    /**
     * Returns the Set of learning {@link DistalDendrite}s
     * @return
     */
    _learningSegments: function() { // Set<DistalDendrite>(void)
        return this.learningSegments;
    },

    /**
     * Returns the Set of active {@link DistalDendrite}s
     * @return
     */
    _activeSegments: function() { // Set<DistalDendrite>(void)
        return this.activeSegments;
    },

    /**
     * Returns the mapping of Segments to active synapses in t-1
     * @return
     */
    _activeSynapsesForSegment: function() { //  Map<DistalDendrite, Set<Synapse>>(void)
        return this.activeSynapsesForSegment;
    }
}