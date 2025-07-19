import { Queue, QueueEvents } from 'bullmq';
export declare const enrichmentQueue: Queue<any, any, string>;
export declare const exportQueue: Queue<any, any, string>;
export declare const enrichmentQueueEvents: QueueEvents;
