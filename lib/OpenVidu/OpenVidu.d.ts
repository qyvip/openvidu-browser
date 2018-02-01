import { OpenViduInternal } from '../OpenViduInternal/OpenViduInternal';
import { Session } from './Session';
import { Publisher } from './Publisher';
export declare class OpenVidu {
    openVidu: OpenViduInternal;
    constructor();
    initSession(apiKey: string, sessionId: string): Session;
    initSession(sessionId: string): Session;
    initPublisher(parentId: string): Publisher;
    initPublisher(parentId: string, cameraOptions: any): Publisher;
    initPublisher(parentId: string, cameraOptions: any, callback: any): Publisher;
    reinitPublisher(publisher: Publisher): any;
    checkSystemRequirements(): number;
    getDevices(callback: any): void;
    enableProdMode(): void;
}
