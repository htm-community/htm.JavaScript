/**
 * A CLA classifier accepts a binary input from the level below (the
 * "activationPattern") and information from the sensor and encoders (the
 * "classification") describing the input to the system at that time step.
 *
 * When learning, for every bit in activation pattern, it records a history of the
 * classification each time that bit was active. The history is weighted so that
 * more recent activity has a bigger impact than older activity. The alpha
 * parameter controls this weighting.
 *
 * For inference, it takes an ensemble approach. For every active bit in the
 * activationPattern, it looks up the most likely classification(s) from the
 * history stored for that bit and then votes across these to get the resulting
 * classification(s).
 *
 * This classifier can learn and infer a number of simultaneous classifications
 * at once, each representing a shift of a different number of time steps. For
 * example, say you are doing multi-step prediction and want the predictions for
 * 1 and 3 time steps in advance. The CLAClassifier would learn the associations
 * between the activation pattern for time step T and the classifications for
 * time step T+1, as well as the associations between activation pattern T and
 * the classifications for T+3. The 'steps' constructor argument specifies the
 * list of time-steps you want.
 * 
 * @author Numenta
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript)
 * @see BitHistory
 */
var ClassifierResult = function() {};

ClassifierResult.prototype = {}