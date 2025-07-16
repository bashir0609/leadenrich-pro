import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@/utils/logger';

export const setupSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Job subscription
    socket.on('job:subscribe', ({ jobId }) => {
      socket.join(`job:${jobId}`);
      logger.info(`Client ${socket.id} subscribed to job ${jobId}`);
    });

    socket.on('job:unsubscribe', ({ jobId }) => {
      socket.leave(`job:${jobId}`);
      logger.info(`Client ${socket.id} unsubscribed from job ${jobId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};