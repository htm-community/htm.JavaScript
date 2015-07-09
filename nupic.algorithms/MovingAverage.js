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
 * Helper class for computing moving average and sliding window
 * 
 * @author Numenta
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
function MovingAverage(...args) {

    var that = this;

    /**
     * Constructs a new {@code MovingAverage}
     * 
     * @param historicalValues  list of entry values
     * @param windowSize        length over which to take the average
     */
    var MovingAverage2 = function(historicalValues, windowSize) { // MovingAverage(TDoubleList, int)
        MovingAverage3(historicalValues, -1, windowSize);
    }

    /**
     * Constructs a new {@code MovingAverage}
     * 
     * @param historicalValues  list of entry values
     * @param windowSize        length over which to take the average
     */
    var MovingAverage3 = function(historicalValues, total, windowSize) { // MovingAverage(TDoubleList, double, int)	
        if (windowSize <= 0) {
            throw new Error("Window size must be > 0");
        }
        that.windowSize = windowSize;

        that.calc = new that.Calculation();
        that.calc.historicalValues =
            isNullOrUndefined(historicalValues) || historicalValues.length < 1 ?
            newArray([windowSize], 0) : historicalValues;
        that.calc.total = total !== -1 ? total : that.calc.historicalValues.reduce((a, b) => a + b);
    }

    if (args.length === 2) {
        MovingAverage2(args[0], args[1]);
    } else if (args.length === 3) {
        MovingAverage3(args[0], args[1], args[2]);
    }
};

/**
 * Routine for computing a moving average
 * 
 * @param slidingWindow     a list of previous values to use in the computation that
 *                          will be modified and returned
 * @param total             total the sum of the values in the  slidingWindow to be used in the
 *                          calculation of the moving average
 * @param newVal            newVal a new number to compute the new windowed average
 * @param windowSize        windowSize how many values to use in the moving window
 * @return
 */
MovingAverage.prototype.compute = function(slidingWindow, total, newVal, windowSize) { // Calculation(TDoubleList, double, double, int)
    return this.compute(null, slidingWindow, total, newVal, windowSize);
};

/**
 * Internal method which does actual calculation
 * 
 * @param calc              Re-used calculation object
 * @param slidingWindow     a list of previous values to use in the computation that
 *                          will be modified and returned
 * @param total             total the sum of the values in the  slidingWindow to be used in the
 *                          calculation of the moving average
 * @param newVal            newVal a new number to compute the new windowed average
 * @param windowSize        windowSize how many values to use in the moving window
 * @return
 */
MovingAverage.prototype.compute = function(
    calc, slidingWindow, total, newVal, windowSize) { // Calculation(Calculation, TDoubleList, double, double, int)

    if (isNullOrUndefined(slidingWindow) || slidingWindow.length === 0) {
        throw new Error("slidingWindow cannot be null.");
    }

    if (slidingWindow.length === windowSize) {
        total -= slidingWindow.splice(0, 1)[0];
    }
    slidingWindow.push(newVal);
    total += newVal;

    if (isNullOrUndefined(calc)) {
        return new Calculation(slidingWindow, total / slidingWindow.length, total);
    }

    return this.copyInto(calc, slidingWindow, total / slidingWindow.length, total);
};

/**
 * Called to compute the next moving average value.
 * 
 * @param newValue  new point data
 * @return
 */
MovingAverage.prototype.next = function(newValue) { // double(double)
    this.compute(this.calc, this.calc.historicalValues, this.calc.total, newValue, this.windowSize);
    return this.calc.average;
};

/**
 * Returns the sliding window buffer used to calculate the moving average.
 * @return
 */
MovingAverage.prototype.getSlidingWindow = function() { // TDoubleList(void)
    return this.calc.historicalValues;
};

/**
 * Returns the current running total
 * @return
 */
MovingAverage.prototype.getTotal = function() { // double(void)
    return this.calc.total;
};

/**
 * Returns the size of the window over which the 
 * moving average is computed.
 * 
 * @return
 */
MovingAverage.prototype.getWindowSize = function() { // int(void)
    return this.windowSize;
};

MovingAverage.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + (isNullOrUndefined(this.calc) ? 0 : this.calc.hashCode());
    result = prime * result + this.windowSize;
    return result;
};

MovingAverage.prototype.equals = function(obj) { // boolean(Object)
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
    if (isNullOrUndefined(this.calc)) {
        if (!isNullOrUndefined(other.calc)) {
            return false;
        }
    } else if (!this.calc.equals(other.calc)) {
        return false;
    }
    if (this.windowSize !== other.windowSize) {
        return false;
    }
    return true;
};

/**
 * Internal method to update running totals.
 * 
 * @param c
 * @param slidingWindow
 * @param value
 * @param total
 * @return
 */
MovingAverage.prototype.copyInto = function(c, slidingWindow, average, total) { // Calculation(Calculation, TDoubleList, double, double)
    c.historicalValues = slidingWindow;
    c.average = average;
    c.total = total;
    return c;
};

/**
 * Container for calculated data
 */
MovingAverage.prototype.Calculation = function(...args) {

    var that = this;

    var Calculation0 = function() {

    }

    var Calculation3 = function(historicalValues, currentValue, total) { // Calculation(TDoubleList, double, double)
        that.average = currentValue;
        that.historicalValues = historicalValues;
        that.total = total;
    }

    if (args.length === 0) {
        Calculation0();
    } else if (arge.length === 3) {
        Calculation3(args[0], args[1], args[2]);
    }
};

/**
 * Returns the current value at this point in the calculation.
 * @return
 */
MovingAverage.prototype.Calculation.prototype.getAverage = function() { // double(void)
    return this.average;
};

/**
 * Returns a list of calculated values in the order of their
 * calculation.
 * 
 * @return
 */
MovingAverage.prototype.Calculation.prototype.getHistoricalValues = function() { // TDoubleList(void)
    return this.historicalValues;
};

/**
 * Returns the total
 * @return
 */
MovingAverage.prototype.Calculation.prototype.getTotal = function() { // double(void)
    return this.total;
};

MovingAverage.prototype.Calculation.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    var temp;
    temp = this.average;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    result = prime * result + (isNullOrUndefined(this.historicalValues) ? 0 : parseInt(HashCode.value(this.historicalValues), 16));
    temp = this.total;
    result = prime * result + Math.floor(temp ^ (temp >>> 32));
    return result;
};

MovingAverage.prototype.Calculation.prototype.equals = function(obj) { // boolean(Obejct)
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
    if (this.average !== other.average) {
        return false;
    }
    if (isNullOrUndefined(this.historicalValues)) {
        if (!isNullOrUndefined(other.historicalValues)) {
            return false;
        }
    } else if (this.historicalValues.length === 0) {
        if (!other.historicalValues.length === 0) {
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