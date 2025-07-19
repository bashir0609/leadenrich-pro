import winston from 'winston';
export declare const logger: winston.Logger;
export declare const loggerStream: {
    write: (message: string) => void;
};
