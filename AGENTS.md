# 仓库贡献指南（Repository Guidelines）

## 项目结构与模块组织
- 根目录：统一脚本（`package.json`）、Docker 配置、文档位于 `doc/`。
- 后端（`backend/`）：Express + TypeScript。源码在 `backend/src`（`index.ts`、`routes/`），Prisma 在 `backend/prisma/`（开发库 `dev.db`）。
- 前端（`frontend/`）：React + Vite + TypeScript。源码在 `frontend/src`（`api/`、`components/`、`layouts/`、`pages/`、`types/`）。

## 构建、测试与开发命令
- 根目录：`npm run install:all` 安装全部依赖；`npm run dev` 同时启动前后端；`npm run build` 构建前后端；Prisma 工具：`npm run prisma:migrate|studio`。
- 后端：`cd backend && npm run dev`（ts-node + nodemon）；`npm run build`（tsc）；`npm start`（运行 dist）；`npm run prisma:migrate` 应用迁移。
- 前端：`cd frontend && npm run dev`（Vite）；`npm run build`（tsc + vite）；`npm run preview`；`npm run lint`。
说明：当前未配置统一测试命令，见下文“测试指南”。

## 代码风格与命名
- 全面使用 TypeScript；2 空格缩进。
- React 组件/文件用帕斯卡命名（如 `components/TaskItem/`）；Hook 以 `useX` 命名；类型集中在 `types/`，类型名帕斯卡（如 `Task`）。
- 后端文件小写（如 `routes/tasks.ts`）；API 以 `/api/*` 为前缀。
- 倾向纯函数与显式类型；提交前在前端运行 `npm run lint`。

## 测试指南
- 现状：暂无项目级 `npm test`。
- 前端（建议）：Vitest + @testing-library/react，放在 `frontend/src/__tests__/`（`*.test.tsx`）。
- 后端（建议）：Vitest 或 Jest + Supertest，放在 `backend/tests/`（`*.test.ts`）。优先覆盖 `/api/health`、`/api/tasks` 等关键路径与核心页面流程。

## 提交与 PR 规范
- 提交信息遵循 Conventional Commits：`feat:`、`fix:`、`docs:`、`chore:`、`refactor:`、`test:`、`build:`；可带作用域（如 `feat(frontend): week view`）。
- PR 请包含：变更目的、关联 issue、UI 截图/GIF、若涉及 Prisma 请备注迁移影响、以及本地验证步骤（`npm run dev`、关键页面/接口）。

## 安全与配置提示
- 环境变量：后端读取 `.env`（如 `PORT`）；前端使用 `VITE_` 前缀（如 `VITE_API_BASE_URL`）。请勿提交敏感信息。
- 数据库：开发前先执行迁移（`npm run prisma:migrate`）。SQLite 路径：`backend/prisma/dev.db`（仅开发）。
