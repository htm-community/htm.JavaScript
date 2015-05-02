/**
 * Handles the relationships between the columns of a region 
 * and the inputs bits. The primary public interface to this function is the 
 * "compute" method, which takes in an input vector and returns a list of 
 * activeColumns columns.
 * Example Usage:
 * >
 * > SpatialPooler sp = SpatialPooler();
 * > Connections c = new Connections();
 * > sp.init(c);
 * > for line in file:
 * >   inputVector = prepared int[] (containing 1's and 0's)
 * >   sp.compute(inputVector)
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 */
var SpatialPooler = function() {};

SpatialPooler.prototype = {
    /**
     * Initializes the specified {@link Connections} object which contains
     * the memory and structural anatomy this spatial pooler uses to implement
     * its algorithms.
     * 
     * @param c		a {@link Connections} object
     */
    init: function(c) {	// void(Connections c)
    	this.initMatrices(c);
    	this.connectAndConfigureInputs(c);
    },
    
    /**
     * Called to initialize the structural anatomy with configured values and prepare
     * the anatomical entities for activation.
     * 
     * @param c
     */
    initMatrices: function(c) {	// void(Connections c)
		var mem = c.getMemory();
    	
    	if (isNullOrUndefined(mem)) {
    		mem = new SparseObjectMatrix(c.getColumnDimensions());
    		c.setMemory(mem);
    	} 
    	      
        c.setInputMatrix(new SparseBinaryMatrix(c.getInputDimensions()));
        
        //Calculate numInputs and numColumns
        var numInputs = c.getInputMatrix().getMaxIndex() + 1;
        var numColumns = c.getMemory().getMaxIndex() + 1;
        c.setNumInputs(numInputs);
        c.setNumColumns(numColumns);
               
        //Fill the sparse matrix with column objects
        for (var i=0; i<numColumns; i++) { 
        	mem.set(i, new Column(c.getCellsPerColumn(), i)); 
        }
        
        c.setPotentialPools(new SparseObjectMatrix(c.getMemory().getDimensions()));
        
        c.setConnectedMatrix(new SparseBinaryMatrix([numColumns, numInputs]));
        
        var tieBreaker = new Array(numColumns);
        tieBreaker.fill(0);
        for (var i=0; i<numColumns; i++) {
            tieBreaker[i] = 0.01 * c.getRandom().nextDouble();
        }
        c.setTieBreaker(tieBreaker);
        
        //Initialize state meta-management statistics
        var odc = new Array(numColumns);
        odc.fill(0);
        c.setOverlapDutyCycles(odc);
        var adc = new Array(numColumns);
        adc.fill(0);
        c.setActiveDutyCycles(adc);
        var modc = new Array(numColumns);
        modc.fill(0);
        c.setMinOverlapDutyCycles(modc);
        var madc = new Array(numColumns);
        madc.fill(0);
        c.setMinActiveDutyCycles(madc);
        var bf = new Array(numColumns);
        bf.fill(1);
        c.setBoostFactors(bf);       
    },

    /**
     * Step two of pooler initialization kept separate from initialization
     * of static members so that they may be set at a different point in 
     * the initialization (as sometimes needed by tests).
     * 
     * @param c		the {@link Connections} memory
     */
    connectAndConfigureInputs: function(c) {	// void(Connections c)
    	// Initialize the set of permanence values for each column. Ensure that
        // each column is connected to enough input bits to allow it to be
        // activated.
    	var numColumns = c.getNumColumns();
        for (var i=0; i<numColumns; i++) {
            var potential = this.mapPotential(c, i, true);
            var column = c.getColumn(i);
            c.getPotentialPools().set(i, column.createPotentialPool(c, potential));
            var perm = this.initPermanence(c, potential, i, c.getInitConnectedPct());
            this.updatePermanencesForColumn(c, perm, column, potential, true);
        }
        
        this.updateInhibitionRadius(c);
    },
	
    /**
     * This is the primary public method of the SpatialPooler class. This
     * function takes a input vector and outputs the indices of the active columns.
     * If 'learn' is set to True, this method also updates the permanences of the
     * columns. 
     * @param inputVector       An array of 0's and 1's that comprises the input to
     *                          the spatial pooler. The array will be treated as a one
     *                          dimensional array, therefore the dimensions of the array
     *                          do not have to match the exact dimensions specified in the
     *                          class constructor. In fact, even a list would suffice.
     *                          The number of input bits in the vector must, however,
     *                          match the number of bits specified by the call to the
     *                          constructor. Therefore there must be a '0' or '1' in the
     *                          array for every input bit.
     * @param activeArray       An array whose size is equal to the number of columns.
     *                          Before the function returns this array will be populated
     *                          with 1's at the indices of the active columns, and 0's
     *                          everywhere else.
     * @param learn             A boolean value indicating whether learning should be
     *                          performed. Learning entails updating the  permanence
     *                          values of the synapses, and hence modifying the 'state'
     *                          of the model. Setting learning to 'off' freezes the SP
     *                          and has many uses. For example, you might want to feed in
     *                          various inputs and examine the resulting SDR's.
     */
    compute: function(c, inputVector, activeArray, learn, stripNeverLearned) {	//void(Connections c, int[] inputVector, int[] activeArray, boolean learn, boolean stripNeverLearned)
        if (inputVector.length != c.getNumInputs()) {
            throw new Error("Input array must be same size as the defined number of inputs");
        }
        
        this.updateBookeepingVars(c, learn);
        var overlaps = this.calculateOverlap(c, inputVector);
        
        var boostedOverlaps = [];
        if (learn) {
        	boostedOverlaps = ArrayUtils.multiply(c.getBoostFactors(), overlaps);
        } else {
        	boostedOverlaps = overlaps;
        }
        
        var activeColumns = this.inhibitColumns(c, boostedOverlaps);
        
        if (learn) {
        	this.adaptSynapses(c, inputVector, activeColumns);
        	this.updateDutyCycles(c, overlaps, activeColumns);
        	this.bumpUpWeakColumns(c);
        	this.updateBoostFactors(c);
        	if (this.isUpdateRound(c)) {
        		this.updateInhibitionRadius(c);
        		this.updateMinDutyCycles(c);
        	}
        } else if (stripNeverLearned){
        	activeColumns = this.stripUnlearnedColumns(c, activeColumns);
        }
        
        activeArray.fill(0);
        if (activeColumns.length > 0) {
        	ArrayUtils.setIndexesTo(activeArray, activeColumns, 1);
        }
    },
    
    /**
     * Removes the set of columns who have never been active from the set of
     * active columns selected in the inhibition round. Such columns cannot
     * represent learned pattern and are therefore meaningless if only inference
     * is required. This should not be done when using a random, unlearned SP
     * since you would end up with no active columns.
     *  
     * @param activeColumns	An array containing the indices of the active columns
     * @return	a list of columns with a chance of activation
     */
    stripUnlearnedColumns: function(c, activeColumns) {	// TIntArrayList(Connections c, int[] activeColumns)
    	var active = new Set(activeColumns);
    	var aboveZero = new Set();
    	var numCols = c.getNumColumns();
    	var colDutyCycles = c.getActiveDutyCycles();
    	for (var i=0; i<numCols; i++) {
    		if (colDutyCycles[i] <= 0) {
    			aboveZero.add(i);
    		}
    	}
    	var aZ = Array.from(aboveZero);
    	for (var i=0; i<aZ.length; i++) {
    		if (active.has(aZ[i])) {
    			active.delete(aZ[i]);
    		}
    	}
    	var l = Array.from(active);
    	l.sort(function(a, b) {
    		return a - b;
    	});
    	return l;
    },
    
    /**
     * Updates the minimum duty cycles defining normal activity for a column. A
     * column with activity duty cycle below this minimum threshold is boosted.
     *  
     * @param c
     */
    updateMinDutyCycles: function(c) {	// void(Connections c)
    	if (c.getGlobalInhibition() || c.getInhibitionRadius() > c.getNumInputs()) {
    		this.updateMinDutyCyclesGlobal(c);
    	}else{
    		this.updateMinDutyCyclesLocal(c);
    	}
    },
    
    /**
     * Updates the minimum duty cycles in a global fashion. Sets the minimum duty
     * cycles for the overlap and activation of all columns to be a percent of the
     * maximum in the region, specified by {@link Connections#getMinOverlapDutyCycles()} and
     * minPctActiveDutyCycle respectively. Functionality it is equivalent to
     * {@link #updateMinDutyCyclesLocal(Connections)}, but this function exploits the globalness of the
     * computation to perform it in a straightforward, and more efficient manner.
     * 
     * @param c
     */
    updateMinDutyCyclesGlobal: function(c) {	// void(Connections c)
    	c.getMinOverlapDutyCycles().fill(c.getMinPctOverlapDutyCycles() * ArrayUtils.max(c.getOverlapDutyCycles()));
    	c.getMinActiveDutyCycles().fill(c.getMinPctActiveDutyCycles() * ArrayUtils.max(c.getActiveDutyCycles()));
    },
    
    /**
     * Updates the minimum duty cycles. The minimum duty cycles are determined
     * locally. Each column's minimum duty cycles are set to be a percent of the
     * maximum duty cycles in the column's neighborhood. Unlike
     * {@link #updateMinDutyCyclesGlobal(Connections)}, here the values can be 
     * quite different for different columns.
     * 
     * @param c
     */
    updateMinDutyCyclesLocal: function(c) {	// void(Connections c)
    	var len = c.getNumColumns();
    	for (var i=0; i<len; i++) {
    		var maskNeighbors = this.getNeighborsND(c, i, c.getMemory(), c.getInhibitionRadius(), true);
    		c.getMinOverlapDutyCycles()[i] = ArrayUtils.max(
    			ArrayUtils.sub(c.getOverlapDutyCycles(), maskNeighbors)) *
    				c.getMinPctOverlapDutyCycles();
    		c.getMinActiveDutyCycles()[i] = ArrayUtils.max(
    			ArrayUtils.sub(c.getActiveDutyCycles(), maskNeighbors)) *
    				c.getMinPctActiveDutyCycles();
    	}
    },
    
    /**
     * Updates the duty cycles for each column. The OVERLAP duty cycle is a moving
     * average of the number of inputs which overlapped with each column. The
     * ACTIVITY duty cycles is a moving average of the frequency of activation for
     * each column.
     * 
     * @param c					the {@link Connections} (spatial pooler memory)
     * @param overlaps			an array containing the overlap score for each column.
     *              			The overlap score for a column is defined as the number
     *              			of synapses in a "connected state" (connected synapses)
     *              			that are connected to input bits which are turned on.
     * @param activeColumns		An array containing the indices of the active columns,
     *              			the sparse set of columns which survived inhibition
     */
    updateDutyCycles: function(c, overlaps, activeColumns) {	// void(Connections c, int[] overlaps, int[] activeColumns)
    	var overlapArray = new Array(c.getNumColumns());
		overlapArray.fill(0);
    	var activeArray = new Array(c.getNumColumns());
    	activeArray.fill(0);
		ArrayUtils.greaterThanXThanSetToY(overlaps, 0, 1);
    	if (activeColumns.length > 0) {
    		ArrayUtils.setIndexesTo(activeArray, activeColumns, 1);
    	}
    	
    	var period = c.getDutyCyclePeriod();
    	if (period > c.getIterationNum()) {
    		period = c.getIterationNum();
    	}
    	
    	c.setOverlapDutyCycles(
    		this.updateDutyCyclesHelper(c, c.getOverlapDutyCycles(), overlapArray, period));
    	
    	c.setActiveDutyCycles(
        	this.updateDutyCyclesHelper(c, c.getActiveDutyCycles(), activeArray, period));
    },
   
    /**
     * Updates a duty cycle estimate with a new value. This is a helper
     * function that is used to update several duty cycle variables in
     * the Column class, such as: overlapDutyCucle, activeDutyCycle,
     * minPctDutyCycleBeforeInh, minPctDutyCycleAfterInh, etc. returns
     * the updated duty cycle. Duty cycles are updated according to the following
     * formula:
     * 
     *  
     *            	  (period - 1)*dutyCycle + newValue
     *	dutyCycle := ----------------------------------
     *                        period
	 *
     * @param c				the {@link Connections} (spatial pooler memory)
     * @param dutyCycles	An array containing one or more duty cycle values that need
     *              		to be updated
     * @param newInput		A new numerical value used to update the duty cycle
     * @param period		The period of the duty cycle
     * @return
     */
    updateDutyCyclesHelper: function(c, dutyCycles, newInput, period) {	// double[](updateDutyCyclesHelper(Connections c, double[] dutyCycles, double[] newInput, double period)
    	return ArrayUtils.divide(ArrayUtils.d_add(ArrayUtils.multiply(dutyCycles, period - 1), newInput), period);
    },
    
    /**
     * The range of connectedSynapses per column, averaged for each dimension.
     * This value is used to calculate the inhibition radius. This variation of
     * the function supports arbitrary column dimensions.
     *  
     * @param c             the {@link Connections} (spatial pooler memory)
     * @param columnIndex   the current column for which to avg.
     * @return
     */
    avgConnectedSpanForColumnND: function(c, columnIndex) {	// double(Connections c, int columnIndex)
        var dimensions = c.getInputDimensions();
        var connected = c.getColumn(columnIndex).getProximalDendrite().getConnectedSynapsesSparse(c);
        if (isNullOrUndefined(connected) || connected.length === 0) {
        	return 0;
        }
        
        var maxCoord = new Array(c.getInputDimensions().length);
        var minCoord = new Array(c.getInputDimensions().length);
        maxCoord.fill(-1);
        minCoord.fill(ArrayUtils.max(dimensions));
        var inputMatrix = c.getInputMatrix();
        for (var i=0; i<connected.length; i++) {
            maxCoord = ArrayUtils.maxBetween(maxCoord, inputMatrix.computeCoordinates(connected[i]));
            minCoord = ArrayUtils.minBetween(minCoord, inputMatrix.computeCoordinates(connected[i]));
        }
        return ArrayUtils.average(ArrayUtils.add(ArrayUtils.subtract(maxCoord, minCoord, "Array"), 1));
    },
    
    /**
     * Update the inhibition radius. The inhibition radius is a measure of the
     * square (or hypersquare) of columns that each a column is "connected to"
     * on average. Since columns are are not connected to each other directly, we
     * determine this quantity by first figuring out how many *inputs* a column is
     * connected to, and then multiplying it by the total number of columns that
     * exist for each input. For multiple dimension the aforementioned
     * calculations are averaged over all dimensions of inputs and columns. This
     * value is meaningless if global inhibition is enabled.
     * 
     * @param c		the {@link Connections} (spatial pooler memory)
     */
    updateInhibitionRadius: function(c) {	// void(Connections c)
        if (c.getGlobalInhibition()) {
            c.setInhibitionRadius(ArrayUtils.max(c.getColumnDimensions()));
            return;
        }
        
        var avgCollected = [];
        var len = c.getNumColumns();
        for (var i=0; i<len; i++) {
            avgCollected.push(this.avgConnectedSpanForColumnND(c, i));
        }
        var avgConnectedSpan = ArrayUtils.average(avgCollected);
        var diameter = avgConnectedSpan * this.avgColumnsPerInput(c);
        var radius = (diameter - 1) / 2.0;
        radius = Math.max(1, radius);
        c.setInhibitionRadius(Math.floor(Math.round(radius)));
    },
    
    /**
     * The average number of columns per input, taking into account the topology
     * of the inputs and columns. This value is used to calculate the inhibition
     * radius. This function supports an arbitrary number of dimensions. If the
     * number of column dimensions does not match the number of input dimensions,
     * we treat the missing, or phantom dimensions as 'ones'.
     *  
     * @param c		the {@link Connections} (spatial pooler memory)
     * @return
     */
    avgColumnsPerInput: function(c) {	// double(Connections c)
        var colDim = c.getColumnDimensions();
        var inputDim = c.getInputDimensions();
        var columnsPerInput = ArrayUtils.divide(colDim, inputDim, 0, 0);
        return ArrayUtils.average(columnsPerInput);
    },
    
    /**
     * The primary method in charge of learning. Adapts the permanence values of
     * the synapses based on the input vector, and the chosen columns after
     * inhibition round. Permanence values are increased for synapses connected to
     * input bits that are turned on, and decreased for synapses connected to
     * inputs bits that are turned off.
     * 
     * @param c					the {@link Connections} (spatial pooler memory)
     * @param inputVector		a integer array that comprises the input to
     *               			the spatial pooler. There exists an entry in the array
     *              			for every input bit.
     * @param activeColumns		an array containing the indices of the columns that
     *              			survived inhibition.
     */
    adaptSynapses: function(c, inputVector, activeColumns) {	// void(Connections c, int[] inputVector, int[] activeColumns)
    	var inputIndices = ArrayUtils.where(inputVector, ArrayUtils.INT_GREATER_THAN_0);
    	
    	var permChanges = new Array(c.getNumInputs());
    	permChanges.fill(-1 * c.getSynPermInactiveDec());
    	ArrayUtils.setIndexesTo(permChanges, inputIndices, c.getSynPermActiveInc());
    	for (var i=0; i<activeColumns.length; i++) {
    		var pool = c.getPotentialPools().getObject(activeColumns[i]);
    		var perm = pool.getDensePermanences(c);
    		var indexes = pool.getSparseConnections();
    		ArrayUtils.raiseValuesBy(permChanges, perm);
    		var col = c.getColumn(activeColumns[i]);
    		this.updatePermanencesForColumn(c, perm, col, indexes, true);
    	}
    },
    
    /**
     * This method increases the permanence values of synapses of columns whose
     * activity level has been too low. Such columns are identified by having an
     * overlap duty cycle that drops too much below those of their peers. The
     * permanence values for such columns are increased.
     *  
     * @param c
     */
    bumpUpWeakColumns: function(c) {	// void(Connections c)
    	var weakColumns = ArrayUtils.where(c.getMemory().get1DIndexes(), function(i) {
   																			return c.getOverlapDutyCycles()[i] < c.getMinOverlapDutyCycles()[i];
    																	 });
    	
    	for (var i=0; i<weakColumns.length; i++) {
    		var pool = c.getPotentialPools().getObject(weakColumns[i]);
    		var perm = pool.getSparsePermanences();
    		ArrayUtils.raiseValuesBy(c.getSynPermBelowStimulusInc(), perm);
    		var indexes = pool.getSparseConnections();
    		var col = c.getColumn(weakColumns[i]);
    		this.updatePermanencesForColumnSparse(c, perm, col, indexes, true);
    	}
    },
    
    /**
     * This method ensures that each column has enough connections to input bits
     * to allow it to become active. Since a column must have at least
     * 'stimulusThreshold' overlaps in order to be considered during the
     * inhibition phase, columns without such minimal number of connections, even
     * if all the input bits they are connected to turn on, have no chance of
     * obtaining the minimum threshold. For such columns, the permanence values
     * are increased until the minimum number of connections are formed.
     * 
     * @param c					the {@link Connections} memory
     * @param perm				the permanence values
     * @param maskPotential			
     */
    raisePermanenceToThreshold: function(c, perm, maskPotential) {	// void(Connections c, double[] perm, int[] maskPotential)
        ArrayUtils.clip(perm, c.getSynPermMin(), c.getSynPermMax());
        while(true) {
            var numConnected = ArrayUtils.valueGreaterCountAtIndex(c.getSynPermConnected(), perm, maskPotential);
            if (numConnected >= c.getStimulusThreshold()) {
            	return;
            }
            //Skipping version of "raiseValuesBy" that uses the maskPotential until bug #1322 is fixed
            //in NuPIC - for now increment all bits until numConnected >= stimulusThreshold
            ArrayUtils.raiseValuesBy(c.getSynPermBelowStimulusInc(), perm, maskPotential);
        }
    },
    
    /**
     * This method ensures that each column has enough connections to input bits
     * to allow it to become active. Since a column must have at least
     * 'stimulusThreshold' overlaps in order to be considered during the
     * inhibition phase, columns without such minimal number of connections, even
     * if all the input bits they are connected to turn on, have no chance of
     * obtaining the minimum threshold. For such columns, the permanence values
     * are increased until the minimum number of connections are formed.
     * 
     * Note: This method services the "sparse" versions of corresponding methods
     * 
     * @param c         The {@link Connections} memory
     * @param perm		permanence values
     */
    raisePermanenceToThresholdSparse: function(c, perm) {	// void(Connections c, double[] perm)
        ArrayUtils.clip(perm, c.getSynPermMin(), c.getSynPermMax());
        while(true) {
            var numConnected = ArrayUtils.valueGreaterCount(c.getSynPermConnected(), perm);
            if (numConnected >= c.getStimulusThreshold()) {
            	return;
            }
            ArrayUtils.raiseValuesBy(c.getSynPermBelowStimulusInc(), perm);
        }
    },
    
    /**
     * This method updates the permanence matrix with a column's new permanence
     * values. The column is identified by its index, which reflects the row in
     * the matrix, and the permanence is given in 'sparse' form, i.e. an array
     * whose members are associated with specific indexes. It is in
     * charge of implementing 'clipping' - ensuring that the permanence values are
     * always between 0 and 1 - and 'trimming' - enforcing sparseness by zeroing out
     * all permanence values below 'synPermTrimThreshold'. It also maintains
     * the consistency between 'permanences' (the matrix storing the
     * permanence values), 'connectedSynapses', (the matrix storing the bits
     * each column is connected to), and 'connectedCounts' (an array storing
     * the number of input bits each column is connected to). Every method wishing
     * to modify the permanence matrix should do so through this method.
     * 
     * @param c                 the {@link Connections} which is the memory model.
     * @param perm              An array of permanence values for a column. The array is
     *                          "dense", i.e. it contains an entry for each input bit, even
     *                          if the permanence value is 0.
     * @param column		    The column in the permanence, potential and connectivity matrices
     * @param maskPotential		The indexes of inputs in the specified {@link Column}'s pool.
     * @param raisePerm         a boolean value indicating whether the permanence values
     */
    updatePermanencesForColumn: function(c, perm, column, maskPotential, raisePerm) {	// void(Connections c, double[] perm, Column column, int[] maskPotential, boolean raisePerm)
    	if (raisePerm) {
            this.raisePermanenceToThreshold(c, perm, maskPotential);
        }
        
        ArrayUtils.lessThanOrEqualXThanSetToY(perm, c.getSynPermTrimThreshold(), 0);
        ArrayUtils.clip(perm, c.getSynPermMin(), c.getSynPermMax());
        column.setProximalPermanences(c, perm);
    },
    
    /**
     * This method updates the permanence matrix with a column's new permanence
     * values. The column is identified by its index, which reflects the row in
     * the matrix, and the permanence is given in 'sparse' form, (i.e. an array
     * whose members are associated with specific indexes). It is in
     * charge of implementing 'clipping' - ensuring that the permanence values are
     * always between 0 and 1 - and 'trimming' - enforcing sparseness by zeroing out
     * all permanence values below 'synPermTrimThreshold'. Every method wishing
     * to modify the permanence matrix should do so through this method.
     * 
     * @param c                 the {@link Connections} which is the memory model.
     * @param perm              An array of permanence values for a column. The array is
     *                          "sparse", i.e. it contains an entry for each input bit, even
     *                          if the permanence value is 0.
     * @param column		    The column in the permanence, potential and connectivity matrices
     * @param raisePerm         a boolean value indicating whether the permanence values
     */
    updatePermanencesForColumnSparse: function(c, perm, column, maskPotential, raisePerm) {	// void(Connections c, double[] perm, Column column, int[] maskPotential, boolean raisePerm)
    	if (raisePerm) {
            this.raisePermanenceToThresholdSparse(c, perm);
        }
        
        ArrayUtils.lessThanOrEqualXThanSetToY(perm, c.getSynPermTrimThreshold(), 0);
        ArrayUtils.clip(perm, c.getSynPermMin(), c.getSynPermMax());
        column.setProximalPermanencesSparse(c, perm, maskPotential);
    },
    
    /**
     * Returns a randomly generated permanence value for a synapse that is
     * initialized in a connected state. The basic idea here is to initialize
     * permanence values very close to synPermConnected so that a small number of
     * learning steps could make it disconnected or connected.
     *
     * Note: experimentation was done a long time ago on the best way to initialize
     * permanence values, but the history for this particular scheme has been lost.
     * 
     * @return  a randomly generated permanence value
     */
    initPermConnected: function(c) {	// double(Connections c)
        var p = c.getSynPermConnected() + c.getRandom().nextDouble() * c.getSynPermActiveInc() / 4.0;
        
        // Note from Python implementation on conditioning below:
        // Ensure we don't have too much unnecessary precision. A full 64 bits of
        // precision causes numerical stability issues across platforms and across
        // implementations
        p = Math.floor(p * 100000) / 100000.0;
        return p;
    },
    
    /**
     * Returns a randomly generated permanence value for a synapses that is to be
     * initialized in a non-connected state.
     * 
     * @return  a randomly generated permanence value
     */
    initPermNonConnected: function(c) {	// double(Connections c)
        var p = c.getSynPermConnected() * c.getRandom().nextDouble();
        
        // Note from Python implementation on conditioning below:
        // Ensure we don't have too much unnecessary precision. A full 64 bits of
        // precision causes numerical stability issues across platforms and across
        // implementations
        p = Math.floor(p * 100000) / 100000.0;
        return p;
    },
    
    /**
     * Initializes the permanences of a column. The method
     * returns a 1-D array the size of the input, where each entry in the
     * array represents the initial permanence value between the input bit
     * at the particular index in the array, and the column represented by
     * the 'index' parameter.
     * 
     * @param c                 the {@link Connections} which is the memory model
     * @param potentialPool     An array specifying the potential pool of the column.
     *                          Permanence values will only be generated for input bits
     *                          corresponding to indices for which the mask value is 1.
     *                          WARNING: potentialPool is sparse, not an array of "1's"
     * @param index				the index of the column being initialized
     * @param connectedPct      A value between 0 or 1 specifying the percent of the input
     *                          bits that will start off in a connected state.
     * @return
     */
    initPermanence: function(c, potentialPool, index, connectedPct) {	// double[](Connections c, int[] potentialPool, int index, double connectedPct)
    	var count = Math.floor(Math.round(potentialPool.length * connectedPct));
        var pick = new Set();
        var random = c.getRandom();
        while (pick.size < count) {
        	var randIdx = random.nextInt(potentialPool.length);
        	pick.add(potentialPool[randIdx]);
        }
        
        var perm = new Array(c.getNumInputs());
        perm.fill(0);
        for (var i=0; i<potentialPool.length; i++) {
        	var idx = parseInt(potentialPool[i]);
        	if (pick.has(idx)) {	
                perm[idx] = this.initPermConnected(c);
            } else {
                perm[idx] = this.initPermNonConnected(c);
            }
        	
        	perm[idx] = perm[idx] < c.getSynPermTrimThreshold() ? 0 : perm[idx];
        }
        c.getColumn(index).setProximalPermanences(c, perm);
                
        return perm;
    },
    
    /**
     * Maps a column to its respective input index, keeping to the topology of
     * the region. It takes the index of the column as an argument and determines
     * what is the index of the flattened input vector that is to be the center of
     * the column's potential pool. It distributes the columns over the inputs
     * uniformly. The return value is an integer representing the index of the
     * input bit. Examples of the expected output of this method:
     * * If the topology is one dimensional, and the column index is 0, this
     *   method will return the input index 0. If the column index is 1, and there
     *   are 3 columns over 7 inputs, this method will return the input index 3.
     * * If the topology is two dimensional, with column dimensions [3, 5] and
     *   input dimensions [7, 11], and the column index is 3, the method
     *   returns input index 8. 
     *   
     * @param columnIndex   The index identifying a column in the permanence, potential
     *                      and connectivity matrices.
     * @return              A boolean value indicating that boundaries should be
     *                      ignored.
     */
    mapColumn: function(c, columnIndex) {	// int(Connections c, int columnIndex)
        var columnCoords = c.getMemory().computeCoordinates(columnIndex);
        var colCoords = columnCoords;
        var ratios = ArrayUtils.divide(colCoords, c.getColumnDimensions(), 0, 0);
        var inputCoords = ArrayUtils.multiply(c.getInputDimensions(), ratios, 0, 0);
        inputCoords = ArrayUtils.d_add(inputCoords, 
        				   ArrayUtils.multiply(
        						ArrayUtils.divide(c.getInputDimensions(), c.getColumnDimensions(), 0, 0), 0.5));
        var inputCoordInts = ArrayUtils.clip(inputCoords.map(Math.round), c.getInputDimensions(), -1);
        return c.getInputMatrix().computeIndex(inputCoordInts);
    },
    
    /**
     * Maps a column to its input bits. This method encapsulates the topology of
     * the region. It takes the index of the column as an argument and determines
     * what are the indices of the input vector that are located within the
     * column's potential pool. The return value is a list containing the indices
     * of the input bits. The current implementation of the base class only
     * supports a 1 dimensional topology of columns with a 1 dimensional topology
     * of inputs. To extend this class to support 2-D topology you will need to
     * override this method. Examples of the expected output of this method:
     * * If the potentialRadius is greater than or equal to the entire input
     *   space, (global visibility), then this method returns an array filled with
     *   all the indices
     * * If the topology is one dimensional, and the potentialRadius is 5, this
     *   method will return an array containing 5 consecutive values centered on
     *   the index of the column (wrapping around if necessary).
     * * If the topology is two dimensional (not implemented), and the
     *   potentialRadius is 5, the method should return an array containing 25
     *   '1's, where the exact indices are to be determined by the mapping from
     *   1-D index to 2-D position.
     * 
     * @param c	            {@link Connections} the main memory model
     * @param columnIndex   The index identifying a column in the permanence, potential
     *                      and connectivity matrices.
     * @param wrapAround    A boolean value indicating that boundaries should be
     *                      ignored.
     * @return
     */
    mapPotential: function(c, columnIndex, wrapAround) {	// int[](Connections c, int columnIndex, boolean wrapAround)
        var inputIndex = this.mapColumn(c, columnIndex);
        
        var indices = this.getNeighborsND(c, inputIndex, c.getInputMatrix(), c.getPotentialRadius(), wrapAround);        
        
        // Alternative begin (To change remove/add "//")
        //for (var i=0; i<indices.length; i++) {
        //	if (!indices[i]) {
        //		indices[i] = inputIndex; // indices.push(inputIndex); increases length
        //		break;
        //	}
        //}
        indices.push(inputIndex);
        // Alternative end
        
        //TODO: See https://github.com/numenta/nupic.core/issues/128
        indices.sort(function(a, b) {
    		  return a - b;
    	});
        
        return ArrayUtils.sample(Math.floor(Math.round(indices.length * c.getPotentialPct())), indices, c.getRandom());
    },

    /**
     * Similar to _getNeighbors1D and _getNeighbors2D (Not included in this implementation), 
     * this function Returns a list of indices corresponding to the neighbors of a given column. 
     * Since the permanence values are stored in such a way that information about topology
     * is lost. This method allows for reconstructing the topology of the inputs,
     * which are flattened to one array. Given a column's index, its neighbors are
     * defined as those columns that are 'radius' indices away from it in each
     * dimension. The method returns a list of the flat indices of these columns.
     * 
     * @param c     		        matrix configured to this {@code SpatialPooler}'s dimensions
     *                      		for transformation work.
     * @param columnIndex   		The index identifying a column in the permanence, potential
     *                      		and connectivity matrices.
     * @param topology    			A {@link SparseMatrix} with dimensionality info.
     * @param inhibitionRadius      Indicates how far away from a given column are other
     *                      		columns to be considered its neighbors. In the previous 2x3
     *                      		example, each column with coordinates:
     *                      		[2+/-radius, 3+/-radius] is considered a neighbor.
     * @param wrapAround    		A boolean value indicating whether to consider columns at
     *                      		the border of a dimensions to be adjacent to columns at the
     *                      		other end of the dimension. For example, if the columns are
     *                      		laid out in one dimension, columns 1 and 10 will be
     *                      		considered adjacent if wrapAround is set to true:
     *                      		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     *               
     * @return              a list of the flat indices of these columns
     */
    getNeighborsND: function(c, columnIndex, topology, inhibitionRadius, wrapAround) {	// TIntArrayList(Connections c, int columnIndex, SparseMatrix<?> topology, int inhibitionRadius, boolean wrapAround)
        var dimensions = topology.getDimensions();
        var columnCoords = topology.computeCoordinates(columnIndex);
        var dimensionCoords = [];
        
        for (var i=0; i<dimensions.length; i++) {
            var range = ArrayUtils.range(columnCoords[i] - inhibitionRadius, columnCoords[i] + inhibitionRadius + 1);
            var curRange = new Array(range.length);
            curRange.fill(0);
            
            if (wrapAround) {
                for (var j=0; j<curRange.length; j++) {
                    curRange[j] = Math.floor(ArrayUtils.positiveRemainder(range[j], dimensions[i]));
                }
            } else {
                var idx = i;
                curRange = ArrayUtils.retainLogicalAnd(range, [ArrayUtils.GREATER_OR_EQUAL_0, function(n) {
                            																	  return n < dimensions[idx];
                        																	  }]);
            }
            dimensionCoords.push(ArrayUtils.unique(curRange));
        }
        
        var neighborList = ArrayUtils.dimensionsToCoordinateList(dimensionCoords);
        // Alternative begin (To change remove/add "//")
        //var neighbors = new Array(neighborList.length);
        //neighbors.fill(0);
        var neighbors = [];	// To be able to use push here and in mapPotential which is closer to the Java implementation
        // Alternative end
        var size = neighborList.length;
        for (var i=0, j=0; i<size; i++) {
        	var flatIndex = c.getInputMatrix().computeIndex(neighborList[i], false);
            if (flatIndex === columnIndex) {
            	continue;
            }
            
            // Alternative begin (To change remove/add "//")
            //neighbors[j++] = flatIndex; // neighbors.push(flatIndex); increases length
            neighbors.push(flatIndex);
            // Alternative begin
        }
        return neighbors;
    },
    
    /**
     * Returns true if enough rounds have passed to warrant updates of
     * duty cycles
     * 
     * @param c	the {@link Connections} memory encapsulation
     * @return
     */
    isUpdateRound: function(c) {	// boolean(Connections c)
    	return c.getIterationNum() % c.getUpdatePeriod() === 0;
    },
    
    /**
     * Updates counter instance variables each cycle.
     *  
     * @param c         the {@link Connections} memory encapsulation
     * @param learn     a boolean value indicating whether learning should be
     *                  performed. Learning entails updating the  permanence
     *                  values of the synapses, and hence modifying the 'state'
     *                  of the model. setting learning to 'off' might be useful
     *                  for indicating separate training vs. testing sets.
     */
    updateBookeepingVars: function(c, learn) {	// void(Connections c, boolean learn)
        c.iterationNum += 1;
        if (learn) {
        	c.iterationLearnNum += 1;
        }
    },
    
    /**
     * This function determines each column's overlap with the current input
     * vector. The overlap of a column is the number of synapses for that column
     * that are connected (permanence value is greater than '_synPermConnected')
     * to input bits which are turned on. Overlap values that are lower than
     * the 'stimulusThreshold' are ignored. The implementation takes advantage of
     * the SpraseBinaryMatrix class to perform this calculation efficiently.
     *  
     * @param c				the {@link Connections} memory encapsulation
     * @param inputVector   an input array of 0's and 1's that comprises the input to
     *                      the spatial pooler.
     * @return
     */
    calculateOverlap: function(c, inputVector) {	// int[](Connections c, int[] inputVector)
        var overlaps = new Array(c.getNumColumns());
        overlaps.fill(0);
        c.getConnectedCounts().rightVecSumAtNZ(inputVector, overlaps);
        ArrayUtils.lessThanXThanSetToY(overlaps, Math.floor(c.getStimulusThreshold()), 0);
        return overlaps;
    },
    
    /**
     * Return the overlap to connected counts ratio for a given column
     * @param c
     * @param overlaps
     * @return
     */
    calculateOverlapPct: function(c, overlaps) {	// double[](Connections c, int[] overlaps)
    	return ArrayUtils.divide(overlaps, c.getConnectedCounts().getTrueCounts());
    },
    
    /**
     * Performs inhibition. This method calculates the necessary values needed to
     * actually perform inhibition and then delegates the task of picking the
     * active columns to helper functions.
     * 
     * @param c				the {@link Connections} matrix
     * @param overlaps		an array containing the overlap score for each  column.
     *              		The overlap score for a column is defined as the number
     *              		of synapses in a "connected state" (connected synapses)
     *              		that are connected to input bits which are turned on.
     * @return
     */
    inhibitColumns: function(c, overlaps) {	// int[](Connections c, double[] overlaps)
    	//overlaps = Arrays.copyOf(overlaps, overlaps.length);
    	
    	var density;
    	var inhibitionArea;
    	if ((density = c.getLocalAreaDensity()) <= 0) {
    		inhibitionArea = Math.pow(2 * c.getInhibitionRadius() + 1, c.getColumnDimensions().length);
    		inhibitionArea = Math.min(c.getNumColumns(), inhibitionArea);
    		density = c.getNumActiveColumnsPerInhArea() / inhibitionArea;
    		density = Math.min(density, 0.5);
    	}
    	
    	//Add our fixed little bit of random noise to the scores to help break ties.
    	ArrayUtils.d_add(overlaps, c.getTieBreaker());
    	
    	if (c.getGlobalInhibition() || c.getInhibitionRadius() > ArrayUtils.max(c.getColumnDimensions())) {
    		var nhibit = this.inhibitColumnsGlobal(c, overlaps, density);
    		return nhibit;
    	}
    	return this.inhibitColumnsLocal(c, overlaps, density);
    },
    
    /**
     * Perform global inhibition. Performing global inhibition entails picking the
     * top 'numActive' columns with the highest overlap score in the entire
     * region. At most half of the columns in a local neighborhood are allowed to
     * be active.
     * 
     * @param c				the {@link Connections} matrix
     * @param overlaps		an array containing the overlap score for each  column.
     *              		The overlap score for a column is defined as the number
     *              		of synapses in a "connected state" (connected synapses)
     *              		that are connected to input bits which are turned on.
     * @param density		The fraction of columns to survive inhibition.
     * 
     * @return
     */
    inhibitColumnsGlobal: function(c, overlaps, density) {	// int[](Connections c, double[] overlaps, double density)
    	var numCols = c.getNumColumns();
    	var numActive = Math.floor(density * numCols);
		var o = overlaps;
    	var winners = ArrayUtils.nGreatest(overlaps, numActive);
    	winners.sort(function(a, b) {
    		  return a - b;
    	});
    	return winners;
    },
    
    /**
     * Performs inhibition. This method calculates the necessary values needed to
     * actually perform inhibition and then delegates the task of picking the
     * active columns to helper functions.
     * 
     * @param c			the {@link Connections} matrix
     * @param overlaps	an array containing the overlap score for each  column.
     *              	The overlap score for a column is defined as the number
     *              	of synapses in a "connected state" (connected synapses)
     *              	that are connected to input bits which are turned on.
     * @return
     */
    inhibitColumnsLocal: function(c, overlaps, density) {	// int[](Connections c, double[] overlaps, double density)
    	var numCols = c.getNumColumns();
    	var activeColumns = new Array(numCols);
		activeColumns.fill(0);
    	var addToWinners = ArrayUtils.max(overlaps) / 1000.0;
    	for (var i=0; i<numCols; i++) {
    		var maskNeighbors = this.getNeighborsND(c, i, c.getMemory(), c.getInhibitionRadius(), false);
    		var overlapSlice = ArrayUtils.sub(overlaps, maskNeighbors);
    		var numActive = Math.floor(0.5 + density * (maskNeighbors.length + 1));
    		var numBigger = ArrayUtils.valueGreaterCount(overlaps[i], overlapSlice);
    		if (numBigger < numActive) {
    			activeColumns[i] = 1;
    			overlaps[i] += addToWinners;
    		}
    	}
    	return ArrayUtils.where(activeColumns, ArrayUtils.INT_GREATER_THAN_0);
    },
    
    /**
     * Update the boost factors for all columns. The boost factors are used to
     * increase the overlap of inactive columns to improve their chances of
     * becoming active. and hence encourage participation of more columns in the
     * learning process. This is a line defined as: y = mx + b boost =
     * (1-maxBoost)/minDuty * dutyCycle + maxFiringBoost. Intuitively this means
     * that columns that have been active enough have a boost factor of 1, meaning
     * their overlap is not boosted. Columns whose active duty cycle drops too much
     * below that of their neighbors are boosted depending on how infrequently they
     * have been active. The more infrequent, the more they are boosted. The exact
     * boost factor is linearly interpolated between the points (dutyCycle:0,
     * boost:maxFiringBoost) and (dutyCycle:minDuty, boost:1.0).
	 * 
     *         boostFactor
     *             ^
     * maxBoost _  |
     *             |\
     *             | \
     *       1  _  |  \ _ _ _ _ _ _ _
     *             |
     *             +--------------------> activeDutyCycle
     *                |
     *         minActiveDutyCycle
     */
    updateBoostFactors: function(c) {	// void(Connections c)
    	var activeDutyCycles = c.getActiveDutyCycles();
    	var minActiveDutyCycles = c.getMinActiveDutyCycles();
    	
    	//Indexes of values > 0
    	var mask = ArrayUtils.where(minActiveDutyCycles, ArrayUtils.GREATER_THAN_0);
 
    	var boostInterim;
    	if (mask.length < 1) {
    		boostInterim = c.getBoostFactors();
    	} else {
	    	var numerator = new Array(c.getNumColumns());
	    	numerator.fill(1 - c.getMaxBoost());
	    	boostInterim = ArrayUtils.divide(numerator, minActiveDutyCycles, 0, 0);
	    	boostInterim = ArrayUtils.multiply(boostInterim, activeDutyCycles, 0, 0);
	    	boostInterim = ArrayUtils.d_add(boostInterim, c.getMaxBoost());
	    }
    	
    	ArrayUtils.setIndexesTo(boostInterim, ArrayUtils.where(activeDutyCycles, function(d) {
    																				var i = 0;
    																				return d > minActiveDutyCycles[i++];
    																			 }), 1.0);
    	
    	c.setBoostFactors(boostInterim);
    }
}
