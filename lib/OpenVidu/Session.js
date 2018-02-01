"use strict";
exports.__esModule = true;
var Subscriber_1 = require("./Subscriber");
var EventEmitter = require("wolfy87-eventemitter");
var Session = /** @class */ (function () {
    function Session(session, openVidu) {
        var _this = this;
        this.session = session;
        this.openVidu = openVidu;
        this.ee = new EventEmitter();
        this.sessionId = session.getSessionId();
        // Listens to the deactivation of the default behaviour upon the deletion of a Stream object
        this.session.addEventListener('stream-destroyed-default', function (event) {
            event.stream.removeVideo();
        });
        // Listens to the deactivation of the default behaviour upon the disconnection of a Session
        this.session.addEventListener('session-disconnected-default', function () {
            var s;
            for (var _i = 0, _a = _this.openVidu.openVidu.getRemoteStreams(); _i < _a.length; _i++) {
                s = _a[_i];
                s.removeVideo();
            }
            if (_this.connection) {
                for (var streamId in _this.connection.getStreams()) {
                    _this.connection.getStreams()[streamId].removeVideo();
                }
            }
        });
        // Sets or updates the value of 'connection' property. Triggered by SessionInternal when succesful connection
        this.session.addEventListener('update-connection-object', function (event) {
            _this.connection = event.connection;
        });
    }
    Session.prototype.connect = function (param1, param2, param3) {
        // Early configuration to deactivate automatic subscription to streams
        if (param3) {
            this.session.configure({
                sessionId: this.session.getSessionId(),
                participantId: param1,
                metadata: this.session.stringClientMetadata(param2),
                subscribeToStreams: false
            });
            this.session.connect(param1, param3);
        }
        else {
            this.session.configure({
                sessionId: this.session.getSessionId(),
                participantId: param1,
                metadata: '',
                subscribeToStreams: false
            });
            this.session.connect(param1, param2);
        }
    };
    Session.prototype.disconnect = function () {
        var _this = this;
        this.openVidu.openVidu.close(false);
        this.session.emitEvent('sessionDisconnected', [{
                preventDefault: function () { _this.session.removeEvent('session-disconnected-default'); }
            }]);
        this.session.emitEvent('session-disconnected-default', [{}]);
    };
    Session.prototype.publish = function (publisher) {
        var _this = this;
        if (!publisher.stream.isPublisherPublished) {
            if (publisher.isScreenRequested) {
                if (!publisher.stream.isScreenRequestedReady) {
                    publisher.stream.addOnceEventListener('screen-ready', function () {
                        _this.streamPublish(publisher);
                    });
                }
                else {
                    this.streamPublish(publisher);
                }
            }
            else {
                this.streamPublish(publisher);
            }
        }
        else {
            publisher = this.openVidu.reinitPublisher(publisher);
            if (publisher.isScreenRequested && !publisher.stream.isScreenRequestedReady) {
                publisher.stream.addOnceEventListener('screen-ready', function () {
                    _this.streamPublish(publisher);
                });
            }
            else {
                this.streamPublish(publisher);
            }
        }
    };
    Session.prototype.streamPublish = function (publisher) {
        publisher.session = this;
        publisher.stream.publish();
    };
    Session.prototype.unpublish = function (publisher) {
        this.session.unpublish(publisher);
    };
    Session.prototype.on = function (eventName, callback) {
        this.session.addEventListener(eventName, function (event) {
            if (event) {
                console.info("Event '" + eventName + "' triggered by 'Session'", event);
            }
            else {
                console.info("Event '" + eventName + "' triggered by 'Session'");
            }
            callback(event);
        });
    };
    Session.prototype.once = function (eventName, callback) {
        this.session.addOnceEventListener(eventName, function (event) {
            callback(event);
        });
    };
    Session.prototype.off = function (eventName, eventHandler) {
        this.session.removeListener(eventName, eventHandler);
    };
    Session.prototype.subscribe = function (param1, param2, param3) {
        // Subscription
        this.session.subscribe(param1);
        var subscriber = new Subscriber_1.Subscriber(param1, param2);
        param1.playOnlyVideo(param2, null);
        return subscriber;
    };
    Session.prototype.unsubscribe = function (subscriber) {
        this.session.unsubscribe(subscriber.stream);
        subscriber.stream.removeVideo();
    };
    Session.prototype.signal = function (signal, completionHandler) {
        var signalMessage = {};
        if (signal.to && signal.to.length > 0) {
            var connectionIds = [];
            for (var i = 0; i < signal.to.length; i++) {
                connectionIds.push(signal.to[i].connectionId);
            }
            signalMessage['to'] = connectionIds;
        }
        else {
            signalMessage['to'] = [];
        }
        signalMessage['data'] = signal.data ? signal.data : '';
        signalMessage['type'] = signal.type ? signal.type : '';
        this.openVidu.openVidu.sendMessage(JSON.stringify(signalMessage));
    };
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=Session.js.map