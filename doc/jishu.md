下面开始生成你所需的 **技术文档（Technical Documentation）**。
这是一份围绕你的任务管理系统（Web + Mobile）的完整技术方案文档，可用于对接前后端开发、规范实现，也可作为后续交付的项目文档基础。

文档包含：

1. 系统架构
2. 技术选型说明
3. 前端架构
4. 后端架构
5. 数据模型（SQLite + Prisma）
6. API 设计（REST）
7. 日历视图数据交互
8. 前端页面结构（与 Figma 原型一致）
9. 部署（Docker）
10. 后续扩展点

---

# 1. 系统架构（System Architecture）

```
Client (React + Mantine)
      │
      │ HTTP/JSON (REST API)
      ▼
Backend API Server (Node + Express/Fastify + Prisma)
      │
      ▼
SQLite Database (Single .db File)
```

特点：

* 单用户，无登录，无多租户逻辑
* SQLite 本地文件，配合 Docker Volume 持久化
* 前端 SPA 通过 Node 静态服务托管
* 架构简洁、部署成本极低、易维护

---

# 2. 技术选型说明（Technical Stack）

## 前端

| 模块     | 技术                         |
| ------ | -------------------------- |
| 框架     | React + TypeScript         |
| 构建工具   | Vite                       |
| UI 组件库 | Mantine（包含 @mantine/dates） |
| 状态管理   | Zustand（可选）                |
| 路由     | React Router               |
| 请求     | fetch 或 axios（任选）          |

选择 Mantine 的理由：

* 文档友好、AI 易读、组件现代、美观轻量
* 内置 Calendar / DatePicker / TimeInput
* 响应式支持优秀，PC + Mobile 布局方便

---

## 后端

| 模块     | 技术                         |
| ------ | -------------------------- |
| 框架     | Node.js（Express 或 Fastify） |
| ORM    | Prisma                     |
| 数据库    | SQLite                     |
| API 格式 | REST JSON                  |

理由：

* SQLite 文件部署非常简单（适合单用户）
* Prisma 支持 SQLite，开发体验好

---

## 部署

* 使用 Docker（单镜像）
* Node Server 提供：

  * `/api/**`
  * 静态文件：前端打包产物

---

# 3. 前端架构（Frontend Architecture）

```
src/
│── components/
│── layouts/
│── pages/
│     ├── TodayPage.tsx
│     ├── WeekPage.tsx
│     ├── AllTasksPage.tsx
│     ├── Calendar/
│           ├── MonthView.tsx
│           ├── WeekView.tsx
│
│── hooks/
│── store/ (Zustand store)
│── api/
│── utils/
│── App.tsx
│── main.tsx
```

Mantine AppShell（Web）：

```
<AppShell>
 ├── Navbar
 ├── Header
 └── MainContent
```

Mobile 则使用：

* Header（小）
* BottomTabBar
* 单列 TaskList

---

# 4. 后端架构（Backend Architecture）

```
backend/
│── src/
│     ├── index.ts (server entry)
│     ├── routes/
│     │     └── tasks.ts
│     ├── prisma/
│     │     └── schema.prisma
│     ├── services/
│     └── utils/
│
│── package.json
│── Dockerfile
```

---

# 5. 数据模型（Data Model）

## Prisma Schema（SQLite）

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?

  date        String?     // 'YYYY-MM-DD'
  allDay      Boolean     @default(false)
  startTime   String?     // 'HH:mm'
  endTime     String?     // 'HH:mm'

  status      String      @default("pending") // pending | done

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

数据库索引：

```prisma
@@index([date])
```

---

# 6. API 设计（REST）

## 基础路径

```
/api/tasks
```

---

## 6.1 创建任务

### POST `/api/tasks`

Body：

```json
{
  "title": "写技术文档",
  "description": "与前端结构同步",
  "date": "2025-02-10",
  "allDay": false,
  "startTime": "09:00",
  "endTime": "11:00",
  "status": "pending"
}
```

Response：

```json
{
  "id": 1,
  "title": "写技术文档",
  "date": "2025-02-10",
  "allDay": false,
  "startTime": "09:00",
  "endTime": "11:00",
  "status": "pending"
}
```

---

## 6.2 获取单个任务

GET `/api/tasks/:id`

---

## 6.3 更新任务（全量）

PUT `/api/tasks/:id`

---

## 6.4 部分更新（状态等）

PATCH `/api/tasks/:id`

Body 示例：

```json
{ "status": "done" }
```

---

## 6.5 删除任务

DELETE `/api/tasks/:id`

---

## 6.6 获取区间任务（核心接口）

GET `/api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending|done|all`

Response：

```json
{
  "from": "2025-02-01",
  "to": "2025-02-28",
  "tasks": [ ... ]
}
```

用于：

* 月视图
* 周视图
* 今日、本周视图

---

## 6.7 获取全部任务

GET `/api/tasks/all`

---

# 7. 日历视图数据交互（Calendar Interaction Data Logic）

## 月视图（Month View）

前端步骤：

1. 用户选中当前月份（如 2025-02）
2. 计算该视图应包含的起止日期（例如 1 月 27 - 3 月 2）
3. 调用：

```
GET /api/tasks?from=2025-01-27&to=2025-03-02
```

4. 按日期分组：

```
{
  "2025-02-01": [...],
  "2025-02-02": [...],
  ...
}
```

5. 渲染格子：

* 显示前 2~3 条任务
* 显示加号“+3 more”
* 高亮当天

---

## 周视图（Week View）

前端步骤：

1. 用户处于某一周（如 2025-02-10 ~ 2025-02-16）
2. 调用：

```
GET /api/tasks?from=2025-02-10&to=2025-02-16
```

3. 按天分组
4. 时间段任务渲染至时间轴
5. 全天任务置顶显示

---

# 8. 页面结构（与 Figma 原型一致）

## Web

* Sidebar
* TodayPage
* WeekPage
* AllTasksPage
* CalendarPage

  * MonthView
  * WeekView
* TaskDetailPanel

## Mobile

* Header
* TaskList
* BottomTabBar
* CalendarMonth
* CalendarWeek
* TaskDetailPage

---

# 9. Docker 部署文档

## Dockerfile（多阶段构建）

```Dockerfile
# Frontend build
FROM node:20-alpine AS fe-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Backend build
FROM node:20-alpine AS be-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./
RUN npm run build

# Final runtime image
FROM node:20-alpine
WORKDIR /app

COPY --from=be-build /app/backend/dist ./backend/dist
COPY --from=be-build /app/backend/node_modules ./backend/node_modules
COPY --from=fe-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
```

---

# 10. 后续扩展点（Future Enhancements）

* 任务拖拽排序（列表、日历、周视图）
* 重复任务（每日、每周、间隔重复）
* 搜索功能
* 任务优先级 / 标签
* 自动备份 SQLite 文件
* PWA 支持（离线可访问）


