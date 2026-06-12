# 用户小程序福利卡账户选择与绑卡入口实施计划

> **给执行代理：** 必须按 TDD 执行。先写失败测试，再实现，再验证。本文档、完成记录和后续 docs-only 收口必须使用中文。

**目标：** 用户小程序接入与 Portal 一致的福利卡账户列表、实体卡绑卡和支付账户选择合同，避免继续停留在只传数值福利卡金额的过渡形态。

**架构：** 复用已落地的后端合同：`GET /api/franchises/:franchiseId/welfare-card-accounts/me` 读取当前买家在销售加盟商下的福利卡账户，`POST /api/franchises/:franchiseId/welfare-cards/bind` 绑定实体卡，`POST /api/orders/payments` 在福利卡抵扣金额大于 0 时携带 `welfareCardAccountId`。小程序详情页负责基于商品池销售加盟商提供绑卡入口；订单详情页负责按订单 `salesFranchiseId` 拉取账户、选择账户并创建组合支付。

**业务强约束：**
- 加盟商是福利卡发行方、真实销售方、销售账主体、收款归属主体。
- 商户是商品发布、库存和履约主体，不直接承接用户支付。
- 用户支付只能是福利卡加线上现金组合；线上现金只允许微信支付和支付宝。
- 福利卡支付组件必须绑定用户在订单销售加盟商下的福利卡账户。
- 无线下现金支付；线下只允许出现在加盟商与商户结算打款确认语义里。
- 不引入门店/商店主模型，不新增 `shop/store` 主链路语义。

**本切片范围：**
- 小程序 API helper 增加福利卡账户列表 URL 和实体卡绑卡 URL。
- 小程序支付 payload 支持 `welfareCardAccountId`。
- 小程序订单详情页在订单福利卡抵扣金额大于 0 时加载并要求选择福利卡账户。
- 小程序商品详情页基于当前商品销售加盟商提供实体卡绑卡入口。

**暂不纳入本切片：**
- 多张福利卡叠加支付。
- 原路退款按 `OrderPaymentComponent` 逐组件退款状态机。
- 卡号/绑定码安全生成、脱敏展示、加密存储。
- 正式组织、部门、岗位、角色账号体系替换本地过渡账号。
- 微信/支付宝 SDK 真机支付调起；本切片仍验证本地 API 合同。

---

### 任务 1：RED API 与支付合同测试

**文件：**
- 修改：`apps/user-miniprogram/utils/api.test.mjs`
- 修改：`apps/user-miniprogram/utils/payment.test.mjs`

- [x] API helper 应生成 `GET /franchises/:franchiseId/welfare-card-accounts/me` URL。
- [x] API helper 应生成 `POST /franchises/:franchiseId/welfare-cards/bind` URL。
- [x] 支付 payload 在传入福利卡账户 ID 时应包含 `welfareCardAccountId`。
- [x] 支付 payload 在未传账户 ID 时不应发送空字段。

RED 证据：
- `pnpm --filter @welfare-mall/user-miniprogram run test --run utils/api.test.mjs utils/payment.test.mjs pages/order-detail/index.test.mjs pages/detail/index.test.mjs` 首次失败于 `welfareCardAccountsUrl is not a function`，以及支付 payload 缺少 `welfareCardAccountId`。

### 任务 2：GREEN API 与支付合同实现

**文件：**
- 修改：`apps/user-miniprogram/utils/api.js`
- 修改：`apps/user-miniprogram/utils/payment.js`

- [x] 实现账户列表和绑卡 URL helper。
- [x] 导出 helper。
- [x] `buildPaymentPayload` 支持可选 `welfareCardAccountId`。

GREEN 证据：
- focused 用户小程序测试通过，API helper 和支付 payload 相关测试全部通过。

### 任务 3：RED 订单详情页账户选择

**文件：**
- 修改：`apps/user-miniprogram/pages/order-detail/index.test.mjs`
- 修改：`apps/user-miniprogram/pages/order-detail/index.wxml`

- [x] 加载含福利卡抵扣的订单后，应按 `salesFranchiseId` 请求当前买家的福利卡账户列表。
- [x] 未选择福利卡账户时，不应创建支付单，并显示“请先选择福利卡账户”。
- [x] 选择账户后，应把 `welfareCardAccountId` 随支付请求提交。
- [x] WXML 应显示“选择福利卡账户”，并仍只展示微信支付和支付宝。

RED 证据：
- focused 测试首次失败于账户列表请求缺失、未选择账户没有拦截、`selectWelfareCardAccount is not a function`、WXML 缺少“选择福利卡账户”。

### 任务 4：GREEN 订单详情页账户选择实现

**文件：**
- 修改：`apps/user-miniprogram/pages/order-detail/index.js`
- 修改：`apps/user-miniprogram/pages/order-detail/index.wxml`
- 修改：`apps/user-miniprogram/pages/order-detail/index.wxss`

- [x] 增加账户列表、选中账户、加载错误状态。
- [x] `loadOrderDetail` 成功后按 `salesFranchiseId` 拉取账户。
- [x] 增加 `selectWelfareCardAccount`。
- [x] `submitPayment` 在福利卡抵扣金额大于 0 时校验账户并传 `welfareCardAccountId`。

GREEN 证据：
- 订单详情页相关测试通过，旧支付、取消、退款测试已改为按 URL 查找请求，适配账户列表请求插入后的新合同。

### 任务 5：RED 商品详情页绑卡入口

**文件：**
- 修改：`apps/user-miniprogram/pages/detail/index.test.mjs`
- 修改：`apps/user-miniprogram/pages/detail/index.wxml`

- [x] 商品详情页应显示福利卡卡号和绑定码输入。
- [x] 商品详情页绑定实体卡时，应调用当前商品销售加盟商的绑卡 API。
- [x] 绑卡成功后应显示余额提示。
- [x] 缺少卡号或绑定码时应拦截提交。

RED 证据：
- focused 测试首次失败于商品详情 WXML 缺少“福利卡卡号/福利卡绑定码”，以及 `onBindCardNoInput`、`submitBindWelfareCard` 方法不存在。

### 任务 6：GREEN 商品详情页绑卡入口实现

**文件：**
- 修改：`apps/user-miniprogram/pages/detail/index.js`
- 修改：`apps/user-miniprogram/pages/detail/index.wxml`
- 修改：`apps/user-miniprogram/pages/detail/index.wxss`

- [x] 增加绑卡表单状态。
- [x] 从商品池详情读取 `productPool.franchiseId` 或顶层 `franchiseId` 作为销售加盟商。
- [x] 实现 `submitBindWelfareCard`。
- [x] 绑卡成功显示 `福利卡绑定成功，余额 ¥xx.xx`。

GREEN 证据：
- 商品详情页绑卡入口测试通过。

### 任务 6.5：补齐真实入口加盟商传递

**文件：**
- 新增：`apps/user-miniprogram/pages/catalog/index.test.mjs`
- 修改：`apps/user-miniprogram/pages/catalog/index.js`
- 修改：`apps/user-miniprogram/pages/catalog/index.wxml`
- 修改：`apps/user-miniprogram/pages/detail/index.test.mjs`
- 修改：`apps/user-miniprogram/pages/detail/index.js`

- [x] Catalog 应把商品池 `franchiseId` 写入商品卡片数据。
- [x] Catalog 跳转详情页时应携带 `franchiseId`。
- [x] Detail 在详情 API 未返回加盟商时，应使用导航参数里的销售加盟商。

RED 证据：
- `pnpm --filter @welfare-mall/user-miniprogram run test --run pages/catalog/index.test.mjs pages/detail/index.test.mjs` 首次失败于 catalog 商品缺少 `franchiseId`，以及 detail 未使用导航传入的 `franchiseId`。

GREEN 证据：
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` 通过，10 个 test files、52 个测试通过。

### 任务 7：验证与完成

- [x] 运行用户小程序 focused tests。
- [x] 运行用户小程序 lint/typecheck 如项目提供。
- [x] 运行业务边界 guard。
- [x] 运行完整 `pnpm run verify`。
- [ ] 提交 feature 分支。
- [ ] 推送并创建 PR。
- [ ] 等待 GitHub checks。
- [ ] checks 通过后合并回 `main`。
- [ ] 合并后创建中文 docs-only 完成分支并标记本计划完成。

验证证据：
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` 通过，10 个 test files、52 个测试通过。
- `apps/user-miniprogram/package.json` 仅提供 `test` 脚本，无独立 lint/typecheck 脚本；根 `pnpm run verify` 已覆盖仓库现有 lint/typecheck 链路。
- `pnpm run verify:business-boundary` 通过，报告 27 个已登记偏差文件。
- `git diff --check` 通过；仅输出 Windows 工作区 LF/CRLF 提示。
- 文档占位词检查无匹配。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 306/306 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 32 tests、用户小程序 10 files 52 tests。
