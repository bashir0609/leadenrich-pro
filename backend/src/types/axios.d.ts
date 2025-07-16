import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId?: string;
      startTime?: number;
    };
  }
  
  export interface InternalAxiosRequestConfig {
    metadata?: {
      requestId?: string;
      startTime?: number;
    };
  }
}