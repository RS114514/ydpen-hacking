package flash.filesystem {
    import flash.events.EventDispatcher;
    import flash.utils.ByteArray;

    [API("661")]
    public class FileStream extends EventDispatcher {
        private var _buffer:ByteArray = null;
        private var _path:String = "";
        private var _mode:String = "";
        private var _isOpen:Boolean = false;

        public function FileStream() {
            super();
        }

        private static native function nativeReadFile(path:String):ByteArray;
        private static native function nativeWriteFile(path:String, data:ByteArray):void;

        public function open(file:File, fileMode:String):void {
            if (file === null || file.nativePath === "") {
                throw new Error("Invalid file");
            }
            _path = file.nativePath;
            _mode = fileMode;
            _isOpen = true;

            if (_mode === "read" || _mode === "update") {
                _buffer = nativeReadFile(_path);
                _buffer.position = 0;
            } else if (_mode === "append") {
                if (file.exists) {
                    _buffer = nativeReadFile(_path);
                    _buffer.position = _buffer.length;
                } else {
                    _buffer = new ByteArray();
                }
            } else {
                _buffer = new ByteArray();
            }
        }

        public function openAsync(file:File, fileMode:String):void {
            open(file, fileMode);
        }

        public function close():void {
            if (_isOpen && _buffer !== null) {
                if (_mode === "write" || _mode === "append" || _mode === "update") {
                    nativeWriteFile(_path, _buffer);
                }
            }
            _isOpen = false;
            _buffer = null;
        }

        public function get bytesAvailable():uint {
            return _buffer !== null ? _buffer.bytesAvailable : 0;
        }

        public function get position():Number {
            return _buffer !== null ? _buffer.position : 0;
        }

        public function set position(value:Number):void {
            if (_buffer !== null) {
                _buffer.position = value;
            }
        }

        public function get endian():String {
            return _buffer !== null ? _buffer.endian : "bigEndian";
        }

        public function set endian(value:String):void {
            if (_buffer !== null) {
                _buffer.endian = value;
            }
        }

        public function readUTFBytes(length:uint):String {
            return _buffer.readUTFBytes(length);
        }

        public function readUTF():String {
            return _buffer.readUTF();
        }

        public function readBytes(bytes:ByteArray, offset:uint = 0, length:uint = 0):void {
            _buffer.readBytes(bytes, offset, length);
        }

        public function readByte():int {
            return _buffer.readByte();
        }

        public function readUnsignedByte():uint {
            return _buffer.readUnsignedByte();
        }

        public function readInt():int {
            return _buffer.readInt();
        }

        public function readUnsignedInt():uint {
            return _buffer.readUnsignedInt();
        }

        public function readBoolean():Boolean {
            return _buffer.readBoolean();
        }

        public function writeUTFBytes(value:String):void {
            _buffer.writeUTFBytes(value);
        }

        public function writeUTF(value:String):void {
            _buffer.writeUTF(value);
        }

        public function writeBytes(bytes:ByteArray, offset:uint = 0, length:uint = 0):void {
            _buffer.writeBytes(bytes, offset, length);
        }

        public function writeByte(value:int):void {
            _buffer.writeByte(value);
        }

        public function writeInt(value:int):void {
            _buffer.writeInt(value);
        }

        public function writeUnsignedInt(value:uint):void {
            _buffer.writeUnsignedInt(value);
        }

        public function writeBoolean(value:Boolean):void {
            _buffer.writeBoolean(value);
        }
    }
}
