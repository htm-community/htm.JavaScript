function isNullOrUndefined(o) {
	if (o === null || o === undefined) {
		return true;
	}
	return false;
}

/*
 * Compares arbitrary arrays
 */
function equals(a1, a2) {
	
	if (!Array.isArray(a1) || !Array.isArray(a2)) {
		throw new Error("Arguments to function equals(a1, a2) must be arrays.");
	}
	
	if (a1.length !== a2.length) {
		return false;
	}
	for (var i=0; i<a1.length; i++) {
		if (Array.isArray(a1[i]) && Array.isArray(a2[i])) {
			 if (equals(a1[i], a2[i])) {
			 	continue;
			 } else {
			 	return false;
			 }
		} else {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
	}
	return true;
}

function toMercator(lon, lat) {
	var x = lon * 20037508.34 / 180;
	var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
	y = y * 20037508.34 / 180;
	
	return [x, y];
}

function toGeocentric(lon, lat, alt) {	// double(double, double, double)

	lon = lon * Math.PI/180.0;
	lat = lat * Math.PI/180.0;

	var PI_OVER_2 = Math.PI / 2.0;
	
	if (lat < -PI_OVER_2 && lat > -1.001 * PI_OVER_2 ) {
    	lat = -PI_OVER_2;
    } else if ( lat > PI_OVER_2 && lat < 1.001 * PI_OVER_2 ) {
      	lat = PI_OVER_2;
  	} else if ((lat < -PI_OVER_2) || (lat > PI_OVER_2)) { 
    	throw new Error("latitude out of range");
  	}

    if (lon > Math.PI) {
    	lon -= (2.0 * Math.PI);
    }
    
    var Rn = 6378137.0;
    
    var x = (Rn + alt) * Math.cos(lat) * Math.cos(lon);
    var y = (Rn + alt) * Math.cos(lat) * Math.sin(lon);
    var z = (Rn + alt) * Math.sin(lat);
    
    return [x, y, z];
}

function makeArray(arr, dims) {			

	if (dims[1] === undefined) {
	    return arr;
    }
		
    arr = new Array(dims[0]);
	
    for (var i=0; i<dims[0]; i++) {
	    arr[i] = new Array(dims[1]);
	    arr[i] = makeArray(arr[i], dims.slice(1));
    }

    return arr;
}

