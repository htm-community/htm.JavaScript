/* ---------------------------------------------------------------------
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2014, Numenta, Inc.  Unless you have an agreement
 * with Numenta, Inc., for a separate license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * ---------------------------------------------------------------------
 */
/**
 * This module analyzes and estimates the distribution of averaged anomaly scores
 * from a CLA model. Given a new anomaly score `s`, estimates `P(score >= s)`.
 *
 * The number `P(score >= s)` represents the likelihood of the current state of
 * predictability. For example, a likelihood of 0.01 or 1% means we see this much
 * predictability about one out of every 100 records. The number is not as unusual
 * as it seems. For records that arrive every minute, this means once every hour
 * and 40 minutes. A likelihood of 0.0001 or 0.01% means we see it once out of
 * 10,000 records, or about once every 7 days.
 *
 * USAGE
 * -----
 *
 * The {@code Anomaly} base class follows the factory pattern and can construct an
 * appropriately configured anomaly calculator by invoking the following:
 * 
 * <pre>
 * Map<String, Object> params = new HashMap<>();
 * params.put(KEY_MODE, Mode.LIKELIHOOD);            // May be Mode.PURE or Mode.WEIGHTED
 * params.put(KEY_USE_MOVING_AVG, true);             // Instructs the Anomaly class to compute moving average
 * params.put(KEY_WINDOW_SIZE, 10);                  // #of inputs over which to compute the moving average
 * params.put(KEY_IS_WEIGHTED, true);                // Use a weighted moving average or not
 * 
 * // Instantiate the Anomaly computer
 * Anomaly anomalyComputer = Anomaly.create(params); // Returns the appropriate Anomaly
 *                                                   // implementation.
 * int[] actual = array of input columns at time t
 * int[] predicted = array of predicted columns for t+1
 * double anomaly = an.compute(
 *     actual, 
 *     predicted, 
 *     0 (inputValue = OPTIONAL, needed for likelihood calcs), 
 *     timestamp);
 *     
 * double anomalyProbability = anomalyComputer.anomalyProbability(
 *     inputValue, anomaly, timestamp);
 * </pre>
 *
 * Raw functions
 * -------------
 * 
 * There are two lower level functions, estimateAnomalyLikelihoods and
 * updateAnomalyLikelihoods. The details of these are described by the method docs.
 * 
 * For more information please see: {@link AnomalyTest} and {@link AnomalyLikelihoodTest}
 * 
 * @author Numenta
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see AnomalyTest
 * @see AnomalyLikelihoodTest
 */
function Anomaly(...args) {
    /** Modes to use for factory creation method */
    this.Mode = {
        PURE: "PURE",
        LIKELIHOOD: "LIKELIHOOD",
        WEIGHTED: "WEIGHTED"
    };

    // Instantiation keys
    this.VALUE_NONE = -1;
    this.KEY_MODE = "mode";
    this.KEY_LEARNING_PERIOD = "claLearningPeriod";
    this.KEY_ESTIMATION_SAMPLES = "estimationSamples";
    this.KEY_USE_MOVING_AVG = "useMovingAverage";
    this.KEY_WINDOW_SIZE = "windowSize";
    this.KEY_IS_WEIGHTED = "isWeighted";
    // Configs
    this.KEY_DIST = "distribution";
    this.KEY_MVG_AVG = "movingAverage";
    this.KEY_HIST_LIKE = "historicalLikelihoods";
    this.KEY_HIST_VALUES = "historicalValues";
    this.KEY_TOTAL = "total";

    // Computational argument keys
    this.KEY_MEAN = "mean";
    this.KEY_STDEV = "stdev";
    this.KEY_VARIANCE = "variance";

    var that = this;

    /**
     * Constructs a new {@code Anomaly}
     */
    var Anomaly0 = function() { // Anomaly(void)
        Anomaly2(false, -1);
    }

    /**
     * Constructs a new {@code Anomaly}
     * 
     * @param useMovingAverage  indicates whether to apply and store a moving average
     * @param windowSize        size of window to average over
     */
    var Anomaly2 = function(useMovingAverage, windowSize) { // Anomaly(boolean, int)
        that.useMovingAverage = useMovingAverage;
        if (that.useMovingAverage) {
            if (windowSize < 1) {
                throw new Error(
                    "Window size must be > 0, when using moving average.");
            }
            that.movingAverage = new MovingAverage(null, windowSize);
        }
    }

    if (args.length === 0) {
        Anomaly0();
    } else if (args.length === 2) {
        Anomaly2(args[0], args[1]);
    } else {
        throw new Error("No constructor found for Anomaly");
    }
};

Anomaly.prototype.create(...args) {

    var that = this;

    /**
     * Convenience method to create a simplistic Anomaly computer in 
     * {@link Mode#PURE}
     *  
     * @return
     */
    var create0 = function() { // Anomaly(void)
        var params = new Map < > ();
        params.set(that.KEY_MODE, that.Mode.PURE);

        return create1(params);
    }

    /**
     * Returns an {@code Anomaly} configured to execute the type
     * of calculation specified by the {@link Mode}, and whether or
     * not to apply a moving average.
     * 
     * Must have one of "MODE" = {@link Mode#LIKELIHOOD}, {@link Mode#PURE}, {@link Mode#WEIGHTED}
     * 
     * @param   p       Map 
     * @return
     */
    var create1 = function(params) { // Anomaly(Map<String, Object>)
        var useMovingAvg = params.has(that.KEY_USE_MOVING_AVG) ? params.get(that.KEY_USE_MOVING_AVG) : false;
        var windowSize = params.has(that.KEY_WINDOW_SIZE) ? params.get(that.KEY_WINDOW_SIZE) : -1;
        if (useMovingAvg && windowSize < 1) {
            throw new Error("windowSize must be > 0, when using moving average.");
        }

        var mode = params.get(that.KEY_MODE);
        if (isNullOrUndefined(mode)) {
            throw new Error("MODE cannot be null.");
        }

        switch (mode) {
            case "PURE:"
            return new Anomaly(useMovingAvg, windowSize);
            case "LIKELIHOOD":
            case "WEIGHTED":
                {
                    var isWeighted = params.has(that.KEY_IS_WEIGHTED) ? params.get(that.KEY_IS_WEIGHTED) : false;
                    var claLearningPeriod = params.has(that.KEY_LEARNING_PERIOD) ? params.get(that.KEY_LEARNING_PERIOD) : that.VALUE_NONE;
                    var estimationSamples = params.has(that.KEY_ESTIMATION_SAMPLES) ? params.get(that.KEY_ESTIMATION_SAMPLES) : that.VALUE_NONE;

                    return new AnomalyLikelihood(useMovingAvg, windowSize, isWeighted, claLearningPeriod, estimationSamples);
                }
            default:
                return null;
        }
    }

    if (args.length === 0) {
        return create0();
    } else if (args.length === 1) {
        return create1(args[0]);
    } else {
        throw new Error("No method found for call to create");
    }
};

/**
 * The raw anomaly score is the fraction of active columns not predicted.
 * 
 * @param   activeColumns           an array of active column indices
 * @param   prevPredictedColumns    array of column indices predicted in the 
 *                                  previous step
 * @return  anomaly score 0..1 
 */
Anomaly.prototype.computeRawAnomalyScore(activeColumns, prevPredictedColumns) { // double(int[], int[])
    var score = 0;

    var nActiveColumns = activeColumns.length;
    if (nActiveColumns > 0) {
        // Test whether each element of a 1-D array is also present in a second
        // array. Sum to get the total # of columns that are active and were
        // predicted.
        score = ArrayUtils.in1d(activeColumns, prevPredictedColumns).length;
        // Get the percent of active columns that were NOT predicted, that is
        // our anomaly score.
        score = (nActiveColumns - score) / nActiveColumns;
    } else if (prevPredictedColumns.length > 0) {
        score = 1.0;
    }

    return score;
};

/**
 * Compute the anomaly score as the percent of active columns not predicted.
 * 
 * @param activeColumns         array of active column indices
 * @param predictedColumns      array of columns indices predicted in this step
 *                              (used for anomaly in step T+1)
 * @param inputValue            (optional) value of current input to encoders 
 *                              (eg "cat" for category encoder)
 *                              (used in anomaly-likelihood)
 * @param timestamp             timestamp: (optional) date timestamp when the sample occurred
 *                              (used in anomaly-likelihood)
 * @return
 */
Anomaly.prototype.compute = function(activeColumns, predictedColumns, inputValue, timestamp) { // double(int[], int[], double, long)
    var retVal = this.computeRawAnomalyScore(activeColumns, predictedColumns);
    if (this.useMovingAverage) {
        retVal = this.movingAverage.next(retVal);
    }
    return retVal;
};

//////////////////////////////////////////////////////////////////////////////////////
//                            Inner Class Definitions                               //
//////////////////////////////////////////////////////////////////////////////////////
/**
 * Container to hold interim {@link AnomalyLikelihood} calculations.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see AnomalyLikelihood
 * @see MovingAverage
 */
/**
 * Constructs a new {@code AveragedAnomalyRecordList}
 * 
 * @param averagedRecords       List of samples which are { timestamp, average, value } at a data point
 * @param historicalValues      List of values of a given window size (moving average grouping)
 * @param total                 Sum of all values in the series
 */
Anomaly.prototype.AveragedAnomalyRecordList = function(averagedRecords, historicalValues, total) { // AveragedAnomalyRecordList(List < Sample >, TDoubleList, double)
    this.averagedRecords = averagedRecords;
    this.historicalValues = historicalValues;
    this.total = total;
};

/**
 * Returns a list of the averages in the contained averaged record list.
 * @return
 */
Anomaly.prototype.AveragedAnomalyRecordList.prototype.getMetrics = function() { // TDoubleList(void)
    var retVal = [];
    for (var s of this.averagedRecords) {
        retVal.push(s.score);
    }

    return retVal;
};

/**
 * Returns a list of the sample values in the contained averaged record list.
 * @return
 */
Anomaly.prototype.AveragedAnomalyRecordList.prototype.getSamples = function() { // TDoubleList(void)
    var retVal = [];
    for (var s of this.averagedRecords) {
        retVal.push(s.value);
    }

    return retVal;
};

/**
 * Returns the size of the count of averaged records (i.e. {@link Sample}s)
 * @return
 */
Anomaly.prototype.AveragedAnomalyRecordList.prototype.size = function() { // int(void)
    return this.averagedRecords.length; //let fail if null
};

Anomaly.prototype.AveragedAnomalyRecordList.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + (isNullOrUndefined(this.averagedRecords) ? 0 : parseInt(HashCode.value(this.averagedRecords), 16));
    result = prime * result + (isNullOrUndefined(this.historicalValues) ? 0 : parseInt(HashCode.value(this.historicalValues), 16));
    var temp;
    temp = total;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    return result;
};

Anomaly.prototype.AveragedAnomalyRecordList.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj) {
        return true;
    }
    if (isNullOrUndefined(obj)) {
        return false;
    }
    if (this.constructor !== obj.constructor) {
        return false;
    }
    var other = obj;
    if (isNullOrUndefined(this.averagedRecords)) {
        if (!isNullOrUndefined(other.averagedRecords)) {
            return false;
        }
    } else if (!equals(this.averagedRecords, other.averagedRecords)) {
        return false;
    }
    if (isNullOrUndefined(this.historicalValues)) {
        if (!isNullOrUndefined(other.historicalValues)) {
            return false;
        }
    } else if (!equals(this.historicalValues, other.historicalValues)) {
        return false;
    }
    if (this.total !== other.total) {
        return false;
    }
    return true;
};