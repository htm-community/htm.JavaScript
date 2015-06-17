/**
 * GUI (see also qt_interactive.html):
 * provides graphical user controls to interact with the QuickTest simulation 
 * generates input data and passes it to the QuickTest object
 * gisplays QuickTest results to the browser
 */
var Gui = function() {
    this.example = null; // Will contain the QuickTest object
    this.runOn = false; // Used for pausing/continuing simulation
    this.queue = new Queue(); // Queue that contains the commands to be passed to the QuickTest object
    this.timer = null; // Interval timer checks periodically for actions in the command queue
    this.recordNum = -1; // Input data to be processed by the QuickTest object
    this.sequenceNum = -1; // Input data to be processed by the QuickTest object
    this.isResetting = false; // Controls temporal memory reset
    this.lineCnt = 0; // Controls display
    this.maxLineCnt = 0; // Controls display
};

Gui.prototype = {

    /**
     * Receives a command (@cmd) and initiates the corresponding action 
     */
    executeCmd: function(cmd) {
        switch (cmd.action) {
            case "initialize":
                this.example = new QuickTest(this);
                break;
            case "process":
                this.example.processInput(cmd.recordNum, cmd.sequenceNum, cmd.isResetting);
                break;
            default:
                throw new Error("Action " + cmd.action + " not found in command queue.");
                break;
        }
    },

    /*
     * Prepares results (@str) for output in the browser
     */
    log: function(str) {
        if (this.lineCnt++ > this.maxLineCnt && str.indexOf("----------") > -1) {
            document.getElementById("result").innerHTML = "";
            this.lineCnt = 0;
        }
        document.getElementById("result").innerHTML += "<p>" + str + "</p>";
        
        var body = document.getElementsByTagName("body")[0];
        body.scrollTop = body.scrollHeight;
    },

    /*
     * Prepares next input and places it into the command queue
     */
    nextInput: function() {
        /*
         * Later, this will be the place to collect and combine the data from other entities and the environment
         * (Note for future reference: use queues with timestamped entries)	
         */
        this.recordNum = (this.recordNum == 6 ? 0 : this.recordNum + 1);
        this.sequenceNum++;

        this.queue.enqueue({
            action: "process",
            recordNum: this.recordNum,
            sequenceNum: this.sequenceNum,
            isResetting: this.isResetting
        });
    },

    /*
     * Initializes GUI controls
     */
    initControls: function() {
        document.getElementById("maxLineCnt").disabled = false;
        document.getElementById("reset").disabled = false;
        document.getElementById("reset").checked = false;
        document.getElementById("init").disabled = false;
        document.getElementById("step").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("pause").disabled = true;
        document.getElementById("stop").disabled = true;
    }
}

/*
 * GUI event handlers
 */
window.onload = function() {

    var gui = new Gui();

    gui.initControls();

    document.getElementById("init").onclick = function() {
        gui.isResetting = document.getElementById("reset").checked;
        document.getElementById("reset").disabled = true;

        gui.maxLineCnt = parseInt(document.getElementById("maxLineCnt").value);
        document.getElementById("maxLineCnt").disabled = true;

        document.getElementById("result").innerHTML = "";

        gui.queue.enqueue({
            action: "initialize"
        });

        /*
         * Periodically check the command queue for commands
         */
        gui.timer = setInterval(function() {
            if (gui.queue.peek() !== undefined) {
                gui.executeCmd(gui.queue.dequeue());
            }
        }, 4);

        document.getElementById("init").disabled = true;
        document.getElementById("step").disabled = false;
        document.getElementById("run").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("step").onclick = function() {
        gui.runOn= false;
        gui.nextInput();
    }

    document.getElementById("run").onclick = function() {
        gui.runOn = true;
        gui.nextInput();

        document.getElementById("step").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("pause").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("pause").onclick = function() {
        gui.runOn = false;

        document.getElementById("step").disabled = false;
        document.getElementById("run").disabled = false;
        document.getElementById("pause").disabled = true;
        document.getElementById("stop").disabled = false;
    }

    /*
     * Terminate simualtion and clean up
     */
    document.getElementById("stop").onclick = function() {
        gui.runOn = false;
        clearInterval(gui.timer);

        while (gui.queue.peek()) {
            gui.queue.dequeue();
        }

        gui.recordNum = -1;
        gui.sequenceNum = -1;
        gui.isResetting = false;
        gui.maxLineCnt = 0;
        gui.lineCnt = 0;

        gui.initControls();
    }
}