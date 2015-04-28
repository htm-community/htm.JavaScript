/**
 * 
 */
var Parameters = function() {
	this.KEY_MAP = {
		'seed':                            'seed',
		'random':                          'random',
		'COLUMN_DIMENSIONS':               'columnDimensions',
		'CELLS_PER_COLUMN':                'cellsPerColumns',
	    'ACTIVATION_THRESHOLD':            'activationThreshold',
	    'LEARNING_RADIUS':                 'learningRadius',
	    'MIN_THRESHOLD':                   'minThreshold',
	    'MAX_NEW_SYNAPSE_COUNT':           'maxNewSynapseCount',
	    'INITIAL_PERMANENCE':              'initialPermanence',
	    'CONNECTED_PERMANENCE':            'connectedPermanence',
	    'PERMANENCE_INCREMENT':            'permanenceIncrement',
	    'PERMANENCE_DECREMENT':            'permanenceDecrement',
	    'TM_VERBOSITY':                    'tmVerbosity',
	    'INPUT_DIMENSIONS':                'inputDimensions',
	    'POTENTIAL_RADIUS':                'potentialRadius',
	    'POTENTIAL_PCT':                   'potentialPct',
	    'GLOBAL_INHIBITIONS':              'globalInhibition',
	    'INHIBITION_RADIUS':               'inhibitionRadius',
	    'LOCAL_AREA_DENSITY':              'localAreaDensity',
	    'NUM_ACTIVE_COLUMNS_PER_INH_AREA': 'numActiveColumnsPerInhArea',
	    'STIMULUS_THRESHOLD':              'stimulusThreshold',
	    'SYN_PERM_INACTIVE_DEC':           'synPermInactiveDec',
	    'SYN_PERM_ACTIVE_INC':             'synPermActiveInc',
	    'SYN_PERM_CONNECTED':              'synPermConnected',
	    'SYN_PERM_BELOW_STIMULUS_INC':     'synPermBelowStimulusInc',
	    'SYN_PERM_TRIM_THRESHOLD':         'synPermTrimThreshold',
	    'MIN_PCT_OVERLAP_DUTY_CYCLE':      'minPctOverlapDutyCycle',
	    'MIN_PCT_ACTIVE_DUTY_CYCLE':       'minPctActiceDutyCycle',
	    'DUTY_CYCLE_PERIOD':               'dutyCyclePeriod',
	    'MAX_BOOST':                       'maxBoost',
	    'SP_VERBOSITY':                    'spVerbosity'
	};

	this.DEFAULTS_ALL = {
		'seed': 42
	};
	
	var mt = new MersenneTwister(this.DEFAULTS_ALL['seed']);
	
	this.DEFAULTS_ALL['random'] = function() {
		return mt.nextDouble();
	};

	this.DEFAULTS_TEMPORAL = {
		'COLUMN_DIMENSIONS':     [],
		'CELLS_PER_COLUMN':      32,
	    'ACTIVATION_THRESHOLD':  13,
	    'LEARNING_RADIUS':       2048,
	    'MIN_THRESHOLD':         10,
	    'MAX_NEW_SYNAPSE_COUNT': 20,
	    'INITIAL_PERMANENCE':    0.21,
	    'CONNECTED_PERMANENCE':  0.5,
	    'PERMANENCE_INCREMENT':  0.10,
	    'PERMANENCE_DECREMENT':  0.10,
	    'TM_VERBOSITY':          0
	};
	
	this.DEFAULTS_SPATIAL = {
	    'INPUT_DIMENSIONS':                [],
	    'POTENTIAL_RADIUS':                16,
	    'POTENTIAL_PCT':                   0.5,
	    'GLOBAL_INHIBITIONS':              false,
	    'INHIBITION_RADIUS':               0,
	    'LOCAL_AREA_DENSITY':              -1.0,
	    'NUM_ACTIVE_COLUMNS_PER_INH_AREA': 10.0,
	    'STIMULUS_THRESHOLD':              0.0,
	    'SYN_PERM_INACTIVE_DEC':           0.01,
	    'SYN_PERM_ACTIVE_INC':             0.1,
	    'SYN_PERM_CONNECTED':              0.10,
	    'SYN_PERM_BELOW_STIMULUS_INC':     0.01,
	    'SYN_PERM_TRIM_THRESHOLD':         0.5,
	    'MIN_PCT_OVERLAP_DUTY_CYCLE':      0.001,
	    'MIN_PCT_ACTIVE_DUTY_CYCLE':       0.001,
	    'DUTY_CYCLE_PERIOD':               1000,
	    'MAX_BOOST':                       10.0,
	    'SP_VERBOSITY':                    0
	};
	
	for (var key in this.DEFAULTS_TEMPORAL) {
		this.DEFAULTS_ALL[key] = this.DEFAULTS_TEMPORAL[key];
	}

	for (var key in this.DEFAULTS_SPATIAL) {
		this.DEFAULTS_ALL[key] = this.DEFAULTS_SPATIAL[key];
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
	
	apply: function(p, c) {
		for (var key in p) {
			c[this.KEY_MAP[key]] = p[key];
		}
	}
};
