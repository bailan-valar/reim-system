# 个人报销管理系统

一个基于 Nuxt 3 的个人报销管理平台，支持报销单管理、费用项目管理和发票文件上传。

## 功能特性

### 1. 报销单管理
- ✅ 创建、编辑、删除报销单
- ✅ 报销单列表查看（支持筛选和排序）
- ✅ 报销单详情页面
- ✅ 五阶段状态流程：
  - 待整理
  - 待打印单据
  - 待审批
  - 待打款
  - 已完成

### 2. 费用项目管理
- ✅ 添加、编辑、删除费用项目
- ✅ 费用项目字段：
  - 金额
  - 日期
  - 类别（交通、餐饮、住宿、办公、其他）
  - 描述
- ✅ 自动计算报销单总金额

### 3. 发票管理
- ✅ 上传发票文件（PDF, PNG, JPG, JPEG）
- ✅ 文件大小限制：10MB
- ✅ 发票状态跟踪
- ✅ 查看和删除发票
- ✅ 拖拽上传支持

### 4. 数据统计
- ✅ 首页仪表盘
- ✅ 统计数据：
  - 总报销单数量
  - 待处理报销单
  - 已完成报销单
  - 总金额统计

## 技术栈

- **前端框架**: Nuxt 3
- **UI 样式**: Tailwind CSS
- **数据库**: SQLite (通过 Prisma ORM)
- **语言**: TypeScript
- **文件存储**: 本地文件系统

## 项目结构

```
reim-system/
├── prisma/                    # Prisma 数据库配置
│   ├── schema.prisma         # 数据库模型定义
│   └── dev.db                # SQLite 数据库文件
├── server/                    # 服务端代码
│   ├── api/                  # API 路由
│   │   ├── reimbursements/   # 报销单 API
│   │   └── uploads/          # 文件上传 API
│   └── utils/                # 服务端工具函数
├── pages/                     # 页面组件
│   ├── index.vue             # 首页/仪表盘
│   └── reimbursements/       # 报销单相关页面
├── components/                # Vue 组件
│   ├── ui/                   # 基础 UI 组件
│   ├── reimbursement/        # 报销单组件
│   └── expense/              # 费用项目组件
├── composables/               # 组合式函数
├── types/                     # TypeScript 类型定义
├── utils/                     # 工具函数
└── public/                    # 静态资源
    └── uploads/              # 上传的发票文件
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

数据库已经在项目初始化时自动创建。如需重新初始化：

```bash
npx prisma db push
npx prisma generate
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

## 数据库模型

### Reimbursement (报销单)
- `id`: 唯一标识符
- `title`: 标题
- `description`: 描述（可选）
- `status`: 状态
- `totalAmount`: 总金额（自动计算）
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### ExpenseItem (费用项目)
- `id`: 唯一标识符
- `reimbursementId`: 关联的报销单 ID
- `amount`: 金额
- `date`: 日期
- `description`: 描述（可选）
- `category`: 类别
- `invoiceFileName`: 发票文件名
- `invoiceFilePath`: 发票文件路径
- `hasInvoice`: 是否已上传发票
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## API 端点

### 报销单 API
- `GET /api/reimbursements` - 获取报销单列表
- `POST /api/reimbursements` - 创建报销单
- `GET /api/reimbursements/:id` - 获取单个报销单
- `PUT /api/reimbursements/:id` - 更新报销单
- `DELETE /api/reimbursements/:id` - 删除报销单

### 费用项目 API
- `POST /api/reimbursements/:id/items` - 创建费用项目
- `PUT /api/reimbursements/:id/items/:itemId` - 更新费用项目
- `DELETE /api/reimbursements/:id/items/:itemId` - 删除费用项目

### 文件上传 API
- `POST /api/uploads/invoice` - 上传发票
- `DELETE /api/uploads/:filename` - 删除发票

## 使用说明

### 创建报销单
1. 点击"创建报销单"按钮
2. 填写标题、描述和初始状态
3. 点击"保存"

### 添加费用项目
1. 进入报销单详情页
2. 点击"添加费用"按钮
3. 填写金额、日期、类别和描述
4. 点击"保存"

### 上传发票
1. 在费用项目卡片中点击"上传发票"
2. 拖拽文件或点击选择文件
3. 支持的格式：PDF, PNG, JPG, JPEG
4. 最大文件大小：10MB

### 更新报销单状态
1. 进入报销单详情页
2. 点击"编辑"按钮
3. 选择新的状态
4. 点击"保存"

## 注意事项

- 这是一个单用户应用，无需登录认证
- 发票文件存储在本地 `public/uploads/invoices/` 目录
- 删除报销单或费用项目时，相关的发票文件会自动删除
- 报销单的总金额会根据费用项目自动计算

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 生成 Prisma 客户端
npx prisma generate

# 同步数据库模型
npx prisma db push

# 打开 Prisma Studio（数据库管理界面）
npx prisma studio
```

## 许可证

MIT
