/**
 * Convenience subclass of {@link Tuple} to contain the list of
 * ranges expressed for a particular decoded output of an
 * {@link Encoder} by using tightly constrained types without 
 * the verbosity at the instantiation site.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript) 
 */
/**
 * Constructs and new {@code Ranges} object.
 * @param l		the {@link List} of {@link MinMax} objects which are the 
 * 				minimum and maximum postions of 1's
 * @param s
 */
var RangeList = function(l, s) {
    RangeTuple.call(this, l, s);
};

RangeList.prototype = Object.create(RangeTuple.prototype);
RangeList.prototype.constructor = RangeList;

/**
 * Returns a List of the {@link MinMax}es.
 * @return
 */
RangeList.prototype.getRanges = function() { // List<MinMax>(void)
    return this.l;
};

/**
 * Returns a comma-separated String containing the descriptions
 * for all of the {@link MinMax}es
 * @return
 */
RangeList.prototype.getDescription = function() { // String(void)
    return this.desc;
};

/**
 * Adds a {@link MinMax} to this list of ranges
 * @param mm
 */
RangeList.prototype.add = function(mm) { // void(MinMax)
    this.l.push(mm);
};

/**
 * Returns the specified {@link MinMax} 
 * 	
 * @param index		the index of the MinMax to return
 * @return			the specified {@link MinMax} 
 */
RangeList.prototype.getRange = function(index) { // MinMax(int)
    return this.l[index];
};

/**
 * Sets the entire comma-separated description string
 * @param s
 */
RangeList.prototype.setDescription = function(s) { // void(String)
    this.desc = s;
};

/**
 * Returns the count of ranges contained in this Ranges object
 * @return
 */
RangeList.prototype.size = function() { // int(void)
    return this.l.length;
};

/**
 * {@inheritDoc}
 */
RangeList.prototype.toString = function() { // String(void)
    return this.l.toString();
};