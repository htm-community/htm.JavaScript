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
 * A sample data point or record consisting of a timestamp, value, and score.
 * This class is used as an input value to methods in the {@link AnomalyLikelihood}
 * class.
 */
function Sample(timeStamp, value, score) {	// Sample(DateTime, double, double)
    if(isNullOrUndefined(timeStamp)) {
        throw new Error("Sample must have a valid date");
    }
    this.date = timeStamp;
    /** Original value */
    this.value = value;
    /** Same thing as average */
    this.score = score;
};
    
/**
 * Returns a {@link DateTime} object representing the internal timestamp
 * @return
 */
Sample.prototype.timeStamp = function() {	// DateTime(void)
    return date;
};
    
/**
 * {@inheritDoc}
 */
Sample.prototype.toString = function() {	// String(void)
    return timeStamp().toString() + ", value: " +
        value + ", metric: " + score;
};

Sample.prototype.hashCode = function() {	// int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + (isNullOrUndefined(this.date) ? 0 : HashCode.value(this.date));
    var temp;
    temp = score;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    temp = value;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    return result;
};

Sample.prototype.equals = function(obj) {	// boolean(Object)
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
    if (isNullorUndefined(this.date)) {
        if (!isNullOrUndefined(other.date)) {
            return false;
		}
    } else if (this.date !== other.date) {
        return false;
	}
    if (this.score) !== other.score) {
        return false;
	}
    if (this.value) !== other.value) {
        return false;
	}
    return true;  
};
