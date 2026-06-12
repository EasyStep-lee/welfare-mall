# 福利卡批次、实体卡与绑卡账户实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把福利卡从“加盟商直接给用户账户发余额”的过渡形态，推进到“加盟商发行批次、生成实体卡、用户绑卡到账户”的正式后端合同。

**Architecture:** 保留现有 `WelfareCardAccount` 与 `WelfareCardLedgerEntry` 作为用户余额账户和余额流水；新增 `WelfareCardBatch` 与 `WelfareCard` 表。加盟商创建批次时生成实体卡；用户用 `cardNo + bindCode` 绑定实体卡，绑定成功后创建或更新对应加盟商下的用户福利卡账户，并写 `bind` 类型流水。

**Tech Stack:** NestJS、Prisma、MySQL、Jest、Supertest。Admin/Merchant 仍保持 Vue 3 + Vite + Element Plus，Portal 仍保持 Vue 3 + Vite；本切片不改前端。

**业务强约束：**
- 加盟商是福利卡发行方，实体卡必须带 `issuerFranchiseId`。
- 用户是绑卡方，绑卡必须使用 JWT buyer 身份；不能依赖固定本地用户 ID。
- 批次创建不直接增加用户余额；用户绑卡成功后才形成或增加福利卡账户余额。
- 每次余额增加必须写流水，绑卡流水类型为 `bind`。
- 兼容保留旧 `issueWelfareCard` 直接发余额接口，但新主链路优先使用批次/实体卡/绑卡。
- 不引入门店/商店模型，不引入线下现金支付语义。

**本切片范围：**
- 新增批次表与实体卡表。
- 新增加盟商创建批次 API。
- 新增用户绑卡 API。
- 仓储层实现批次创建、实体卡生成、绑卡到账户、绑卡流水与幂等。

**暂不纳入本切片：**
- Portal/小程序绑卡 UI。
- 多张福利卡支付选择 UI。
- 卡密加密、短信发卡、实体制卡导出。
- 加盟商卡批次前端列表与卡明细查询。

---

### 任务 1：RED 批次与实体卡测试

**文件：**
- 修改：`apps/api/test/franchise/welfare-card.repository.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.service.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.e2e-spec.ts`

- [x] **步骤 1：仓储层要求创建批次和实体卡**

覆盖：
- `createWelfareCardBatch` 必须创建一条批次记录。
- 必须按 `totalCards` 生成对应数量的实体卡。
- 批次和实体卡都必须记录发行加盟商 `issuerFranchiseId`。
- 实体卡初始状态为 `unbound`。

- [x] **步骤 2：服务层要求校验批次输入**

覆盖：
- `franchiseId`、`requestId`、`batchName` 必须非空。
- `faceValueAmount` 与 `totalCards` 必须为正整数。
- 通过后调用仓储层。

- [x] **步骤 3：API 要限制批次创建主体**

覆盖：
- 加盟商 JWT 只能为自己创建批次。
- 平台 JWT 可为指定加盟商创建批次。
- 未登录请求被拒绝。

RED 证据：
- focused tests 初始失败：批次创建 API 返回 404，`service.createWelfareCardBatch is not a function`，仓储状态常量 `WelfareCardBatchStatuses.Active` 尚不存在。

### 任务 2：RED 用户绑卡测试

**文件：**
- 修改：`apps/api/test/franchise/welfare-card.repository.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.service.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.e2e-spec.ts`

- [x] **步骤 1：仓储层要求绑卡到账户并写流水**

覆盖：
- 按 `cardNo + bindCode` 查找未绑定实体卡。
- 绑定成功后实体卡状态变为 `bound`，记录 `boundBuyerUserId`、`boundAccountId`、`boundAt`。
- 若用户在该加盟商下没有账户，则创建账户。
- 账户余额和累计发行金额增加实体卡面值。
- 写入 `bind` 类型福利卡流水，`balanceAfter` 等于绑定后的账户余额。

- [x] **步骤 2：服务层要求使用 JWT buyer 身份**

覆盖：
- `buyerUserId` 来自登录用户 `subjectId`。
- `requestId`、`cardNo`、`bindCode` 必须非空。
- 非 buyer 用户不能走用户绑卡主链路。

- [x] **步骤 3：API 要提供用户绑卡合同**

覆盖：
- `POST /api/franchises/:franchiseId/welfare-cards/bind` 使用 Bearer buyer token。
- 请求体只传 `requestId`、`cardNo`、`bindCode`。
- 即使请求体带攻击者 `buyerUserId`，也不能覆盖 JWT buyer 身份。

RED 证据：
- focused tests 初始失败：绑卡 API 返回 404，`service.bindWelfareCard is not a function`，实体卡状态常量尚不存在。

### 任务 3：GREEN 实现正式合同

**文件：**
- 修改：`apps/api/prisma/schema.prisma`
- 修改：`apps/api/src/franchise/welfare-card-status.ts`
- 修改：`apps/api/src/franchise/welfare-card.repository.ts`
- 修改：`apps/api/src/franchise/welfare-card.service.ts`
- 修改：`apps/api/src/franchise/franchise.controller.ts`

- [x] **步骤 1：新增 Prisma 模型**

新增：
- `WelfareCardBatch`
- `WelfareCard`

关键字段：
- 批次：`batchNo`、`requestId`、`issuerFranchiseId`、`batchName`、`faceValueAmount`、`totalCards`、`totalAmount`、`status`、`createdBy`、`remark`。
- 实体卡：`cardNo`、`bindCode`、`batchId`、`issuerFranchiseId`、`faceValueAmount`、`status`、`boundBuyerUserId`、`boundAccountId`、`boundAt`。

- [x] **步骤 2：新增状态常量**

新增：
- `WelfareCardBatchStatuses.Active`
- `WelfareCardStatuses.Unbound`
- `WelfareCardStatuses.Bound`
- `WelfareCardLedgerEntryTypes.Bind`

- [x] **步骤 3：实现创建批次**

规则：
- `requestId` 幂等：重复请求返回已创建批次和实体卡摘要。
- 卡号格式为 `WFC-<normalized requestId>-<sequence>`。
- 绑定码格式为 `BIND-<normalized requestId>-<sequence>`。
- 创建批次和实体卡必须在同一事务。

- [x] **步骤 4：实现用户绑卡**

规则：
- 使用 `requestId` 对绑卡流水幂等。
- 只允许绑定 `unbound` 状态实体卡。
- 绑定时锁定实体卡所属发行加盟商，账户必须是同一加盟商下的买家账户。
- 绑定成功后写 `bind` 流水并增加账户余额。

- [x] **步骤 5：接入 Controller**

接口：
- `POST /api/franchises/:franchiseId/welfare-card-batches`
- `POST /api/franchises/:franchiseId/welfare-cards/bind`

权限：
- 批次创建：平台或该加盟商。
- 用户绑卡：必须是 buyer JWT，且实体卡发行加盟商必须等于路径加盟商。

### 任务 4：验证与完成

- [x] 运行 focused RED/GREEN tests。
- [x] 运行 Prisma validate/generate。
- [x] 运行 API typecheck。
- [x] 运行业务边界 guard。
- [x] 运行完整 `pnpm run verify`。
- [x] 运行 Docker runtime/API 真实写入验证。
- [x] 运行 `git diff --check`。
- [x] 提交 feature 分支。
- [x] 推送并创建 PR。
- [x] 等待 GitHub checks。
- [x] checks 通过后合并回 `main`。
- [x] 合并后创建中文 docs-only 完成分支并标记本计划完成。

验证证据：
- 基线 focused tests 初始通过：`pnpm --filter @welfare-mall/api test -- --runInBand test/franchise/welfare-card.repository.spec.ts test/franchise/welfare-card.service.spec.ts test/franchise/welfare-card.e2e-spec.ts`，3 个 suite、9 个测试通过。
- RED focused tests 失败，失败点为批次/绑卡接口 404、服务方法不存在、状态常量不存在。
- GREEN focused tests 通过：同一命令 3 个 suite、19 个测试通过。
- 带本地 Docker MySQL `DATABASE_URL` 后，`pnpm --dir apps/api exec prisma validate --schema prisma/schema.prisma` 通过。
- `pnpm --filter @welfare-mall/api run prisma:generate` 通过。
- `pnpm --filter @welfare-mall/api run typecheck` 通过。
- `pnpm run verify:business-boundary` 通过，报告 27 个已登记偏差文件。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 301/301 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 26 tests、用户小程序 43 tests。
- `git diff --check` 通过；只输出 Windows 工作区 LF/CRLF 提示。
- Docker API 镜像用当前分支重建并重启，容器健康，启动时 `prisma db push` 后 MySQL 已存在 `welfare_card_batch`、`welfare_card`、`welfare_card_account`、`welfare_card_ledger_entry` 表。
- `pnpm run docker:runtime:smoke` 通过。
- 真实 HTTP/DB 验证通过：加盟商 JWT 创建批次 `WCB-batch-live-20260612044947`，生成 2 张面值 1234 分实体卡；buyer JWT 绑定卡 `WFC-batch-live-20260612044947-0001`，即使请求体带 `buyerUserId=attacker-user`，DB 中仍绑定到 JWT 用户 `user-001`；账户 `WCA-franchise-local-review-user-001` 增加余额，流水 `WCL-bind-live-20260612044947` 类型为 `bind`、金额 1234 分。
- `pnpm run docker:order-flow-smoke` 通过，订单 `ORDER-20260612045039334-R3J4SR` 完成 smoke。

完成记录：
- feature 分支：`codex/welfare-card-batch-binding`
- feature 提交：`96f56d7 feat: add welfare card batch binding`
- feature PR：`#291 feat: add welfare card batch binding`
- GitHub checks：`docs-check` 通过，`project-foundation-check` 通过。
- feature 合并提交：`97cfe5a feat: add welfare card batch binding (#291)`
- docs-only 分支：`codex/docs-welfare-card-batch-binding-complete`

剩余工作：
- Portal/用户小程序仍需补正式绑卡 UI，并从用户账户列表选择福利卡账户进入组合支付。
- Franchise 工作台仍需补批次列表、实体卡明细、发卡导出和批次状态管理。
- 卡号/绑定码后续需要切到安全生成、脱敏展示和必要的加密存储策略。
- 多张福利卡叠加支付和按支付组件逐项退款状态机仍需继续单独切片。
- 正式组织、部门、岗位、角色、加盟商账号、商户账号和用户账号体系仍需继续替换本地过渡身份。
