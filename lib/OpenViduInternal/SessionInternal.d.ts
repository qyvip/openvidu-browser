import { Stream } from './Stream';
import { OpenViduInternal } from './OpenViduInternal';
import { Connection, ConnectionOptions } from './Connection';
import { Publisher } from '../OpenVidu/Publisher';
export interface SessionOptions {
    sessionId: string;
    participantId: string;
    metadata: string;
    subscribeToStreams?: boolean;
    updateSpeakerInterval?: number;
    thresholdSpeaker?: number;
}
export interface SignalOptions {
    type?: string;
    to?: Connection[];
    data?: string;
}
export declare class SessionInternal {
    private openVidu;
    private id;
    private sessionId;
    private ee;
    private streams;
    private participants;
    private publishersSpeaking;
    private connected;
    localParticipant: Connection;
    private subscribeToStreams;
    private updateSpeakerInterval;
    thresholdSpeaker: number;
    private options;
    constructor(openVidu: OpenViduInternal, sessionId: string);
    private processOpenViduUrl(url);
    private getSecretFromUrl(url);
    private getRecorderFromUrl(url);
    private getUrlWithoutSecret(url);
    private getFinalUrl(url);
    connect(token: any, callback: any): void;
    configure(options: SessionOptions): void;
    getId(): string;
    getSessionId(): string;
    private activateUpdateMainSpeaker();
    getLocalParticipant(): Connection;
    addEventListener(eventName: any, listener: any): void;
    addOnceEventListener(eventName: any, listener: any): void;
    removeListener(eventName: any, listener: any): void;
    removeEvent(eventName: any): void;
    emitEvent(eventName: any, eventsArray: any): void;
    subscribe(stream: Stream): void;
    unsubscribe(stream: Stream): void;
    onParticipantPublished(response: ConnectionOptions): void;
    onParticipantUnpublished(msg: any): void;
    onParticipantJoined(response: ConnectionOptions): void;
    onParticipantLeft(msg: any): void;
    onParticipantEvicted(msg: any): void;
    onNewMessage(msg: any): void;
    recvIceCandidate(msg: any): void;
    onRoomClosed(msg: any): void;
    onLostConnection(): void;
    onMediaError(params: any): void;
    leave(forced: any, jsonRpcClient: any): void;
    disconnect(stream: Stream): void;
    unpublish(publisher: Publisher): void;
    getStreams(): {};
    addParticipantSpeaking(participantId: any): void;
    removeParticipantSpeaking(participantId: any): void;
    stringClientMetadata(metadata: any): string;
    private randomToken();
}
