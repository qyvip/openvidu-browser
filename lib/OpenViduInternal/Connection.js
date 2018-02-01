"use strict";
exports.__esModule = true;
var Stream_1 = require("./Stream");
var Connection = /** @class */ (function () {
    function Connection(openVidu, local, room, options) {
        this.openVidu = openVidu;
        this.local = local;
        this.room = room;
        this.options = options;
        this.streams = {};
        console.info("'Connection' created (" + (local ? "local" : "remote") + ")" + (local ? "" : ", with 'connectionId' [" + (options ? options.id : '') + "] "));
        if (options) {
            this.connectionId = options.id;
            if (options.metadata) {
                this.data = options.metadata;
            }
            if (options.streams) {
                this.initRemoteStreams(options);
            }
        }
    }
    Connection.prototype.addStream = function (stream) {
        this.streams[stream.streamId] = stream;
        this.room.getStreams()[stream.streamId] = stream;
    };
    Connection.prototype.removeStream = function (key) {
        delete this.streams[key];
        delete this.room.getStreams()[key];
        delete this.inboundStreamsOpts;
    };
    Connection.prototype.setOptions = function (options) {
        this.options = options;
    };
    Connection.prototype.getStreams = function () {
        return this.streams;
    };
    Connection.prototype.dispose = function () {
        for (var key in this.streams) {
            this.streams[key].dispose();
        }
    };
    Connection.prototype.sendIceCandidate = function (candidate) {
        console.debug((this.local ? "Local" : "Remote"), "candidate for", this.connectionId, JSON.stringify(candidate));
        this.openVidu.sendRequest("onIceCandidate", {
            endpointName: this.connectionId,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        }, function (error, response) {
            if (error) {
                console.error("Error sending ICE candidate: "
                    + JSON.stringify(error));
            }
        });
    };
    Connection.prototype.initRemoteStreams = function (options) {
        var opts;
        for (var _i = 0, _a = options.streams; _i < _a.length; _i++) {
            opts = _a[_i];
            var streamOptions = {
                id: opts.id,
                connection: this,
                recvAudio: (opts.audioActive == null ? true : opts.audioActive),
                recvVideo: (opts.videoActive == null ? true : opts.videoActive),
                typeOfVideo: opts.typeOfVideo
            };
            var stream = new Stream_1.Stream(this.openVidu, false, this.room, streamOptions);
            this.addStream(stream);
            this.inboundStreamsOpts = streamOptions;
        }
        console.info("Remote 'Connection' with 'connectionId' [" + this.connectionId + "] is now configured for receiving Streams with options: ", this.inboundStreamsOpts);
    };
    return Connection;
}());
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map