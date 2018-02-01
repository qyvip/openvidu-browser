import { SessionInternal, SignalOptions } from '../OpenViduInternal/SessionInternal';
import { Stream } from '../OpenViduInternal/Stream';
import { Connection } from "../OpenViduInternal/Connection";
import { OpenVidu } from './OpenVidu';
import { Publisher } from './Publisher';
import { Subscriber } from './Subscriber';
export declare class Session {
    private session;
    private openVidu;
    sessionId: String;
    connection: Connection;
    private ee;
    constructor(session: SessionInternal, openVidu: OpenVidu);
    connect(token: string, callback: any): any;
    connect(token: string, metadata: any, callback: any): any;
    disconnect(): void;
    publish(publisher: Publisher): void;
    private streamPublish(publisher);
    unpublish(publisher: Publisher): void;
    on(eventName: string, callback: any): void;
    once(eventName: string, callback: any): void;
    off(eventName: string, eventHandler: any): void;
    subscribe(stream: Stream, htmlId: string, videoOptions: any): Subscriber;
    subscribe(stream: Stream, htmlId: string): Subscriber;
    unsubscribe(subscriber: Subscriber): void;
    signal(signal: SignalOptions, completionHandler?: Function): void;
}
