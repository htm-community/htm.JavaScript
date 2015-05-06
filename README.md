# htm.JavaScript
This is a port of the [numenta/nupic](https://github.com/numenta/nupic) port [htm.java](https://github.com/numenta/htm.java) to JavaScript.

##Disclaimer
This project is work in progress and subject to frequent changes. Sometimes it might even be broken.

## Goal
Run NuPIC in a browser (For now Firefox only due to extensive use of the ECMAScript 6 data structures Set and Map)

## Usage
1. Clone or download ZIP

2. Unpack into the web root folder of your favorite web server. With XAMPP the result should look like
   - htdocs/foo/bar/baz/nupic/...
   - ...
   - htdocs/foo/bar/baz/sp.html

3. Start the web server

4. Load http://localhost/foo/bar/baz/sp.html with Firefox 

Alternatively, sp_dbg.html might be used. It can be loaded from the file system (no web server needed), allows the use of a debugger (e.g. Firebug), but doesn't use web workers, so the browser freezes during spatial pooler initialization.

Currently htm.JavaScript reproduces just the "HelloSP" demo from htm.java which illustrates the meaning of SDRs. Altogether, I tried to stick as close as possible to the Java implementation. This worked pretty well because ECMAScript 6 supports advanced data structures like Set and Map. Due to the use of web workers, the browser UI stays responsive during the time consuming simulation. 

The next goal is the reproduction of the other htm.java demo named "QuickTest" which involves the temporal memory, too. 
