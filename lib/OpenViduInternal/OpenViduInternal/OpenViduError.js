"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OpenViduErrorName;
(function (OpenViduErrorName) {
    OpenViduErrorName["CAMERA_ACCESS_DENIED"] = "CAMERA_ACCESS_DENIED";
    OpenViduErrorName["MICROPHONE_ACCESS_DENIED"] = "MICROPHONE_ACCESS_DENIED";
    OpenViduErrorName["SCREEN_CAPTURE_DENIED"] = "SCREEN_CAPTURE_DENIED";
    OpenViduErrorName["NO_VIDEO_DEVICE"] = "NO_VIDEO_DEVICE";
    OpenViduErrorName["NO_INPUT_DEVICE"] = "NO_INPUT_DEVICE";
    OpenViduErrorName["SCREEN_EXTENSION_NOT_INSTALLED"] = "SCREEN_EXTENSION_NOT_INSTALLED";
    OpenViduErrorName["GENERIC_ERROR"] = "GENERIC_ERROR";
})(OpenViduErrorName = exports.OpenViduErrorName || (exports.OpenViduErrorName = {}));
var OpenViduError = /** @class */ (function () {
    function OpenViduError(name, message) {
        this.name = name;
        this.message = message;
    }
    return OpenViduError;
}());
exports.OpenViduError = OpenViduError;
//# sourceMappingURL=OpenViduError.js.map