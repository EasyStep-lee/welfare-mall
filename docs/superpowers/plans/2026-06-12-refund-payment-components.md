# 退款支付组件原路拆分实施计划

> **给执行代理：** 必须按 TDD 执行。先写失败测试，再实现，再验证。本文档为中文计划，完成记录也必须使用中文。

**目标：** 把退款从“按订单旧金额字段推导福利卡退款”的过渡形态，推进到正式按 `OrderPaymentComponent` 拆分的原路退款合同。

**架构：** 保留 `OrderRefund.channel` 与 `refundAmount` 作为历史兼容字段；新增 `OrderRefundComponent` 作为新主合同。退款成功回调首次生效时，读取原支付组件，按退款金额顺序分摊到福利卡组件与线上现金组件，写入退款组件明细；福利卡组件退回原福利卡账户并写福利卡退款流水，线上现金组件记录微信或支付宝原路退款组件。

**技术栈：** NestJS API、Prisma、Jest、MySQL Docker 运行态。

**业务强约束：**
- 加盟商是真实销售方、福利卡发行方、销售账主体、收款归属主体。
- 商户是商品发布、库存和履约主体，并有实际地址；商户货款与加盟商结算。
- 用户支付方式为福利卡加线上现金组合支付；线上现金只允许微信支付或支付宝。
- 线下只存在加盟商与商户之间的结算打款确认，不属于用户支付方式。
- 平台没有核心门店或商店模型；`pickupStoreName` 只能作为历史兼容字段。

**本切片范围：**
- 新增退款组件表 `OrderRefundComponent`。
- 退款成功回调首次生效时按 `OrderPaymentComponent` 生成退款组件。
- 福利卡退款必须优先使用原支付组件上的 `welfareCardAccountId`，不能再只按加盟商加用户隐式找账户。
- 重复 providerEventId 或退款已成功后的新回调不能重复生成退款组件、重复退卡、重复写流水。

**暂不纳入本切片：**
- 真实微信或支付宝退款 API 适配器。
- 多张福利卡叠加退款的前端选择体验。
- Portal/小程序退款组件展示。
- 正式生产身份体系替换。
- 清理 `pickupStoreName` 历史兼容字段。

---

## 任务 1：RED 退款组件合同测试

**文件：**
- 修改：`apps/api/test/order/order-refund.repository.spec.ts`
- 修改：`apps/api/prisma/schema.prisma`
- 修改：`apps/api/src/order/order-refund.repository.ts`

- [x] 增加失败测试：混合支付退款成功回调按原支付组件创建 `welfare_card` 和 `online_cash` 两条退款组件。
- [x] 增加失败测试：福利卡退款使用原支付组件 `welfareCardAccountId` 查找账户，而不是 `franchiseId_buyerUserId`。
- [x] 增加失败测试：现金-only 退款只创建线上现金退款组件，不访问福利卡账户。
- [x] 增加失败测试：重复 providerEventId 或已成功退款后的新回调不创建退款组件，不重复退卡。
- [x] 运行 focused 测试，确认失败原因是缺少退款组件表/逻辑。

RED 证据：
- `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand` 失败，失败点为 `orderPaymentComponent.findMany` 没有被调用。

## 任务 2：GREEN 退款组件实现

**文件：**
- 修改：`apps/api/prisma/schema.prisma`
- 修改：`apps/api/src/order/order-refund.repository.ts`

- [x] 在 Prisma schema 中新增 `OrderRefundComponent` 模型，并关联 `OrderRefund`。
- [x] 在退款事务类型中加入 `orderPaymentComponent.findMany` 与 `orderRefundComponent.createMany`。
- [x] 退款成功回调首次生效时读取原支付组件并按金额分摊生成退款组件。
- [x] 福利卡退款改为按原支付组件账户 ID 退回账户，并保留账户归属校验。
- [x] 线上现金退款组件只允许 `wechat` 或 `alipay` 渠道。
- [x] 重复回调和已成功退款路径保持不触碰组件与福利卡流水。

## 任务 3：验证

- [x] `pnpm --dir apps/api exec prisma generate --schema prisma/schema.prisma`
- [x] `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`
- [x] `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/order/order-refund.e2e-spec.ts --runInBand`
- [x] `pnpm --filter @welfare-mall/api run typecheck`
- [x] `pnpm run verify:business-boundary`
- [x] `git diff --check`
- [x] `pnpm run verify`

验证证据：
- `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand` 通过，6 个测试通过。
- `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/order/order-refund.e2e-spec.ts --runInBand` 通过，12 个测试通过。
- `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts test/order/order-refund.service.spec.ts test/order/order-refund.e2e-spec.ts --runInBand` 通过，18 个测试通过。
- `pnpm --filter @welfare-mall/api run typecheck` 通过。
- 带本地 Docker MySQL `DATABASE_URL` 后，`pnpm --dir apps/api exec prisma validate --schema prisma/schema.prisma` 通过。
- `pnpm run verify:business-boundary` 通过，报告 28 个已登记偏差文件。
- `git diff --check` 通过；只输出 Windows 工作区 LF/CRLF 提示。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 306/306 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 32 tests、用户小程序 52 tests。
- Docker API 镜像用当前分支重建并重启，容器健康，启动时 `prisma db push` 后 MySQL 已存在 `order_refund_component` 表。
- `pnpm run docker:runtime:smoke` 通过。
- 真实退款组件验证通过：本地 buyer `user-001` 使用 1000 分福利卡和 5990 分微信补差创建并支付订单 `ORDER-20260612114442133-8RWEYY`，支付号 `PAY-20260612114442178-UH4UFE`；随后退款 `REF-20260612114442337-LXKG8C` 成功并重复回调一次。数据库中 `order_refund_component` 写入 `welfare_card` 组件 1000 分、账户 `cmq9gnt320009lx1te1v9j1zi`，以及 `online_cash` 微信组件 5990 分、provider 退款号 `provider-refund-20260612114442043`；福利卡退款流水按 `refund:refund-component-refund-20260612114442043` 只写入 1 条。

## 任务 4：完成

- [x] 提交 feature 分支。
- [x] 推送并创建 PR。
- [x] 等待 GitHub checks。
- [x] checks 通过后合并回 `main`。
- [x] 合并后创建中文 docs-only 完成分支并标记本计划完成。

完成记录：
- feature 分支：`codex/refund-payment-components`
- feature commit：`a713e0b feat: add refund payment components`
- feature PR：`#297 feat: add refund payment components`
- GitHub checks：`docs-check` 通过，`project-foundation-check` 通过。
- feature PR 已 squash merge 到 `main`，合并提交：`a04f90f feat: add refund payment components (#297)`。
- docs-only 分支：`codex/docs-refund-payment-components-complete`
- 本切片完成后剩余工作：真实微信/支付宝退款适配器、多张福利卡退款分摊、Portal/小程序退款组件展示、正式身份体系替换、清理 `pickupStoreName` 历史兼容字段。
