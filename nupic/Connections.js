/**
 * Contains the definition of the interconnected structural state of the {@link SpatialPooler} and 
 * {@link TemporalMemory} as well as the state of all support structures 
 * (i.e. Cells, Columns, Segments, Synapses etc.). 
 * 
 * In the separation of data from logic, this class represents the data/state. 
 */
var Connections = function() {
	/////////////////////////////////////// Spatial Pooler Vars ///////////////////////////////////////////
	this.potentialRadius = 16;	// int
	this.potentialPct = 0.5;	// double
	this.globalInhibition = false;	// boolean 
	this.localAreaDensity = -1.0;	// double
	this.numActiveColumnsPerInhArea;	// double
	this.stimulusThreshold = 0;	// double
	this.synPermInactiveDec = 0.01;	// double
	this.synPermActiveInc = 0.10;	// double
	this.synPermConnected = 0.10;	// double
	this.synPermBelowStimulusInc = this.synPermConnected / 10.0;	// double
	this.minPctOverlapDutyCycles = 0.001;	// double
	this.minPctActiveDutyCycles = 0.001;// double
	this.dutyCyclePeriod = 1000;	// int
	this.maxBoost = 10.0;	// double
	this.spVerbosity = 0;	// int
	    
	this.numInputs = 1;  //product of input dimensions	// int
	this.numColumns = 1; //product of column dimensions	// int
	    
	//Extra parameter settings
	this.synPermMin = 0.0;	// double
	this.synPermMax = 1.0;	// double
	this.synPermTrimThreshold = this.synPermActiveInc / 2.0;	// double 
	this.updatePeriod = 50;	// int
	this.initConnectedPct = 0.5;	// double
	    
	//Internal state
	this.version = 1.0;	// double
	this.iterationNum = 0;	// int
	this.iterationLearnNum = 0;// int
	    
	/** A matrix representing the shape of the input. */
	this.inputMatrix = null;	// SparseMatrix<?>
	/**
	 * Store the set of all inputs that are within each column's potential pool.
	 * 'potentialPools' is a matrix, whose rows represent cortical columns, and
	 * whose columns represent the input bits. if potentialPools[i][j] == 1,
	 * then input bit 'j' is in column 'i's potential pool. A column can only be
	 * connected to inputs in its potential pool. The indices refer to a
	 * flattened version of both the inputs and columns. Namely, irrespective
	 * of the topology of the inputs and columns, they are treated as being a
	 * one dimensional array. Since a column is typically connected to only a
	 * subset of the inputs, many of the entries in the matrix are 0. Therefore
	 * the potentialPool matrix is stored using the SparseBinaryMatrix
	 * class, to reduce memory footprint and computation time of algorithms that
	 * require iterating over the data structure.
	 */
	this.potentialPools = null;	// SparseObjectMatrix<Pool>
	/**
	 * Initialize a tiny random tie breaker. This is used to determine winning
	 * columns where the overlaps are identical.
	 */
	this.tieBreaker = [];	// double[]
	/** 
	 * Stores the number of connected synapses for each column. This is simply
	 * a sum of each row of 'connectedSynapses'. again, while this
	 * information is readily available from 'connectedSynapses', it is
	 * stored separately for efficiency purposes.
	 */
	this.connectedCounts = null;	// SparseBinaryMatrix	
	/**
	 * The inhibition radius determines the size of a column's local
	 * neighborhood. of a column. A cortical column must overcome the overlap
	 * score of columns in his neighborhood in order to become actives. This
	 * radius is updated every learning round. It grows and shrinks with the
	 * average number of connected synapses per column.
	 */
	this.inhibitionRadius = 0;	// int
	    
	this.proximalSynapseCounter = 0;	// int
	    
	this.overlapDutyCycles = [];	// double[]
	this.activeDutyCycles = [];		// double[]
	this.minOverlapDutyCycles = [];	// double[]
	this.minActiveDutyCycles = [];	// double[]
	this.boostFactors = [];			// double[]
	    
	/////////////////////////////////////// Temporal Memory Vars ///////////////////////////////////////////
	    
	this.activeCells = null;				// Set<Cell> activeCells = new LinkedHashSet<Cell>();
	this.winnerCells = null;				// Set<Cell> winnerCells = new LinkedHashSet<Cell>();
	this.predictiveCells = null;			// Set<Cell> predictiveCells = new LinkedHashSet<Cell>();
	this.predictedColumns = null;			// Set<Column> predictedColumns = new LinkedHashSet<Column>();
	this.activeSegments = null;				// Set<DistalDendrite> activeSegments = new LinkedHashSet<DistalDendrite>();
	this.learningSegments = null;			// Set<DistalDendrite> learningSegments = new LinkedHashSet<DistalDendrite>();
	this.activeSynapsesForSegment = null;	// Map<DistalDendrite, Set<Synapse>> activeSynapsesForSegment = new LinkedHashMap<DistalDendrite, Set<Synapse>>();
	    
	/** Total number of columns */
	this.columnDimensions = [2048];		// int[] columnDimensions = new int[] { 2048 };
	/** Total number of cells per column */
	this.cellsPerColumn = 32;			// int
	/** What will comprise the Layer input. Input (i.e. from encoder) */
	this.inputDimensions = [32, 32];	// int[] inputDimensions = new int[] { 32, 32 };
	/** 
	 * If the number of active connected synapses on a segment 
	 * is at least this threshold, the segment is said to be active.
	 */
	this.activationThreshold = 13;	// int
	/**
	 * Radius around cell from which it can
	 * sample to form distal {@link DistalDendrite} connections.
	 */
	this.learningRadius = 2048;	// int
	/**
	 * If the number of synapses active on a segment is at least this
	 * threshold, it is selected as the best matching
	 * cell in a bursting column.
	 */
	this.minThreshold = 10;	// int
	/** The maximum number of synapses added to a segment during learning. */
	this.maxNewSynapseCount = 20;	// int
	/** Initial permanence of a new synapse */
	this.initialPermanence = 0.21;	// double
	/**
	 * If the permanence value for a synapse
	 * is greater than this value, it is said
	 * to be connected.
	 */
	this.connectedPermanence = 0.50;	// double
	/** 
	 * Amount by which permanences of synapses
	 * are incremented during learning.
	 */
	this.permanenceIncrement = 0.10;	// double
	/** 
	 * Amount by which permanences of synapses
	 * are decremented during learning.
	 */
	this.permanenceDecrement = 0.10;	// double
	    
	/** The main data structure containing columns, cells, and synapses */
	this.memory = null;	// SparseObjectMatrix<Column> 
	    
	this.cells = null;	// Cell[]
	    
	/////////////////////// Structural Elements /////////////////////////
	/** Reverse mapping from source cell to {@link Synapse} */
	this.receptorSynapses = null;	// Map<Cell, Set<Synapse>>
	    
	this.segments = null;	// Map<Cell, List<DistalDendrite>>
	this.synapses = null;	// Map<Segment, List<Synapse>>
	    
	/** Helps index each new Segment */
	this.segmentCounter = 0;	// int
	/** Helps index each new Synapse */
	this.synapseCounter = 0;	// int
	/** The default random number seed */
	this.seed = 42;	// int
	/** The random number generator */
	this.random = new MersenneTwister(this.seed);	// Random random = new MersenneTwister(42);
};	    
	          
Connections.prototype = {
	/**
	 * Returns the configured initial connected percent.
	 * @return
	 */
	getInitConnectedPct: function() {	// double(void)
		return this.initConnectedPct;
	},

	/**
	 * Clears all state.
	 */
	clear: function() {	// void(void)
		this.activeCells.length = 0;
		this.winnerCells.length = 0;
		this.predictiveCells.length = 0;
		this.predictedColumns.length = 0;
		this.activeSegments.length = 0;
		this.learningSegments.length = 0;
		this.activeSynapsesForSegment.length = 0;
	},

	/**
	  * Returns the segment counter
	  * @return
	  */
	getSegmentCount: function() {	// int(void)
		return this.segmentCounter;
	},

	/**
	 * Sets the segment counter
	 * @param counter
	 */
	setSegmentCount: function(counter) {	// void(int)
	   	this.segmentCounter = counter;
	},	    

	/**
	 * Returns the cycle count.
	 * @return
	 */
	getIterationNum: function() {	// int(void)
	   	return this.iterationNum;
	},

	/**
	 * Sets the iteration count.
	 * @param num
	 */
	setIterationNum: function(num) {	// void(int)
	   	this.iterationNum = num;
	},	    

	/**
	 * Returns the period count which is the number of cycles
	 * between meta information updates.
	 * @return
	 */
	getUpdatePeriod: function() {	// int(void)
	   	return this.updatePeriod;
	},
	    
	/**
	 * Sets the update period
	 * @param period
	 */
	setUpdatePeriod: function(period) {	// void(int)
	  	this.updatePeriod = period;
	},
	    
	/**
	 * Returns the {@link Cell} specified by the index passed in.
	 * @param index		of the specified cell to return.
	 * @return
	 */
	getCell: function(index) {	// Cell(int)
	   	return this.cells[index];
	},
	    
	/**
	 * Returns an array containing all of the {@link Cell}s.
	 * @return
	 */
	getCells: function() {	// Cell[](void)
	   	return this.cells;
	},
	    
	/**
	 * Sets the flat array of cells
	 * @param cells
	 */
	setCells: function(cells) {	// void
	   	this.cells = cells;
	},
	    
	/**
	 * Returns an array containing the {@link Cell}s specified
	 * by the passed in indexes.
	 * 
	 * @param cellIndexes	indexes of the Cells to return
	 * @return
	 */
	getCells: function(cellIndexes) {	// Cell[](int[])
	    var retVal = [];
	    for(var i = 0; i < cellIndexes.length; i++) {
	    	retVal[i] = this.cells[cellIndexes[i]];
	    }
	    return retVal;
	},
	    
	/**
	 * Returns a {@link LinkedHashSet} containing the {@link Cell}s specified
	 * by the passed in indexes.
	 * 
	 * @param cellIndexes	indexes of the Cells to return
	 * @return
	 */
	getCellSet: function(cellIndexes) {	// LinkedHashSet<Cell>(int[])
	    var	retVal = new Set();
	    for(var i = 0; i < cellIndexes.length; i++) {
	    	retVal.add(this.cells[cellIndexes[i]]);
	    }
	    return retVal;
	},
	    
	/**
	 * Sets the seed used for the internal random number generator.
	 * If the generator has been instantiated, this method will initialize
	 * a new random generator with the specified seed.
	 * 
	 * @param seed
	 */
	setSeed: function(seed) {	// void(int)
	    this.seed = seed;
	},
	    
	/**
	 * Returns the configured random number seed
	 * @return
	 */
	getSeed: function() {	// int(void)
	    return this.seed;
	},

	/**
	 * Returns the thread specific {@link Random} number generator.
	 * @return
	 */
	getRandom: function() {	// Random
	    return this.random;
	},

	setRandom: function(random) {	// void(Random)
	    this.random = random;
	},
	    
	/**
	 * Sets the matrix containing the {@link Column}s
	 * @param mem
	 */
	setMemory: function(mem) {	// void(SparseObjectMatrix<Column>)
	   	this.memory = mem;
	},
	    
	/**
	 * Returns the matrix containing the {@link Column}s
	 * @return
	 */
	getMemory: function() {	// SparseObjectMatrix<Column>(void)
	   	return this.memory;
	},
	    
	/**
	 * Returns the input column mapping
	 */
	getInputMatrix: function() {	// SparseMatrix<?>(void)
	    return this.inputMatrix;
	},
	    
	/**
	 * Sets the input column mapping matrix
	 * @param matrix
	 */
	setInputMatrix: function(matrix) {	// Java void(SparseMatrix<?>)
	    this.inputMatrix = matrix;
	},
	    
	/**
	 * Returns the inhibition radius
	 * @return
	 */
	getInhibitionRadius: function() {	// int(void)
	    return this.inhibitionRadius;
	},
	    
	/**
	 * Sets the inhibition radius
	 * @param radius
	 */
	setInhibitionRadius: function(radius) {	// void(int)
	    this.inhibitionRadius = radius;
	},
	    
	/**
	 * Returns the product of the input dimensions 
	 * @return  the product of the input dimensions 
	 */
	getNumInputs: function() {	// Java int(void)
	    return this.numInputs;
	},
	    
	setNumInputs: function(n) {	// void(int)
	    this.numInputs = n;
	},
	    
	/**
	 * Returns the product of the column dimensions 
	 * @return  the product of the column dimensions 
	 */
	getNumColumns: function() {	// int(void)
	    return this.numColumns;
	},
	    
	setNumColumns: function(n) {	// void(int)
	    this.numColumns = n;
	},
	    
	/**
	 * This parameter determines the extent of the input
	 * that each column can potentially be connected to.
	 * This can be thought of as the input bits that
	 * are visible to each column, or a 'receptiveField' of
	 * the field of vision. A large enough value will result
	 * in 'global coverage', meaning that each column
	 * can potentially be connected to every input bit. This
	 * parameter defines a square (or hyper square) area: a
	 * column will have a max square potential pool with
	 * sides of length 2 * potentialRadius + 1.
	 * 
	 * @param potentialRadius
	 */
	setPotentialRadius: function(potentialRadius) {	// void(int)
	    this.potentialRadius = potentialRadius;
	},
	    
	/**
	 * Returns the configured potential radius
	 * @return  the configured potential radius
	 * @see {@link #setPotentialRadius(int)}
	 */
	getPotentialRadius: function() {	// int(void)
	    return Math.min(this.numInputs, this.potentialRadius);
	},

	/**
	 * The percent of the inputs, within a column's
	 * potential radius, that a column can be connected to.
	 * If set to 1, the column will be connected to every
	 * input within its potential radius. This parameter is
	 * used to give each column a unique potential pool when
	 * a large potentialRadius causes overlap between the
	 * columns. At initialization time we choose
	 * ((2*potentialRadius + 1)^(# inputDimensions) *
	 * potentialPct) input bits to comprise the column's
	 * potential pool.
	 * 
	 * @param potentialPct
	 */
	setPotentialPct: function(potentialPct) {	// void(double)
	    this.potentialPct = potentialPct;
	},
	    
	/**
	 * Returns the configured potential pct
	 * 
	 * @return the configured potential pct
	 * @see {@link #setPotentialPct(double)}
	 */
	getPotentialPct: function() {	// double(void)
	    return this.potentialPct;
	},
	    
	/**
	 * Sets the {@link SparseObjectMatrix} which represents the 
	 * proximal dendrite permanence values.
	 * 
	 * @param s the {@link SparseObjectMatrix}
	 */
	setPermanences: function(s) {	// void(SparseObjectMatrix<double[]>)
		for (var i=0; i<s.getSparseIndices().length; i++) {
			var idx = s.getSparseIndices()[i];
			this.memory.getObject(idx).setProximalPermanences(this, s.getObject(idx));
		}
	},
	    
	/**
	 * Returns the count of {@link Synapse}s
	 * @return
	 */
	getSynapseCount: function() {	// int(void)
	   	return this.synapseCounter;
	},
	    
	/**
	 * Sets the count of {@link Synapse}s
	 * @param i
	 */
	setSynapseCount: function(i) {	// void(int)
	   	this.synapseCounter = i;
	},
	    
	/**
	 * Returns the indexed count of connected synapses per column.
	 * @return
	 */
	getConnectedCounts: function() {	// SparseBinaryMatrix(void)
	    return this.connectedCounts;
	},
	    
	/**
	 * Returns the connected count for the specified column.
	 * @param columnIndex
	 * @return
	 */
	getConnectedCount: function(columnIndex) {	// int(int)
	    return this.connectedCounts.getTrueCount(columnIndex);
	},
	    
	/**
	 * Sets the indexed count of synapses connected at the columns in each index.
	 * @param counts
	 */
	setConnectedCounts: function(counts) {	// void(int[])
	    for (var i=0; i<counts.length; i++) {
	       	this.connectedCounts.setTrueCount(i, counts[i]);
	    }
	},
	    
	/**
	 * Sets the connected count {@link SparseBinaryMatrix}
	 * @param columnIndex
	 * @param count
	 */
	setConnectedMatrix: function(matrix) {	// void(SparseBinaryMatrix)
	    this.connectedCounts = matrix;
	},
	    
	/**
	 * Sets the array holding the random noise added to proximal dendrite overlaps.
	 * 
	 * @param tieBreaker	random values to help break ties
	 */
	setTieBreaker: function(tieBreaker) {	// void(double[])
	    this.tieBreaker = tieBreaker;
	},
	    
	/**
	 * Returns the array holding random values used to add to overlap scores
	 * to break ties.
	 * 
	 * @return
	 */
	getTieBreaker: function() {	// double(void)
	   	return this.tieBreaker;
	},
	    
	/**
	 * If true, then during inhibition phase the winning
	 * columns are selected as the most active columns from
	 * the region as a whole. Otherwise, the winning columns
	 * are selected with respect to their local
	 * neighborhoods. Using global inhibition boosts
	 * performance x60.
	 * 
	 * @param globalInhibition
	 */
	setGlobalInhibition: function(globalInhibition) {	// void(boolean)
	    this.globalInhibition = globalInhibition;
	},
	    
    /**
     * Returns the configured global inhibition flag
     * @return  the configured global inhibition flag
     * @see {@link #setGlobalInhibition(boolean)}
     */
    getGlobalInhibition: function() {	// boolean(void)
	    return this.globalInhibition;
	},

	/**
	 * The desired density of active columns within a local
	 * inhibition area (the size of which is set by the
	 * internally calculated inhibitionRadius, which is in
	 * turn determined from the average size of the
	 * connected potential pools of all columns). The
	 * inhibition logic will insure that at most N columns
	 * remain ON within a local inhibition area, where N =
	 * localAreaDensity * (total number of columns in
	 * inhibition area).
	 * 
	 * @param localAreaDensity
	 */
	setLocalAreaDensity: function(localAreaDensity) {	// void(double)
	    this.localAreaDensity = localAreaDensity;
	},
	    
	/**
	 * Returns the configured local area density
	 * @return  the configured local area density
	 * @see {@link #setLocalAreaDensity(double)}
	 */
	getLocalAreaDensity: function() {	// double(void)
	    return this.localAreaDensity;
	},

	/**
	 * An alternate way to control the density of the active
	 * columns. If numActivePerInhArea is specified then
	 * localAreaDensity must be less than 0, and vice versa.
	 * When using numActivePerInhArea, the inhibition logic
	 * will insure that at most 'numActivePerInhArea'
	 * columns remain ON within a local inhibition area (the
	 * size of which is set by the internally calculated
	 * inhibitionRadius, which is in turn determined from
	 * the average size of the connected receptive fields of
	 * all columns). When using this method, as columns
	 * learn and grow their effective receptive fields, the
	 * inhibitionRadius will grow, and hence the net density
	 * of the active columns will *decrease*. This is in
	 * contrast to the localAreaDensity method, which keeps
	 * the density of active columns the same regardless of
	 * the size of their receptive fields.
	 * 
	 * @param numActiveColumnsPerInhArea
	 */
	setNumActiveColumnsPerInhArea: function(numActiveColumnsPerInhArea) {	// void(double)
	    this.numActiveColumnsPerInhArea = numActiveColumnsPerInhArea;
	},
	    
	/**
	 * Returns the configured number of active columns per
	 * inhibition area.
	 * @return  the configured number of active columns per
	 * inhibition area.
	 * @see {@link #setNumActiveColumnsPerInhArea(double)}
	 */
	getNumActiveColumnsPerInhArea: function() {	// double(void)
	    return this.numActiveColumnsPerInhArea;
	},

	/**
	 * This is a number specifying the minimum number of
	 * synapses that must be on in order for a columns to
	 * turn ON. The purpose of this is to prevent noise
	 * input from activating columns. Specified as a percent
	 * of a fully grown synapse.
	 * 
	 * @param stimulusThreshold
	 */
	setStimulusThreshold: function(stimulusThreshold) {	// void(double)
	    this.stimulusThreshold = stimulusThreshold;
	},
	    
	/**
	 * Returns the stimulus threshold
	 * @return  the stimulus threshold
	 * @see {@link #setStimulusThreshold(double)}
	 */
	getStimulusThreshold: function() {	// double(void)
	    return this.stimulusThreshold;
	},

	/**
	 * The amount by which an inactive synapse is
	 * decremented in each round. Specified as a percent of
	 * a fully grown synapse.
	 * 
	 * @param synPermInactiveDec
	 */
	setSynPermInactiveDec: function(synPermInactiveDec) {	// void(double)
	    this.synPermInactiveDec = synPermInactiveDec;
	},
	    
	/**
	 * Returns the synaptic permanence inactive decrement.
	 * @return  the synaptic permanence inactive decrement.
	 * @see {@link #setSynPermInactiveDec(double)}
	 */
	getSynPermInactiveDec: function() {	// double(void)
	    return this.synPermInactiveDec;
	},

	/**
	 * The amount by which an active synapse is incremented
	 * in each round. Specified as a percent of a
	 * fully grown synapse.
	 * 
	 * @param synPermActiveInc
	 */
	setSynPermActiveInc: function(synPermActiveInc) {	// void(double)
	    this.synPermActiveInc = synPermActiveInc;
	},
	    
	/**
	 * Returns the configured active permanence increment
	 * @return the configured active permanence increment
	 * @see {@link #setSynPermActiveInc(double)}
	 */
	getSynPermActiveInc: function() {	// double(void)
	    return this.synPermActiveInc;
	},

	/**
	 * The default connected threshold. Any synapse whose
	 * permanence value is above the connected threshold is
	 * a "connected synapse", meaning it can contribute to
	 * the cell's firing.
	 * 
	 * @param minPctOverlapDutyCycle
	 */
	setSynPermConnected: function(synPermConnected) {	// void(double)
	    this.synPermConnected = synPermConnected;
	},
	    
	/**
	 * Returns the synapse permanence connected threshold
	 * @return the synapse permanence connected threshold
	 * @see {@link #setSynPermConnected(double)}
	 */
	getSynPermConnected: function() {	// double(void)
	    return this.synPermConnected;
	},
	    
	/**
	 * Sets the stimulus increment for synapse permanences below 
	 * the measured threshold.
	 * @param stim
	 */
	setSynPermBelowStimulusInc: function(stim) {	// void(double)
	  	this.synPermBelowStimulusInc = stim;
	},
	    
	/**
	 * Returns the stimulus increment for synapse permanences below 
	 * the measured threshold.
	 * 
	 * @return
	 */
	getSynPermBelowStimulusInc: function() {	// double(void)
	        return this.synPermBelowStimulusInc;
	},
	    
	/**
	 * A number between 0 and 1.0, used to set a floor on
	 * how often a column should have at least
	 * stimulusThreshold active inputs. Periodically, each
	 * column looks at the overlap duty cycle of
	 * all other columns within its inhibition radius and
	 * sets its own internal minimal acceptable duty cycle
	 * to: minPctDutyCycleBeforeInh * max(other columns'
	 * duty cycles).
	 * On each iteration, any column whose overlap duty
	 * cycle falls below this computed value will  get
	 * all of its permanence values boosted up by
	 * synPermActiveInc. Raising all permanences in response
	 * to a sub-par duty cycle before  inhibition allows a
	 * cell to search for new inputs when either its
	 * previously learned inputs are no longer ever active,
	 * or when the vast majority of them have been
	 * "hijacked" by other columns.
	 * 
	 * @param minPctOverlapDutyCycle
	 */
	setMinPctOverlapDutyCycles: function(minPctOverlapDutyCycle) {	// void(double)
	        this.minPctOverlapDutyCycles = minPctOverlapDutyCycle;
	},
	    
	/**
	 * {@see #setMinPctOverlapDutyCycles(double)}
	 * @return
	 */
	getMinPctOverlapDutyCycles: function() {	// double(void)
	    return this.minPctOverlapDutyCycles;
	},

	/**
	 * A number between 0 and 1.0, used to set a floor on
	 * how often a column should be activate.
	 * Periodically, each column looks at the activity duty
	 * cycle of all other columns within its inhibition
	 * radius and sets its own internal minimal acceptable
	 * duty cycle to:
	 *   minPctDutyCycleAfterInh *
	 *   max(other columns' duty cycles).
	 * On each iteration, any column whose duty cycle after
	 * inhibition falls below this computed value will get
	 * its internal boost factor increased.
	 * 
	 * @param minPctActiveDutyCycle
	 */
	setMinPctActiveDutyCycles: function(minPctActiveDutyCycle) {	// void(double)
	    this.minPctActiveDutyCycles = minPctActiveDutyCycle;
	},
	    
	/**
	 * Returns the minPctActiveDutyCycle
	 * @return  the minPctActiveDutyCycle
	 * @see {@link #setMinPctActiveDutyCycle(double)}
	 */
	getMinPctActiveDutyCycles: function() {	// double(void)
	    return this.minPctActiveDutyCycles;
	},

	/**
	 * The period used to calculate duty cycles. Higher
	 * values make it take longer to respond to changes in
	 * boost or synPerConnectedCell. Shorter values make it
	 * more unstable and likely to oscillate.
	 * 
	 * @param dutyCyclePeriod
	 */
	setDutyCyclePeriod: function(dutyCyclePeriod) {	// void(int)
	    this.dutyCyclePeriod = dutyCyclePeriod;
	},
	    
	/**
	 * Returns the configured duty cycle period
	 * @return  the configured duty cycle period
	 * @see {@link #setDutyCyclePeriod(double)}
	 */
	getDutyCyclePeriod: function() {	// int(void)
	    return this.dutyCyclePeriod;
	},

	/**
	 * The maximum overlap boost factor. Each column's
	 * overlap gets multiplied by a boost factor
	 * before it gets considered for inhibition.
	 * The actual boost factor for a column is number
	 * between 1.0 and maxBoost. A boost factor of 1.0 is
	 * used if the duty cycle is >= minOverlapDutyCycle,
	 * maxBoost is used if the duty cycle is 0, and any duty
	 * cycle in between is linearly extrapolated from these
	 * 2 end points.
	 * 
	 * @param maxBoost
	 */
	setMaxBoost: function(maxBoost) {	// void(double)
	    this.maxBoost = maxBoost;
	},
	    
	/**
	 * Returns the max boost
	 * @return  the max boost
	 * @see {@link #setMaxBoost(double)}
	 */
	getMaxBoost: function() {	// double(void)
	    return this.maxBoost;
	},
	    
	/**
	 * spVerbosity level: 0, 1, 2, or 3
	 * 
	 * @param spVerbosity
	 */
	setSpVerbosity: function(spVerbosity) {	// void(int)
	    this.spVerbosity = spVerbosity;
	},
	    
	/**
	 * Returns the verbosity setting.
	 * @return  the verbosity setting.
	 * @see {@link #setSpVerbosity(int)}
	 */
	getSpVerbosity: function() {	// int(void)
	    return this.spVerbosity;
	},

	/**
	 * Sets the synPermTrimThreshold
	 * @param threshold
	 */
	setSynPermTrimThreshold: function(threshold) {	// void(double)
	    this.synPermTrimThreshold = threshold;
	},
	    
	/**
	 * Returns the synPermTrimThreshold
	 * @return
	 */
	getSynPermTrimThreshold: function() {	// double(void)
	    return this.synPermTrimThreshold;
	},
	    
	/**
	 * Sets the {@link SparseObjectMatrix} which holds the mapping
	 * of column indexes to their lists of potential inputs. 
	 * 
	 * @param pools		{@link SparseObjectMatrix} which holds the pools.
	 */
	setPotentialPools: function(pools) {	// void(SparseObjectMatrix<Pool>)
	    this.potentialPools = pools;
	},
	    
	/**
	 * Returns the {@link SparseObjectMatrix} which holds the mapping
	 * of column indexes to their lists of potential inputs.
	 * @return	the potential pools
	 */
	getPotentialPools: function() {	// SparseObjectMatrix<Pool>(void)
	    return this.potentialPools;
	},
	    
	/**
	 * 
	 * @return
	 */
	getSynPermMin: function() {	// double(void)
	    return this.synPermMin;
	},
	    
	/**
	 * 
	 * @return
	 */
	getSynPermMax: function() {	// double(void)
	    return this.synPermMax;
	},
	    
	/**
	 * Returns the output setting for verbosity
	 * @return
	 */
	getVerbosity: function() {	// int(void)
	    return this.spVerbosity;
	},
	    
	/**
	 * Returns the version number
	 * @return
	 */
	getVersion: function() {	// double(void)
	    return this.version;
	},
	    
	/**
	 * Returns the overlap duty cycles.
	 * @return
	 */
	getOverlapDutyCycles: function() {	// double[](void)
		return this.overlapDutyCycles;
	},

	setOverlapDutyCycles: function(overlapDutyCycles) {	// void(double[])
		this.overlapDutyCycles = overlapDutyCycles;
	},

	/**
	 * Returns the dense (size=numColumns) array of duty cycle stats. 
	 * @return	the dense array of active duty cycle values.
	 */
	getActiveDutyCycles: function() {	// double[](void)
		return this.activeDutyCycles;
	},

	/**
	 * Sets the dense (size=numColumns) array of duty cycle stats. 
	 * @param activeDutyCycles
	 */
	setActiveDutyCycles: function(activeDutyCycles) {	// void(double[])
		this.activeDutyCycles = activeDutyCycles;
	},
		
	/**
	 * Applies the dense array values which aren't -1 to the array containing
	 * the active duty cycles of the column corresponding to the index specified.
	 * The length of the specified array must be as long as the configured number
	 * of columns of this {@code Connections}' column configuration.
	 * 
	 * @param	denseActiveDutyCycles	a dense array containing values to set.
	 */
	updateActiveDutyCycles: function(denseActiveDutyCycles) {	// void(double[])
		for(var i=0; i<denseActiveDutyCycles.length; i++) {
			if(denseActiveDutyCycles[i] != -1) {
				activeDutyCycles[i] = denseActiveDutyCycles[i];
			}
		}
	},

	getMinOverlapDutyCycles: function() {	// double[](void)
		return this.minOverlapDutyCycles;
	},

	setMinOverlapDutyCycles: function(minOverlapDutyCycles) {	// void(double[])
		this.minOverlapDutyCycles = minOverlapDutyCycles;
	},

	getMinActiveDutyCycles: function() {	// double[](void)
		return this.minActiveDutyCycles;
	},

	setMinActiveDutyCycles: function(minActiveDutyCycles) {	// void(double[])
		this.minActiveDutyCycles = minActiveDutyCycles;
	},

	getBoostFactors: function() {	// double[](void)
		return this.boostFactors;
	},

	setBoostFactors: function(boostFactors) {	// void(double[])
		this.boostFactors = boostFactors;
	},
		
	/**
	 * Returns the current count of {@link Synapse}s for {@link ProximalDendrite}s.
	 * @return
	 */
	getProxSynCount: function() {	// int(void)
		return this.proximalSynapseCounter;
	},

	/**
	 * High verbose output useful for debugging
	 */
	printParameters: function() {	// void(void)
	        console.log("------------ SpatialPooler Parameters ------------------");
	        console.log("numInputs                  = " + getNumInputs());
	        console.log("numColumns                 = " + getNumColumns());
	        console.log("columnDimensions           = " + getColumnDimensions());
	        console.log("numActiveColumnsPerInhArea = " + getNumActiveColumnsPerInhArea());
	        console.log("potentialPct               = " + getPotentialPct());
	        console.log("globalInhibition           = " + getGlobalInhibition());
	        console.log("localAreaDensity           = " + getLocalAreaDensity());
	        console.log("stimulusThreshold          = " + getStimulusThreshold());
	        console.log("synPermActiveInc           = " + getSynPermActiveInc());
	        console.log("synPermInactiveDec         = " + getSynPermInactiveDec());
	        console.log("synPermConnected           = " + getSynPermConnected());
	        console.log("minPctOverlapDutyCycle     = " + getMinPctOverlapDutyCycles());
	        console.log("minPctActiveDutyCycle      = " + getMinPctActiveDutyCycles());
	        console.log("dutyCyclePeriod            = " + getDutyCyclePeriod());
	        console.log("maxBoost                   = " + getMaxBoost());
	        console.log("spVerbosity                = " + getSpVerbosity());
	        console.log("version                    = " + getVersion());
	},
	    
	/////////////////////////////// Temporal Memory //////////////////////////////
	    
	/**
	 * Returns the current {@link Set} of active {@link Cell}s
	 * 
	 * @return  the current {@link Set} of active {@link Cell}s
	 */
	getActiveCells: function() {	// Set<Cell>(void)
	    return this.activeCells;
	},
	    
	/**
	 * Sets the current {@link Set} of active {@link Cell}s
	 * @param cells
	 */
	setActiveCells: function(cells) {	// void(Set<Cell>)
		this.activeCells = cells;
	},
	    
	/**
	 * Returns the current {@link Set} of winner cells
	 * 
	 * @return  the current {@link Set} of winner cells
	 */
	getWinnerCells: function() {	// Set<Cell>(void)
	    return this.winnerCells;
	},
	    
	/**
	 * Sets the current {@link Set} of winner {@link Cells}s
	 * @param cells
	 */
	setWinnerCells: function(cells) {	// void(Set<Cell>)
	    this.winnerCells = cells;
	},
	    
	/**
	 * Returns the {@link Set} of predictive cells.
	 * @return
	 */
	getPredictiveCells: function() {	// Set<Cell>(void)
	    return this.predictiveCells;
	},
	    
	/**
	 * Sets the current {@link Set} of predictive {@link Cell}s
	 * @param cells
	 */
	setPredictiveCells: function(cells) {	// void(Set<Cell>)
	    this.predictiveCells = cells;
	},
	    
	/**
	 * Returns the current {@link Set} of predicted columns
	 * 
	 * @return  the current {@link Set} of predicted columns
	 */
	getPredictedColumns: function() {	// Set<Column>(void)
	    return this.predictedColumns;
	},
	    
	/**
	 * Sets the {@link Set} of predictedColumns
	 * @param columns
	 */
	setPredictedColumns: function(columns) {	// void(Set<Column>)
	    this.predictedColumns = columns;
	},
	    
	/**
	 * Returns the Set of learning {@link DistalDendrite}s
	 * @return
	 */
	getLearningSegments: function() {	// Set<DistalDendrite>(void)
	    return this.learningSegments;
	},
	    
	/**
	 * Sets the {@link Set} of learning segments
	 * @param segments
	 */
	setLearningSegments: function(segments) {	// void(Set<DistalDendrite>)
	    this.learningSegments = segments;
	},
	    
	/**
	 * Returns the Set of active {@link DistalDendrite}s
	 * @return
	 */
	getActiveSegments: function() {	// Set<DistalDendrite>(void)
	    return this.activeSegments;
	},
	    
	/**
	 * Sets the {@link Set} of active {@link Segment}s
	 * @param segments
	 */
	setActiveSegments: function(segments) {	// void(Set<DistalDendrite>)
	    this.activeSegments = segments;
	},
	    
	/**
	 * Returns the mapping of Segments to active synapses in t-1
	 * @return
	 */
	getActiveSynapsesForSegment: function() {	// Map<DistalDendrite, Set<Synapse>>(void)
	    return this.activeSynapsesForSegment;
	},
	    
	/**
	 * Sets the mapping of {@link Segment}s to active {@link Synapse}s
	 * @param syns
	 */
	setActiveSynapsesForSegment: function(syns) {	// void(Map<DistalDendrite, Set<Synapse>>)
	    this.activeSynapsesForSegment = syns;
	},
	    
	/**
	 * Returns the mapping of {@link Cell}s to their reverse mapped 
	 * {@link Synapse}s.
	 * 
	 * @param cell      the {@link Cell} used as a key.
	 * @return          the mapping of {@link Cell}s to their reverse mapped 
	 *                  {@link Synapse}s.   
	 */
	getReceptorSynapses: function(cell) {	// Set<Synapse>(Cell)
    	if (isNullOrUndefined(cell)) {
            throw new Error("Illegal Argument: Cell was null, undefined or empty.");
    	}
	        
	    if (isNullOrUndefined(this.receptorSynapses)) {
	        this.receptorSynapses = new WeakMap();
	    }
	        
	    var retVal = this.receptorSynapses.get(cell);
	    if (isNullOrUndefined(retVal)) {
	    	retVal = new Set();
	        this.receptorSynapses.set(cell, retVal);
	    }
	        
	    return retVal;
	},
	    
	/**
	 * Returns the mapping of {@link Cell}s to their {@link DistalDendrite}s.
	 * 
	 * @param cell      the {@link Cell} used as a key.
	 * @return          the mapping of {@link Cell}s to their {@link DistalDendrite}s.
	 */
	getSegments: function(cell) {	// List<DistalDendrite>(Cell) 
	    if (isNullOrUndefined(cell)) {
	        throw new Error("Illegal Argument: Cell was null, undefined or empty.");
	    }
	        
	    if (isNullOrUndefined(this.segments)) {
	        this.segments = new WeakMap();
	    }
	        
	    var retVal = this.segments.get(cell);
	    if (isNullOrUndefined(retVal)) {
	    	retVal = [];
	        this.segments.set(cell, retVal);
	    }
	        
	    return retVal;
	},
	    
	/**
	 * Returns the mapping of {@link DistalDendrite}s to their {@link Synapse}s.
	 * 
	 * @param segment   the {@link DistalDendrite} used as a key.
	 * @return          the mapping of {@link DistalDendrite}s to their {@link Synapse}s.
	 */
	getSynapses: function(segment) {	// List<Synapse>(DistalDendrite)
	    if(isNullOrUndefined(segment)) {
	        throw new Error("Illegal Argument: Segment was null, undefined or empty.");
	    }
	        
	    if (isNullOrUndefined(this.synapses)) {
	        this.synapses = new WeakMap();
	    }
	        
	    var retVal = this.synapses.get(segment);
	    if (isNullOrUndefined(retVal)) {
	    	retVal = [];
	        this.synapses.set(segment, retVal);
	    }
	        
	    return retVal;
	 },
	    
	    /**
	     * Returns the mapping of {@link ProximalDendrite}s to their {@link Synapse}s.
	     * 
	     * @param segment   the {@link ProximalDendrite} used as a key.
	     * @return          the mapping of {@link ProximalDendrite}s to their {@link Synapse}s.
	     */
	    /*
	 	public List<Synapse> getSynapses(ProximalDendrite segment) {	// List<Synapse>(ProximalDendrite)
	    	if(segment == null) {
	            throw new IllegalArgumentException("Segment was null");
	        }
	    	
	    	if(synapses == null) {
	            synapses = new LinkedHashMap<Segment, List<Synapse>>();
	        }
	        
	        List<Synapse> retVal = null;
	        if((retVal = synapses.get(segment)) == null) {
	            synapses.put(segment, retVal = new ArrayList<Synapse>());
	        }
	        
	        return retVal;
	    }
	    */
	    
	/**
	 * Returns the column at the specified index.
	 * @param index
	 * @return
	 */
	getColumn: function(index) {	// Column(int)
	    return this.memory.getObject(index);
	},
	    
	/**
	 * Sets the number of {@link Column}.
	 * 
	 * @param columnDimensions
	 */
	setColumnDimensions: function(columnDimensions) {	// void(int[])
	    this.columnDimensions = columnDimensions;
	},
	    
	/**
	 * Gets the number of {@link Column}.
	 * 
	 * @return columnDimensions
	 */
	getColumnDimensions: function() {	// int[](void)
	    return this.columnDimensions;
	},
	    
	/**
	 * A list representing the dimensions of the input
	 * vector. Format is [height, width, depth, ...], where
	 * each value represents the size of the dimension. For a
	 * topology of one dimension with 100 inputs use 100, or
	 * [100]. For a two dimensional topology of 10x5 use
	 * [10,5].
	 * 
	 * @param inputDimensions
	 */
	setInputDimensions: function(inputDimensions) {	// void(int[])
	    this.inputDimensions = inputDimensions;
	},
	    
	/**
	 * Returns the configured input dimensions
	 *
	 * @return the configured input dimensions
	 * @see {@link #setInputDimensions(int[])}
	 */
	getInputDimensions: function() {	// int[](void)
	    return this.inputDimensions;
	},

	/**
	 * Sets the number of {@link Cell}s per {@link Column}
	 * @param cellsPerColumn
	 */
	setCellsPerColumn: function(cellsPerColumn) {	// void(int)
	    this.cellsPerColumn = cellsPerColumn;
	},
	    
	/**
	 * Gets the number of {@link Cells} per {@link Column}.
	 * 
	 * @return cellsPerColumn
	 */
	getCellsPerColumn: function() {	// int(void)
	    return this.cellsPerColumn;
	},

	/**
	 * Sets the activation threshold.
	 * 
	 * If the number of active connected synapses on a segment 
	 * is at least this threshold, the segment is said to be active.
	 * 
	 * @param activationThreshold
	 */
	setActivationThreshold: function(activationThreshold) {	// void(int)
	    this.activationThreshold = activationThreshold;
	},
	    
	/**
	 * Returns the activation threshold.
	 * @return
	 */
	getActivationThreshold: function() {	// int(void)
	    return this.activationThreshold;
	},

	/**
	 * Radius around cell from which it can
	 * sample to form distal dendrite connections.
	 * 
	 * @param   learningRadius
	 */
	setLearningRadius: function(learningRadius) {	// void(int)
	    this.learningRadius = learningRadius;
	},
	    
	/**
	 * Returns the learning radius.
	 * @return
	 */
	getLearningRadius: function() {	// int(void)
	    return this.learningRadius;
	},

	/**
	 * If the number of synapses active on a segment is at least this
	 * threshold, it is selected as the best matching
	 * cell in a bursting column.
	 * 
	 * @param   minThreshold
	 */
	setMinThreshold: function(minThreshold) {	// void(int)
	    this.minThreshold = minThreshold;
	},
	    
	/**
	 * Returns the minimum threshold of active synapses to be picked as best.
	 * @return
	 */
	getMinThreshold: function() {	// int(void)
	    return this.minThreshold;
	},

	/** 
	 * The maximum number of synapses added to a segment during learning. 
	 * 
	 * @param   maxNewSynapseCount
	 */
	setMaxNewSynapseCount: function(maxNewSynapseCount) {	// void(int)
	    this.maxNewSynapseCount = maxNewSynapseCount;
	},
	    
	/**
	 * Returns the maximum number of synapses added to a segment during
	 * learning.
	 * 
	 * @return
	 */
	getMaxNewSynapseCount: function() {	// int(void)
	    return this.maxNewSynapseCount;
	},

	/** 
	 * Initial permanence of a new synapse 
	 * 
	 * @param   
	 */
	setInitialPermanence: function(initialPermanence) {	// void(double)
	    this.initialPermanence = initialPermanence;
	},
	    
	/**
	 * Returns the initial permanence setting.
	 * @return
	 */
	getInitialPermanence: function() {	// double(void)
	    return this.initialPermanence;
	},
	    
	/**
	 * If the permanence value for a synapse
	 * is greater than this value, it is said
	 * to be connected.
	 * 
	 * @param connectedPermanence
	 */
	setConnectedPermanence: function(connectedPermanence) {	// void(double)
	    this.connectedPermanence = connectedPermanence;
	},
	    
	/**
	 * If the permanence value for a synapse
	 * is greater than this value, it is said
	 * to be connected.
	 * 
	 * @return
	 */
	getConnectedPermanence: function() {	// double(void)
	    return this.connectedPermanence;
	},

	/** 
	 * Amount by which permanences of synapses
	 * are incremented during learning.
	 * 
	 * @param   permanenceIncrement
	 */
	setPermanenceIncrement: function(permanenceIncrement) {	// void(double)
	    this.permanenceIncrement = permanenceIncrement;
	},
	    
	/** 
	 * Amount by which permanences of synapses
	 * are incremented during learning.
	 * 
	 * @param   permanenceIncrement
	 */
	getPermanenceIncrement: function() {	// double(void)
	    return this.permanenceIncrement;
	},

	/** 
	 * Amount by which permanences of synapses
	 * are decremented during learning.
	 * 
	 * @param   permanenceDecrement
	 */
	setPermanenceDecrement: function(permanenceDecrement) {	// void(double)
	    this.permanenceDecrement = permanenceDecrement;
	},
	    
	/** 
	 * Amount by which permanences of synapses
	 * are decremented during learning.
	 * 
	 * @param   permanenceDecrement
	 */
	getPermanenceDecrement: function() {	// double(void)
	    return this.permanenceDecrement;
	},
	    
	/**
	 * Converts a {@link Collection} of {@link Cell}s to a list
	 * of cell indexes.
	 * 
	 * @param cells
	 * @return
	 */
	asCellIndexes: function(cells) {	// List<Integer>(Collection<Cell>)
	    var ints = [];
	    for (var cell in cells) {
	        ints.push(cell.getIndex());
	    }
	        
	    return ints;
	},
	    
	/**
	 * Converts a {@link Collection} of {@link Columns}s to a list
	 * of column indexes.
	 * 
	 * @param columns
	 * @return
	 */
	asColumnIndexes: function(columns) {	// List<Integer>(Collection<Column>)
	    var ints = [];
	    for (var col in columns) {
	        ints.push(col.getIndex());
	    }
	        
	    return ints;
	},
	    
	/**
	 * Returns a list of the {@link Cell}s specified.
	 * @param cells		the indexes of the {@link Cell}s to return
	 * @return	the specified list of cells
	 */
	asCellObjects: function(cells) {	// List<Cell>(Collection<Integer>)
	    var objs = [];
	    for (var i in cells) {
	        objs.push(this.cells[i]);
	    }
	    return objs;
	},
	    
	/**
	 * Returns a list of the {@link Column}s specified.
	 * @param cols		the indexes of the {@link Column}s to return
	 * @return		the specified list of columns
	 */
	asColumnObjects: function(cols) {	// List<Column>(Collection<Integer>)
	    var objs = [];
	    for (var i in cols) {
	        objs.push(this.memory.getObject(i));
	    }
	    return objs;
	},
	    
	/**
	 * Returns a {@link Set} view of the {@link Column}s specified by 
	 * the indexes passed in.
	 * 
	 * @param indexes		the indexes of the Columns to return
	 * @return				a set view of the specified columns
	 */
	getColumnSet: function(indexes) {	// LinkedHashSet<Column>(int[])
	    var retVal = new Set();
	    for (var i=0; i<indexes.length; i++) {
	    	retVal.add(this.memory.getObject(indexes[i]));
	    }
	    return retVal;
	},
	    
	/**
	 * Returns a {@link List} view of the {@link Column}s specified by 
	 * the indexes passed in.
	 * 
	 * @param indexes		the indexes of the Columns to return
	 * @return				a List view of the specified columns
	 */
	getColumnList: function(indexes) {	// List<Column>(int[])
	 	var retVal = [];
	   	for (var i=0; i<indexes.length; i++) {
	   		retVal.push(this.memory.getObject(indexes[i]));
	   	}
	   	return retVal;
	}
}