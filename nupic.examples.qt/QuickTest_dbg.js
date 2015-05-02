/**
 * Quick and dirty example of tying together a network of components.
 * This should hold off peeps until the Network API is complete.
 * (see: https://github.com/numenta/htm.java/wiki/Roadmap)
 * 
 * <p>Warning: Sloppy sketchpad code, but it works!</p>
 * 
 * <p><em><b>
 * To see the pretty printed test output and Classification results, uncomment all
 * the print out lines below
 * </b></em></p>
 * 
 * @author PDove
 * @author cogmission
 * @author Ralf Seliger (port to JavaScript)
 */
var QuickTest = {

	main: function() {	// void(String[])

	},	

	getParameters: function() {	// Parameters(void)
	
	},

	runThroughLayer: function(l, input, recordNum, sequenceNum) {	// <T> void(Layer<T>, T, int, int)

	},
	
	getLayer: function(p, e, s, t, c) {	// Layer<Double>(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)	

	},

    /**
     * I'm going to make an actual Layer, this is just temporary so I can
     * work out the details while I'm completing this for Peter
     * 
     * @author David Ray
	 * @author Ralf Seliger (port to JavaScript)
     *
     */
	LayerImpl: function(p, e, s, t, c) {	// LayerImpl(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)
		
	}
};

QuickTest.LayerImpl.prototype = {
	
	input: function(value, recordNum, sequenceNum) {	// void(Double, int, int)
	
	},
	
	inflateSDR: function(SDR, len) {	// int[](int[], int)

	},
	
	getSDR: function(cells) {	// int[](Set<Cell>)
	
	},
	
    /**
     * Returns the next predicted value.
     * 
     * @return the SDR representing the prediction
     */
	getPredicted: function() {	// int[](void)
	
	},
	
    /**
     * Returns the actual columns in time t + 1 to compare
     * with {@link #getPrediction()} which returns the prediction
     * at time t for time t + 1.
     * @return
     */
	getActual: function() {	// int[](void)
	
	},
	
    /**
     * Simple getter for external reset
     * @return
     */
	getMemory: function() {	// Connections(void)
	
	}
};



