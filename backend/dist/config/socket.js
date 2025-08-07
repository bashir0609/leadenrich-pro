"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
const setupSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        logger_1.logger.info(`Client connected: ${socket.id}`);
        // Job subscription
        socket.on('job:subscribe', ({ jobId }) => {
            socket.join(`job:${jobId}`);
            logger_1.logger.info(`Client ${socket.id} subscribed to job ${jobId}`);
        });
        socket.on('job:unsubscribe', ({ jobId }) => {
            socket.leave(`job:${jobId}`);
            logger_1.logger.info(`Client ${socket.id} unsubscribed from job ${jobId}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.setupSocket = setupSocket;
//# sourceMappingURL=socket.js.map