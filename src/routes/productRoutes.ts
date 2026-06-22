/**
 * Product route definitions.
 *
 * What: Maps URL paths to controller handlers.
 * Why: Keeps the API surface in one registry; app.ts stays wiring-only.
 * How it helps: New endpoints add a line here without touching server bootstrap.
 */

import { Router } from 'express';
import { getProducts } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);

export default router;
