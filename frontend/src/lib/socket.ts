import { io, Socket } from 'socket.io-client';
import { useJobStore } from '@/lib/stores/jobStore';

class SocketManager {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('job:progress', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        progress: data.progress,
        status: data.status,
      });
    });

    this.socket.on('job:completed', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    });

    this.socket.on('job:failed', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        status: 'failed',
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToJob(jobId: string) {
    this.socket?.emit('job:subscribe', { jobId });
  }

  unsubscribeFromJob(jobId: string) {
    this.socket?.emit('job:unsubscribe', { jobId });
  }
}

export const socketManager = new SocketManager();