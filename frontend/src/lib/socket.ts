// frontend/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private updateJobCallback: ((jobId: string, updates: any) => void) | null = null;

  setUpdateJobCallback(callback: (jobId: string, updates: any) => void) {
    console.log('Update job callback set');
    this.updateJobCallback = callback;
  }

  connect() {
    // If already connected, just return
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Attempting to connect to socket:', socketUrl);

    // Disconnect any existing socket
    this.disconnect();

    // Create new socket
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      forceNew: true,
    });

    // Attach event listeners
    this.attachSocketListeners();

    return this.socket;
  }

  private attachSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('job:progress', (data: any) => {
      console.log('Job progress received:', data);
      if (this.updateJobCallback) {
        this.updateJobCallback(data.jobId, {
          progress: data.progress,
          status: data.status,
        });
      }
    });

    this.socket.on('job:completed', (data: any) => {
      console.log('Job completed:', data);
      if (this.updateJobCallback) {
        this.updateJobCallback(data.jobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }
    });

    this.socket.on('job:failed', (data: any) => {
      console.log('Job failed:', data);
      if (this.updateJobCallback) {
        this.updateJobCallback(data.jobId, {
          status: 'failed',
        });
      }
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToJob(jobId: string) {
    console.log('Subscribing to job:', jobId);
    this.socket?.emit('job:subscribe', { jobId });
  }

  unsubscribeFromJob(jobId: string) {
    console.log('Unsubscribing from job:', jobId);
    this.socket?.emit('job:unsubscribe', { jobId });
  }
}

export const socketManager = new SocketManager();