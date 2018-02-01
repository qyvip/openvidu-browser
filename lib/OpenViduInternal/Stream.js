"use strict";
exports.__esModule = true;
var OpenViduError_1 = require("./OpenViduError");
var EventEmitter = require("wolfy87-eventemitter");
var kurentoUtils = require("../KurentoUtils/kurento-utils-js");
var adapter = require("webrtc-adapter");
if (window) {
    window["adapter"] = adapter;
}
function jq(id) {
    return id.replace(/(@|:|\.|\[|\]|,)/g, "\\$1");
}
function show(id) {
    document.getElementById(jq(id)).style.display = 'block';
}
function hide(id) {
    document.getElementById(jq(id)).style.display = 'none';
}
var Stream = /** @class */ (function () {
    function Stream(openVidu, local, room, options) {
        var _this = this;
        this.openVidu = openVidu;
        this.local = local;
        this.room = room;
        this.ee = new EventEmitter();
        this.showMyRemote = false;
        this.localMirrored = false;
        this.chanId = 0;
        this.dataChannelOpened = false;
        this.isReadyToPublish = false;
        this.isPublisherPublished = false;
        this.isVideoELementCreated = false;
        this.accessIsAllowed = false;
        this.accessIsDenied = false;
        this.isScreenRequestedReady = false;
        this.isScreenRequested = false;
        if (options !== 'screen-options') {
            if ('id' in options) {
                this.inboundOptions = options;
            }
            else {
                this.outboundOptions = options;
            }
            this.streamId = (options.id != null) ? options.id : ((options.sendVideo) ? "CAMERA" : "MICRO");
            this.typeOfVideo = (options.typeOfVideo != null) ? options.typeOfVideo : '';
            this.connection = options.connection;
        }
        else {
            this.isScreenRequested = true;
            this.typeOfVideo = 'SCREEN';
            this.connection = this.room.getLocalParticipant();
        }
        this.addEventListener('mediastream-updated', function () {
            if (_this.video)
                _this.video.srcObject = _this.mediaStream;
            console.debug("Video srcObject [" + _this.mediaStream + "] added to stream [" + _this.streamId + "]");
        });
    }
    Stream.prototype.emitStreamReadyEvent = function () {
        this.ee.emitEvent('stream-ready');
    };
    Stream.prototype.removeVideo = function (parentElement) {
        if (this.video) {
            if (typeof parentElement === "string") {
                document.getElementById(parentElement).removeChild(this.video);
            }
            else if (parentElement instanceof Element) {
                parentElement.removeChild(this.video);
            }
            else if (!parentElement) {
                if (document.getElementById(this.parentId)) {
                    document.getElementById(this.parentId).removeChild(this.video);
                }
            }
            delete this.video;
        }
    };
    Stream.prototype.getVideoElement = function () {
        return this.video;
    };
    Stream.prototype.setVideoElement = function (video) {
        this.video = video;
    };
    Stream.prototype.getParentId = function () {
        return this.parentId;
    };
    Stream.prototype.getRecvVideo = function () {
        return this.inboundOptions.recvVideo;
    };
    Stream.prototype.getRecvAudio = function () {
        return this.inboundOptions.recvAudio;
    };
    Stream.prototype.getSendVideo = function () {
        return this.outboundOptions.sendVideo;
    };
    Stream.prototype.getSendAudio = function () {
        return this.outboundOptions.sendAudio;
    };
    Stream.prototype.subscribeToMyRemote = function () {
        this.showMyRemote = true;
    };
    Stream.prototype.displayMyRemote = function () {
        return this.showMyRemote;
    };
    Stream.prototype.mirrorLocalStream = function (wr) {
        this.showMyRemote = true;
        this.localMirrored = true;
        if (wr) {
            this.mediaStream = wr;
            this.ee.emitEvent('mediastream-updated');
        }
    };
    Stream.prototype.isLocalMirrored = function () {
        return this.localMirrored;
    };
    Stream.prototype.getChannelName = function () {
        return this.streamId + '_' + this.chanId++;
    };
    Stream.prototype.isDataChannelEnabled = function () {
        return this.outboundOptions.dataChannel;
    };
    Stream.prototype.isDataChannelOpened = function () {
        return this.dataChannelOpened;
    };
    Stream.prototype.onDataChannelOpen = function (event) {
        console.debug('Data channel is opened');
        this.dataChannelOpened = true;
    };
    Stream.prototype.onDataChannelClosed = function (event) {
        console.debug('Data channel is closed');
        this.dataChannelOpened = false;
    };
    Stream.prototype.sendData = function (data) {
        if (this.wp === undefined) {
            throw new Error('WebRTC peer has not been created yet');
        }
        if (!this.dataChannelOpened) {
            throw new Error('Data channel is not opened');
        }
        console.info("Sending through data channel: " + data);
        this.wp.send(data);
    };
    Stream.prototype.getMediaStream = function () {
        return this.mediaStream;
    };
    Stream.prototype.getWebRtcPeer = function () {
        return this.wp;
    };
    Stream.prototype.addEventListener = function (eventName, listener) {
        this.ee.addListener(eventName, listener);
    };
    Stream.prototype.addOnceEventListener = function (eventName, listener) {
        this.ee.addOnceListener(eventName, listener);
    };
    Stream.prototype.removeListener = function (eventName) {
        this.ee.removeAllListeners(eventName);
    };
    Stream.prototype.showSpinner = function (spinnerParentId) {
        var progress = document.createElement('div');
        progress.id = 'progress-' + this.streamId;
        progress.style.background = "center transparent url('img/spinner.gif') no-repeat";
        var spinnerParent = document.getElementById(spinnerParentId);
        if (spinnerParent) {
            spinnerParent.appendChild(progress);
        }
    };
    Stream.prototype.hideSpinner = function (spinnerId) {
        spinnerId = (spinnerId === undefined) ? this.streamId : spinnerId;
        hide('progress-' + spinnerId);
    };
    Stream.prototype.playOnlyVideo = function (parentElement, thumbnailId) {
        var _this = this;
        this.video = document.createElement('video');
        this.video.id = (this.local ? 'local-' : 'remote-') + 'video-' + this.streamId;
        this.video.autoplay = true;
        this.video.controls = false;
        this.ee.emitEvent('mediastream-updated');
        if (this.local && !this.displayMyRemote()) {
            this.video.muted = true;
            this.video.oncanplay = function () {
                console.info("Local 'Stream' with id [" + _this.streamId + "] video is now playing");
                _this.ee.emitEvent('video-is-playing', [{
                        element: _this.video
                    }]);
            };
        }
        else {
            this.video.title = this.streamId;
        }
        if (typeof parentElement === "string") {
            this.parentId = parentElement;
            var parentElementDom = document.getElementById(parentElement);
            if (parentElementDom) {
                this.video = parentElementDom.appendChild(this.video);
                this.ee.emitEvent('video-element-created-by-stream', [{
                        element: this.video
                    }]);
                this.isVideoELementCreated = true;
            }
        }
        else {
            this.parentId = parentElement.id;
            this.video = parentElement.appendChild(this.video);
        }
        this.isReadyToPublish = true;
        return this.video;
    };
    Stream.prototype.playThumbnail = function (thumbnailId) {
        var container = document.createElement('div');
        container.className = "participant";
        container.id = this.streamId;
        var thumbnail = document.getElementById(thumbnailId);
        if (thumbnail) {
            thumbnail.appendChild(container);
        }
        var name = document.createElement('div');
        container.appendChild(name);
        var userName = this.streamId.replace('_webcam', '');
        if (userName.length >= 16) {
            userName = userName.substring(0, 16) + "...";
        }
        name.appendChild(document.createTextNode(userName));
        name.id = "name-" + this.streamId;
        name.className = "name";
        name.title = this.streamId;
        this.showSpinner(thumbnailId);
        return this.playOnlyVideo(container, thumbnailId);
    };
    Stream.prototype.getParticipant = function () {
        return this.connection;
    };
    Stream.prototype.getRTCPeerConnection = function () {
        return this.getWebRtcPeer().peerConnection;
    };
    Stream.prototype.requestCameraAccess = function (callback) {
        var _this = this;
        this.connection.addStream(this);
        var constraints = this.outboundOptions.mediaConstraints;
        /*let constraints2 = {
            audio: true,
            video: {
                width: {
                    ideal: 1280
                },
                frameRate: {
                    ideal: 15
                }
            }
        };*/
        this.userMediaHasVideo(function (hasVideo) {
            if (!hasVideo) {
                if (_this.outboundOptions.sendVideo) {
                    callback(new OpenViduError_1.OpenViduError("NO_VIDEO_DEVICE" /* NO_VIDEO_DEVICE */, 'You have requested camera access but there is no video input device available. Trying to connect with an audio input device only'), _this);
                }
                if (!_this.outboundOptions.sendAudio) {
                    callback(new OpenViduError_1.OpenViduError("NO_INPUT_DEVICE" /* NO_INPUT_DEVICE */, 'You must init Publisher object with audio or video streams enabled'), undefined);
                }
                else {
                    constraints.video = false;
                    _this.outboundOptions.sendVideo = false;
                    _this.requestCameraAccesAux(constraints, callback);
                }
            }
            else {
                _this.requestCameraAccesAux(constraints, callback);
            }
        });
    };
    Stream.prototype.requestCameraAccesAux = function (constraints, callback) {
        var _this = this;
        console.log(constraints);
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (userStream) {
            _this.cameraAccessSuccess(userStream, callback);
        })["catch"](function (error) {
            _this.accessIsDenied = true;
            _this.accessIsAllowed = false;
            var errorName;
            var errorMessage = error.toString();
            ;
            if (!_this.isScreenRequested) {
                errorName = _this.outboundOptions.sendVideo ? "CAMERA_ACCESS_DENIED" /* CAMERA_ACCESS_DENIED */ : "MICROPHONE_ACCESS_DENIED" /* MICROPHONE_ACCESS_DENIED */;
            }
            else {
                errorName = "SCREEN_CAPTURE_DENIED" /* SCREEN_CAPTURE_DENIED */; // This code is only reachable for Firefox
            }
            callback(new OpenViduError_1.OpenViduError(errorName, errorMessage), undefined);
        });
    };
    Stream.prototype.cameraAccessSuccess = function (userStream, callback) {
        this.accessIsAllowed = true;
        this.accessIsDenied = false;
        this.ee.emitEvent('access-allowed-by-publisher');
        if (userStream.getAudioTracks()[0] != null) {
            userStream.getAudioTracks()[0].enabled = this.outboundOptions.activeAudio;
        }
        if (userStream.getVideoTracks()[0] != null) {
            userStream.getVideoTracks()[0].enabled = this.outboundOptions.activeVideo;
        }
        this.mediaStream = userStream;
        this.ee.emitEvent('mediastream-updated');
        callback(undefined, this);
    };
    Stream.prototype.userMediaHasVideo = function (callback) {
        // If the user is going to publish its screen there's a video source
        if (this.isScreenRequested) {
            callback(true);
            return;
        }
        else {
            // List all input devices and serach for a video kind
            navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
                var videoInput = mediaDevices.filter(function (deviceInfo) {
                    return deviceInfo.kind === 'videoinput';
                })[0];
                callback(videoInput != null);
            });
        }
    };
    Stream.prototype.publishVideoCallback = function (error, sdpOfferParam, wp) {
        var _this = this;
        if (error) {
            return console.error("(publish) SDP offer error: "
                + JSON.stringify(error));
        }
        console.debug("Sending SDP offer to publish as "
            + this.streamId, sdpOfferParam);
        this.openVidu.sendRequest("publishVideo", {
            sdpOffer: sdpOfferParam,
            doLoopback: this.displayMyRemote() || false,
            audioActive: this.outboundOptions.sendAudio,
            videoActive: this.outboundOptions.sendVideo,
            typeOfVideo: ((this.outboundOptions.sendVideo) ? ((this.isScreenRequested) ? 'SCREEN' : 'CAMERA') : '')
        }, function (error, response) {
            if (error) {
                console.error("Error on publishVideo: " + JSON.stringify(error));
            }
            else {
                _this.processSdpAnswer(response.sdpAnswer);
                console.info("'Publisher' succesfully published to session");
            }
        });
    };
    Stream.prototype.startVideoCallback = function (error, sdpOfferParam, wp) {
        var _this = this;
        if (error) {
            return console.error("(subscribe) SDP offer error: "
                + JSON.stringify(error));
        }
        console.debug("Sending SDP offer to subscribe to "
            + this.streamId, sdpOfferParam);
        this.openVidu.sendRequest("receiveVideoFrom", {
            sender: this.streamId,
            sdpOffer: sdpOfferParam
        }, function (error, response) {
            if (error) {
                console.error("Error on recvVideoFrom: " + JSON.stringify(error));
            }
            else {
                _this.processSdpAnswer(response.sdpAnswer);
            }
        });
    };
    Stream.prototype.initWebRtcPeer = function (sdpOfferCallback) {
        var _this = this;
        if (this.local) {
            var userMediaConstraints = {
                audio: this.outboundOptions.sendAudio,
                video: this.outboundOptions.sendVideo
            };
            var options = {
                videoStream: this.mediaStream,
                mediaConstraints: userMediaConstraints,
                onicecandidate: this.connection.sendIceCandidate.bind(this.connection)
            };
            if (this.outboundOptions.dataChannel) {
                options.dataChannelConfig = {
                    id: this.getChannelName(),
                    onopen: this.onDataChannelOpen,
                    onclose: this.onDataChannelClosed
                };
                options.dataChannels = true;
            }
            if (this.displayMyRemote()) {
                this.wp = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
                    if (error) {
                        return console.error(error);
                    }
                    _this.wp.generateOffer(sdpOfferCallback.bind(_this));
                });
            }
            else {
                this.wp = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                    if (error) {
                        return console.error(error);
                    }
                    _this.wp.generateOffer(sdpOfferCallback.bind(_this));
                });
            }
            this.isPublisherPublished = true;
            this.ee.emitEvent('stream-created-by-publisher');
        }
        else {
            var offerConstraints = {
                audio: this.inboundOptions.recvAudio,
                video: this.inboundOptions.recvVideo
            };
            console.debug("'Session.subscribe(Stream)' called. Constraints of generate SDP offer", offerConstraints);
            var options = {
                onicecandidate: this.connection.sendIceCandidate.bind(this.connection),
                mediaConstraints: offerConstraints
            };
            this.wp = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                if (error) {
                    return console.error(error);
                }
                _this.wp.generateOffer(sdpOfferCallback.bind(_this));
            });
        }
        console.debug("Waiting for SDP offer to be generated ("
            + (this.local ? "local" : "remote") + " 'Stream': " + this.streamId + ")");
    };
    Stream.prototype.publish = function () {
        var _this = this;
        // FIXME: Throw error when stream is not local
        if (this.isReadyToPublish) {
            this.initWebRtcPeer(this.publishVideoCallback);
        }
        else {
            this.ee.once('stream-ready', function (streamEvent) {
                _this.publish();
            });
        }
        // FIXME: Now we have coupled connecting to a room and adding a
        // stream to this room. But in the new API, there are two steps.
        // This is the second step. For now, it do nothing.
    };
    Stream.prototype.subscribe = function () {
        // FIXME: In the current implementation all participants are subscribed
        // automatically to all other participants. We use this method only to
        // negotiate SDP
        this.initWebRtcPeer(this.startVideoCallback);
    };
    Stream.prototype.processSdpAnswer = function (sdpAnswer) {
        var _this = this;
        var answer = new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer
        });
        console.debug(this.streamId + ": set peer connection with recvd SDP answer", sdpAnswer);
        var participantId = this.streamId;
        var pc = this.wp.peerConnection;
        pc.setRemoteDescription(answer, function () {
            // Avoids to subscribe to your own stream remotely 
            // except when showMyRemote is true
            if (!_this.local || _this.displayMyRemote()) {
                _this.mediaStream = pc.getRemoteStreams()[0];
                console.debug("Peer remote stream", _this.mediaStream);
                if (_this.mediaStream != undefined) {
                    _this.ee.emitEvent('mediastream-updated');
                    if (_this.mediaStream.getAudioTracks()[0] != null) {
                        _this.speechEvent = kurentoUtils.WebRtcPeer.hark(_this.mediaStream, { threshold: _this.room.thresholdSpeaker });
                        _this.speechEvent.on('speaking', function () {
                            //this.room.addParticipantSpeaking(participantId);
                            _this.room.emitEvent('publisherStartSpeaking', [{
                                    connection: _this.connection,
                                    streamId: _this.streamId
                                }]);
                        });
                        _this.speechEvent.on('stopped_speaking', function () {
                            //this.room.removeParticipantSpeaking(participantId);
                            _this.room.emitEvent('publisherStopSpeaking', [{
                                    connection: _this.connection,
                                    streamId: _this.streamId
                                }]);
                        });
                    }
                }
                // let thumbnailId = this.video.thumb;
                _this.video.oncanplay = function () {
                    if (_this.local && _this.displayMyRemote()) {
                        console.info("Your own remote 'Stream' with id [" + _this.streamId + "] video is now playing");
                        _this.ee.emitEvent('remote-video-is-playing', [{
                                element: _this.video
                            }]);
                    }
                    else if (!_this.local && !_this.displayMyRemote()) {
                        console.info("Remote 'Stream' with id [" + _this.streamId + "] video is now playing");
                        _this.ee.emitEvent('video-is-playing', [{
                                element: _this.video
                            }]);
                    }
                    //show(thumbnailId);
                    //this.hideSpinner(this.streamId);
                };
                _this.room.emitEvent('stream-subscribed', [{
                        stream: _this
                    }]);
            }
        }, function (error) {
            console.error(_this.streamId + ": Error setting SDP to the peer connection: "
                + JSON.stringify(error));
        });
    };
    Stream.prototype.unpublish = function () {
        if (this.wp) {
            this.wp.dispose();
        }
        else {
            if (this.mediaStream) {
                this.mediaStream.getAudioTracks().forEach(function (track) {
                    track.stop && track.stop();
                });
                this.mediaStream.getVideoTracks().forEach(function (track) {
                    track.stop && track.stop();
                });
            }
        }
        if (this.speechEvent) {
            this.speechEvent.stop();
        }
        console.info(this.streamId + ": Stream '" + this.streamId + "' unpublished");
    };
    Stream.prototype.dispose = function () {
        function disposeElement(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        disposeElement("progress-" + this.streamId);
        if (this.wp) {
            this.wp.dispose();
        }
        else {
            if (this.mediaStream) {
                this.mediaStream.getAudioTracks().forEach(function (track) {
                    track.stop && track.stop();
                });
                this.mediaStream.getVideoTracks().forEach(function (track) {
                    track.stop && track.stop();
                });
            }
        }
        if (this.speechEvent) {
            this.speechEvent.stop();
        }
        console.info((this.local ? "Local " : "Remote ") + "'Stream' with id [" + this.streamId + "]' has been succesfully disposed");
    };
    Stream.prototype.configureScreenOptions = function (options) {
        this.outboundOptions = options;
        this.streamId = "SCREEN";
    };
    return Stream;
}());
exports.Stream = Stream;
//# sourceMappingURL=Stream.js.map