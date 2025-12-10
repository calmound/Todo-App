import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import taskRoutes from './routes/tasks';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tasks', taskRoutes);

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 生产环境：托管前端打包静态文件
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// 非 API 路由统一返回 index.html（SPA 回退）
app.use((req: Request, res: Response, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`[server]: 服务已启动 http://localhost:${port}`);
});
