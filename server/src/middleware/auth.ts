import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: number;
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: number };
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}
