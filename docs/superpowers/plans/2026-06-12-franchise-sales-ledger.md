# 加盟商销售账与收款归属账实施计划

> **给执行代理：** 必须按 TDD 执行。先写失败测试，再实现，再验证。本文档为中文主计划，后续完成记录也必须使用中文。

**目标：** 在支付与退款主链路中固化“加盟商是真实销售方、福利卡发行方、销售账主体、收款归属主体”的账务事实。支付成功生成加盟商销售/应收流水，退款成功生成加盟商冲减流水；商户结算账仍只表达加盟商应与商户结算的货款，不把用户支付误写成直接付给商户。

**架构：** 新增 `FranchiseSalesLedgerEntry` 事件流水表。支付成功写入正向 `order_paid` 流水；退款成功写入负向 `refund_succeeded` 流水。流水记录加盟商、订单、支付、退款、购买用户、福利卡金额、线上现金金额和有符号金额。

**业务强约束：**
- 主体链固定为平台 -> 加盟商 -> 商户 -> 商品/SKU -> 订单。
- 加盟商是销售账和收款归属主体。
- 商户是履约和货款结算对象，不是用户支付收款主体。
- 用户线上现金只允许微信支付/支付宝；无线下现金支付。
- 退款是原路冲减：本切片在加盟商账中记录冲减流水，福利卡和线上现金真实退款由既有支付/退款链路继续承担。

**本切片范围：**
- 新增加盟商销售流水模型。
- 支付成功回调后生成加盟商正向销售流水。
- 退款成功回调后生成加盟商负向冲减流水。
- 与现有商户结算账并行，不改变商户结算确认语义。

**暂不纳入本切片：**
- 加盟商销售账前端工作台。
- 加盟商收款对账单/提现/打款确认流程。
- 多支付组件退款逐组件状态机。
- 正式组织权限下的加盟商财务角色细分。

---

### 任务 1：RED 加盟商销售账测试

**文件：**
- 修改：`apps/api/test/settlement/settlement.repository.spec.ts`
- 修改：`apps/api/test/order/order-payment.service.spec.ts`
- 修改：`apps/api/test/order/order-refund.service.spec.ts`

- [x] **步骤 1：仓储层要求生成加盟商支付流水**

覆盖：
- 已支付订单必须生成 `order_paid` 加盟商销售流水。
- 流水必须记录 `franchiseId`、`orderNo`、`paymentNo`、`buyerUserId`、福利卡金额、线上现金金额和正向金额。

- [x] **步骤 2：仓储层要求生成加盟商退款冲减流水**

覆盖：
- 成功退款必须生成 `refund_succeeded` 加盟商冲减流水。
- 流水必须记录 `refundNo`，金额为负数。
- 福利卡退款金额按既有规则优先冲减福利卡支付部分，剩余为线上现金冲减。

- [x] **步骤 3：服务层要求接入支付/退款回调**

覆盖：
- 非重复支付成功回调同时生成商户结算账和加盟商销售流水。
- 重复或失败支付回调不生成加盟商流水。
- 非重复退款成功回调同时生成商户冲减和加盟商冲减流水。
- 重复或失败退款回调不生成加盟商冲减流水。

RED 证据：
- focused tests 失败，显示 `generateFranchiseSalesLedgerForPaidOrder` 和 `generateFranchiseSalesLedgerForSucceededRefund` 方法不存在，服务层也未调用对应方法。

### 任务 2：GREEN 加盟商账实现

**文件：**
- 修改：`apps/api/prisma/schema.prisma`
- 修改：`apps/api/src/settlement/settlement-status.ts`
- 修改：`apps/api/src/settlement/settlement.repository.ts`
- 修改：`apps/api/src/order/order-payment.service.ts`
- 修改：`apps/api/src/order/order-refund.service.ts`

- [x] **步骤 1：新增 `FranchiseSalesLedgerEntry` 模型**

字段包括：
- `entryNo`
- `franchiseId`
- `orderNo`
- `paymentNo`
- `refundNo`
- `buyerUserId`
- `source`
- `status`
- `totalAmount`
- `welfareCardAmount`
- `onlineCashAmount`
- `amount`

- [x] **步骤 2：支付成功生成正向流水**

规则：
- 只处理已支付订单。
- 必须有 `salesFranchiseId`。
- 从已支付 payment 读取福利卡金额和线上现金金额。
- `amount` 为正数。
- 使用 `createMany(..., skipDuplicates: true)` 保证幂等。

- [x] **步骤 3：退款成功生成负向流水**

规则：
- 必须有订单销售加盟商。
- 读取原支付的福利卡/线上现金构成。
- 福利卡冲减金额为 `min(welfareCardPayableAmount, refundAmount)`。
- 线上现金冲减金额为剩余金额。
- `amount` 为负数。
- 使用 `createMany(..., skipDuplicates: true)` 保证幂等。

- [x] **步骤 4：服务层接入**

规则：
- 支付成功回调非重复且状态为 `paid` 时，生成商户结算账后生成加盟商销售流水。
- 退款成功回调非重复且状态为 `succeeded` 时，生成商户冲减后生成加盟商冲减流水。
- 重复回调、失败回调不生成账务流水。

### 任务 3：验证

- [x] 运行 focused RED/GREEN tests。
- [x] 运行 Prisma validate/generate。
- [x] 运行 API typecheck。
- [x] 运行业务边界 guard。
- [x] 运行完整 `pnpm run verify`。
- [x] 运行 Docker runtime/API 真实写入验证。
- [x] 运行 `git diff --check`。

验证证据：
- `pnpm --filter @welfare-mall/api test -- --runInBand test/settlement/settlement.repository.spec.ts test/order/order-payment.service.spec.ts test/order/order-refund.service.spec.ts` 通过，32 个测试通过。
- 带本地 Docker MySQL `DATABASE_URL` 后，`pnpm --dir apps/api exec prisma validate --schema prisma/schema.prisma` 通过。
- `pnpm --dir apps/api exec prisma generate --schema prisma/schema.prisma` 通过。
- `pnpm --filter @welfare-mall/api run typecheck` 通过。
- `pnpm run verify:business-boundary` 通过，报告 27 个已登记偏差文件。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 291/291 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 26 tests、用户小程序 43 tests。
- Docker API 镜像用当前分支重建并重启，容器健康，启动时 `prisma db push` 后 MySQL 已存在 `franchise_sales_ledger_entry` 表。
- `pnpm run docker:runtime:smoke` 通过。
- 真实支付/退款账务验证通过：临时用户 `franchise-ledger-user-20260612035337623` 使用 1000 分福利卡和 5990 分微信补差创建并支付订单 `ORDER-20260612035338063-4PGHX0`，支付号 `PAY-20260612035338181-UF2S2J`；随后退款 `REF-20260612035338367-UF2XJC` 成功，退款 2000 分。数据库中加盟商销售流水写入 `order_paid +6990` 和 `refund_succeeded -2000` 两条记录，其中退款拆分为福利卡 1000 分、线上现金 1000 分；商户结算账保留为加盟商应结算给商户的净额 4990 分。
- `pnpm run docker:page-smoke` 通过。
- `git diff --check` 通过；只输出 Windows 工作区 LF/CRLF 提示。

### 任务 4：完成

- [x] 提交 feature 分支。
- [x] 推送并创建 PR。
- [x] 等待 GitHub checks。
- [x] checks 通过后合并回 `main`。
- [x] 合并后创建中文 docs-only 完成分支并标记本计划完成。

完成记录：
- feature 分支：`codex/franchise-sales-ledger`
- feature 提交：`33ec63c feat: add franchise sales ledger`
- feature PR：`#289 feat: add franchise sales ledger`
- GitHub checks：`docs-check` 通过，`project-foundation-check` 通过。
- feature 合并提交：`1e337eb feat: add franchise sales ledger (#289)`
- docs-only 分支：`codex/docs-franchise-sales-ledger-complete`

剩余工作：
- 加盟商销售账前端工作台仍需继续补齐，当前切片只完成后端流水事实和回调写账。
- 加盟商收款对账单、应收确认、提现或打款确认仍需单独切片实现。
- 福利卡完整“批次、实体卡、绑卡账户”体系仍需继续从当前账户余额模型扩展。
- 退款仍需继续升级为按支付组件逐项状态机和回调幂等确认。
- 正式组织、部门、岗位、角色、加盟商账号、商户账号和用户账号体系仍需继续替换本地过渡身份。
