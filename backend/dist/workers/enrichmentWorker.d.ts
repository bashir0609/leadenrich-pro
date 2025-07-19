import { Worker } from 'bullmq';
import { EnrichmentJobData } from '@/services/QueueService';
export declare const enrichmentWorker: Worker<EnrichmentJobData, any, string>;
