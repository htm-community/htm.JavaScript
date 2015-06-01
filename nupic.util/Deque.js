/**
 * Double ended queue implementation which has a restricted capacity.
 * Operations may be conducted on both ends and when capacity is reached,
 * the next addition to either end will result in a removal on the opposite
 * end, thus always maintaining a size <= initial size.
 * 
 * This behavior differs from the {@link LinkedBlockingDeque} implementation
 * of the Java Collections Framework, and is the reason for the development of this
 * "alternative" - by allowing constant mutation of this list without an exception
 * being thrown and forcing the client to handle capacity management logic. 
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 * @param <E>
 */
/**
 * Constructs a new {@code Deque} with the specified capacity.
 * @param capacity
 */
var Deque = function(capacity) {
    this.backingList = new LinkedBlockingDeque();
    this.capacity = capacity;
    this.currentSize = 0;
};

Deque.prototype = {
    /**
     * Appends the specified item to the end of this {@code Deque}
     * 
     * @param t		the object of type &lt;T&gt; to add
     * @return		flag indicating whether capacity had been reached 
     * 				<em><b>prior</b></em> to this call.
     */
    append: function(t) { // boolean(t)
        var ret = this.currentSize === this.capacity;
        if (ret) {
            this.backingList.removeFirst();
            this.backingList.addLast(t);
        } else {
            this.backingList.addLast(t);
            this.currentSize++;
        }
        return ret;
    },

    /**
     * Inserts the specified item at the head of this {@code Deque}
     * 
     * @param t		the object of type &lt;T&gt; to add
     * @return		flag indicating whether capacity had been reached 
     * 				<em><b>prior</b></em> to this call.
     */
    insert: function(t) { // boolean(t)
        var ret = this.currentSize === this.capacity;
        if (ret) {
            this.backingList.removeLast();
            this.backingList.addFirst(t);
        } else {
            this.backingList.addFirst(t);
            this.currentSize++;
        }
        return ret;
    },

    /**
     * Appends the specified item to the end of this {@code Deque},
     * and if this deque was at capacity prior to this call, the object
     * residing at the head of this queue is returned, otherwise null
     * is returned
     * 
     * @param t		the object of type &lt;T&gt; to add
     * @return		the object residing at the head of this queue is 
     * 				returned if previously at capacity, otherwise null 
     * 				is returned
     */
    pushLast: function(t) { // E(E)
        var retVal = null;
        var ret = currentSize === capacity;
        if (ret) {
            retVal = this.backingList.removeFirst();
            this.backingList.addLast(t);
        } else {
            this.backingList.addLast(t);
            this.currentSize++;
        }
        return retVal;
    },

    /**
     * Inserts the specified item at the head of this {@code Deque},
     * and if this deque was at capacity prior to this call, the object
     * residing at the tail of this queue is returned, otherwise null
     * is returned
     * 
     * @param t		the object of type &lt;T&gt; to add
     * @return		the object residing at the tail of this queue is 
     * 				returned if previously at capacity, otherwise null 
     * 				is returned
     */
    pushFirst: function(t) { // E(E)
        var retVal = null;
        var ret = currentSize === capacity;
        if (ret) {
            retVal = this.backingList.removeLast();
            this.backingList.addFirst(t);
        } else {
            this.backingList.addFirst(t);
            this.currentSize++;
        }
        return retVal;
    },

    /**
     * Clears this {@code Deque} of all contents
     */
    clear: function() { // void(void)
        this.backingList.clear();
        this.currentSize = 0;
    },

    /**
     * Returns the item at the head of this {@code Deque} or null
     * if it is empty. This call does not block if empty.
     * 
     * @return	item at the head of this {@code Deque} or null
     * 			if it is empty.
     */
    takeFirst: function() { // E(void)
        if (currentSize === 0) {
            return null;
        }

        var val = null;
        try {
            val = this.backingList.takeFirst();
            this.currentSize--;
        } catch (e) {
            console.log(e.message);
        }

        return val;
    },

    /**
     * Returns the item at the tail of this {@code Deque} or null
     * if it is empty. This call does not block if empty.
     * 
     * @return	item at the tail of this {@code Deque} or null
     * 			if it is empty.
     */
    takeLast: function() { // E(void)
        if (currentSize === 0) {
            return null;
        }

        var val = null;
        try {
            val = this.backingList.takeLast();
            this.currentSize--;
        } catch (e) {
            console.log(e.message);
        }

        return val;
    },

    /**
     * Returns the item at the head of this {@code Deque}, blocking
     * until an item is available.
     * 
     * @return	item at the tail of this {@code Deque}
     */
    head: function() { // E(void)
        var val = null;
        try {
            val = this.backingList.takeFirst();
            this.currentSize--;
        } catch (e) {
            console.log(e.message);
        }

        return val;
    },

    /**
     * Returns the item at the tail of this {@code Deque} or null
     * if it is empty. This call does not block if empty.
     * 
     * @return	item at the tail of this {@code Deque} or null
     * 			if it is empty.
     */
    tail: function() { // E(void)
        var val = null;
        try {
            val = this.backingList.takeLast();
            this.currentSize--;
        } catch (e) {
            console.log(e.message);
        }

        return val;
    },

    /**
     * Returns an array containing all of the elements in this deque, 
     * in proper sequence; the runtime type of the returned array is 
     * that of the specified array.
     *  
     * @param a		array indicating return type
     * @return		the contents of this {@code Deque} in an array of
     * 				type &lt;T&gt;
     */
    toArray: function(a) { // <T> T[](T[])
        return this.backingList.toArray(a);
    },

    /**
     * Returns the number of elements in this {@code Deque}
     * @return
     */
    size: function() { // int(void)
        return this.currentSize;
    },

    /**
     * Returns the capacity this {@code Deque} was last configured with
     * @return
     */
    capacity: function() { // int(void)
        return this.capacity;
    },

    /**
     * Resizes the capacity of this {@code Deque} to the capacity
     * specified. 
     * 
     * @param newCapacity
     * @throws IllegalArgumentException if the specified new capacity is less than
     * the previous capacity
     */
    resize: function(newCapacity) { // void(int)
        if (capacity === newCapacity) {
            return;
        }
        if (capacity > newCapacity) {
            throw new Error("Cannot resize to less than " +
                "the original capacity: " + capacity + " > " + newCapacity);
        }

        this.capacity = newCapacity;
    },

    /**
     * Retrieves, but does not remove, the first element of this deque, or 
     * returns null if this deque is empty.
     * 
     * @return
     */
    peekFirst: function() { // E(void)
        return this.backingList.peekFirst();
    },

    /**
     * Retrieves, but does not remove, the last element of this deque, or 
     * returns null if this deque is empty.
     * 
     * @return
     */
    peekLast: function() { // E(void)
        return this.backingList.peekLast();
    },

    /**
     * Returns an {@link Iterator} over the contents of this {@code Deque}
     * @return
     */
    iterator: function() { // Iterator<E>(void)
        return this.backingList.iterator();
    },

    /* (non-Javadoc)
     * @see java.lang.Object#hashCode()
     */
    hashCode: function() { // int(void)
        var prime = 31;
        var result = 1;
        result = prime * result + (isNullOrUndefined(this.backingList) ? 0 : this.backingList.hashCode());
        result = prime * result + this.capacity;
        result = prime * result + this.currentSize;
        return result;
    },

    /* (non-Javadoc)
     * @see java.lang.Object#equals(java.lang.Object)
     */
    equals: function(obj) { // boolean(Object)
        if (this === obj) {
            return true;
        }
        if (isNullOrUndefined(obj)) {
            return false;
        }
        if (typeof this !== typeof obj) {
            return false;
        }
        var other = obj;
        if (this.capacity !== other.capacity) {
            return false;
        }
        if (this.currentSize != other.currentSize) {
            return false;
        }
        if (isNullOrUndefined(this.backingLis)) {
            if (!isNullOrUndefined(other.backingList)) {
                return false;
            }
        } else if (!deepEquals(other)) {
            return false;
        }

        return true;
    },

    deepEquals: function(other) { // boolean(Deque<E>)
        var otherIt = other.iterator();
        var it = this.iterator();
        for (;;) {
            var otherEl = otherIt.next();
            var el = it.next();
            if (otherEl['done'] === true || it['value'] !== otherIt['value']) {
                return false;
            }
        }
        return true;
    },

    /**
     * {@inheritDoc}
     */
    toString: function() { // String(void)
        return this.backingList.toString() + " capacity: " + this.capacity;
    }
}