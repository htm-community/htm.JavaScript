# htm.JavaScript
This is a port of the [numenta/nupic](https://github.com/numenta/nupic) port [htm.java](https://github.com/numenta/htm.java) to JavaScript.

##Disclaimer
This project is work in progress and subject to frequent changes. Sometimes it might even be broken.

## Goal
Run NuPIC in a browser (For now Firefox only, due to extensive use of the ECMAScript 6 features such as Set and Map data structures)

## Usage
1. Clone or download ZIP

2. Unpack into the web root folder of your favorite web server. With XAMPP the result should look like
   - htdocs/foo/bar/baz/nupic/...
   - ...
   - htdocs/foo/bar/baz/sp.html
   - htdocs/foo/bar/baz/qt.html

3. Start the web server

4. Load http://localhost/foo/bar/baz/sp.html or http://localhost/foo/bar/baz/qt.html with Firefox 

Alternatively, sp_dbg.html or qt_dbg.html might be used. Those files can be loaded from the file system (no web server needed). They allow the use of a debugger (e.g. Firebug), but don't use web workers. Thus the browser freezes.

Currently htm.JavaScript reproduces both the "HelloSP" (sp.html or sp_dbg.html) and "QuickTest" (qt.html or qt_dbg.html) demos from htm.java which illustrate SDRs, spatial pooling and temporal memory. Altogether, I tried to stick as close as possible to the Java implementation. This worked pretty well because ECMAScript 6 supports advanced data structures like Set and Map. Due to the use of web workers, the browser UI stays responsive during the time consuming simulation. 
