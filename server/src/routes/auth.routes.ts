import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User';
import StreakRecord from '../models/StreakRecord';
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(50),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// 注册
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    // 创建 streak 记录
    await StreakRecord.create({
      user_id: user.id,
      current_streak: 0,
      best_streak: 0,
      last_updated: new Date(),
    });

    const token = generateToken(user.id);
    res.json({
      code: 200,
      message: '注册成功',
      data: { token, user: { id: user.id, username: user.username } },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 登录
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }

    const token = generateToken(user.id);
    res.json({
      code: 200,
      message: '登录成功',
      data: { token, user: { id: user.id, username: user.username, avatar: user.avatar } },
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取当前用户
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.userId, {
    attributes: ['id', 'username', 'avatar', 'created_at'],
  });
  res.json({ code: 200, data: user });
});

export default router;
