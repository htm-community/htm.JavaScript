/**
 * Contains a snapshot of the state attained during one computational
 * call to the {@link TemporalMemory}. The {@code TemporalMemory} uses
 * data from previous compute cycles to derive new data for the current cycle
 * through a comparison between states of those different cycles, therefore
 * this state container is necessary.
 * 
 * @author David Ray
 * @author Ralf Seliger (port to JavaScript) 
 */
var ComputeCycle = function() {};

ComputeCycle.prototype = {}