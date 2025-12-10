当然可以。你需要的是「**Figma 式结构化页面层级说明（Page Tree / Layer Structure）**」，用于后续让 AI 在 Figma 中自动生成界面，或让前端根据结构快速搭建页面。

以下内容将完全按照 **Figma 的页面结构组织方式（Pages → Frames → Components）** 来呈现，涵盖 **Web 端 + 移动端** 两套界面，并保持模块命名清晰、组件嵌套合理、可复用性强。

下面开始正式文档。

---

# 一、Figma Pages（顶级页面）

建议在 Figma 中建立以下顶级 Page，用于清晰分隔结构：

```
1. Web - Main App
2. Web - Calendar (Month & Week)
3. Mobile - Main App
4. Mobile - Calendar (Month & Week)
5. Components Library
```

---

# 二、Web 端 - 页面层级结构（Figma 结构）

## PAGE: **Web - Main App**

```
Frame: AppShell (Desktop)
│
├── Component: Sidebar (Left Navigation)
│     ├── Logo
│     ├── NavItem: Today
│     ├── NavItem: This Week
│     ├── NavItem: All Tasks
│     ├── NavItem: Calendar
│     └── NavItem: Settings (optional)
│
├── Frame: ContentArea (Middle Column)
│     ├── Frame: PageHeader
│     │     ├── Title
│     │     └── Actions (Add Task Button)
│     │
│     ├── Input: QuickAddTask
│     │
│     └── Frame: TaskList
│           ├── Component: TaskItem (repeat)
│           ├── Divider (optional)
│           └── EmptyState (if no task)
│
└── Component: TaskDetailPanel (Right Drawer)
      ├── CloseButton
      ├── Input: Title
      ├── TextArea: Description
      ├── DatePicker
      ├── TimeRangePicker
      ├── StatusToggle
      └── DangerZone: DeleteButton
```

---

## PAGE: **Web - Calendar**

### FRAME: Month View

```
Frame: CalendarMonth
│
├── Frame: CalendarHeader
│     ├── Button: Prev
│     ├── Text: "January 2025"
│     ├── Button: Today
│     ├── Button: Next
│     └── SegmentControl: [Month | Week]
│
└── Frame: CalendarGrid (7 columns × 5–6 rows)
      ├── Component: CalendarDayCell (repeat)
      │     ├── Text: DayNumber
      │     ├── Group: TaskPreview (max 2 items)
      │     │      ├── MiniTaskDot or MiniTaskBar
      │     │      └── Text: "09:00 Meeting"
      │     ├── Text: "+3 more" (if overflow)
      │     └── State: Today Highlight / Other Month Dim
```

### FRAME: Week View

```
Frame: CalendarWeek
│
├── Frame: CalendarHeader (same as Month)
│
└── Frame: TimeGrid
      ├── ColumnHeaderRow (Mon–Sun)
      │
      └── Frame: TimeRows (24 hours)
            ├── Row: 00:00
            ├── Row: 01:00
            ├── ...
            └── Row: 23:00
            │
            └── Component: TaskBlock (absolute positioned)
                  ├── Title
                  ├── TimeRange
                  └── StatusColor
```

---

# 三、移动端 - 页面层级结构（Figma 结构）

## PAGE: **Mobile - Main App**

```
Frame: AppShell (Mobile)
│
├── Component: MobileHeader
│     ├── BackButton (visible on detail pages)
│     └── PageTitle
│
├── Frame: TaskListArea
│     ├── Input: QuickAddTask
│     └── Frame: TaskList
│           ├── TaskItem (repeat)
│           └── EmptyState
│
└── Component: BottomTabBar
      ├── Tab: Today
      ├── Tab: This Week
      ├── Tab: All
      └── Tab: Calendar
```

---

## PAGE: **Mobile - Calendar**

### FRAME: Month View

```
Frame: MobileCalendarMonth
│
├── Frame: CalendarHeader
│     ├── Button: Prev
│     ├── Text: January 2025
│     ├── Button: Next
│     └── Segment: [Month | Week]
│
├── Frame: MonthGrid (compact)
│     ├── CalendarDayCell-Mobile (repeat)
│     │     ├── DayNumber
│     │     └── DotCount (task count dot)
│
└── Frame: DayTaskList
      ├── Text: "January 10 · 3 tasks"
      ├── TaskItem (repeat)
      └── AddTaskButton (Floating)
```

---

### FRAME: Week View（移动端）

```
Frame: MobileCalendarWeek
│
├── ScrollableRow: DaySelector
│     ├── DayChip: Mon
│     ├── DayChip: Tue
│     ├── ...
│     └── DayChip: Sun
│
├── Frame: TimeAxisView
│     ├── TimeRow: 08:00
│     ├── TimeRow: 09:00
│     ├── ...
│     └── TaskBlock (repeat)
│
└── FloatingActionButton: AddTask
```

---

# 四、Components Library（推荐组件命名）

```
Components:
│
├── Buttons
│     ├── PrimaryButton
│     ├── SecondaryButton
│     └── IconButton
│
├── Inputs
│     ├── TextInput
│     ├── TextArea
│     ├── DatePicker (Mantine)
│     ├── TimeRangePicker
│     └── StatusToggle
│
├── Navigation
│     ├── Sidebar
│     ├── SidebarItem
│     ├── BottomTabBar
│     └── MobileHeader
│
├── Calendar
│     ├── CalendarDayCell
│     ├── CalendarDayCell-Mobile
│     ├── TaskBlock
│     └── MiniTaskIndicator
│
└── Task
      ├── TaskItem
      ├── TaskItem-Mobile
      └── TaskDetailPanel
```

---

# 五、Web + Mobile 交互流程（Figma 可用）

## 5.1 新建任务流程

```
User clicks "Add Task"
→ Open TaskDetailPanel or Modal
→ User fills Title + Date + TimeRange
→ Save
→ TaskList refresh
→ Calendar refresh (if in month/week view)
```

## 5.2 月视图交互

```
User clicks date cell
→ Highlight date
→ Middle panel shows tasks for this day
```

## 5.3 周视图交互

```
User drags TaskBlock (future)
→ Update startTime / endTime
→ Sync with backend
```

## 5.4 移动端切换日期

```
Tap DayChip (Wed)
→ TimeAxis scrolls to relevant time
→ Taskblocks reposition
```

---

# 六、如果你需要，我可以进一步生成：

### A）把这份结构转换成 **Figma JSON node 结构**（可直接给 AI 做自动生成）

### B）生成一份 **完整可用的 FigJam 时序图 / 流程图**

### C）生成一份 **可开箱即用的 React + Mantine 组件树图（Component Hierarchy）**

### D）生成 **可导入 Figma 的页面 wireframe（通过 get_design_context 工具）**

你接下来想让我做哪一步？
