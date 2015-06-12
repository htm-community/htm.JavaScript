/**
 * GUI (see also qt_interactive.html):
 * provides graphical user controls to interact with the QuickTest simulation 
 * generates input data and passes it to the QuickTest object
 * gisplays QuickTest results to the browser
 */
var Gui = function() {
    this.example = null; // Will contain the QuickTest object
    this.isRunning = false; // Used for pausing/continuing simulation
    this.queue = new Queue(); // Queue that contains the commands to be passed to the QuickTest object
    this.timer = null; // Interval timer checks periodically for actions in the command queue
    this.input = 0; // Input data to be processed by the QuickTest object
    this.cnt = 0; // Controls display
    this.blockCnt = 1; // Controls display
    this.maxBlockCnt = 0; // Controls display
    this.tmp = ""; // Controls display
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
                this.example.processInput(cmd.input);
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
        var el = document.getElementById("result");
        if (this.cnt % 10 === 9) {
            el.innerHTML = this.tmp;
            if (this.blockCnt >= this.maxBlockCnt) {
                this.tmp = "";
                this.blockCnt = 0;
            }
            this.blockCnt++;
            this.cnt = 0;
        } else {
            this.tmp += "<p>" + str + "</p>";
            this.cnt++;
        }
        var body = document.getElementsByTagName("body")[0];
        body.scrollTop = body.scrollHeight;
    },

    /*
     * Prepares next input and places it into the command queue
     */
    prepareNextInput: function() {
        /*
         * Later, this will be the place to collect and combine the data from other entities and the environment
         * (Note for future use: queues with timestamped entries)	
         */
        this.input = (this.input == 7 ? 1 : this.input + 1);

        this.queue.enqueue({
            action: "process",
            input: this.input
        });
    },

    /*
     * Initializes GUI controls
     */
    initControls: function() {
        document.getElementById("maxBlockCnt").disabled = false;
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

        gui.maxBlockCnt = parseInt(document.getElementById("maxBlockCnt").value);
        document.getElementById("maxBlockCnt").disabled = true;

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
        gui.isRunning = false;
        gui.prepareNextInput();
    }

    document.getElementById("run").onclick = function() {
        gui.isRunning = true;
        gui.prepareNextInput();

        document.getElementById("step").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("pause").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("pause").onclick = function() {
        gui.isRunning = false;

        document.getElementById("step").disabled = false;
        document.getElementById("run").disabled = false;
        document.getElementById("pause").disabled = true;
        document.getElementById("stop").disabled = false;
    }

    /*
     * Terminate simualtion and clean up
     */
    document.getElementById("stop").onclick = function() {
        gui.isRunning = false;
        clearInterval(gui.timer);

        while (gui.queue.peek()) {
            gui.queue.dequeue();
        }

        gui.input = 0;
        gui.cnt = 0;
        gui.blockCnt = 1;
        gui.tmp = "";

        gui.initControls();
    }
}