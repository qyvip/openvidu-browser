import { Stream, StreamOptionsServer } from './Stream';
import { OpenViduInternal } from './OpenViduInternal';
import { SessionInternal } from './SessionInternal';
export interface ConnectionOptions {
    id: string;
    metadata: string;
    streams: StreamOptionsServer[];
}
export declare class Connection {
    private openVidu;
    private local;
    private room;
    private options;
    connectionId: string;
    data: string;
    creationTime: number;
    private streams;
    private inboundStreamsOpts;
    constructor(openVidu: OpenViduInternal, local: boolean, room: SessionInternal, options?: ConnectionOptions);
    addStream(stream: Stream): void;
    removeStream(key: string): void;
    setOptions(options: ConnectionOptions): void;
    getStreams(): {
        [s: string]: Stream;
    };
    dispose(): void;
    sendIceCandidate(candidate: any): void;
    initRemoteStreams(options: ConnectionOptions): void;
}
