import { Application } from 'express';
import './services/providers/implementations/SurfeProvider';
import './services/providers/implementations/ApolloProvider';
import './services/providers/implementations/BetterEnrichProvider';
declare const app: Application;
declare global {
    var io: import('socket.io').Server;
}
export default app;
//# sourceMappingURL=app.d.ts.map