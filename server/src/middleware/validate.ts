import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const details = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid request body', details);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).validatedBody = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      const details = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', details);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).validatedQuery = result.data;
    next();
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    
    if (!result.success) {
      const details = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid URL parameters', details);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).validatedParams = result.data;
    next();
  };
}
