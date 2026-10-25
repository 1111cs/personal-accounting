import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少必需的环境变量：${name}`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`环境变量 ${name} 必须是 1 到 65535 之间的整数`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('环境变量 JWT_SECRET 至少需要 32 个字符');
}

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  port: positiveInteger('PORT', 3001),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: {
    host: process.env.DB_HOST?.trim() || 'localhost',
    port: positiveInteger('DB_PORT', 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
  },
  jwtSecret,
} as const;
