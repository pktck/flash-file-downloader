package {
	import flash.display.Loader;
    import flash.display.Sprite;
    import flash.events.*;
    import flash.external.ExternalInterface;
	import flash.ui.Mouse;
    import flash.utils.Timer;
	import flash.utils.ByteArray;

	import flash.net.FileReference;
	import flash.net.URLRequest;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	
    public class FlashFileDownloader extends Sprite {
		private var fileLoader:URLLoader = new URLLoader();
		private var imageLoader:Loader = new Loader();
		private var fileReference:FileReference = new FileReference();
		private var stageFiller:Sprite;
		private var jsProgressHandler:String;
		private var jsSuccessHandler:String;
		private var jsFailureHandler:String;
		private var lastProgressBytes:Number = -1;
		private var fileName:String = "bitparcel-download";

        public function FlashFileDownloader() {
			configureExternalInterface();
        }

		private function configureExternalInterface():void {
			if (ExternalInterface.available) {
				try {
					trace("Adding callbacks...\n");
					ExternalInterface.addCallback("download", download);
					ExternalInterface.addCallback("sendToActionScript", receivedFromJavaScript);
					ExternalInterface.addCallback("addCallback", addCallback);
					
					if (checkJavaScriptReady()) {
						trace("JavaScript is ready.\n");
					} else {
						trace("JavaScript is not ready, creating timer.\n");
						var readyTimer:Timer = new Timer(100, 0);
						readyTimer.addEventListener(TimerEvent.TIMER, timerHandler);
						readyTimer.start();
					}
				} catch (error:SecurityError) {
					trace("A SecurityError occurred: " + error.message + "\n");
				} catch (error:Error) {                                                                           
					trace("An Error occurred: " + error.message + "\n");
				}
			} else {
				trace("External interface is not available for this container.");
			}
		}

		private function timerHandler(event:TimerEvent):void {
			trace("Checking JavaScript status...\n");
			var isReady:Boolean = checkJavaScriptReady();
			trace(isReady);
			if (isReady) {
				trace("JavaScript is ready.");
				Timer(event.target).stop();
			}
		}

		private function checkJavaScriptReady():Boolean {
			var isReady:Boolean = ExternalInterface.call("FileDownloader_isJavaScriptReady");
			return isReady;
		}

		private function receivedFromJavaScript(value:String):void {
			trace("JavaScript says: " + value);
		}


		private function download(url:String):void {
			// Save the filename for when the user downloads the file
			var url_split:Array = url.split('/');
			fileName = url_split[url_split.length - 1];
			
			var fileData:ByteArray= new ByteArray();
			fileLoader.dataFormat = URLLoaderDataFormat.BINARY;
			fileLoader.addEventListener(Event.COMPLETE, completeHandler);
			fileLoader.addEventListener(ProgressEvent.PROGRESS, progressHandler);
			fileLoader.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			fileLoader.load(new URLRequest(url));
		}

		/*
		 * Call out to JavaScript and execute jsEventHandler when the given
		 * event occurs. Event can be:
		 * - success 
		 * - failure
		 * - progrss
		 */
		private function addCallback(event:String, jsEventHandler:String):void {
			trace("Setting JS handler for event: " + event + "to: " + jsEventHandler);
			if (event == "success") {
				jsSuccessHandler = jsEventHandler;
			} else if (event == "failure") {
				jsFailureHandler = jsEventHandler;
			} else if (event == "progress") {
				jsProgressHandler = jsEventHandler;
			}
		}

		private function progressHandler(event:ProgressEvent):void {
			// Don't throw do anything on duplicate event (we get the progress
			// event twice for each downloaded packet/buffer).
			if (lastProgressBytes >= event.bytesLoaded) {
				return;
			}
			lastProgressBytes = event.bytesLoaded;

			ExternalInterface.call(jsProgressHandler, event);
			trace("progressHandler: bytesLoaded=" + event.bytesLoaded + " bytesTotal=" + event.bytesTotal);
		}

		private function ioErrorHandler(event:IOErrorEvent):void {
			ExternalInterface.call(jsFailureHandler, event);
			trace("ioErrorHandler: " + event);
		}

		private function completeHandler(event:Event):void {
			ExternalInterface.call(jsSuccessHandler, event);
			trace("completeHandler: " + event);
			showSaveElement();
		}

		private function showSaveElement():void {
			stage.addEventListener(MouseEvent.CLICK, function():void {
				fileReference.save(fileLoader.data, fileName)
			});

			// Need a sprite overlay to set cursor
			var stageFiller:Sprite = new Sprite();
			stageFiller.graphics.beginFill(0xFFFFFF, 0.0);
			stageFiller.graphics.drawCircle(0,0,4000);
			stageFiller.graphics.endFill();
			stageFiller.buttonMode = true;
			stageFiller.useHandCursor = true;
			addChild(stageFiller);
		}
    }
}

