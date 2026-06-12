# Franchise 福利卡发放工作台实施计划

> **给智能执行者：** 必须使用 `superpowers:test-driven-development` 逐任务执行。步骤使用 checkbox (`- [ ]`) 跟踪。

**目标：** 新增独立 Franchise Vue 工作台，让加盟商登录后以自身加盟商身份发放福利卡，替代只依赖 Admin 过渡入口的发卡可见性。

**架构：** 后端本地登录增加 `franchise` subject，发卡接口使用 JWT 约束：平台人员可监管代操作，加盟商只能给自己的 `franchiseId` 发卡。前端新增 `apps/franchise`，复用 Vue 3 + Vite + Element Plus 登录和发卡面板，Docker 暴露 `5176`。

**技术栈：** API NestJS + Prisma；Franchise 前端 Vue 3 + Vite + Element Plus + Pinia；Vitest 做前端行为测试；Jest/Supertest 做 API 登录和发卡授权测试。

**业务约束：**
- 加盟商是福利卡发行方、销售账主体和收款归属主体。
- Admin 只能作为监管/本地过渡入口，不替代加盟商主链路。
- 商户不是福利卡发行方。
- 用户支付仍为福利卡 + 微信/支付宝线上现金组合支付；不引入线下现金支付。
- 不引入门店/商店主链路。

## 任务清单

- [x] 增加 API 失败测试：`franchise-local` 登录后返回 `subjectType=franchise`、`subjectId=franchise-local-review` 和加盟商权限。
- [x] 增加 API 失败测试：加盟商 JWT 调用自己的发卡接口成功，调用其他加盟商发卡接口返回 403；未登录调用返回 401。
- [x] 实现 API 本地加盟商用户和发卡接口 JWT 授权。
- [x] 新增 Franchise Vue 失败测试：登录页显示“加盟商登录”，登录成功后显示“福利卡发放”工作台并使用 JWT token。
- [x] 新增 Franchise Vue 失败测试：发卡表单提交到当前加盟商的 `/franchises/{franchiseId}/welfare-cards/issue`，成功后显示流水、余额、累计发行金额。
- [x] 新增 Franchise Vue 失败测试：缺少用户或正整数金额时不发请求，并显示中文错误。
- [x] 实现 `apps/franchise` package、API client、Vue 工作台、样式、Vite/TypeScript 配置和 Dockerfile。
- [x] 将 Franchise 纳入根 `lint`、`typecheck`、`test`、`build`、前端栈 guard、Docker compose、runtime smoke、page smoke。
- [x] 运行 focused API/Franchise 测试，确认 RED -> GREEN。
- [x] 运行 `pnpm run verify:frontend-stack`、`pnpm run verify:business-boundary`、Franchise typecheck/test 和全量 `pnpm run verify`。
- [x] 启动/刷新 Docker 运行态，验证 3000/5173/5174/5175/5176，确认 Franchise 源码、served bundle、真实 HTTP/API/DB 运行态一致；本轮未获得可调用的 in-app Browser 工具，因此不声称已完成点击验收。
- [ ] 提交、推送、开 PR，等待 checks，通过后合并回 `main`。
- [ ] 合并后使用 docs-only 分支把本计划标记完成，文档保持中文。

## 验收标准

- `franchise-local` 能登录，返回主体为 `franchise-local-review`。
- Franchise 工作台不要求手填发卡加盟商 ID，发卡加盟商来自 JWT subject。
- 发卡请求必须发送 Bearer token。
- Franchise 用户不能替其他加盟商发卡。
- 未登录不能调用发卡接口。
- Admin 监管入口仍可用，因为 platform subject 允许代操作。
- Docker page smoke 覆盖 Franchise 页面关键文案和 API 地址。

## 本地验证记录

- RED：`pnpm --filter @welfare-mall/api run test --runInBand test/auth/auth.e2e-spec.ts test/franchise/welfare-card.e2e-spec.ts` 失败，原因包括 `franchise-local` 登录返回 401、未登录发卡未被拒绝。
- GREEN：同一 API focused 命令通过，2 个测试文件、9 个测试通过。
- RED：`pnpm --filter @welfare-mall/franchise run test --run src/App.test.ts` 先失败于缺少 `./App`。
- GREEN：同一 Franchise focused 命令通过，1 个测试文件、3 个测试通过。
- `pnpm --filter @welfare-mall/franchise run typecheck`：通过。
- `pnpm run verify:frontend-stack`：通过。
- `pnpm run verify:business-boundary`：通过。
- `pnpm run verify`：通过，API 67 个套件、289 个测试通过；Admin、Franchise、Merchant、Portal、User MiniProgram 前端测试均通过。
- `pnpm run docker:runtime:up`：通过，启动 API 3000、Admin 5173、Merchant 5174、Portal 5175、Franchise 5176、MySQL 3306、Redis 6379。
- `pnpm run docker:runtime:smoke`：通过。
- `pnpm run docker:page-smoke`：通过，包含 Franchise 5176 页面 smoke。
- `node tools/verify-docker-release-manifest.cjs`：通过，release manifest 已包含 Franchise 镜像。
- Franchise served bundle `http://localhost:5176/assets/index-C-KAZWCs.js` 已包含 `加盟商登录`、`福利卡发放`、`http://localhost:3000/api`、`welfare-cards/issue`、`FRANCHISE-WELFARE-ISSUE`。
- HTTP/API/DB 运行态验证：`franchise-local` 登录返回 `subjectType=franchise`、`subjectId=franchise-local-review`；使用该 JWT 发卡成功，账户 `WCA-franchise-local-review-franchise-panel-user-20260611213244183` 和流水 `WCL-FRANCHISE-WELFARE-ISSUE-franchise-panel-user-20260611213244183-23456` 入库，余额与累计发行金额均为 `23456`。
- 浏览器边界：本轮工具发现未返回可调用的 in-app Browser 控制工具，因此没有声称完成点击级浏览器验收。
