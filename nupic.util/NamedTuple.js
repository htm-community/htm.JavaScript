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
 * Immutable tuple which adds associative lookup functionality.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 */
/**
 * Constructs and new {@code NamedTuple}
 * 
 * @param keys      
 * @param objects
 */
function NamedTuple(keys, ...objects) { // NamedTuple(String[], Objects...)
    Tuple.call(this, this.Bucket.prototype.interleave(keys, objects));

    this.hash = 0; // int

    this.EMPTY_KEYS = {}; // String[]

    if (keys.length !== objects.length) {
        throw new Error("Keys and values must be same length.");
    }

    this.keys = keys; // String[]

    this.entries = newArray([this.keys.length * 2], null); // Bucket[]
    for (var i = 0; i < this.entries.length; i++) {
        this.entries[i] = new this.Bucket(i);
    }

    for (var i = 0; i < this.keys.length; i++) {
        this.addEntry(this.keys[i], objects[i]);
    }

    this.thisHashcode = this.hashCode(); // int
};

NamedTuple.prototype = Object.create(Tuple.prototype);
NamedTuple.prototype.constructor = NamedTuple;


/**
 * Returns a array copy of this {@code NamedTuple}'s keys.
 * @return
 */
NamedTuple.prototype.keys = function() { // String[](void)
    if (isNullOrUndefined(this.keys) || this.keys.length < 1) {
        return this.EMPTY_KEYS;
    }

    return copyOf(this.keys, "array");
};

/**
 * Returns the Object corresponding with the specified
 * key.
 * 
 * @param key   the identifier with the same corresponding index as 
 *              its value during this {@code NamedTuple}'s construction.
 * @return
 */
NamedTuple.prototype.get = function(key) { // Object(String)
    if (isNullOrUndefined(key)) {
        return null;
    }

    var hash = this.hashIndex(key);
    var e = this.entries[hash].find(key, hash);
    return isNullOrUndefined(e) ? null : e.value;
};

/**
 * Returns a flag indicating whether the specified key
 * exists within this {@code NamedTuple}
 * 
 * @param key
 * @return
 */
NamedTuple.prototype.hasKey = function(key) { // boolean(String)
    var hash = this.hashIndex(key);
    var e = this.entries[hash].find(key, hash);
    return !isNullOrUndefined(e);
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.toString = function() { // String(void)
    var sb = "";
    for (var i = 0; i < this.entries.length; i++) {
        sb += this.entries[i].toString();
    }
    return sb;
};

/**
 * Creates an {@link Entry} with the hashed key value, checking 
 * for duplicates (which aren't allowed during construction).
 * 
 * @param key       the unique String identifier
 * @param value     the Object corresponding to the specified key
 */
NamedTuple.prototype.addEntry = function(key, value) { // void(String, Object)
    var hash = this.hashIndex(key);
    var e = this.entries[hash].find(key, hash);
    if (!isNullOrUndefined(e) && e.key === key) {
        throw new Error(
            "Duplicates Not Allowed - Key: " + key + ", reinserted.");
    }

    var entry = new this.Entry(key, value, hash);
    this.entries[hash].add(entry);
};

/**
 * Creates and returns a hash code conforming to a number
 * between 0 - n-1, where n = #Buckets
 * 
 * @param key   String to be hashed.
 * @return
 */
NamedTuple.prototype.hashIndex = function(key) { // int(String)
    return Math.abs(key.hashCode()) % this.entries.length;
};

/**
 * {@inheritDoc}
 */
NemedTuple.prototype.hashCode() { // int(void)
    if (this.hash === 0) {
        var prime = 31;
        var result = Tuple.prototype._hashCode();
        result = prime * result + parseInt(HashCode.value(this.entries), 16);
        this.hash = result;
    }
    return this.hash;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj) {
        return true;
    }
    if (this.constructor !== obj.constructor) {
        return false;
    }
    if (!Tuple.prototype.equals(obj)) {
        return false;
    }
    var other = obj;
    if (this.thisHashcode !== other.thisHashcode) {
        return false;
    }
    return true;
};

/**
 * Encapsulates the hashed key/value pair in a linked node.
 */
/**
 * Constructs a new {@code Entry}
 * 
 * @param key
 * @param value
 * @param hash
 */
NamedTuple.prototype.Entry = function(key, value, hash) { // Entry(String, Object, int)
    this.prev = null; // Entry
    this.key = key;
    this.value = value;
    this.hash = hashIndex(key);
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Entry.prototype.toString = function() { // String(void)
    return "key=" + key + ", value=" + value + ", hash=" + hash;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Entry.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + this.hash;
    result = prime * result + ((key === null) ? 0 : key.hashCode());
    return result;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Entry.prototype.equals = function(obj) { // boolean(Object)
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
    if (this.hash !== other.hash) {
        return false;
    }
    if (this.key === null) {
        if (other.key !== null) {
            return false;
        }
    } else if (this.key !== other.key) {
        return false;
    }
    if (isNullOrUndefined(this.value)) {
        if (isNullOrUndefined(other.value)) {
            return false;
        }
    } else if (this.value !== other.value) {
        return false;
    }
    return true;
};

/**
 * Rudimentary (light-weight) Linked List implementation for storing
 * hash {@link Entry} collisions.
 */
/**
 * Constructs a new {@code Bucket}
 * @param idx   the identifier of this bucket for debug purposes.
 */
NamedTuple.prototype.Bucket = function(idx) { // Bucket(int)
    this.last = null; // Entry
    this.idx = idx;
};

/**
 * Adds the specified {@link Entry} to this Bucket.
 * @param e
 */
NamedTuple.prototype.Bucket.prototype.add = fucntion(e) { // void(Entry)
    if (isNullOrUndefined(this.last)) {
        this.last = e;
    } else {
        e.prev = this.last;
        this.last = e;
    }
};

/**
 * Searches for an {@link Entry} with the specified key,
 * and returns it if found and otherwise returns null.
 * 
 * @param key       the String identifier corresponding to the
 *                  hashed value
 * @param hash      the hash code.
 * @return
 */
NamedTuple.prototype.Bucket.prototype.find = function(key, hash) { // Entry(String, int)
    if (isNullOrUndefined(last)) {
        return null;
    }

    var found = this.last;
    while (!isNullOrUndefined(found.prev) && found.key !== key) {
        found = found.prev;
        if (found.key === key) {
            return found;
        }
    }
    return found.key === key ? found : null;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Bucket.prototype.toString = function() { // String(void)
    var sb = "Bucket: " + idx + "\n";
    var l = this.last;
    while (!isNullOrUndefined(l)) {
        sb += "\t" + l.toString() + "\n";
        l = l.prev;
    }

    return sb;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Bucket.prototype.hashCode = function() { // int(void)
    var prime = 31;
    var result = 1;
    result = prime * result + this.idx;
    result = prime * result + (isNullOrUndefined(this.last) ? 0 : this.last.hashCode());
    return result;
};

/**
 * {@inheritDoc}
 */
NamedTuple.prototype.Bucket.prototype.equals = function(obj) { // boolean(Object)
    if (this === obj) {
        return true;
    }
    if (isNullOrUndefined(obj)) {
        return false;
    }
    if (this.constructor !== obj.constructor()) {
        return false;
    }
    var other = obj;
    if (this.idx !== other.idx) {
        return false;
    }
    if (isNullOrUndefined(last)) {
        if (!isNullOrUndefined(other.last)) {
            return false;
        }
    } else if (!this.last.equals(other.last)) {
        return false;
    }
    return true;
};

/**
 * Returns an array containing the successive elements of each
 * argument array as in [ first[0], second[0], first[1], second[1], ... ].
 * 
 * Arrays may be of zero length, and may be of different sizes, but may not be null.
 * 
 * @param first     the first array
 * @param second    the second array
 * @return
 */
NamedTuple.prototype.Bucket.prototype.interleave = function(first, second) { // <F, S> Object[](F, S)
    var flen = first.length;
    var slen = second.length;
    var retVal = newArray([flen + slen], null);
    for (var i = 0, j = 0, k = 0; i < flen || j < slen;) {
        if (i < flen) {
            retVal[k++] = first[i++];
        }
        if (j < slen) {
            retVal[k++] = second[j++];
        }
    }

    return retVal;
};