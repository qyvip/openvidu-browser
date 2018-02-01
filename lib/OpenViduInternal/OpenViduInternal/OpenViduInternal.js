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
var SessionInternal_1 = require("./SessionInternal");
var OpenViduError_1 = require("./OpenViduError");
var Stream_1 = require("./Stream");
var RpcBuilder = require("../KurentoUtils/kurento-jsonrpc");
var OpenViduInternal = /** @class */ (function () {
    function OpenViduInternal() {
        this.remoteStreams = [];
        this.recorder = false;
    }
    /* NEW METHODS */
    OpenViduInternal.prototype.initSession = function (sessionId) {
        console.info("'Session' initialized with 'sessionId' [" + sessionId + "]");
        this.session = new SessionInternal_1.SessionInternal(this, sessionId);
        return this.session;
    };
    OpenViduInternal.prototype.initPublisherTagged = function (parentId, cameraOptions, newStream, callback) {
        var _this = this;
        if (newStream) {
            if (cameraOptions == null) {
                cameraOptions = {
                    connection: this.session.getLocalParticipant(),
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
            }
            else {
                cameraOptions.connection = this.session.getLocalParticipant();
            }
            this.localStream = new Stream_1.Stream(this, true, this.session, cameraOptions);
        }
        this.localStream.requestCameraAccess(function (error, localStream) {
            if (error) {
                // Neither localStream or microphone device is allowed/able to capture media
                console.error(error);
                if (callback) {
                    callback(error);
                }
                _this.localStream.ee.emitEvent('access-denied-by-publisher');
            }
            else {
                _this.localStream.setVideoElement(_this.cameraReady(localStream, parentId));
                if (callback) {
                    callback(undefined);
                }
            }
        });
        return this.localStream;
    };
    OpenViduInternal.prototype.initPublisherScreen = function (parentId, newStream, callback) {
        var _this = this;
        if (newStream) {
            this.localStream = new Stream_1.Stream(this, true, this.session, 'screen-options');
        }
        this.localStream.addOnceEventListener('can-request-screen', function () {
            _this.localStream.requestCameraAccess(function (error, localStream) {
                if (error) {
                    _this.localStream.ee.emitEvent('access-denied-by-publisher');
                    var errorName = "SCREEN_CAPTURE_DENIED" /* SCREEN_CAPTURE_DENIED */;
                    var errorMessage = 'You must allow access to one window of your desktop';
                    var e = new OpenViduError_1.OpenViduError(errorName, errorMessage);
                    console.error(e);
                    if (callback) {
                        callback(e);
                    }
                }
                else {
                    _this.localStream.setVideoElement(_this.cameraReady(localStream, parentId));
                    if (_this.localStream.getSendAudio()) {
                        // If the user wants to send audio with the screen capturing
                        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                            .then(function (userStream) {
                            _this.localStream.getMediaStream().addTrack(userStream.getAudioTracks()[0]);
                            // Mute audio if 'activeAudio' property is false
                            if (userStream.getAudioTracks()[0] != null) {
                                userStream.getAudioTracks()[0].enabled = _this.localStream.outboundOptions.activeAudio;
                            }
                            _this.localStream.isScreenRequestedReady = true;
                            _this.localStream.ee.emitEvent('screen-ready');
                            if (callback) {
                                callback(undefined);
                            }
                        })
                            .catch(function (error) {
                            _this.localStream.ee.emitEvent('access-denied-by-publisher');
                            console.error("Error accessing the microphone", error);
                            if (callback) {
                                var errorName = "MICROPHONE_ACCESS_DENIED" /* MICROPHONE_ACCESS_DENIED */;
                                var errorMessage = error.toString();
                                callback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                            }
                        });
                    }
                    else {
                        _this.localStream.isScreenRequestedReady = true;
                        _this.localStream.ee.emitEvent('screen-ready');
                        if (callback) {
                            callback(undefined);
                        }
                    }
                }
            });
        });
        return this.localStream;
    };
    OpenViduInternal.prototype.cameraReady = function (localStream, parentId) {
        this.localStream = localStream;
        var videoElement = this.localStream.playOnlyVideo(parentId, null);
        this.localStream.emitStreamReadyEvent();
        return videoElement;
    };
    OpenViduInternal.prototype.getLocalStream = function () {
        return this.localStream;
    };
    OpenViduInternal.prototype.getRemoteStreams = function () {
        return this.remoteStreams;
    };
    /* NEW METHODS */
    OpenViduInternal.prototype.getWsUri = function () {
        return this.wsUri;
    };
    OpenViduInternal.prototype.setWsUri = function (wsUri) {
        this.wsUri = wsUri;
    };
    OpenViduInternal.prototype.getSecret = function () {
        return this.secret;
    };
    OpenViduInternal.prototype.setSecret = function (secret) {
        this.secret = secret;
    };
    OpenViduInternal.prototype.getRecorder = function () {
        return this.recorder;
    };
    OpenViduInternal.prototype.setRecorder = function (recorder) {
        this.recorder = recorder;
    };
    OpenViduInternal.prototype.getOpenViduServerURL = function () {
        return 'https://' + this.wsUri.split("wss://")[1].split("/room")[0];
    };
    OpenViduInternal.prototype.getRoom = function () {
        return this.session;
    };
    OpenViduInternal.prototype.connect = function (callback) {
        this.callback = callback;
        this.initJsonRpcClient(this.wsUri);
    };
    OpenViduInternal.prototype.initJsonRpcClient = function (wsUri) {
        var config = {
            heartbeat: 3000,
            sendCloseMessage: false,
            ws: {
                uri: wsUri,
                useSockJS: false,
                onconnected: this.connectCallback.bind(this),
                ondisconnect: this.disconnectCallback.bind(this),
                onreconnecting: this.reconnectingCallback.bind(this),
                onreconnected: this.reconnectedCallback.bind(this)
            },
            rpc: {
                requestTimeout: 15000,
                //notifications
                participantJoined: this.onParticipantJoined.bind(this),
                participantPublished: this.onParticipantPublished.bind(this),
                participantUnpublished: this.onParticipantUnpublished.bind(this),
                participantLeft: this.onParticipantLeft.bind(this),
                participantEvicted: this.onParticipantEvicted.bind(this),
                sendMessage: this.onNewMessage.bind(this),
                iceCandidate: this.iceCandidateEvent.bind(this),
                mediaError: this.onMediaError.bind(this),
            }
        };
        this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);
    };
    OpenViduInternal.prototype.connectCallback = function (error) {
        if (error) {
            this.callback(error);
        }
        else {
            this.callback(null);
        }
    };
    OpenViduInternal.prototype.isRoomAvailable = function () {
        if (this.session !== undefined && this.session instanceof SessionInternal_1.SessionInternal) {
            return true;
        }
        else {
            console.warn('Room instance not found');
            return false;
        }
    };
    OpenViduInternal.prototype.disconnectCallback = function () {
        console.warn('Websocket connection lost');
        if (this.isRoomAvailable()) {
            this.session.onLostConnection();
        }
        else {
            alert('Connection error. Please reload page.');
        }
    };
    OpenViduInternal.prototype.reconnectingCallback = function () {
        console.warn('Websocket connection lost (reconnecting)');
        if (this.isRoomAvailable()) {
            this.session.onLostConnection();
        }
        else {
            alert('Connection error. Please reload page.');
        }
    };
    OpenViduInternal.prototype.reconnectedCallback = function () {
        console.warn('Websocket reconnected');
    };
    OpenViduInternal.prototype.onParticipantJoined = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onParticipantJoined(params);
        }
    };
    OpenViduInternal.prototype.onParticipantPublished = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onParticipantPublished(params);
        }
    };
    OpenViduInternal.prototype.onParticipantUnpublished = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onParticipantUnpublished(params);
        }
    };
    OpenViduInternal.prototype.onParticipantLeft = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onParticipantLeft(params);
        }
    };
    OpenViduInternal.prototype.onParticipantEvicted = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onParticipantEvicted(params);
        }
    };
    OpenViduInternal.prototype.onNewMessage = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onNewMessage(params);
        }
    };
    OpenViduInternal.prototype.iceCandidateEvent = function (params) {
        if (this.isRoomAvailable()) {
            this.session.recvIceCandidate(params);
        }
    };
    OpenViduInternal.prototype.onRoomClosed = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onRoomClosed(params);
        }
    };
    OpenViduInternal.prototype.onMediaError = function (params) {
        if (this.isRoomAvailable()) {
            this.session.onMediaError(params);
        }
    };
    OpenViduInternal.prototype.setRpcParams = function (params) {
        this.rpcParams = params;
    };
    OpenViduInternal.prototype.sendRequest = function (method, params, callback) {
        if (params && params instanceof Function) {
            callback = params;
            params = undefined;
        }
        params = params || {};
        if (this.rpcParams && this.rpcParams !== null && this.rpcParams !== undefined) {
            for (var index in this.rpcParams) {
                if (this.rpcParams.hasOwnProperty(index)) {
                    params[index] = this.rpcParams[index];
                    console.debug('RPC param added to request {' + index + ': ' + this.rpcParams[index] + '}');
                }
            }
        }
        console.debug('Sending request: {method:"' + method + '", params: ' + JSON.stringify(params) + '}');
        this.jsonRpcClient.send(method, params, callback);
    };
    OpenViduInternal.prototype.close = function (forced) {
        if (this.isRoomAvailable()) {
            this.session.leave(forced, this.jsonRpcClient);
        }
    };
    ;
    OpenViduInternal.prototype.disconnectParticipant = function (stream) {
        if (this.isRoomAvailable()) {
            this.session.disconnect(stream);
        }
    };
    //CHAT
    OpenViduInternal.prototype.sendMessage = function (message) {
        this.sendRequest('sendMessage', {
            message: message
        }, function (error, response) {
            if (error) {
                console.error(error);
            }
        });
    };
    ;
    OpenViduInternal.prototype.generateMediaConstraints = function (cameraOptions) {
        var mediaConstraints = {
            audio: cameraOptions.audio,
            video: {}
        };
        if (!cameraOptions.video) {
            mediaConstraints.video = false;
        }
        else {
            var w = void 0, h = void 0;
            if (cameraOptions.quality.width && cameraOptions.quality.height) {
                w = cameraOptions.quality.width;
                h = cameraOptions.quality.height;
            }
            else {
                switch (cameraOptions.quality) {
                    case 'LOW':
                        w = 320;
                        h = 240;
                        break;
                    case 'MEDIUM':
                        w = 640;
                        h = 480;
                        break;
                    case 'HIGH':
                        w = 1280;
                        h = 720;
                        break;
                    default:
                        w = 640;
                        h = 480;
                }
            }
            mediaConstraints.video['width'] = { exact: w };
            mediaConstraints.video['height'] = { exact: h };
            //mediaConstraints.video['frameRate'] = { ideal: Number((<HTMLInputElement>document.getElementById('frameRate')).value) };
        }
        return mediaConstraints;
    };
    return OpenViduInternal;
}());
exports.OpenViduInternal = OpenViduInternal;
//# sourceMappingURL=OpenViduInternal.js.map