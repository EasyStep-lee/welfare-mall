# 退款渠道适配器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让订单退款申请能按正式线上渠道合同发起微信/支付宝退款请求，本地模式保持不访问外部网络。

**Architecture:** 在订单域内新增 `order-refund-provider` 端口和微信/支付宝实现，`OrderRefundService.createRefund` 创建本地退款单后读取原支付组件，计算本次线上退款金额，再调用 provider。福利卡退款仍由成功回调阶段原路退回账户；线上现金退款只允许微信/支付宝，线下现金不进入用户退款链路。

**Tech Stack:** NestJS, TypeScript, Node `crypto`, Node `fetch`, Prisma, Jest.

---

## 强约束

- 用户退款只能拆为福利卡原路退回和线上现金原渠道退款。
- 线上现金退款只允许 `wechat` 或 `alipay`。
- 不新增门店/商店主模型，不新增线下现金支付或退款渠道。
- `REFUND_CHANNEL_PROVIDER_MODE=real` 时缺微信/支付宝必要配置必须失败，不能静默本地成功。
- 本切片不处理真实微信/支付宝回调验签；仍沿用现有退款回调入口推进订单、福利卡流水和结算冲减。

## 任务 1：新增 provider 合同与单元测试

**Files:**
- Create: `apps/api/src/order/order-refund-provider.ts`
- Create: `apps/api/test/order/order-refund-provider.spec.ts`

- [x] **Step 1: 写失败测试**

覆盖：
- 微信真实模式向 `/v3/refund/domestic/refunds` 发送签名 JSON 请求。
- 支付宝真实模式向网关发送 `alipay.trade.refund` 表单请求。
- 缺配置时报错。
- `cash` 不是合法用户退款渠道。

Run:
`pnpm --filter @welfare-mall/api run test -- test/order/order-refund-provider.spec.ts --runInBand`

Expected: 因 `order-refund-provider.ts` 尚不存在失败。

- [x] **Step 2: 实现最小 provider**

实现：
- `RefundChannelProvider` 接口。
- `createRefundChannelProviderFromEnv` 工厂。
- `NoopRefundChannelProvider` 本地模式，不访问外部网络。
- `WechatRefundChannelProvider` 使用 RSA-SHA256 生成 `WECHATPAY2-SHA256-RSA2048` Authorization。
- `AlipayRefundChannelProvider` 使用 RSA-SHA256 生成 `sign`，金额从分转元。

- [x] **Step 3: 运行测试变绿**

Run:
`pnpm --filter @welfare-mall/api run test -- test/order/order-refund-provider.spec.ts --runInBand`

Expected: PASS。

## 任务 2：把 provider 接入退款申请服务

**Files:**
- Modify: `apps/api/src/order/order-refund.service.ts`
- Modify: `apps/api/src/order/order-refund.repository.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Modify: `apps/api/test/order/order-refund.service.spec.ts`
- Modify: `apps/api/test/order/order-refund.repository.spec.ts`

- [x] **Step 1: 写失败测试**

服务测试覆盖：
- 创建退款后读取 provider 上下文，并只把线上现金组件金额交给 provider。
- 纯福利卡退款不调用 provider。

仓储测试覆盖：
- `findRefundProviderContext` 返回支付单、原 provider payment no、原线上金额和组件。
- `markRefundProviderInitiated` 可在 processing 退款上写入 provider refund no。

Run:
`pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/order/order-refund.repository.spec.ts --runInBand`

Expected: 因方法不存在失败。

- [x] **Step 2: 实现服务接入**

实现：
- `OrderRefundService` 可注入 `REFUND_CHANNEL_PROVIDER`。
- 本地默认 provider 为 no-op。
- 创建退款后读取原支付组件。
- 按组件顺序分摊本次退款，计算线上现金退款金额。
- 线上退款金额大于 0 时调用 provider，并写回 provider refund no。

- [x] **Step 3: 运行 focused tests 变绿**

Run:
`pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/order/order-refund.repository.spec.ts test/order/order-refund-provider.spec.ts --runInBand`

Expected: PASS。

## 任务 3：验证与收口

- [x] **Step 1: 类型与边界验证**

Run:
`pnpm --filter @welfare-mall/api run typecheck`
`pnpm run verify:business-boundary`

Expected: PASS。

- [x] **Step 2: 全量验证**

Run:
`pnpm run verify`

Expected: PASS。

- [x] **Step 3: Docker API 重建与 smoke**

Run:
`docker compose up -d --build api`
`pnpm run docker:runtime:smoke`

Expected: PASS。

验证记录：
- RED：`pnpm --filter @welfare-mall/api run test -- test/order/order-refund-provider.spec.ts --runInBand` 首次失败于缺少 provider 模块。
- RED：`pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts --runInBand` 失败于缺少原支付上下文时仍先创建退款单。
- focused：`pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/order/order-refund.repository.spec.ts test/order/order-refund-provider.spec.ts test/order/order-refund.e2e-spec.ts --runInBand` 通过，4 个文件 28 个用例。
- 全量：`pnpm run verify` 通过，包含 frontend stack guard、business boundary、Prisma generate、lint、typecheck 和 68 个 API 测试套件。
- Docker：`docker compose up -d --build api`、`pnpm run docker:runtime:smoke`、`pnpm run docker:order-flow-smoke` 通过。
- 本地退款 HTTP 验证：订单 `ORDER-20260612130036432-IQQMWV`、支付 `PAY-20260612130036489-SRVL4W`、退款 `REF-20260612130036705-QQZG7R` 创建成功；local provider 模式下 `providerRefundNo=null`。

- [x] **Step 4: 提交、推送、PR、checks、合并**

提交 feature 分支，推送 `codex/refund-provider-adapters`，创建 PR，等待 `docs-check` 和 `project-foundation-check`，通过后 squash merge 回 `main`。

完成记录：
- feature 分支：`codex/refund-provider-adapters`
- feature commit：`5578a5f feat: add refund provider adapters`
- feature PR：`#299 feat: add refund provider adapters`
- GitHub checks：`docs-check` 通过，`project-foundation-check` 通过。
- feature PR 已 squash merge 到 `main`，合并提交：`4642659 feat: add refund provider adapters (#299)`。
- docs-only 分支：`codex/docs-refund-provider-adapters-complete`
- 本切片完成后剩余工作：微信/支付宝退款回调验签与解密、真实渠道错误码映射、目标环境支付退款密钥模板、Portal/小程序退款组件展示、纯福利卡退款自动完成策略。
