# 千店同城商城平台 V2

本仓库用于承接“千店同城商城平台”新版重构。新版不是修补旧系统，而是以旧系统为资源仓库，重建业务内核、数据模型、权限边界、商品池、订单状态机、库存流水、结算规则和审计能力。

## 项目定位

- 旧系统：提供 UI、素材、历史数据和已验证业务口径。
- 新系统：重新建立稳定的业务模型、接口契约、权限体系、结算链路和验收体系。
- 五端范围：Admin 管理后台、Merchant 商户平台、Portal 门户网站、User App 用户端小程序、Logistics App 物流端小程序。
- 后端范围：统一业务平台 API、数据模型、权限、支付退款、库存履约、结算、审计和运维门禁。

## 当前资产

- [项目总体方案](docs/01-项目总体方案_2026-06-02.md)
- [GitHub 协作与项目治理方案](docs/02-GitHub协作与项目治理方案_2026-06-02.md)
- [实施路线图](docs/03-实施路线图_2026-06-02.md)
- [领域模型与验收基线](docs/04-领域模型与验收基线_2026-06-02.md)
- [ADR-0001 技术栈与重构边界](docs/adr/0001-技术栈与重构边界.md)

## 定稿技术栈

| 模块 | 技术栈 |
|---|---|
| 后端平台 | NestJS + TypeScript + MySQL 8 + Prisma + Redis + OpenAPI + Jest + Docker |
| Admin | Vue 3 + TypeScript + Vite + Pinia + Element Plus + OpenAPI Client + Playwright |
| Merchant | Vue 3 + TypeScript + Vite + Pinia + Element Plus + OpenAPI Client + Playwright |
| Portal | Vue 3 + TypeScript + Vite + 静态生成/预渲染 + OpenAPI Client |
| User App | 原生微信小程序 + TypeScript + 统一 API Client + 分包 |
| Logistics App | 原生微信小程序 + TypeScript + 统一 API Client + 地图/扫码能力 |

## GitHub 使用原则

- 所有需求先进入 Issue，按 Epic、Story、Acceptance、Bug、Tech Debt 分类。
- 所有实现走分支和 Pull Request，不直接在主分支开发。
- 每个 PR 必须说明影响范围、验收证据、未覆盖风险和回滚方式。
- 里程碑按 P0 基础内核、P1 五端联调、P2 迁移验收、P3 上线准备拆分。
- GitHub Project 用作唯一任务看板，代码完成、运行验收、真机/目标环境验收分开追踪。

