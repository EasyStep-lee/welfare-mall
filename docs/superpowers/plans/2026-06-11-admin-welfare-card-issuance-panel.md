# Admin 福利卡发放过渡入口实施计划

> **给智能执行者：** 必须使用 `superpowers:test-driven-development` 逐任务执行。步骤使用 checkbox (`- [ ]`) 跟踪。

**目标：** 在 Admin 本地工作台增加一个可见的福利卡发放入口，调用现有加盟商发卡 API，并展示账户余额与发卡流水，避免福利卡发行能力只停留在后端不可见状态。

**架构：** 不新增核心门店/商店模型，不改变福利卡发行主体。Admin 入口只作为本地监管/过渡操作面板，接口仍指向 `POST /api/franchises/:franchiseId/welfare-cards/issue`，语义保持“加盟商发卡”。后续独立 Franchise 工作台仍是正式主链路。

**技术栈：** Admin Vue 3 + Vite + Element Plus，API 复用现有 NestJS 发卡接口，Vitest 做前端行为测试。

**业务约束：**
- 加盟商是福利卡发行方和销售账主体。
- Admin 只能作为监管/本地过渡入口，不把平台改成福利卡真实发行方。
- 用户支付方式仍是福利卡 + 微信/支付宝线上现金组合支付。
- 不引入线下现金支付。
- 不引入门店/商店主链路。

## 任务清单

- [x] 增加 Admin Vue 失败测试：页面显示“福利卡发放”面板，填写加盟商、用户、金额、备注后调用加盟商发卡 API。
- [x] 增加 Admin Vue 失败测试：缺少加盟商、用户或正整数金额时，不调用 API，并显示中文校验错误。
- [x] 在 Admin API client 增加 `issueWelfareCard()` 类型和请求函数。
- [x] 在 Admin App 中增加福利卡发放表单、校验、成功结果展示。
- [x] 运行 Admin focused 测试，确认 RED -> GREEN。
- [x] 运行 `pnpm run verify:frontend-stack`、`pnpm run verify:business-boundary`、Admin typecheck/test 和全量 `pnpm run verify`。
- [x] 如涉及 Docker served bundle，重建 Admin 容器并验证源码、served bundle、真实 HTTP/API/DB 运行态；本轮未获得可调用的 in-app Browser 工具，因此不声称已完成点击验收。
- [ ] 提交、推送、开 PR，等待 checks，通过后合并回 `main`。
- [ ] 合并后使用 docs-only 分支把本计划标记完成，文档保持中文。

## 验收标准

- Admin 登录后能看到“福利卡发放”面板。
- 面板字段使用业务含义：发卡加盟商ID、发卡用户ID、发卡金额(分)、发卡备注。
- 点击“发放福利卡”会调用 `/api/franchises/{franchiseId}/welfare-cards/issue`。
- 成功后页面显示发卡流水号、用户、余额、累计发行金额。
- 缺少必填字段或金额不是正整数时，不发送请求，并显示中文错误。
- 页面文案不把平台描述为福利卡发行方。

## 本地验证记录

- `pnpm --filter @welfare-mall/admin run test --run src/App.test.ts`：先失败后通过，覆盖面板可见、发卡请求体、成功展示和前端校验。
- `pnpm --filter @welfare-mall/admin run typecheck`：通过。
- `pnpm run verify:frontend-stack`：通过。
- `pnpm run verify:business-boundary`：通过。
- `pnpm run verify`：通过。
- `docker build -t welfare-mall-v2-admin:local -f apps/admin/Dockerfile --build-arg VITE_ADMIN_API_BASE_URL=http://localhost:3000/api .`：通过。
- `docker compose up -d --no-build admin`：通过。
- `pnpm run docker:runtime:smoke`：通过。
- Admin served bundle `http://localhost:5173/assets/index-DaKlfeSW.js` 已包含 `福利卡发放`、`发卡加盟商ID`、`welfare-cards/issue`、`加盟商发卡操作`。
- HTTP/API/DB 运行态验证：使用 Admin JWT 调用 `POST /api/franchises/franchise-local-review/welfare-cards/issue` 成功创建福利卡账户与 `issue` 流水，DB 余额与累计发行金额均为 `12345`。
- 备注：`docker compose up -d --build admin` 在本机 Docker/BuildKit session 阶段出现 `x-docker-expose-session-sharedkey` 非可打印字符错误；已使用直接 `docker build` + `docker compose up -d --no-build admin` 完成镜像与运行态刷新。
