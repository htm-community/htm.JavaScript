/**
 * GUI
 */
var Gui = function() {
    this.example = null;
    this.isRunning = false;
    this.queue = new Queue();
    this.timer = null;
    this.input = 0;
    this.cnt = 0;
    this.blockCnt = 1;
    this.tmp = "";
    this.maxBlockCnt = 0;
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

    prepareNextInput: function() {
        this.input = (this.input == 7 ? 1 : this.input + 1);

        this.queue.enqueue({
            action: "run",
            input: this.input
        });
    },

    initButtons: function() {
        document.getElementById("maxBlockCnt").disabled = false;
        document.getElementById("init").disabled = false;
        document.getElementById("step").disabled = true;
        document.getElementById("run").disabled = true;
        document.getElementById("pause").disabled = true;
        document.getElementById("continue").disabled = true;
        document.getElementById("stop").disabled = true;
    }
}

var gui = gui = new Gui();

window.onload = function() {

    gui.initButtons();

    document.getElementById("init").onclick = function() {

        gui.maxBlockCnt = parseInt(document.getElementById("maxBlockCnt").value);
        document.getElementById("maxBlockCnt").disabled = true;

        document.getElementById("result").innerHTML = "";

        gui.queue.enqueue({
            action: "init"
        });

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

        document.getElementById("run").disabled = true;
        document.getElementById("step").disabled = true;
        document.getElementById("pause").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("pause").onclick = function() {
        gui.isRunning = false;

        document.getElementById("pause").disabled = true;
        document.getElementById("step").disabled = false;
        document.getElementById("continue").disabled = false;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("continue").onclick = function() {
        gui.isRunning = true;
        gui.prepareNextInput();

        document.getElementById("pause").disabled = false;
        document.getElementById("step").disabled = true;
        document.getElementById("continue").disabled = true;
        document.getElementById("stop").disabled = false;
    }

    document.getElementById("stop").onclick = function() {
        gui.isRunning = false;
        clearInterval(gui.timer);

        while (gui.queue.dequeue()) {
            gui.queue.dequeue();
        }

        gui.input = 0;
        gui.cnt = 0;
        gui.blockCnt = 1;
        gui.tmp = "";

        gui.initButtons();
    }
}