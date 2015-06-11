/**
 * TODO: Implement range checking (see Parameters.java)
 */
var Parameters = function() {
    this.KEY_MAP = {
        'seed': 'seed',
        'random': 'random',
        'COLUMN_DIMENSIONS': 'columnDimensions',
        'CELLS_PER_COLUMN': 'cellsPerColumn',
		'LEARN': 'learn',
        'ACTIVATION_THRESHOLD': 'activationThreshold',
        'LEARNING_RADIUS': 'learningRadius',
        'MIN_THRESHOLD': 'minThreshold',
        'MAX_NEW_SYNAPSE_COUNT': 'maxNewSynapseCount',
        'INITIAL_PERMANENCE': 'initialPermanence',
        'CONNECTED_PERMANENCE': 'connectedPermanence',
        'PERMANENCE_INCREMENT': 'permanenceIncrement',
        'PERMANENCE_DECREMENT': 'permanenceDecrement',
        'TM_VERBOSITY': 'tmVerbosity',
        'INPUT_DIMENSIONS': 'inputDimensions',
        'POTENTIAL_RADIUS': 'potentialRadius',
        'POTENTIAL_PCT': 'potentialPct',
        'GLOBAL_INHIBITIONS': 'globalInhibition',
        'INHIBITION_RADIUS': 'inhibitionRadius',
        'LOCAL_AREA_DENSITY': 'localAreaDensity',
        'NUM_ACTIVE_COLUMNS_PER_INH_AREA': 'numActiveColumnsPerInhArea',
        'STIMULUS_THRESHOLD': 'stimulusThreshold',
        'SYN_PERM_INACTIVE_DEC': 'synPermInactiveDec',
        'SYN_PERM_ACTIVE_INC': 'synPermActiveInc',
        'SYN_PERM_CONNECTED': 'synPermConnected',
        'SYN_PERM_BELOW_STIMULUS_INC': 'synPermBelowStimulusInc',
        'SYN_PERM_TRIM_THRESHOLD': 'synPermTrimThreshold',
        'MIN_PCT_OVERLAP_DUTY_CYCLE': 'minPctOverlapDutyCycle',
        'MIN_PCT_ACTIVE_DUTY_CYCLE': 'minPctActiceDutyCycle',
        'DUTY_CYCLE_PERIOD': 'dutyCyclePeriod',
        'MAX_BOOST': 'maxBoost',
        'SP_VERBOSITY': 'spVerbosity'
    };

    this.DEFAULTS_ALL = {
        'seed': 42
    };

    this.DEFAULTS_ALL['random'] = new MersenneTwister(this.DEFAULTS_ALL['seed']);

    this.DEFAULTS_TEMPORAL = {
        'COLUMN_DIMENSIONS': [],
        'CELLS_PER_COLUMN': 32,
        'ACTIVATION_THRESHOLD': 13,
        'LEARNING_RADIUS': 2048,
        'MIN_THRESHOLD': 10,
        'MAX_NEW_SYNAPSE_COUNT': 20,
        'INITIAL_PERMANENCE': 0.21,
        'CONNECTED_PERMANENCE': 0.5,
        'PERMANENCE_INCREMENT': 0.10,
        'PERMANENCE_DECREMENT': 0.10,
        'TM_VERBOSITY': 0,
		'LEARN': true
    };

    this.DEFAULTS_SPATIAL = {
        'INPUT_DIMENSIONS': [],
        'POTENTIAL_RADIUS': 16,
        'POTENTIAL_PCT': 0.5,
        'GLOBAL_INHIBITIONS': false,
        'INHIBITION_RADIUS': 0,
        'LOCAL_AREA_DENSITY': -1.0,
        'NUM_ACTIVE_COLUMNS_PER_INH_AREA': 10.0,
        'STIMULUS_THRESHOLD': 0.0,
        'SYN_PERM_INACTIVE_DEC': 0.01,
        'SYN_PERM_ACTIVE_INC': 0.1,
        'SYN_PERM_CONNECTED': 0.10,
        'SYN_PERM_BELOW_STIMULUS_INC': 0.01,
        'SYN_PERM_TRIM_THRESHOLD': 0.5,
        'MIN_PCT_OVERLAP_DUTY_CYCLE': 0.001,
        'MIN_PCT_ACTIVE_DUTY_CYCLE': 0.001,
        'DUTY_CYCLE_PERIOD': 1000,
        'MAX_BOOST': 10.0,
        'SP_VERBOSITY': 0,
		'LEARN': true
    };
	
	this.DEFAULTS_ENCODER = {
        'N': 500,
        'W': 21,
        'MIN_VAL': 0,
        'MAX_VAL': 1000,
        'RADIUS': 21,
        'RESOLUTION': 1,
        'PERIODIC': false,
        'CLIP_INPUT': false,
        'FORCED': false,
        'FIELD_NAME': "UNSET",
        'FIELD_TYPE': "int",
        'ENCODER': "ScalarEncoder",
        'FIELD_ENCODING_MAP': new Map(),
        'AUTO_CLASSIFY': false
	};

    for (var key in this.DEFAULTS_TEMPORAL) {
        this.DEFAULTS_ALL[key] = this.DEFAULTS_TEMPORAL[key];
    }

    for (var key in this.DEFAULTS_SPATIAL) {
        this.DEFAULTS_ALL[key] = this.DEFAULTS_SPATIAL[key];
    }

    for (var key in this.DEFAULTS_ENCODER) {
        this.DEFAULTS_ALL[key] = this.DEFAULTS_ENCODER[key];
    }
};

Parameters.prototype = {
    getAllDefaultParameters: function() {
        return this.DEFAULTS_ALL;
    },

    getTemporalDefaultParameters: function() {
        return this.DEFAULTS_TEMPORAL;
    },

    getSpatialDefaultParameters: function() {
        return this.DEFAULTS_SPATIAL;
    },
	
    getEncoderDefaultParameters: function() {
        return this.DEFAULTS_ENCODER;	
    },

    apply: function(p, c) {
        for (var key in p) {
            c[this.KEY_MAP[key]] = p[key];
        }
    }
};