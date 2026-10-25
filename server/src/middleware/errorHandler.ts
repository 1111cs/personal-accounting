import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({
    code: 500,
    message: env.nodeEnv === 'production' ? '服务器内部错误' : err.message,
  });
}
