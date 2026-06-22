/**
 * Product HTTP controller.
 *
 * What: Thin adapter between Express request/response and productService.
 * Why: Keeps transport concerns (status codes, JSON shape) out of query logic.
 * How it helps: Services stay testable without spinning up HTTP.
 */

import { Request, Response, NextFunction } from 'express';
import { parseProductListQuery } from '../validators/productQueryValidator';
import { listProducts } from '../services/productService';

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = parseProductListQuery(req.query as Record<string, unknown>);

    const result = await listProducts({
      category: query.category,
      limit: query.limit,
      cursor: query.decodedCursor,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
