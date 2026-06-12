# Portal 福利卡账户选择与绑卡入口实施计划

> **给执行代理：** 必须按 TDD 执行。先写失败测试，再实现，再验证。本文档、完成记录和后续 docs-only 收口必须使用中文。

**目标：** 把 Portal 用户侧从“手填福利卡抵扣金额”的过渡形态，推进到“用户登录后查看自己在销售加盟商下的福利卡账户，选择账户后进入正式组合支付组件合同”的主链路。

**架构：** 后端新增买家视角福利卡账户列表 API，基于 buyer JWT 和销售加盟商过滤 active 账户。Portal 在订单详情支付区域加载该订单销售加盟商下的账户，福利卡金额大于 0 时必须选择一个账户，并把 `welfareCardAccountId` 随支付创建请求提交给既有 `OrderPaymentComponent` 合同。Portal 同时提供实体卡绑卡入口，调用已存在的 `POST /api/franchises/:franchiseId/welfare-cards/bind`。

**业务强约束：**
- 加盟商是福利卡发行方、真实销售方、销售账主体、收款归属主体。
- 商户是商品发布、库存和履约主体，不直接承接用户支付。
- 用户支付只能是福利卡加线上现金组合；线上现金只允许微信支付和支付宝。
- 福利卡支付组件必须绑定用户在订单销售加盟商下的福利卡账户。
- 无线下现金支付；线下只允许出现在加盟商与商户结算打款确认语义里。
- 不引入门店/商店主模型，不新增 `shop/store` 主链路语义。

**本切片范围：**
- 新增买家福利卡账户列表 API。
- Portal API client 增加账户列表、绑卡和支付账户 ID 字段。
- Portal 订单支付区域显示可选账户，并在福利卡抵扣金额大于 0 时强制选择账户。
- Portal 商品详情提供用户绑卡入口，绑卡后刷新当前销售加盟商下账户。

**暂不纳入本切片：**
- 用户小程序页面改造。
- 多张福利卡叠加支付。
- 原路退款按组件逐项拆分。
- 卡号/绑定码安全生成、脱敏展示、加密存储。
- 正式组织、部门、岗位、角色账号体系替换本地过渡账号。

---

### 任务 1：RED 后端买家账户列表合同

**文件：**
- 修改：`apps/api/test/franchise/welfare-card.repository.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.service.spec.ts`
- 修改：`apps/api/test/franchise/welfare-card.e2e-spec.ts`

- [x] 仓储层按 `franchiseId + buyerUserId + active` 查询福利卡账户。
- [x] 服务层规范化 `franchiseId`、`buyerUserId`。
- [x] API `GET /api/franchises/:franchiseId/welfare-card-accounts/me` 只允许 buyer JWT 读取自己账户。
- [x] 非 buyer 用户请求账户列表返回 403。

RED 证据：
- 首次 focused API 测试失败于 `service.listBuyerWelfareCardAccounts is not a function`、`repository.listBuyerWelfareCardAccounts is not a function`，以及账户列表 API 返回 404。

### 任务 2：GREEN 后端实现

**文件：**
- 修改：`apps/api/src/franchise/welfare-card.repository.ts`
- 修改：`apps/api/src/franchise/welfare-card.service.ts`
- 修改：`apps/api/src/franchise/franchise.controller.ts`

- [x] 实现仓储查询和返回结构。
- [x] 接入 service/controller。
- [x] Swagger 示例使用中文业务语义。

GREEN 证据：
- `pnpm --filter @welfare-mall/api test -- --runInBand test/franchise/welfare-card.repository.spec.ts test/franchise/welfare-card.service.spec.ts test/franchise/welfare-card.e2e-spec.ts` 通过，3 个 suite、24 个测试通过。

### 任务 3：RED Portal 用户侧选择账户

**文件：**
- 修改：`apps/portal/src/api.ts`
- 修改：`apps/portal/src/App.test.ts`

- [x] Portal API client 支持 `fetchPortalWelfareCardAccounts`。
- [x] Portal 支付请求类型支持 `welfareCardAccountId`。
- [x] 订单福利卡金额大于 0 时，Portal 显示“选择福利卡账户”并把选中账户 ID 传给 `/orders/payments`。
- [x] 未选择账户时拦截支付并显示错误。
- [x] Portal 绑卡成功后刷新当前销售加盟商账户。

RED 证据：
- 首次 focused Portal 测试失败于 `fetchPortalWelfareCardAccounts is not a function`、`bindPortalWelfareCard is not a function`、未显示账户选择、未拦截未选账户支付、商品详情缺少“福利卡卡号”输入框。

### 任务 4：GREEN Portal 实现

**文件：**
- 修改：`apps/portal/src/api.ts`
- 修改：`apps/portal/src/App.vue`

- [x] 增加账户列表状态、加载状态和错误状态。
- [x] 订单详情打开时按 `selectedOrder.salesFranchiseId` 拉取账户。
- [x] 支付请求加入 `welfareCardAccountId`。
- [x] 增加实体卡绑卡表单，成功后刷新账户列表。

GREEN 证据：
- `pnpm --filter @welfare-mall/portal test -- run src/api.test.ts src/App.test.ts` 通过，2 个文件、32 个测试通过。

### 任务 5：验证与完成

- [x] 运行 focused API tests。
- [x] 运行 focused Portal tests。
- [x] 运行 API typecheck。
- [x] 运行 Portal typecheck/test。
- [x] 运行业务边界 guard。
- [x] 运行完整 `pnpm run verify`。
- [x] 如改动影响运行态，重建 Docker API/Portal 并验证源码、served bundle、浏览器实际行为三层一致。
- [ ] 提交 feature 分支。
- [ ] 推送并创建 PR。
- [ ] 等待 GitHub checks。
- [ ] checks 通过后合并回 `main`。
- [ ] 合并后创建中文 docs-only 完成分支并标记本计划完成。

验证证据：
- `pnpm --filter @welfare-mall/api test -- --runInBand test/franchise/welfare-card.repository.spec.ts test/franchise/welfare-card.service.spec.ts test/franchise/welfare-card.e2e-spec.ts` 通过，3 个 suite、24 个测试通过。
- `pnpm --filter @welfare-mall/portal test -- run src/api.test.ts src/App.test.ts` 通过，2 个文件、32 个测试通过。
- `pnpm --filter @welfare-mall/api run typecheck` 通过。
- `pnpm --filter @welfare-mall/portal run typecheck` 通过。
- `pnpm run verify:business-boundary` 通过，报告 27 个已登记偏差文件。
- `git diff --check` 通过；只输出 Windows 工作区 LF/CRLF 提示。
- `pnpm run verify` 通过，包含前端技术栈边界、业务边界、Prisma generate、lint、typecheck、API Jest 67/67 suites 306/306 tests、Admin 26 tests、Franchise 3 tests、Merchant 20 tests、Portal 32 tests、用户小程序 43 tests。
- Docker API/Portal 镜像使用当前分支重建成功，并通过 `docker compose up -d --no-build --force-recreate api portal` 重启，API 容器健康。
- `pnpm run docker:runtime:smoke` 通过。
- `pnpm run docker:page-smoke` 通过。
- served Portal bundle `/assets/index-Ct29ONx1.js` 已包含 `选择福利卡账户`、`福利卡卡号`、`welfare-card-accounts/me`、`welfareCardAccountId`、`welfare-cards/bind`。
- 浏览器验证通过：在 `http://localhost:5175/` 使用用户端绑定实体卡 `WFC-portal-browser-bind-20260612014046-0001`，创建福利卡抵扣 1000 分、微信补差 5990 分的订单 `ORDER-20260612054211402-GDDGNG`；未选择账户时显示“请先选择福利卡账户”，选择账户后支付单创建成功，浏览器 console error 为空。
- DB 验证通过：支付单 `PAY-20260612054246761-3TMKTP` 写入 2 条 `order_payment_component`，其中 `welfare_card` 组件绑定账户 `cmq9gnt320009lx1te1v9j1zi`、金额 1000 分，`online_cash` 组件渠道 `wechat`、金额 5990 分，加盟商为 `franchise-local-review`、用户为 `user-001`。
