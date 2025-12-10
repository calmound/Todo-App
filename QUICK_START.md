# 快速开始指南

## 最快速的启动方式

只需三个命令即可启动整个应用：

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 初始化数据库
npm run prisma:migrate

# 3. 启动前后端服务
npm run dev
```

就这么简单！现在打开浏览器访问：
- 🎨 前端界面：http://localhost:5173
- 🔧 后端 API：http://localhost:3000/api

## 可用的根目录命令

在项目根目录，你可以使用以下命令：

### 开发命令
```bash
npm run dev              # 同时启动前后端（推荐！）
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端
```

### 安装命令
```bash
npm run install:all      # 安装根目录、前端、后端的所有依赖
```

### 构建命令
```bash
npm run build            # 构建前后端
npm run build:backend    # 仅构建后端
npm run build:frontend   # 仅构建前端
```

### 数据库命令
```bash
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:studio    # 打开 Prisma Studio（数据库管理界面）
```

### Docker 命令
```bash
npm run docker:build     # 构建 Docker 镜像
npm run docker:up        # 启动 Docker 容器
npm run docker:down      # 停止 Docker 容器
npm run docker:logs      # 查看 Docker 日志
```

## Docker 部署（一键部署）

如果你想使用 Docker 部署：

```bash
# 构建并启动
docker-compose up -d

# 访问应用
open http://localhost:3000
```

## 常见问题

### Q: 端口被占用怎么办？
A: 修改对应的配置文件：
- 前端端口：`frontend/vite.config.ts`
- 后端端口：`backend/.env` 中的 `PORT` 变量

### Q: 数据库在哪里？
A: 开发环境下，SQLite 数据库文件位于 `backend/prisma/dev.db`

### Q: 如何查看数据库内容？
A: 运行 `npm run prisma:studio` 打开可视化数据库管理界面

### Q: 如何停止服务？
A: 在终端按 `Ctrl + C`

## 下一步

- 查看完整文档：[README.md](./README.md)
- 查看设计文档：[doc/](./doc/)
- 开始开发你的功能！

祝开发愉快！🚀
