import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
export declare const setupSocket: (server: HttpServer) => Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
