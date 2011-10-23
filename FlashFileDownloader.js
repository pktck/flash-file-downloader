/*
 * FileDownloader
 */

var FileDownloader = {};
FileDownloader.misc = {};

FileDownloader.flashPath = 'flash-file-downloader/FlashFileDownloader.swf';
FileDownloader.flashContainer = 'flashContainer';
FileDownloader.lastResult = undefined;

FileDownloader.networkReady = true;
FileDownloader.JSReady = false;
FileDownloader.ready = false;

FileDownloader.download = function(url, callback) {
	if (! FileDownloader.ready) { 
		return setTimeout(function() { FileDownloader.download(url, callback); }, 500);
	}

	FileDownloader.ready = false;

	if (! FileDownloader.misc.isFlashAvailable()) {
		FileDownloader.misc.log("Sorry, we need Flash to proceed");
	}

	FileDownloader._url = url;
	FileDownloader._download(FileDownloader._url, callback);
}

/******************************************************************************/
// Misc. utility functions

FileDownloader_isJavaScriptReady = function() {
	return FileDownloader.JSReady;
}

FileDownloader.misc.quietEmbedSWF = function(path, containerId) {
	var swfName = FileDownloader.misc.fileBasename(path);

	FileDownloader.misc.addInvisibleElement(swfName, containerId);
	var containerEl = document.getElementById(containerId);
	var width = parseInt(getComputedStyle(containerEl).width);
	var height = parseInt(getComputedStyle(containerEl).height);

	var params = { allowScriptAccess : "always", name : swfName, wmode : "transparent" };
	var flashvars = false;
	var attributes = { name : swfName};

	swfobject.embedSWF(path, swfName, "" + width, "" + height, "10.0.0",
		"expressInstall.swf", flashvars, params, attributes);
}

FileDownloader.misc.addInvisibleElement = function(id, containerEl) {
	var container = document.getElementById(containerEl) || containerEl || document.body;

	if (!container) {
		return setTimeout(function() { FileDownloader.misc.addInvisibleElement(id, containerEl); }, 500);
	}

	if (document.getElementById(id)) {
		return false;
	}

	var elementType = 'div';

	var innerContainer = document.getElementById('file_downloader_container');
	if (!innerContainer) {
		innerContainer = document.createElement('div');
		innerContainer.id = 'file_downloader_container';
		innerContainer.style.display = 'none';
		container.appendChild(innerContainer);
	}
	// var innerContainer = document.getElementById('file_downloader_container');

	var el = document.createElement(elementType);
	el.id = id;
	el.style.display = 'none';
	container.appendChild(el);

	return true;
}

FileDownloader.misc.fileBasename = function(path) {
	var s = path.replace(/.*\//, '').replace(/.swf/i, '');
	return s;
}

FileDownloader.misc.getMovie = function(movieName) { 
 
	if (navigator.appName.indexOf("Microsoft") != -1) { 
		return window[movieName];
	} else { 
		return document[movieName]; 
	} 
} 

FileDownloader.misc.handleResult = function(resultObj) {

	FileDownloader.lastResult = resultObj;

	// Clear queue of other methods if 
	if (!resultObj.error()) {
		FileDownloader.ready = true;
		
		// Execute user function on object here
		if (FileDownloader._handler) {
			FileDownloader._handler(resultObj);
		}
	} else {
		// nothing worked, return last result
		FileDownloader.ready = true;

		// Execute user function on object here
		if (FileDownloader._handler) {
			FileDownloader._handler(resultObj);
		}
	}
}

// This function gets called from ActionScript after the download is finished
FileDownloader.misc.sendToJavaScript = function(params) {

	FileDownloader.networkReady = true;

	result = new FileDownloader.result(params);
	FileDownloader.misc.handleResult(result);
}

FileDownloader.misc.sendTimestampToFlash = function () {
	var timestamp = new Date().getTime() + "";
	FileDownloader.misc.getMovie("FlashFileDownloader").uploadTimestamp(timestamp);
}

FileDownloader.misc.getTime = function() {
	return (new Date()).getTime();
}

FileDownloader.misc.sendToActionScript = function(command) {
	if (!FileDownloader.networkReady) {
		return setTimeout(function() { FileDownloader.misc.sendToActionScript(command)}, 500);
	}
	
	FileDownloader.networkReady = false;
	FileDownloader.misc.getMovie("FlashFileDownloader").sendToActionScript(command);
}

FileDownloader.misc.isFlashAvailable = function() {
	if (navigator.mimeTypes && navigator.mimeTypes["application/x-shockwave-flash"])
		return true;
	else if (FileDownloader.isFlashReady())
		return true;
	else if (window.ActiveXObject) {
		for (x = 7; x <= 11; x++) {
			try {
				oFlash = eval("new ActiveXObject('ShockwaveFlash.ShockwaveFlash." + x + "');");
				if (oFlash) {
					return true;
				}
			}
			catch(e) { }
		}
	}
	else
		return false;
}

FileDownloader.misc.addOnloadEvent = function(newEvent) {
	var originalEvent = window.onload;

	if (typeof window.onload != 'function') {
		window.onload = newEvent;
	} else {
		window.onload = function() {
			if (originalEvent) { originalEvent(); }
			newEvent();
		}
	}
}

FileDownloader.misc.onloadActions = function () {
	FileDownloader.networkReady = true;
	FileDownloader.JSReady = true;
	FileDownloader.ready = true;
	
	FileDownloader.misc.quietEmbedSWF(FileDownloader.flashPath, FileDownloader.flashContainer);
}

FileDownloader.misc.log = function() {
	if (typeof(console) != "undefined" && console.log)
		console.log(arguments);
}

FileDownloader.isFlashReady = function() {
	var m = FileDownloader.misc.getMovie("FlashFileDownloader");
	return m && m.sendToActionScript;
}

FileDownloader._download = function (url, callback) {
	// Callbacks implemented: success, failure, progress
	if (!callback) {
		callback = {}
	} 

	var defaultHandler = FileDownloader.misc.log;
	FileDownloader.progressHandler = callback.progress || defaultHandler;
	FileDownloader.successHandler = callback.success || defaultHandler;
	FileDownloader.failureHandler = callback.failureHandler || defaultHandler;

	FileDownloader.misc.getMovie("FlashFileDownloader").download(url);
	FileDownloader.misc.getMovie("FlashFileDownloader").addCallback('progress', 'FileDownloader.progressHandler');
	FileDownloader.misc.getMovie("FlashFileDownloader").addCallback('success', 'FileDownloader.successHandler');
	FileDownloader.misc.getMovie("FlashFileDownloader").addCallback('failure', 'FileDownloader.failureHandler') ;
}

/* Create our container element */
document.write('<div id="file_downloader_container"></div>');
FileDownloader.misc.addOnloadEvent(FileDownloader.misc.onloadActions);

