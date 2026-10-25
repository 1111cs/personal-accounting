import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[target]);
      req[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((e) => {
          const field = e.path.join('.') || '(请求体)';
          // 将 Zod 错误码转为中文友好提示
          let msg = e.message;
          if (e.code === 'invalid_type') {
            msg = `字段类型不正确，期望 ${e.expected}`;
          } else if (e.code === 'invalid_value') {
            msg = `值不在允许范围内`;
          }
          return { field, message: msg };
        });
        return res.status(400).json({
          code: 400,
          message: `参数校验失败：${fieldErrors.map((e) => `${e.field} ${e.message}`).join('；')}`,
          errors: fieldErrors,
        });
      }
      next(error);
    }
  };
}
