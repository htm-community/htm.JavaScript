# htm.JavaScript
This is a port of the [numenta/nupic](https://github.com/numenta/nupic) port [htm.java](https://github.com/numenta/htm.java) to JavaScript.

## Goal
Run NuPIC in a browser (For now Firefox only due to extensive use of the ECMAScript 6 data structures Set and Map)

## Usage
1. Clone or download ZIP

2. Unpack into the web root folder of your favorite web server (with XAMPP the result should look like htdocs/htm.JavaScript/...)

3. Start the web server

4. Load http://localhost/htm.JavaScript/index.html with Firefox 

Currently htm.JavaScript reproduces just the "HelloSP" demo from htm.java which illustrates the meaning of SDRs. Altogether, I tried to stick as close as possible to the Java implementation. This worked pretty well because ECMAScript 6 supports advanced data structures like Set and Map. Due to the use of web workers, the browser UI stays responsive during the time consuming simulation. 

The next goal is the reproduction of the other htm.java demo named "QuickTest" which involves the temporal memory, too. 
