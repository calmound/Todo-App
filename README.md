# 任务管理器（Task Manager）

一个带有日历视图的全栈任务管理应用，技术栈包括 React、TypeScript、Mantine UI、Node.js、Express、Prisma、SQLite。

## 功能特性

- **今日视图**：查看今天的所有任务
- **本周视图**：查看本周任务
- **全部任务**：按状态筛选（全部/待办/已完成）
- **日历视图**：交互式月视图，直观展示每日任务
- **任务管理**：新建、编辑、删除、标记完成
- **时间型任务**：支持“全天”与“定时”任务
- **响应式设计**：桌面和移动端均可良好使用

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Mantine UI 7（含 @mantine/dates）
- React Router
- Dayjs

### 后端
- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite 数据库

### 部署
- Docker
- Docker Compose

## 项目结构

```
todo-project/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── api/       # API client functions
│   │   ├── components/ # Reusable components
│   │   ├── layouts/   # Layout components
│   │   ├── pages/     # Page components
│   │   ├── types/     # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── backend/           # Express backend server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── doc/               # Documentation
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js 20+
- npm 或 yarn

### 开发环境

#### 方式一：一键启动（推荐）

1. **安装所有依赖**

```bash
# 在项目根目录执行
npm run install:all
```

2. **运行数据库迁移**

```bash
npm run prisma:migrate
```

3. **启动前后端服务**

```bash
# 一键同时启动前后端开发服务器
npm run dev
```

服务启动后：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api

#### 方式二：分别启动

1. **Setup Backend**

```bash
cd backend
npm install

# Run database migrations
npm run prisma:migrate

# Start backend server (runs on http://localhost:3000)
npm run dev
```

2. **Setup Frontend** (in a new terminal)

```bash
cd frontend
npm install

# Start frontend dev server (runs on http://localhost:5173)
npm run dev
```

### Docker 部署

1. **使用 Docker Compose 启动**

```bash
docker-compose up -d
```

2. **访问应用**

浏览器打开 http://localhost:3000

应用会在一个容器内运行（前端 + 后端 + 数据库）。

3. **停止应用**

```bash
docker-compose down
```

### 数据库

应用使用 SQLite 存储数据。开发环境数据库文件位于 `backend/prisma/dev.db`；Docker 部署时，数据库保存在 `./data` 卷中。

## API 接口

### 任务

- `GET /api/tasks` - 获取任务（支持查询参数：from, to, status）
- `GET /api/tasks/all` - 获取全部任务
- `GET /api/tasks/:id` - 获取单个任务
- `POST /api/tasks` - 新建任务
- `PUT /api/tasks/:id` - 更新任务（全量）
- `PATCH /api/tasks/:id` - 更新任务（部分）
- `DELETE /api/tasks/:id` - 删除任务

### 健康检查

- `GET /api/health` - 服务器健康检查

## 任务数据模型

```typescript
{
  id: number;
  title: string;
  description?: string;
  date?: string;        // 'YYYY-MM-DD'
  allDay: boolean;
  startTime?: string;   // 'HH:mm'
  endTime?: string;     // 'HH:mm'
  status: 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
}
```

## Scripts

## 脚本命令

### 根目录（推荐使用）

- `npm run dev` - 同时启动前后端开发服务器
- `npm run install:all` - 安装所有依赖（根目录 + 前端 + 后端）
- `npm run build` - 构建前后端
- `npm run prisma:migrate` - 运行数据库迁移
- `npm run prisma:studio` - 打开 Prisma Studio
- `npm run docker:build` - 构建 Docker 镜像
- `npm run docker:up` - 启动 Docker 容器
- `npm run docker:down` - 停止 Docker 容器
- `npm run docker:logs` - 查看 Docker 日志

### 后端（backend）

- `npm run dev` - 开发模式（热重载）
- `npm run build` - 生产构建
- `npm start` - 启动生产环境服务
- `npm run prisma:generate` - 生成 Prisma Client
- `npm run prisma:migrate` - 执行数据库迁移
- `npm run prisma:studio` - 打开 Prisma Studio

### 前端（frontend）

- `npm run dev` - 启动开发服务器
- `npm run build` - 生产构建
- `npm run preview` - 预览生产构建

## 后续计划

- 任务拖拽排序
- 重复任务（每日/每周/自定义）
- 搜索功能
- 任务优先级与标签
- SQLite 自动备份
- PWA 支持离线访问
- 周视图时间轴
- 任务分类/项目
- 导出多种格式

## 许可证

MIT

## Author

Task Manager - Built with Claude Code
