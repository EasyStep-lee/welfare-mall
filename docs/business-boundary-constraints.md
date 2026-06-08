# Welfare Mall Business Boundary Constraints

This document is the enforced business boundary for the rewrite. It turns the project master plan and legacy-business baseline into constraints that every later slice must preserve.

## Core Subjects

- `平台 -> 加盟商 -> 商户 -> 商品/SKU -> 订单` is the main business chain.
- 加盟商 is the real sales party, welfare-card issuer, sales ledger owner, and payment ownership subject.
- 商户 publishes products, owns inventory/fulfillment work, and must have an actual address.
- 用户 is the buyer and pays with welfare-card balance plus online cash payment.
- 商品 belongs to a merchant and must be traceable to the merchant's franchise.

## Forbidden Drift

- 门店 and 商店 are not core subjects in the new platform.
- Historical `shop`, `store`, and `pickupStoreName` fields are compatibility only and must not become new write-model subjects.
- There is no offline-cash user payment path.
- Online cash payment is limited to 微信支付 and 支付宝.
- Offline/manual confirmation belongs only to settlement payout, not buyer payment.

## Required Order Facts

Every new order main path must be able to prove:

- sales franchise: the 加盟商 that sells to the user and issues welfare cards.
- fulfillment merchant: the 商户 that published and fulfills the product.
- merchant address: the actual merchant address used for pickup or fulfillment display.
- payment split: welfare-card amount plus online cash amount equals the order payable amount.

## Welfare-Card Rules 福利卡规则

- Welfare cards are issued by a franchise.
- A user may pay with the balance of a welfare card issued by the sales franchise.
- Welfare-card balance changes must have ledger entries.
- Refunds must return the welfare-card part to the original card account and return the online cash part through the original online channel.

## Frontend Wording

- Buyer-facing sales text should use 加盟商 for sales party.
- Buyer-facing fulfillment text should use 履约商户 for the merchant.
- Pickup address should come from the merchant address, not a store or pickup-point subject.
- Admin, Franchise, Merchant, and User login must drive business identity; fixed local IDs are transitional only.
