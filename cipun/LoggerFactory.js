/*
 * Just to be syntactically consistent with htm.java,
 * might be specialized in the future ...
 */
var LoggerFactory = {
    getLogger: function() {
        return new Logger();
    }
};

var Logger = function() {
    this.trace = function(arg) {
        console.log(arg);
    };

    this.info = function(arg) {
        console.log(arg);
    }
};