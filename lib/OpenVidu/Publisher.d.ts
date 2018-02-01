import { Stream } from '../OpenViduInternal/Stream';
import { Session } from './Session';
import EventEmitter = require('wolfy87-eventemitter');
export declare class Publisher {
    ee: EventEmitter;
    accessAllowed: boolean;
    element: Element;
    id: string;
    stream: Stream;
    session: Session;
    isScreenRequested: boolean;
    constructor(stream: Stream, parentId: string, isScreenRequested: boolean);
    publishAudio(value: boolean): void;
    publishVideo(value: boolean): void;
    destroy(): this;
    subscribeToRemote(): void;
    on(eventName: string, callback: any): void;
}
