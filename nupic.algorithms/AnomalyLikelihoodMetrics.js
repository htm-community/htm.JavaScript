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
 * Container class to hold the results of {@link AnomalyLikelihood} estimations
 * and updates.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see AnomalyLikelihood
 * @see AnomalyLikelihoodTest
 */
/**
 * Constructs a new {@code AnomalyLikelihoodMetrics}
 * 
 * @param likelihoods       array of pre-computed estimations
 * @param aggRecordList     List of {@link Sample}s which are basically a set of date, value, average score,
 *                          a list of historical values, and a running total.
 * @param params            {@link AnomalyParams} which are a {@link Statistic}, array of likelihoods,
 *                          and a {@link MovingAverage} 
 */
function AnomalyLikelihoodMetrics(likelihoods, aggRecordList, params) { // AnomalyLikelihoodMetrics(double[], AveragedAnomalyRecordList, AnomalyParams)
    this.params = params; // AnomalyParams
    this.aggRecordList = aggRecordList; // AveragedAnomalyRecordList
    this.likelihoods = likelihoods; // double[]
};

/**
 * Utility method to copy this {@link AnomalyLikelihoodMetrics} object.
 * @return
 */
AnomalyLikelihoodMetrics.prototype.copy = function() { // AnomalyLikelihoodMetrics(void)
    var vals = [];
    for (var key of this.params.keys()) {
        vals.push(this.params.get(key));
    }

    return new AnomalyLikelihoodMetrics(
        copyOf(this.likelihoods),
        this.aggRecordList,
        new AnomalyParams(this.params.keys(), vals));
};

/**
 * Returns the array of computed likelihoods
 * @return
 */
AnomalyLikelihoodMetrics.prototype.getLikelihoods = function() { // double[](void)
    return this.likelihoods;
};

/**
 * <pre>
 * Returns the record list which are:
 *     List of {@link Sample}s which are basically a set of date, value, average score,
 *     a list of historical values, and a running total.
 * </pre>
 * @return
 */
AnomalyLikelihoodMetrics.prototype.getAvgRecordList = function() { // AveragedAnomalyRecordList(void)
    return this.aggRecordList;
};

/**
 * <pre>
 * Returns the {@link AnomalyParams} which is:
 *     a {@link Statistic}, array of likelihoods,
 *     and a {@link MovingAverage}
 * </pre> 
 * @return
 */
AnomalyLikelihoodMetrics.prototype.getParams = function() { // AnomalyParams(void)
    return this.params;
};

AnomalyLikelihoodMetrics.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + (isNullOrUndefined(this.aggRecordList) ? 0 : this.aggRecordList.hashCode());
    result = prime * result + parseInt(HashCode.value(this.likelihoods), 16);
    result = prime * result + (isNullOrUndefined(this.params) 0: this.params.hashCode());
    return result;
};

AnomalyLikelihoodMetrics.prototype.equals = function(obj) { // boolean(Objact)
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
    if (isNullOrUndefined(this.aggRecordList)) {
        if (!isNullOrUndefined(other.aggRecordList)) {
            return false;
        }
    } else if (!this.aggRecordList.equals(other.aggRecordList)) {
        return false;
    }
    if (!equals(this.likelihoods, other.likelihoods)) {
        return false;
    }
    if (isNullOrUndefined(this.params)) {
        if (other.params != null) {
            return false;
        }
    } else if (!this.params.equals(other.params)) {
        return false;
    }
    return true;
};