"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * (C) Copyright 2017 OpenVidu (http://openvidu.io/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var OpenViduInternal_1 = require("../OpenViduInternal/OpenViduInternal");
var Session_1 = require("./Session");
var Publisher_1 = require("./Publisher");
var OpenViduError_1 = require("../OpenViduInternal/OpenViduError");
var adapter = require("webrtc-adapter");
var screenSharingAuto = require("../ScreenSharing/Screen-Capturing-Auto.js");
if (window) {
    window["adapter"] = adapter;
}
var OpenVidu = /** @class */ (function () {
    function OpenVidu() {
        this.openVidu = new OpenViduInternal_1.OpenViduInternal();
        console.info("'OpenVidu' initialized");
    }
    ;
    OpenVidu.prototype.initSession = function (param1, param2) {
        if (this.checkSystemRequirements()) {
            if (typeof param2 == "string") {
                return new Session_1.Session(this.openVidu.initSession(param2), this);
            }
            else {
                return new Session_1.Session(this.openVidu.initSession(param1), this);
            }
        }
        else {
            alert("Browser not supported");
        }
    };
    OpenVidu.prototype.initPublisher = function (parentId, cameraOptions, callback) {
        if (this.checkSystemRequirements()) {
            var publisher_1;
            if (cameraOptions != null) {
                cameraOptions.audio = cameraOptions.audio != null ? cameraOptions.audio : true;
                cameraOptions.video = cameraOptions.video != null ? cameraOptions.video : true;
                if (!cameraOptions.screen) {
                    // Webcam and/or microphone is being requested
                    var cameraOptionsAux = {
                        sendAudio: cameraOptions.audio != null ? cameraOptions.audio : true,
                        sendVideo: cameraOptions.video != null ? cameraOptions.video : true,
                        activeAudio: cameraOptions.audioActive != null ? cameraOptions.audioActive : true,
                        activeVideo: cameraOptions.videoActive != null ? cameraOptions.videoActive : true,
                        dataChannel: true,
                        mediaConstraints: this.openVidu.generateMediaConstraints(cameraOptions)
                    };
                    cameraOptions = cameraOptionsAux;
                    publisher_1 = new Publisher_1.Publisher(this.openVidu.initPublisherTagged(parentId, cameraOptions, true, callback), parentId, false);
                    console.info("'Publisher' initialized");
                    return publisher_1;
                }
                else {
                    publisher_1 = new Publisher_1.Publisher(this.openVidu.initPublisherScreen(parentId, true, callback), parentId, true);
                    if (adapter.browserDetails.browser === 'firefox' && adapter.browserDetails.version >= 52) {
                        screenSharingAuto.getScreenId(function (error, sourceId, screenConstraints) {
                            cameraOptions = {
                                sendAudio: cameraOptions.audio,
                                sendVideo: cameraOptions.video,
                                activeAudio: cameraOptions.audioActive != null ? cameraOptions.audioActive : true,
                                activeVideo: cameraOptions.videoActive != null ? cameraOptions.videoActive : true,
                                dataChannel: true,
                                mediaConstraints: {
                                    video: screenConstraints.video,
                                    audio: false
                                }
                            };
                            publisher_1.stream.configureScreenOptions(cameraOptions);
                            console.info("'Publisher' initialized");
                            publisher_1.stream.ee.emitEvent('can-request-screen');
                        });
                        return publisher_1;
                    }
                    else if (adapter.browserDetails.browser === 'chrome') {
                        // Screen is being requested
                        /*screenSharing.isChromeExtensionAvailable((availability) => {
                            switch (availability) {
                                case 'available':
                                    console.warn('EXTENSION AVAILABLE!!!');
                                    screenSharing.getScreenConstraints((error, screenConstraints) => {
                                        if (!error) {
                                            console.warn(screenConstraints);
                                        }
                                    });
                                    break;
                                case 'unavailable':
                                    console.warn('EXTENSION NOT AVAILABLE!!!');
                                    break;
                                case 'isFirefox':
                                    console.warn('IT IS FIREFOX!!!');
                                    screenSharing.getScreenConstraints((error, screenConstraints) => {
                                        if (!error) {
                                            console.warn(screenConstraints);
                                        }
                                    });
                                    break;
                            }
                        });*/
                        screenSharingAuto.getScreenId(function (error, sourceId, screenConstraints) {
                            if (error === 'not-installed') {
                                var error_1 = new OpenViduError_1.OpenViduError("SCREEN_EXTENSION_NOT_INSTALLED" /* SCREEN_EXTENSION_NOT_INSTALLED */, 'https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk');
                                console.error(error_1);
                                if (callback)
                                    callback(error_1);
                                return;
                            }
                            else if (error === 'permission-denied') {
                                var error_2 = new OpenViduError_1.OpenViduError("SCREEN_CAPTURE_DENIED" /* SCREEN_CAPTURE_DENIED */, 'You must allow access to one window of your desktop');
                                console.error(error_2);
                                if (callback)
                                    callback(error_2);
                                return;
                            }
                            cameraOptions = {
                                sendAudio: cameraOptions.audio != null ? cameraOptions.audio : true,
                                sendVideo: cameraOptions.video != null ? cameraOptions.video : true,
                                activeAudio: cameraOptions.audioActive != null ? cameraOptions.audioActive : true,
                                activeVideo: cameraOptions.videoActive != null ? cameraOptions.videoActive : true,
                                dataChannel: true,
                                mediaConstraints: {
                                    video: screenConstraints.video,
                                    audio: false
                                }
                            };
                            publisher_1.stream.configureScreenOptions(cameraOptions);
                            publisher_1.stream.ee.emitEvent('can-request-screen');
                        }, function (error) {
                            console.error('getScreenId error', error);
                            return;
                        });
                        console.info("'Publisher' initialized");
                        return publisher_1;
                    }
                    else {
                        console.error('Screen sharing not supported on ' + adapter.browserDetails.browser);
                    }
                }
            }
            else {
                cameraOptions = {
                    sendAudio: true,
                    sendVideo: true,
                    activeAudio: true,
                    activeVideo: true,
                    dataChannel: true,
                    mediaConstraints: {
                        audio: true,
                        video: { width: { ideal: 1280 } }
                    }
                };
                publisher_1 = new Publisher_1.Publisher(this.openVidu.initPublisherTagged(parentId, cameraOptions, true, callback), parentId, false);
                console.info("'Publisher' initialized");
                return publisher_1;
            }
        }
        else {
            alert("Browser not supported");
        }
    };
    OpenVidu.prototype.reinitPublisher = function (publisher) {
        if (publisher.stream.typeOfVideo !== 'SCREEN') {
            publisher = new Publisher_1.Publisher(this.openVidu.initPublisherTagged(publisher.stream.getParentId(), publisher.stream.outboundOptions, false), publisher.stream.getParentId(), false);
            console.info("'Publisher' initialized");
            return publisher;
        }
        else {
            publisher = new Publisher_1.Publisher(this.openVidu.initPublisherScreen(publisher.stream.getParentId(), false), publisher.stream.getParentId(), true);
            if (adapter.browserDetails.browser === 'firefox' && adapter.browserDetails.version >= 52) {
                screenSharingAuto.getScreenId(function (error, sourceId, screenConstraints) {
                    publisher.stream.outboundOptions.mediaConstraints.video = screenConstraints.video;
                    publisher.stream.configureScreenOptions(publisher.stream.outboundOptions);
                    console.info("'Publisher' initialized");
                    publisher.stream.ee.emitEvent('can-request-screen');
                });
                return publisher;
            }
            else if (adapter.browserDetails.browser === 'chrome') {
                screenSharingAuto.getScreenId(function (error, sourceId, screenConstraints) {
                    if (error === 'not-installed') {
                        var error_3 = new OpenViduError_1.OpenViduError("SCREEN_EXTENSION_NOT_INSTALLED" /* SCREEN_EXTENSION_NOT_INSTALLED */, 'https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk');
                        console.error(error_3);
                        return;
                    }
                    else if (error === 'permission-denied') {
                        var error_4 = new OpenViduError_1.OpenViduError("SCREEN_CAPTURE_DENIED" /* SCREEN_CAPTURE_DENIED */, 'You must allow access to one window of your desktop');
                        console.error(error_4);
                        return;
                    }
                    publisher.stream.outboundOptions.mediaConstraints.video = screenConstraints.video;
                    publisher.stream.configureScreenOptions(publisher.stream.outboundOptions);
                    publisher.stream.ee.emitEvent('can-request-screen');
                }, function (error) {
                    console.error('getScreenId error', error);
                    return;
                });
                console.info("'Publisher' initialized");
                return publisher;
            }
            else {
                console.error('Screen sharing not supported on ' + adapter.browserDetails.browser);
            }
        }
    };
    OpenVidu.prototype.checkSystemRequirements = function () {
        var browser = adapter.browserDetails.browser;
        var version = adapter.browserDetails.version;
        //Bug fix: 'navigator.userAgent' in Firefox for Ubuntu 14.04 does not return "Firefox/[version]" in the string, so version returned is null
        if ((browser == 'firefox') && (version == null)) {
            return 1;
        }
        if (((browser == 'chrome') && (version >= 28)) || ((browser == 'edge') && (version >= 12)) || ((browser == 'firefox') && (version >= 22))) {
            return 1;
        }
        else {
            return 0;
        }
    };
    OpenVidu.prototype.getDevices = function (callback) {
        navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
            callback(null, deviceInfos);
        }).catch(function (error) {
            console.error("Error getting devices", error);
            callback(error, null);
        });
    };
    OpenVidu.prototype.enableProdMode = function () {
        console.log = function () { };
        console.debug = function () { };
        console.info = function () { };
        console.warn = function () { };
    };
    return OpenVidu;
}());
exports.OpenVidu = OpenVidu;
//# sourceMappingURL=OpenVidu.js.map