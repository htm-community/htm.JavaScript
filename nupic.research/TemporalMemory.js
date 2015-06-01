/**
 * Temporal Memory implementation in Java
 * 
 * @author Chetan Surpur
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
/**
 * Constructs a new {@code TemporalMemory}
 */
var TemporalMemory = function() {};

TemporalMemory.prototype = {
    /**
     * Uses the specified {@link Connections} object to Build the structural 
     * anatomy needed by this {@code TemporalMemory} to implement its algorithms.
     * 
     * The connections object holds the {@link Column} and {@link Cell} infrastructure,
     * and is used by both the {@link SpatialPooler} and {@link TemporalMemory}. Either of
     * these can be used separately, and therefore this Connections object may have its
     * Columns and Cells initialized by either the init method of the SpatialPooler or the
     * init method of the TemporalMemory. We check for this so that complete initialization
     * of both Columns and Cells occurs, without either being redundant (initialized more than
     * once). However, {@link Cell}s only get created when initializing a TemporalMemory, because
     * they are not used by the SpatialPooler.
     * 
     * @param	c		{@link Connections} object
     */
    init: function(c) { // void(Connections)
        var matrix = isNullOrUndefined(c.getMemory()) ?
            new SparseObjectMatrix(c.getColumnDimensions()) :
            c.getMemory();
        c.setMemory(matrix);

        var numColumns = matrix.getMaxIndex() + 1;
        var cellsPerColumn = c.getCellsPerColumn();
        var cells = newArray([numColumns * cellsPerColumn], null);

        //Used as flag to determine if Column objects have been created.
        var colZero = matrix.getObject(0);
        for (var i = 0; i < numColumns; i++) {
            var column = isNullOrUndefined(colZero) ?
                new Column(cellsPerColumn, i) : matrix.getObject(i);
            for (var j = 0; j < cellsPerColumn; j++) {
                cells[i * cellsPerColumn + j] = column.getCell(j);
            }
            //If columns have not been previously configured
            if (isNullOrUndefined(colZero)) {
                matrix.set(i, column);
            }
        }
        //Only the TemporalMemory initializes cells so no need to test 
        c.setCells(cells);
    },

    /////////////////////////// CORE FUNCTIONS /////////////////////////////

    /**
     * Feeds input record through TM, performing inferencing and learning
     * 
     * @param connections		the connection memory
     * @param activeColumns     direct proximal dendrite input
     * @param learn             learning mode flag
     * @return                  {@link ComputeCycle} container for one cycle of inference values.
     */
    //public ComputeCycle compute(Connections connections, int[] activeColumns, boolean learn) {
    //    ComputeCycle result = computeFn(connections, connections.getColumnSet(activeColumns), new LinkedHashSet<Cell>(connections.getPredictiveCells()), 
    //        new LinkedHashSet<DistalDendrite>(connections.getActiveSegments()), new LinkedHashMap<DistalDendrite, Set<Synapse>>(connections.getActiveSynapsesForSegment()), 
    //            new LinkedHashSet<Cell>(connections.getWinnerCells()), learn);
    compute: function(connections, activeColumns, learn) { // ComputeCycle(Connections, int[], boolean)
        var result = this.computeFn(connections, connections.getColumnSet(activeColumns), new Set(connections.getPredictiveCells()),
            new Set(connections.getActiveSegments()), copyOf(connections.getActiveSynapsesForSegment(), "map"),
            new Set(connections.getWinnerCells()), learn);

        connections.setActiveCells(result._activeCells());
        connections.setWinnerCells(result._winnerCells());
        connections.setPredictiveCells(result._predictiveCells());
        connections.setPredictedColumns(result._predictedColumns());
        connections.setActiveSegments(result._activeSegments());
        connections.setLearningSegments(result._learningSegments());
        connections.setActiveSynapsesForSegment(result._activeSynapsesForSegment());

        return result;
    },

    /**
     * Functional version of {@link #compute(int[], boolean)}. 
     * This method is stateless and concurrency safe.
     * 
     * @param c                             {@link Connections} object containing state of memory members
     * @param activeColumns                 proximal dendrite input
     * @param prevPredictiveCells           cells predicting in t-1
     * @param prevActiveSegments            active segments in t-1
     * @param prevActiveSynapsesForSegment  {@link Synapse}s active in t-1
     * @param prevWinnerCells   `           previous winners
     * @param learn                         whether mode is "learning" mode
     * @return
     */
    computeFn: function(c, activeColumns, prevPredictiveCells, prevActiveSegments,
        prevActiveSynapsesForSegment, prevWinnerCells, learn) { // ComputeCycle(Connections, Set<Column>, Set<Cell>, Set<DistalDendrite>, Map<DistalDendrite, Set<Synapse>>, Set<Cell>, boolean)

        var cycle = new ComputeCycle();

        this.activateCorrectlyPredictiveCells(cycle, prevPredictiveCells, activeColumns);

        this.burstColumns(cycle, c, activeColumns, cycle.predictedColumns, prevActiveSynapsesForSegment);

        if (learn) {
            this.learnOnSegments(c, prevActiveSegments, cycle.learningSegments, prevActiveSynapsesForSegment, cycle.winnerCells, prevWinnerCells);
        }

        cycle.activeSynapsesForSegment = this.computeActiveSynapses(c, cycle.activeCells);

        this.computePredictiveCells(c, cycle, cycle.activeSynapsesForSegment);

        return cycle;
    },

    /**
     * Phase 1: Activate the correctly predictive cells
     * 
     * Pseudocode:
     *
     * - for each previous predictive cell
     *   - if in active column
     *     - mark it as active
     *     - mark it as winner cell
     *     - mark column as predicted
     *     
     * @param c                     ComputeCycle interim values container
     * @param prevPredictiveCells   predictive {@link Cell}s predictive cells in t-1
     * @param activeColumns         active columns in t
     */
    activateCorrectlyPredictiveCells: function(c, prevPredictiveCells, activeColumns) { // void(ComputeCycle, Set<Cell>, Set<Column>)
        for (var cell of prevPredictiveCells) {
            var column = cell.getParentColumn();
            if (activeColumns.has(column)) {
                c.activeCells.add(cell);
                c.winnerCells.add(cell);
                c.predictedColumns.add(column);
            }
        }
    },

    /**
     * Phase 2: Burst unpredicted columns.
     * 
     * Pseudocode:
     *
     * - for each unpredicted active column
     *   - mark all cells as active
     *   - mark the best matching cell as winner cell
     *     - (learning)
     *       - if it has no matching segment
     *         - (optimization) if there are previous winner cells
     *           - add a segment to it
     *       - mark the segment as learning
     * 
     * @param cycle                         ComputeCycle interim values container
     * @param c                             Connections temporal memory state
     * @param activeColumns                 active columns in t
     * @param predictedColumns              predicted columns in t
     * @param prevActiveSynapsesForSegment  LinkedHashMap of previously active segments which
     *                                      have had synapses marked as active in t-1     
     */
    burstColumns: function(cycle, c, activeColumns, predictedColumns,
        prevActiveSynapsesForSegment) { // void(ComputeCycle, Connections, Set<Column>, Set<Column>, Map<DistalDendrite, Set<Synapse>>)

        for (var predictedColumn of predictedColumns) {
            activeColumns.delete(predictedColumn);
        }
        for (var column of activeColumns) {
            var cells = column.getCells();
            for (var i = 0; i < cells.length; i++) {
                cycle.activeCells.add(cells[i]);
            }

            var bestSegmentAndCell = this.getBestMatchingCell(c, column, prevActiveSynapsesForSegment);
            var bestSegment = bestSegmentAndCell[0];
            var bestCell = bestSegmentAndCell[1];
            if (!isNullOrUndefined(bestCell)) {
                cycle.winnerCells.add(bestCell);
            }

            var segmentCounter = c.getSegmentCount();
            if (isNullOrUndefined(bestSegment)) {
                bestSegment = bestCell.createSegment(c, segmentCounter);
                c.setSegmentCount(segmentCounter + 1);
            }

            cycle.learningSegments.add(bestSegment);
        }
    },

    /**
     * Phase 3: Perform learning by adapting segments.
     * <pre>
     * Pseudocode:
     *
     * - (learning) for each previously active or learning segment
     *   - if learning segment or from winner cell
     *     - strengthen active synapses
     *     - weaken inactive synapses
     *   - if learning segment
     *     - add some synapses to the segment
     *     - sub sample from previous winner cells
     * </pre>    
     *     
     * @param c                             the Connections state of the temporal memory
     * @param prevActiveSegments			the Set of segments active in the previous cycle.
     * @param learningSegments				the Set of segments marked as learning {@link #burstColumns(ComputeCycle, Connections, Set, Set, Map)}
     * @param prevActiveSynapseSegments		the map of segments which were previously active to their associated {@link Synapse}s.
     * @param winnerCells					the Set of all winning cells ({@link Cell}s with the most active synapses)
     * @param prevWinnerCells				the Set of cells which were winners during the last compute cycle
     */
    learnOnSegments: function(c, prevActiveSegments, learningSegments,
        prevActiveSynapseSegments, winnerCells, prevWinnerCells) { // void(Connections, Set<DistalDendrite>, Set<DistalDendrite>, Map<DistalDendrite, Set<Synapse>>, Set<Cell>, Set<Cell>)

        var permanenceIncrement = c.getPermanenceIncrement();
        var permanenceDecrement = c.getPermanenceDecrement();

        var prevAndLearning = Array.from(prevActiveSegments);
        for (var learningSegment of learningSegments) {
            prevAndLearning.push(learningSegment);
        }

        for (var i = 0; i < prevAndLearning.length; i++) {
            dd = prevAndLearning[i];
            var isLearningSegment = learningSegments.has(dd);
            var isFromWinnerCell = winnerCells.has(dd.getParentCell());

            var activeSynapses = dd.getConnectedActiveSynapses(prevActiveSynapseSegments, 0);

            if (isLearningSegment || isFromWinnerCell) {
                dd.adaptSegment(c, activeSynapses, permanenceIncrement, permanenceDecrement);
            }

            var synapseCounter = c.getSynapseCount();
            var n = c.getMaxNewSynapseCount() - activeSynapses.size;
            if (isLearningSegment && n > 0) {
                var learnCells = dd.pickCellsToLearnOn(c, n, prevWinnerCells, c.getRandom());
                for (var sourceCell of learnCells) {
                    dd.createSynapse(c, sourceCell, c.getInitialPermanence(), synapseCounter);
                    synapseCounter += 1;
                }
                c.setSynapseCount(synapseCounter);
            }
        }
    },

    /**
     * Phase 4: Compute predictive cells due to lateral input on distal dendrites.
     *
     * Pseudocode:
     *
     * - for each distal dendrite segment with activity >= activationThreshold
     *   - mark the segment as active
     *   - mark the cell as predictive
     * 
     * @param c                 the Connections state of the temporal memory
     * @param cycle				the state during the current compute cycle
     * @param activeSegments
     */
    computePredictiveCells: function(c, cycle, activeDendrites) { // void(Connections, ComputeCycle, Map<DistalDendrite, Set<Synapse>>)
        var dds = Array.from(activeDendrites.keys());
        for (var i = 0; i < dds.length; i++) {
            var connectedActive = dds[i].getConnectedActiveSynapses(activeDendrites, c.getConnectedPermanence());
            if (connectedActive.size >= c.getActivationThreshold()) {
                cycle.activeSegments.add(dds[i]);
                cycle.predictiveCells.add(dds[i].getParentCell());
            }
        }
    },

    /**
     * Forward propagates activity from active cells to the synapses that touch
     * them, to determine which synapses are active.
     * 
     * @param   c           the connections state of the temporal memory
     * @param cellsActive
     * @return 
     */
    computeActiveSynapses: function(c, cellsActive) { // Map<DistalDendrite, Set<Synapse>>(Connections, Set<Cell>)
        var activesSynapses = new Map(); // new WeakMap();

        for (var cell of cellsActive) {
            for (var s of cell.getReceptorSynapses(c)) {
                var set = activesSynapses.get(s.getSegment());
                if (isNullOrUndefined(set)) {
                    set = new Set();
                    activesSynapses.set(s.getSegment(), set);
                }
                set.add(s);
            }
        }

        return activesSynapses;
    },

    /**
     * Called to start the input of a new sequence.
     * 
     * @param   connections   the Connections state of the temporal memory
     */
    reset: function(connections) { // void(Connections)
        connections.getActiveCells().clear();
        connections.getPredictiveCells().clear();
        connections.getActiveSegments().clear();
        connections.getActiveSynapsesForSegment().clear();
        connections.getWinnerCells().clear();
    },


    /////////////////////////// HELPER FUNCTIONS ///////////////////////////

    /**
     * Gets the cell with the best matching segment
     * (see `TM.getBestMatchingSegment`) that has the largest number of active
     * synapses of all best matching segments.
     * 
     * @param c									encapsulated memory and state
     * @param column							{@link Column} within which to search for best cell
     * @param prevActiveSynapsesForSegment		a {@link DistalDendrite}'s previously active {@link Synapse}s
     * @return		an object array whose first index contains a segment, and the second contains a cell
     */
    getBestMatchingCell: function(c, column, prevActiveSynapsesForSegment) { // Object[](Connections, Column, Map<DistalDendrite, Set<Synapse>>)
        var retVal = newArray([2], {});
        var bestCell = null;
        var bestSegment = null;
        var maxSynapses = 0;
        var cells = column.getCells();
        for (var i = 0; i < cells.length; i++) {
            var dd = this.getBestMatchingSegment(c, cells[i], prevActiveSynapsesForSegment);
            if (!isNullOrUndefined(dd)) {
                var connectedActiveSynapses = dd.getConnectedActiveSynapses(prevActiveSynapsesForSegment, 0);
                if (connectedActiveSynapses.size > maxSynapses) {
                    maxSynapses = connectedActiveSynapses.size;
                    bestCell = cells[i];
                    bestSegment = dd;
                }
            }
        }

        if (isNullOrUndefined(bestCell)) {
            bestCell = column.getLeastUsedCell(c, c.getRandom());
        }

        retVal[0] = bestSegment;
        retVal[1] = bestCell;
        return retVal;
    },

    /**
     * Gets the segment on a cell with the largest number of activate synapses,
     * including all synapses with non-zero permanences.
     * 
     * @param c									encapsulated memory and state
     * @param column							{@link Column} within which to search for best cell
     * @param activeSynapseSegments				a {@link DistalDendrite}'s active {@link Synapse}s
     * @return	the best segment
     */
    getBestMatchingSegment: function(c, cell, activeSynapseSegments) { // DistalDendrite(Connections, Cell, Map<DistalDendrite, Set<Synapse>>)
        var maxSynapses = c.getMinThreshold();
        var bestSegment = null;
        var dds = cell.getSegments(c);
        for (var i = 0; i < dds.length; i++) {
            var activeSyns = dds[i].getConnectedActiveSynapses(activeSynapseSegments, 0);
            if (activeSyns.size >= maxSynapses) {
                maxSynapses = activeSyns.size;
                bestSegment = dds[i];
            }
        }
        return bestSegment;
    },

    /**
     * Returns the column index given the cells per column and
     * the cell index passed in.
     * 
     * @param c				{@link Connections} memory
     * @param cellIndex		the index where the requested cell resides
     * @return
     */
    columnForCell: function(c, cellIndex) { // int(Connections, int)
        return cellIndex / c.getCellsPerColumn();
    },

    /**
     * Returns the cell at the specified index.
     * @param index
     * @return
     */
    getCell: function(c, index) { // Cell(Connections, int)
        return c.getCells()[index];
    },

    /**
     * Returns a {@link LinkedHashSet} of {@link Cell}s from a 
     * sorted array of cell indexes.
     *  
     * @param`c				the {@link Connections} object
     * @param cellIndexes   indexes of the {@link Cell}s to return
     * @return
     */
    getCells: function(c, cellIndexes) { // LinkedHashSet<Cell>(Connections, int[])
        var cellSet = new Set();
        for (var i = 0; i < cellIndexes.length; i++) {
            cellSet.add(this.getCell(c, cellIndexes[i]));
        }
        return cellSet;
    },

    /**
     * Returns a {@link LinkedHashSet} of {@link Column}s from a 
     * sorted array of Column indexes.
     *  
     * @param cellIndexes   indexes of the {@link Column}s to return
     * @return
     */
    getColumns: function(c, columnIndexes) { // LinkedHashSet<Column>(Connections, int[])
        return c.getColumnSet(columnIndexes);
    }
}