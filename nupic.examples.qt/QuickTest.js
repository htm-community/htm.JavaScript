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
var QuickTest = function() {};

QuickTest.prototype = {

    /**
     * @param args the command line arguments
     */
    main: function(args) { // void(String[])
        var params = this.getParameters();
        console.log(params);

        //Layer components
        var dayBuilder =
            ScalarEncoder.prototype.builder()
            .n(8)
            .w(3)
            .radius(1.0)
            .minVal(1.0)
            .maxVal(8)
            .periodic(true)
            .forced(true)
            .resolution(1);
        var encoder = dayBuilder.build();
        var sp = new SpatialPooler();
        var tm = new TemporalMemory();
        var classifier = new CLAClassifier(newArray([1], 1), 0.1, 0.3, 0);

        var layer = this.getLayer(params, encoder, sp, tm, classifier);

        for (var i = 1, x = 0; x < 10000; i = (i == 7 ? 1 : i + 1), x++) { // USE "X" here to control run length
            if (i === 1) {
                tm.reset(layer.getMemory());
            }
            this.runThroughLayer(layer, i, i, x);
			
		    if (x === 9999) {
		        postMessage("done");
		    }
        }
    },

    getParameters: function() { // Parameters(void)
        var parameters = new Parameters();
        var p = parameters.getAllDefaultParameters();

        p['INPUT_DIMENSIONS'] = [8];
        p['COLUMN_DIMENSIONS'] = [20];
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
        l.input(input, recordNum, sequenceNum);
    },

    getLayer: function(p, e, s, t, c) { // Layer<Double>(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)	
        var l = new this.LayerImpl(p, e, s, t, c);
        return l;
    }
};

////////////////// Preliminary Network API Toy ///////////////////
/**
 * I'm going to make an actual Layer, this is just temporary so I can
 * work out the details while I'm completing this for Peter
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 *
 */
QuickTest.prototype.LayerImpl = function(p, e, s, t, c) { // LayerImpl(Parameters, ScalarEncoder, SpatialPooler, TemporalMemory, CLAClassifier)
    this.memory = new Connections();
    this.classification = new Map(); // Map<String, Object> classification = new LinkedHashMap<String, Object>();
    this.theNum = 0;

    this.predictedColumns = null; // int[]
    this.actual = null; // int[]	
    this.lastPredicted = null; // int[]

    this.params = new Parameters();
    this.encoder = e;
    this.spatialPooler = s;
    this.temporalMemory = t;
    this.classifier = c;

    this.params.apply(p, this.memory);
    this.spatialPooler.init(this.memory);
    this.temporalMemory.init(this.memory);

    this.columnCount = this.memory.getPotentialPools().getMaxIndex() + 1; //If necessary, flatten multi-dimensional index 
    this.cellsPerColumn = this.memory.getCellsPerColumn();
};

QuickTest.prototype.LayerImpl.prototype = {
    input: function(value, recordNum, sequenceNum) { // void(Double, int, int)
        var recordOut = "";
        switch (recordNum) {
            case 1:
                recordOut = "Monday (1)";
                break;
            case 2:
                recordOut = "Tuesday (2)";
                break;
            case 3:
                recordOut = "Wednesday (3)";
                break;
            case 4:
                recordOut = "Thursday (4)";
                break;
            case 5:
                recordOut = "Friday (5)";
                break;
            case 6:
                recordOut = "Saturday (6)";
                break;
            case 7:
                recordOut = "Sunday (7)";
                break;
        }

        //if (recordNum === 1) {
            this.theNum++;
            postMessage("<p>--------------------------------------------------------</p>");
            postMessage("<p>Iteration: " + this.theNum + "</p>");
        //}
        postMessage("<p>===== " + recordOut + "  - Sequence Num: " + sequenceNum + " =====</p>");

        var output = newArray([this.columnCount], 0);

        //Input through encoder
        postMessage("<p>ScalarEncoder Input = " + value + "</p>");
        var encoding = this.encoder.encode(value);
        postMessage("<p>ScalarEncoder Output = " + encoding.toString() + "</p>");
        var bucketIdx = this.encoder.getBucketIndices(value)[0];

        //Input through spatial pooler
        this.spatialPooler.compute(this.memory, encoding, output, true, true);
        postMessage("<p>SpatialPooler Output = " + output.toString() + "</p>");

        //Input through temporal memory
        var input = this.actual = ArrayUtils.where(output, ArrayUtils.WHERE_1);
        var cc = this.temporalMemory.compute(this.memory, input, true);
        if (!isNullOrUndefined(this.predictedColumns)) {
            this.lastPredicted = copyOf(this.predictedColumns, "array");
        }
        this.predictedColumns = this.getSDR(cc._predictiveCells()); //Get the active column indexes
        postMessage("<p>TemporalMemory Input = " + input.toString() + "</p>");

        this.classification.set("bucketIdx", bucketIdx);
        this.classification.set("actValue", value);
        var result = this.classifier.compute(recordNum, this.classification, this.predictedColumns, true, true);

        postMessage("<p>TemporalMemory Prediction = " + this.predictedColumns.toString() + "  |  CLAClassifier 1 step prob = " + result.getStats(1).toString() + "</p>");
        postMessage("<p></p>");
    },

    inflateSDR: function(SDR, len) { // int[](int[], int)
        var retVal = newArray([len], 0);
        for (var i = 0; i < SDR.length; i++) {
            retVal[SDR[i]] = 1;
        }
        return retVal;
    },

    getSDR: function(cells) { // int[](Set<Cell>)
        var retVal = newArray([cells.size], 0);
        var i = 0;
        var it = cells[Symbol.iterator]();
        for (;;) {
            var cell = it.next();
            if (i >= retVal.length || cell['done']) {
                break;
            }
            retVal[i] = cell['value'].getIndex();
            retVal[i] /= this.cellsPerColumn; // Get the column index
            retVal[i] = Math.floor(retVal[i]);
            i++;
        }
        retVal.sort(function(a, b) {
            return a - b;
        });
        retVal = ArrayUtils.unique(retVal);

        return retVal;
    },

    /**
     * Returns the next predicted value.
     * 
     * @return the SDR representing the prediction
     */
    getPredicted: function() { // int[](void)
        return this.lastPredicted;
    },

    /**
     * Returns the actual columns in time t + 1 to compare
     * with {@link #getPrediction()} which returns the prediction
     * at time t for time t + 1.
     * @return
     */
    getActual: function() { // int[](void)
        return this.actual;
    },

    /**
     * Simple getter for external reset
     * @return
     */
    getMemory: function() { // Connections(void)
        return this.memory;
    }
};

onmessage = function(event) {
    var url = event.data.url;

    if (url.charAt(url.length - 1) !== "/") {
        url = url.slice(0, url.lastIndexOf("/") + 1);
    }

    importScripts(
        url + "cipun/webtoolkit.md5.js",
        url + "cipun/util.js",
        url + "nupic/Connections.js",
        url + "nupic/Parameters.js",
        url + "nupic.algorithms/BitHistory.js",
        url + "nupic.algorithms/CLAClassifier.js",
        url + "nupic.algorithms/ClassifierResult.js",
        url + "nupic.util/MersenneTwister.js",
        url + "nupic.util/MinMax.js",
        url + "nupic.util/ArrayUtils.js",
        url + "nupic.util/Tuple.js",
        url + "nupic.util/Deque.js",
        url + "nupic.util/RangeTuple.js",
        url + "nupic.util/DecodeTuple.js",
        url + "nupic.util/SparseMatrix.js",
        url + "nupic.util/SparseBinaryMatrix.js",
        url + "nupic.util/SparseObjectMatrix.js",
        url + "nupic.encoders/RangeList.js",
        url + "nupic.encoders/DecodeResult.js",
        url + "nupic.encoders/EncoderResult.js",
        url + "nupic.encoders/EncoderTuple.js",
        url + "nupic.encoders/Encoder.js",
        url + "nupic.encoders/ScalarEncoder.js",
        url + "nupic.model/Column.js",
        url + "nupic.model/Cell.js",
        url + "nupic.model/Column.js",
        url + "nupic.model/Segment.js",
        url + "nupic.model/ProximalDendrite.js",
        url + "nupic.model/DistalDendrite.js",
        url + "nupic.model/Pool.js",
        url + "nupic.model/Synapse.js",
        url + "nupic.research/ComputeCycle.js",
        url + "nupic.research/SpatialPooler.js",
        url + "nupic.research/TemporalMemory.js"
    );

    var example = new QuickTest();

    example.main([]);
}