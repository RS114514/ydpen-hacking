package flash.filesystem {
    import flash.net.FileReference;

    [API("661")]
    public class File extends FileReference {
        private static var _applicationDirectory:File = null;
        private static var _applicationStorageDirectory:File = null;
        private static var _documentsDirectory:File = null;
        private static var _userDirectory:File = null;

        private var _nativePath:String = "";

        public function File(path:String = null) {
            if (path !== null && path !== "") {
                if (path.indexOf("file://") === 0) {
                    path = path.substr(7);
                }
                _nativePath = nativeResolve(nativeApplicationDirectory(), path);
            }
        }

        private static native function nativeApplicationDirectory():String;
        private static native function nativeResolve(base:String, rel:String):String;
        private static native function nativeExists(path:String):Boolean;
        private static native function nativeIsDirectory(path:String):Boolean;
        private static native function nativeCreateDirectory(path:String):void;
        private static native function nativeDeleteFile(path:String):void;
        private static native function nativeDeleteDirectory(path:String, recursive:Boolean):void;
        private static native function nativeListDirectory(path:String):Array;
        private static native function nativeMoveTo(src:String, dst:String, overwrite:Boolean):void;

        public static function get applicationDirectory():File {
            if (_applicationDirectory === null) {
                _applicationDirectory = new File(nativeApplicationDirectory());
            }
            return _applicationDirectory;
        }

        public static function get applicationStorageDirectory():File {
            if (_applicationStorageDirectory === null) {
                _applicationStorageDirectory = new File(nativeResolve(nativeApplicationDirectory(), "save"));
            }
            return _applicationStorageDirectory;
        }

        public static function get documentsDirectory():File {
            if (_documentsDirectory === null) {
                _documentsDirectory = applicationStorageDirectory;
            }
            return _documentsDirectory;
        }

        public static function get userDirectory():File {
            if (_userDirectory === null) {
                _userDirectory = applicationStorageDirectory;
            }
            return _userDirectory;
        }

        public static function get separator():String {
            return "/";
        }

        public function resolvePath(path:String):File {
            var base:String = _nativePath !== "" ? _nativePath : nativeApplicationDirectory();
            return new File(nativeResolve(base, path));
        }

        public function get exists():Boolean {
            if (_nativePath === "") {
                return false;
            }
            return nativeExists(_nativePath);
        }

        public function get isDirectory():Boolean {
            if (_nativePath === "") {
                return false;
            }
            return nativeIsDirectory(_nativePath);
        }

        public function get nativePath():String {
            return _nativePath;
        }

        public function set nativePath(value:String):void {
            _nativePath = value !== null ? nativeResolve(nativeApplicationDirectory(), value) : "";
        }

        public function get url():String {
            return _nativePath !== "" ? "file://" + _nativePath : "";
        }

        public function canonicalize():void {
            if (_nativePath !== "") {
                _nativePath = nativeResolve(nativeApplicationDirectory(), _nativePath);
            }
        }

        public function createDirectory():void {
            if (_nativePath !== "") {
                nativeCreateDirectory(_nativePath);
            }
        }

        public function deleteFile():void {
            if (_nativePath !== "") {
                nativeDeleteFile(_nativePath);
            }
        }

        public function deleteDirectory(deleteDirectoryContents:Boolean = false):void {
            if (_nativePath !== "") {
                nativeDeleteDirectory(_nativePath, deleteDirectoryContents);
            }
        }

        public function getDirectoryListing():Array {
            if (_nativePath === "") {
                return [];
            }
            var paths:Array = nativeListDirectory(_nativePath);
            var result:Array = [];
            for (var i:int = 0; i < paths.length; i++) {
                result.push(new File(paths[i]));
            }
            return result;
        }

        public function moveTo(newLocation:FileReference, overwrite:Boolean = false):void {
            var dst:File = newLocation as File;
            if (_nativePath !== "" && dst !== null && dst.nativePath !== "") {
                nativeMoveTo(_nativePath, dst.nativePath, overwrite);
            }
        }
    }
}
