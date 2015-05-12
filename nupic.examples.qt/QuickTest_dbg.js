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

    main: function() { // void(String[])
        var params = this.getParameters();
        console.log(params);




    },

    getParameters: function() { // Parameters(void)
        var parameters = new Parameters();
        var p = parameters.getAllDefaultParameters();

        p['INPUT_DIMENSIONS'] = newArray([8], 0);
        p['COLUMN_DIMENSIONS'] = newArray([20], 0);
        p['CELLS_PER_COLUMN'] = 6;

        //SpatialPooler specific
        p['POTENTIAL_RADIUS'] = 12; //3
        p['POTENTIAL_PCT'] = 0.5; //0.5
        p['GLOBAL_INHIBITIONS'] = false;
        p['LOCAL_AREA_DENSITY'] = -1.0;
        p['NUM_ACTIVE_COLUMNS_PER_INH_AREA'] = 5.0;
        p['STIMULUS_THRESHOLD'] = 1.0;
        p['SYN_PERM_INACTIVE_DEC'] = 0.01;
        p['SYN_PERM_ACTIVE_INC'] = 0.1;
        p['SYN_PERM_TRIM_THRESHOLD'] = 0.05;
        p['SYN_PERM_CONNECTED'] = 0.1;
        p['MIN_PCT_OVERLAP_DUTY_CYCLE'] = 0.1;
        p['MIN_PCT_ACTIVE_DUTY_CYCLE'] = 0.1;
        p['DUTY_CYCLE_PERIOD'] = 10;
        p['MAX_BOOST'] = 10.0;
        p['SEED'] = 42;
        p['SP_VERBOSITY'] = 0;

        //Temporal Memory specific
        p['INITIAL_PERMANENCE'] = 0.2;
        p['CONNECTED_PERMANENCE'] = 0.8;
        p['MIN_THRESHOLD'] = 5;
        p['MAX_NEW_SYNAPSE_COUNT'] = 6;
        p['PERMANENCE_INCREMENT'] = 0.05;
        p['PERMANENCE_DECREMENT'] = 0.05;
        p['ACTIVATION_THRESHOLD'] = 4;

        return p;
    },

    runThroughLayer: function(l, input, recordNum, sequenceNum) { // <T> void(Layer<T>, T, int, int)

    },

    getLayer: function(p, e, s, t, c) { // Layer<Double>(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)	

    },

    /**
     * I'm going to make an actual Layer, this is just temporary so I can
     * work out the details while I'm completing this for Peter
     * 
     * @author David Ray
     * @author Ralf Seliger (port to JavaScript)
     *
     */
    LayerImpl: function(p, e, s, t, c) { // LayerImpl(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)

    }
};

QuickTest.LayerImpl.prototype = {

    input: function(value, recordNum, sequenceNum) { // void(Double, int, int)

    },

    inflateSDR: function(SDR, len) { // int[](int[], int)

    },

    getSDR: function(cells) { // int[](Set<Cell>)

    },

    /**
     * Returns the next predicted value.
     * 
     * @return the SDR representing the prediction
     */
    getPredicted: function() { // int[](void)

    },

    /**
     * Returns the actual columns in time t + 1 to compare
     * with {@link #getPrediction()} which returns the prediction
     * at time t for time t + 1.
     * @return
     */
    getActual: function() { // int[](void)

    },

    /**
     * Simple getter for external reset
     * @return
     */
    getMemory: function() { // Connections(void)

    }
};

QuickTest.main([]);