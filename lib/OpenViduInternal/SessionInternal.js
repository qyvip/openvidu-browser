"use strict";
exports.__esModule = true;
var Connection_1 = require("./Connection");
var EventEmitter = require("wolfy87-eventemitter");
var SECRET_PARAM = '?secret=';
var RECORDER_PARAM = '&recorder=';
var SessionInternal = /** @class */ (function () {
    function SessionInternal(openVidu, sessionId) {
        this.openVidu = openVidu;
        this.ee = new EventEmitter();
        this.streams = {};
        this.participants = {};
        this.publishersSpeaking = [];
        this.connected = false;
        this.sessionId = this.getUrlWithoutSecret(sessionId);
        this.localParticipant = new Connection_1.Connection(this.openVidu, true, this);
        if (!this.openVidu.getWsUri()) {
            this.processOpenViduUrl(sessionId);
        }
    }
    SessionInternal.prototype.processOpenViduUrl = function (url) {
        var secret = this.getSecretFromUrl(url);
        var recorder = this.getRecorderFromUrl(url);
        if (!(secret == null)) {
            this.openVidu.setSecret(secret);
        }
        if (!(recorder == null)) {
            this.openVidu.setRecorder(recorder);
        }
        this.openVidu.setWsUri(this.getFinalUrl(url));
    };
    SessionInternal.prototype.getSecretFromUrl = function (url) {
        var secret = '';
        if (url.indexOf(SECRET_PARAM) !== -1) {
            var endOfSecret = url.lastIndexOf(RECORDER_PARAM);
            if (endOfSecret !== -1) {
                secret = url.substring(url.lastIndexOf(SECRET_PARAM) + SECRET_PARAM.length, endOfSecret);
            }
            else {
                secret = url.substring(url.lastIndexOf(SECRET_PARAM) + SECRET_PARAM.length, url.length);
            }
        }
        return secret;
    };
    SessionInternal.prototype.getRecorderFromUrl = function (url) {
        var recorder = '';
        if (url.indexOf(RECORDER_PARAM) !== -1) {
            recorder = url.substring(url.lastIndexOf(RECORDER_PARAM) + RECORDER_PARAM.length, url.length);
        }
        return new Boolean(recorder).valueOf();
        ;
    };
    SessionInternal.prototype.getUrlWithoutSecret = function (url) {
        if (!url) {
            console.error('sessionId is not defined');
        }
        if (url.indexOf(SECRET_PARAM) !== -1) {
            url = url.substring(0, url.lastIndexOf(SECRET_PARAM));
        }
        return url;
    };
    SessionInternal.prototype.getFinalUrl = function (url) {
        url = this.getUrlWithoutSecret(url).substring(0, url.lastIndexOf('/')) + '/room';
        if (url.indexOf(".ngrok.io") !== -1) {
            // OpenVidu server URL referes to a ngrok IP: secure wss protocol and delete port of URL
            url = url.replace("ws://", "wss://");
            var regex = /\.ngrok\.io:\d+/;
            url = url.replace(regex, ".ngrok.io");
        }
        else if ((url.indexOf("localhost") !== -1) || (url.indexOf("127.0.0.1") != -1)) {
            // OpenVidu server URL referes to localhost IP
        }
        return url;
    };
    /* NEW METHODS */
    SessionInternal.prototype.connect = function (token, callback) {
        var _this = this;
        this.openVidu.connect(function (error) {
            if (error) {
                callback('ERROR CONNECTING TO OPENVIDU');
            }
            else {
                if (!token) {
                    token = _this.randomToken();
                }
                var joinParams = {
                    token: token,
                    session: _this.sessionId,
                    metadata: _this.options.metadata,
                    secret: _this.openVidu.getSecret(),
                    recorder: _this.openVidu.getRecorder(),
                    dataChannels: false
                };
                if (_this.localParticipant) {
                    if (Object.keys(_this.localParticipant.getStreams()).some(function (streamId) {
                        return _this.streams[streamId].isDataChannelEnabled();
                    })) {
                        joinParams.dataChannels = true;
                    }
                }
                _this.openVidu.sendRequest('joinRoom', joinParams, function (error, response) {
                    if (error) {
                        callback(error);
                    }
                    else {
                        _this.connected = true;
                        var exParticipants = response.value;
                        // IMPORTANT: Update connectionId with value send by server
                        _this.localParticipant.connectionId = response.id;
                        _this.participants[response.id] = _this.localParticipant;
                        var roomEvent = {
                            participants: new Array(),
                            streams: new Array()
                        };
                        var length_1 = exParticipants.length;
                        for (var i = 0; i < length_1; i++) {
                            var connection = new Connection_1.Connection(_this.openVidu, false, _this, exParticipants[i]);
                            connection.creationTime = new Date().getTime();
                            _this.participants[connection.connectionId] = connection;
                            roomEvent.participants.push(connection);
                            var streams = connection.getStreams();
                            for (var key in streams) {
                                roomEvent.streams.push(streams[key]);
                                if (_this.subscribeToStreams) {
                                    streams[key].subscribe();
                                }
                            }
                        }
                        // Update local Connection object properties with values returned by server
                        _this.localParticipant.data = response.metadata;
                        _this.localParticipant.creationTime = new Date().getTime();
                        // Updates the value of property 'connection' in Session object
                        _this.ee.emitEvent('update-connection-object', [{ connection: _this.localParticipant }]);
                        // Own connection created event
                        _this.ee.emitEvent('connectionCreated', [{ connection: _this.localParticipant }]);
                        // One connection created event for each existing connection in the session
                        for (var _i = 0, _a = roomEvent.participants; _i < _a.length; _i++) {
                            var part = _a[_i];
                            _this.ee.emitEvent('connectionCreated', [{ connection: part }]);
                        }
                        //if (this.subscribeToStreams) {
                        for (var _b = 0, _c = roomEvent.streams; _b < _c.length; _b++) {
                            var stream = _c[_b];
                            _this.ee.emitEvent('streamCreated', [{ stream: stream }]);
                            // Adding the remote stream to the OpenVidu object
                            _this.openVidu.getRemoteStreams().push(stream);
                        }
                        callback(undefined);
                    }
                });
            }
        });
    };
    /* NEW METHODS */
    SessionInternal.prototype.configure = function (options) {
        this.options = options;
        this.id = options.sessionId;
        this.subscribeToStreams = options.subscribeToStreams == null ? true : options.subscribeToStreams;
        this.updateSpeakerInterval = options.updateSpeakerInterval || 1500;
        this.thresholdSpeaker = options.thresholdSpeaker || -50;
        this.activateUpdateMainSpeaker();
    };
    SessionInternal.prototype.getId = function () {
        return this.id;
    };
    SessionInternal.prototype.getSessionId = function () {
        return this.sessionId;
    };
    SessionInternal.prototype.activateUpdateMainSpeaker = function () {
        /*setInterval(() => {
            if (this.publishersSpeaking.length > 0) {
                this.ee.emitEvent('publisherStartSpeaking', [{
                    participantId: this.publishersSpeaking[this.publishersSpeaking.length - 1]
                }]);
            }
        }, this.updateSpeakerInterval);*/
    };
    SessionInternal.prototype.getLocalParticipant = function () {
        return this.localParticipant;
    };
    SessionInternal.prototype.addEventListener = function (eventName, listener) {
        this.ee.on(eventName, listener);
    };
    SessionInternal.prototype.addOnceEventListener = function (eventName, listener) {
        this.ee.once(eventName, listener);
    };
    SessionInternal.prototype.removeListener = function (eventName, listener) {
        this.ee.off(eventName, listener);
    };
    SessionInternal.prototype.removeEvent = function (eventName) {
        this.ee.removeEvent(eventName);
    };
    SessionInternal.prototype.emitEvent = function (eventName, eventsArray) {
        this.ee.emitEvent(eventName, eventsArray);
    };
    SessionInternal.prototype.subscribe = function (stream) {
        stream.subscribe();
    };
    SessionInternal.prototype.unsubscribe = function (stream) {
        console.info("Unsubscribing from " + stream.connection.connectionId);
        this.openVidu.sendRequest('unsubscribeFromVideo', {
            sender: stream.connection.connectionId
        }, function (error, response) {
            if (error) {
                console.error("Error unsubscribing from Subscriber", error);
            }
            else {
                console.info("Unsubscribed correctly from " + stream.connection.connectionId);
            }
            stream.dispose();
        });
    };
    SessionInternal.prototype.onParticipantPublished = function (response) {
        // Get the existing Connection created on 'onParticipantJoined' for
        // existing participants or create a new one for new participants
        var connection = this.participants[response.id];
        if (connection != null) {
            // Update existing Connection
            response.metadata = connection.data;
            connection.setOptions(response);
            connection.initRemoteStreams(response);
        }
        else {
            // Create new Connection
            connection = new Connection_1.Connection(this.openVidu, false, this, response);
        }
        var pid = connection.connectionId;
        if (!(pid in this.participants)) {
            console.debug("Remote Connection not found in connections list by its id [" + pid + "]");
        }
        else {
            console.debug("Remote Connection found in connections list by its id [" + pid + "]");
        }
        this.participants[pid] = connection;
        this.ee.emitEvent('participant-published', [{ connection: connection }]);
        var streams = connection.getStreams();
        for (var key in streams) {
            var stream = streams[key];
            if (this.subscribeToStreams) {
                stream.subscribe();
            }
            this.ee.emitEvent('streamCreated', [{ stream: stream }]);
            // Adding the remote stream to the OpenVidu object
            this.openVidu.getRemoteStreams().push(stream);
        }
    };
    SessionInternal.prototype.onParticipantUnpublished = function (msg) {
        var _this = this;
        var connection = this.participants[msg.name];
        if (connection !== undefined) {
            var streams = connection.getStreams();
            for (var key in streams) {
                this.ee.emitEvent('streamDestroyed', [{
                        stream: streams[key],
                        preventDefault: function () { _this.ee.removeEvent('stream-destroyed-default'); }
                    }]);
                this.ee.emitEvent('stream-destroyed-default', [{
                        stream: streams[key]
                    }]);
                // Deleting the removed stream from the OpenVidu object
                var index = this.openVidu.getRemoteStreams().indexOf(streams[key]);
                var stream = this.openVidu.getRemoteStreams()[index];
                stream.dispose();
                this.openVidu.getRemoteStreams().splice(index, 1);
                delete this.streams[stream.streamId];
                connection.removeStream(stream.streamId);
            }
        }
        else {
            console.warn("Participant " + msg.name
                + " unknown. Participants: "
                + JSON.stringify(this.participants));
        }
    };
    SessionInternal.prototype.onParticipantJoined = function (response) {
        var connection = new Connection_1.Connection(this.openVidu, false, this, response);
        connection.creationTime = new Date().getTime();
        var pid = connection.connectionId;
        if (!(pid in this.participants)) {
            this.participants[pid] = connection;
        }
        else {
            //use existing so that we don't lose streams info
            console.warn("Connection already exists in connections list with " +
                "the same connectionId, old:", this.participants[pid], ", joined now:", connection);
            connection = this.participants[pid];
        }
        this.ee.emitEvent('participant-joined', [{
                connection: connection
            }]);
        this.ee.emitEvent('connectionCreated', [{
                connection: connection
            }]);
    };
    SessionInternal.prototype.onParticipantLeft = function (msg) {
        var _this = this;
        var connection = this.participants[msg.name];
        if (connection !== undefined) {
            delete this.participants[msg.name];
            this.ee.emitEvent('participant-left', [{
                    connection: connection
                }]);
            var streams = connection.getStreams();
            for (var key in streams) {
                this.ee.emitEvent('streamDestroyed', [{
                        stream: streams[key],
                        preventDefault: function () { _this.ee.removeEvent('stream-destroyed-default'); }
                    }]);
                this.ee.emitEvent('stream-destroyed-default', [{
                        stream: streams[key]
                    }]);
                // Deleting the removed stream from the OpenVidu object
                var index = this.openVidu.getRemoteStreams().indexOf(streams[key]);
                this.openVidu.getRemoteStreams().splice(index, 1);
            }
            connection.dispose();
            this.ee.emitEvent('connectionDestroyed', [{
                    connection: connection
                }]);
        }
        else {
            console.warn("Participant " + msg.name
                + " unknown. Participants: "
                + JSON.stringify(this.participants));
        }
    };
    ;
    SessionInternal.prototype.onParticipantEvicted = function (msg) {
        this.ee.emitEvent('participant-evicted', [{
                localParticipant: this.localParticipant
            }]);
    };
    ;
    SessionInternal.prototype.onNewMessage = function (msg) {
        console.info("New signal: " + JSON.stringify(msg));
        this.ee.emitEvent('signal', [{
                data: msg.data,
                from: this.participants[msg.from],
                type: msg.type
            }]);
        this.ee.emitEvent('signal:' + msg.type, [{
                data: msg.data,
                from: this.participants[msg.from],
                type: msg.type
            }]);
    };
    SessionInternal.prototype.recvIceCandidate = function (msg) {
        var candidate = {
            candidate: msg.candidate,
            sdpMid: msg.sdpMid,
            sdpMLineIndex: msg.sdpMLineIndex
        };
        var connection = this.participants[msg.endpointName];
        if (!connection) {
            console.error("Participant not found for endpoint " +
                msg.endpointName + ". Ice candidate will be ignored.", candidate);
            return;
        }
        var streams = connection.getStreams();
        var _loop_1 = function (key) {
            var stream = streams[key];
            stream.getWebRtcPeer().addIceCandidate(candidate, function (error) {
                if (error) {
                    console.error("Error adding candidate for " + key
                        + " stream of endpoint " + msg.endpointName
                        + ": " + error);
                }
            });
        };
        for (var key in streams) {
            _loop_1(key);
        }
    };
    SessionInternal.prototype.onRoomClosed = function (msg) {
        console.info("Room closed: " + JSON.stringify(msg));
        var room = msg.room;
        if (room !== undefined) {
            this.ee.emitEvent('room-closed', [{
                    room: room
                }]);
        }
        else {
            console.warn("Room undefined in on room closed", msg);
        }
    };
    SessionInternal.prototype.onLostConnection = function () {
        if (!this.connected) {
            console.warn('Not connected to room: if you are not debugging, this is probably a certificate error');
            if (window.confirm('If you are not debugging, this is probably a certificate error at \"' + this.openVidu.getOpenViduServerURL() + '\"\n\nClick OK to navigate and accept it')) {
                location.assign(this.openVidu.getOpenViduServerURL() + '/accept-certificate');
            }
            ;
            return;
        }
        console.warn('Lost connection in Session ' + this.id);
        var room = this.id;
        if (room !== undefined) {
            this.ee.emitEvent('lost-connection', [{ room: room }]);
        }
        else {
            console.warn('Room undefined when lost connection');
        }
    };
    SessionInternal.prototype.onMediaError = function (params) {
        console.error("Media error: " + JSON.stringify(params));
        var error = params.error;
        if (error) {
            this.ee.emitEvent('error-media', [{
                    error: error
                }]);
        }
        else {
            console.warn("Received undefined media error. Params:", params);
        }
    };
    /*
     * forced means the user was evicted, no need to send the 'leaveRoom' request
     */
    SessionInternal.prototype.leave = function (forced, jsonRpcClient) {
        forced = !!forced;
        console.info("Leaving Session (forced=" + forced + ")");
        if (this.connected && !forced) {
            this.openVidu.sendRequest('leaveRoom', function (error, response) {
                if (error) {
                    console.error(error);
                }
                jsonRpcClient.close();
            });
        }
        else {
            jsonRpcClient.close();
        }
        this.connected = false;
        if (this.participants) {
            for (var pid in this.participants) {
                this.participants[pid].dispose();
                delete this.participants[pid];
            }
        }
    };
    SessionInternal.prototype.disconnect = function (stream) {
        var connection = stream.getParticipant();
        if (!connection) {
            console.error("Stream to disconnect has no participant", stream);
            return;
        }
        delete this.participants[connection.connectionId];
        connection.dispose();
        if (connection === this.localParticipant) {
            console.info("Unpublishing my media (I'm " + connection.connectionId + ")");
            delete this.localParticipant;
            this.openVidu.sendRequest('unpublishVideo', function (error, response) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.info("Media unpublished correctly");
                }
            });
        }
        else {
            this.unsubscribe(stream);
        }
    };
    SessionInternal.prototype.unpublish = function (publisher) {
        var _this = this;
        var stream = publisher.stream;
        if (!stream.connection) {
            console.error("The associated Connection object of this Publisher is null", stream);
            return;
        }
        else if (stream.connection !== this.localParticipant) {
            console.error("The associated Connection object of this Publisher is not your local Connection." +
                "Only moderators can force unpublish on remote Streams via 'forceUnpublish' method", stream);
            return;
        }
        else {
            stream.dispose();
            console.info("Unpublishing local media (" + stream.connection.connectionId + ")");
            this.openVidu.sendRequest('unpublishVideo', function (error, response) {
                if (error) {
                    console.error(error);
                }
                else {
                    console.info("Media unpublished correctly");
                }
            });
            stream.isReadyToPublish = false;
            stream.isScreenRequestedReady = false;
            delete stream.connection.getStreams()[stream.streamId];
            publisher.ee.emitEvent('streamDestroyed', [{
                    stream: publisher.stream,
                    preventDefault: function () { _this.ee.removeEvent('stream-destroyed-default'); }
                }]);
            publisher.ee.emitEvent('stream-destroyed-default', [{
                    stream: publisher.stream
                }]);
        }
    };
    SessionInternal.prototype.getStreams = function () {
        return this.streams;
    };
    SessionInternal.prototype.addParticipantSpeaking = function (participantId) {
        this.publishersSpeaking.push(participantId);
        this.ee.emitEvent('publisherStartSpeaking', [{
                participantId: participantId
            }]);
    };
    SessionInternal.prototype.removeParticipantSpeaking = function (participantId) {
        var pos = -1;
        for (var i = 0; i < this.publishersSpeaking.length; i++) {
            if (this.publishersSpeaking[i] == participantId) {
                pos = i;
                break;
            }
        }
        if (pos != -1) {
            this.publishersSpeaking.splice(pos, 1);
            this.ee.emitEvent('publisherStopSpeaking', [{
                    participantId: participantId
                }]);
        }
    };
    SessionInternal.prototype.stringClientMetadata = function (metadata) {
        if (!(typeof metadata === 'string')) {
            return JSON.stringify(metadata);
        }
        else {
            return metadata;
        }
    };
    SessionInternal.prototype.randomToken = function () {
        return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    };
    return SessionInternal;
}());
exports.SessionInternal = SessionInternal;
//# sourceMappingURL=SessionInternal.js.map