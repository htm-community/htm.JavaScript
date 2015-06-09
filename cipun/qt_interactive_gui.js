/**
 * GUI
 */
var Gui = function(maxBlockCnt) {
    this.example = null;
    this.exampleIsRunning = false;
    this.queue = new Queue();
    this.timer = null;
    this.input = 0;
    this.cnt = 0;
    this.blockCnt = 0;
    this.tmp = "";
    this.maxBlockCnt = maxBlockCnt;
};

Gui.prototype = {
    executeCmd: function(cmd) {
        switch (cmd.action) {
            case "init":
                this.example = new QuickTest(this);
                break;
            case "run":
                this.example.processInput(cmd.input);
                break;
            default:
                throw new Error("No executable action found in queue.");
                break;
        }
    },

    log: function(str) {
        var el = document.getElementById("result");
        if (this.cnt % 10 === 9) {
            el.innerHTML = this.tmp;
            if (this.blockCnt > this.maxBlockCnt) {
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

    prepareNextInput: function() {
        this.input = (this.input == 7 ? 1 : this.input + 1);

        this.queue.enqueue({
            action: "run",
            input: this.input
        });
    },

    initButtons: function() {
        document.getElementById("init").disabled = false;
        document.getElementById("step").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("pause").disabled = true;
        document.getElementById("continue").disabled = true;
        document.getElementById("stop").disabled = true;
    }
}

var gui = new Gui(30);

window.onload = function() {

    gui.initButtons();

    document.getElementById("init").onclick = function() {
        document.getElementById("result").innerHTML = "";

        while (gui.queue.dequeue()) {
            gui.queue.dequeue();
        }

        gui.timer = setInterval(function() {
            if (gui.queue.peek() !== undefined) {
                gui.executeCmd(gui.queue.dequeue());
            }
        }, 50);

        gui.queue.enqueue({
            action: "init"
        });

        document.getElementById("init").disabled = true;
        document.getElementById("step").disabled = false;
        document.getElementById("run").disabled = false;
		document.getElementById("stop").disabled = false;
    }

    document.getElementById("step").onclick = function() {
        gui.exampleIsRunning = false;
        gui.prepareNextInput();
    }

    document.getElementById("run").onclick = function() {
        gui.exampleIsRunning = true;
        gui.prepareNextInput();

        document.getElementById("run").disabled = true;
        document.getElementById("step").disabled = true;
        document.getElementById("pause").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("pause").onclick = function() {
        gui.exampleIsRunning = false;

        document.getElementById("pause").disabled = true;
        document.getElementById("step").disabled = false;
        document.getElementById("continue").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("continue").onclick = function() {
        gui.exampleIsRunning = true;
        gui.prepareNextInput();

        document.getElementById("pause").disabled = false;
        document.getElementById("step").disabled = true;
        document.getElementById("continue").disabled = true;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("stop").onclick = function() {
        gui.exampleIsRunning = false;
        clearInterval(gui.timer);
        gui.input = 0;
        gui.cnt = 0;
        gui.blockCnt = 0;
        gui.tmp = "";

        gui.initButtons();
    }
}