import { Router } from 'express';
import { getProviders } from '../controllers/providersController';

const router = Router();

router.get('/', getProviders);

export default router;