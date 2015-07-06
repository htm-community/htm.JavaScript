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
 * Container to hold a specific calculation for a statistical data point.
 * 
 * Follows the form:
 * <pre>
 * {
 *    "distribution":               # describes the distribution
 *     {
 *        "name": STRING,           # name of the distribution, such as 'normal'
 *        "mean": SCALAR,           # mean of the distribution
 *        "variance": SCALAR,       # variance of the distribution
 *
 *        # There may also be some keys that are specific to the distribution
 *     }
 * </pre>
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
function Statistic(mean, variance, stdev) { // Statistic(double, double, double)

    this.mean = mean;
    this.variance = variance;
    this.stdev = stdev;

    this.entries = new NamedTuple({
        "mean", "variance", "stdev"
    }, mean, variance, stdev);
};

/**
 * Creates and returns a JSON ObjectNode containing this Statistic's data.
 * 
 * @param factory
 * @return
 */
Statistic.prototype.toJson = function(facctory) { // ObjectNode toJson(JsonNodeFactory) 
    var distribution = {
        "distribution": {}
    };
    distribution["distribution"]["mean"] = this.mean;
    distribution["distribution"]["variance"] = this.variance;
    distribution["distribution"]["stdev"] = this.stdev;

    return distribution;
};

Statistic.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    var temp = mean;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    temp = stdev;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    temp = variance;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    return result;
};

Statistic.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj)
        return true;
    if (isNullOrUndefined(obj))
        return false;
    if (this.constructor !== obj.constructor)
        return false;
    var other = obj;
    if (this.mean !== other.mean)
        return false;
    if (this.stdev !== other.stdev)
        return false;
    if (this.variance !== other.variance)
        return false;
    return true;
};