# 订单正式组合支付组件合同实施计划

> **给执行代理：** 必须按 TDD 执行。先写失败测试，再实现，再验证。本文档为中文主计划，后续完成记录也必须使用中文。

**目标：** 把用户支付从“单个 `channel` 加两个金额字段”的过渡形态，推进到正式组合支付组件合同：一笔订单支付可以包含福利卡组件和线上现金组件；福利卡组件必须能绑定具体福利卡账户；线上现金组件只能是微信支付或支付宝。

**架构：** 保留 `OrderPayment.channel`、`welfareCardPayableAmount`、`cashPayableAmount` 作为历史兼容字段；新增 `OrderPaymentComponent` 作为新主合同。支付创建时，在同一事务里完成福利卡扣款、福利卡流水、`OrderPayment` 主记录、支付组件明细、订单状态进入待支付。

**业务强约束：**
- 加盟商仍是销售方、福利卡发行方、收款归属主体。
- 商户仍是商品发布、库存和履约主体，不直接承接用户支付。
- 用户支付只能是福利卡加线上现金组合；线上现金只允许微信支付和支付宝。
- 无线下现金支付；线下只允许出现在加盟商与商户结算打款确认语义里。
- 不引入门店/商店主模型，`pickupStoreName` 仍只作为历史兼容字段。

**本切片范围：**
- 新增订单支付组件表。
- API/Service 支持传入 `welfareCardAccountId`，并向仓储透传。
- 仓储创建支付组件明细：福利卡组件、线上现金组件。
- 福利卡扣款优先使用显式选择的福利卡账户，并校验账户属于订单销售加盟商和购买用户。

**暂不纳入本切片：**
- Portal/小程序正式账户选择 UI。
- 多张福利卡叠加支付。
- 原路退款组件拆分表。
- 加盟商销售账/收款归属账。该能力作为下一个独立切片。
- 清理 `pickupStoreName` 历史兼容字段。

---

### 任务 1：RED 支付组件合同测试

**文件：**
- 修改：`apps/api/test/order/order-payment.repository.spec.ts`
- 修改：`apps/api/test/order/order-payment.service.spec.ts`
- 修改：`apps/api/test/order/order-payment.e2e-spec.ts`

- [x] **步骤 1：仓储层要求创建支付组件**

覆盖：
- 纯线上现金支付创建 1 条 `online_cash` 组件。
- 福利卡加线上现金支付创建 1 条 `welfare_card` 组件和 1 条 `online_cash` 组件。
- 福利卡组件必须记录 `welfareCardAccountId`、`franchiseId`、`buyerUserId`。
- 余额不足时不能创建支付组件。

RED 证据：
- focused repository test 失败，显示 `orderPaymentComponent.createMany` 没有被调用。
- 混合支付仍按 `franchiseId_buyerUserId` 隐式查卡，未使用显式 `welfareCardAccountId`。

- [x] **步骤 2：API/Service 要透传福利卡账户选择**

覆盖：
- API 请求体传 `welfareCardAccountId` 后，Controller 调用 Service 时保留该字段。
- Service trim 后传给 Repository。

RED 证据：
- focused service/e2e test 失败，显示 `welfareCardAccountId` 被丢弃。

### 任务 2：GREEN 支付组件实现

**文件：**
- 修改：`apps/api/prisma/schema.prisma`
- 修改：`apps/api/src/order/order-payment.repository.ts`
- 修改：`apps/api/src/order/order-payment.service.ts`
- 修改：`apps/api/src/order/order.controller.ts`

- [x] **步骤 1：新增 `OrderPaymentComponent` 模型**

字段包括：
- `paymentId`、`paymentNo`、`orderNo`
- `sequenceNo`
- `componentType`
- `channel`
- `welfareCardAccountId`
- `franchiseId`
- `buyerUserId`
- `amount`
- `status`

- [x] **步骤 2：仓储创建组件明细**

规则：
- 福利卡金额大于 0 时创建 `welfare_card` 组件。
- 线上现金金额大于 0 时创建 `online_cash` 组件。
- 组件状态初始为 `pending`。
- 组件写入与支付创建在同一事务内。

- [x] **步骤 3：福利卡账户选择进入后端合同**

规则：
- 如果请求提供 `welfareCardAccountId`，按该账户查找。
- 账户必须属于订单销售加盟商和购买用户。
- 当前保留旧客户端兼容：未传账户时暂按加盟商加用户查找。

### 任务 3：验证

- [x] 运行 focused repository test。
- [x] 运行 focused service/e2e test。
- [x] 运行 Prisma generate/validate。
- [x] 运行 API typecheck。
- [x] 运行业务边界 guard。
- [x] 运行完整 `pnpm run verify`。
- [x] 运行 `git diff --check`。
- [x] 运行 Docker runtime/API 真实写入验证。

验证证据：
- `pnpm --filter @welfare-mall/api test -- --runInBand test/order/order-payment.repository.spec.ts` 通过，7 个测试通过。
- `pnpm --filter @welfare-mall/api test -- --runInBand test/order/order-payment.service.spec.ts test/order/order-payment.e2e-spec.ts` 通过，16 个测试通过。
- `pnpm --filter @welfare-mall/api test -- --runInBand test/order/order-payment.repository.spec.ts test/order/order-payment.service.spec.ts test/order/order-payment.e2e-spec.ts` 通过，23 个测试通过。
- 带本地 Docker MySQL `DATABASE_URL` 后，`pnpm --dir apps/api exec prisma validate --schema prisma/schema.prisma` 通过。
- `pnpm --dir apps/api exec prisma generate --schema prisma/schema.prisma` 通过。
- `pnpm --filter @welfare-mall/api run typecheck` 通过。
- `pnpm run verify:business-boundary` 通过，报告 27 个已登记偏差文件。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 289/289 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 26 tests、用户小程序 43 tests。
- `git diff --check` 通过；只输出 Windows 工作区 LF/CRLF 提示。
- Docker API 镜像用当前分支重建并重启，容器健康，启动时 `prisma db push` 后 MySQL 已存在 `order_payment_component` 表。
- `pnpm run docker:runtime:smoke` 通过。
- `pnpm run docker:order-flow-smoke` 通过，订单 `ORDER-20260612031606674-AAJWZ4` 创建并完成。
- 真实混合支付验证通过：先由加盟商给临时用户 `component-live-user-20260612031730048` 发放 2000 分福利卡余额，再创建订单 `ORDER-20260612031730397-6RUZNU` 和支付 `PAY-20260612031730473-12C1OZ`。数据库中该支付写入 2 条组件：`welfare_card` 组件绑定账户 `cmqacvrqu000fpf1yef0mg9ej`、金额 1000 分；`online_cash` 组件渠道 `wechat`、金额 5990 分；福利卡流水写入 `payment -1000`，余额 1000 分。
- `pnpm run docker:page-smoke` 通过。

### 任务 4：完成

- [ ] 提交 feature 分支。
- [ ] 推送并创建 PR。
- [ ] 等待 GitHub checks。
- [ ] checks 通过后合并回 `main`。
- [ ] 合并后创建中文 docs-only 完成分支并标记本计划完成。
