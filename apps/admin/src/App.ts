import { ElButton, ElCard, ElCol, ElRow, ElSpace, ElTag } from 'element-plus';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import {
  AdminInventoryReservation,
  AdminInventoryStock,
  AdminOrder,
  AdminSettlementStatement,
  ReviewQueueItem,
  adminInventoryReservationStatusLabels,
  adminOrderStatusLabels,
  adminSettlementStatementStatusLabels,
  confirmSettlementOfflinePayout,
  createOrderRefund,
  decideProductReview,
  fetchAdminInventoryReservations,
  fetchAdminInventoryStocks,
  fetchAdminOrders,
  fetchAdminSettlementStatements,
  fetchReviewQueue,
  generateSettlementStatement,
  processOrderPaymentCallback,
  processOrderRefundCallback,
  publishProductToPool,
  statusLabels
} from './api';
import { summarizeAdminOrders } from './orderSummary';
import { summarizeSettlementStatements } from './settlementSummary';

const adminActorUserId = 'admin-user-001';
const defaultRejectReason = '资料不完整';
const localSettlementMerchantId = 'merchant-001';
const localSettlementPaidAt = '2026-06-06T08:00:00.000Z';
const localSettlementPayoutRemark = '本地线下打款确认';
const localPaymentPaidAt = '2026-06-06T08:10:00.000Z';
const localRefundSucceededAt = '2026-06-06T08:20:00.000Z';

export default defineComponent({
  name: 'AdminApp',
  setup() {
    const reviewItems = ref<ReviewQueueItem[]>([]);
    const orders = ref<AdminOrder[]>([]);
    const reservations = ref<AdminInventoryReservation[]>([]);
    const stocks = ref<AdminInventoryStock[]>([]);
    const statements = ref<AdminSettlementStatement[]>([]);
    const loading = ref(true);
    const actionLoading = ref(false);
    const message = ref<string | null>(null);
    const error = ref<string | null>(null);

    const orderSummary = computed(() => summarizeAdminOrders(orders.value));
    const settlementSummary = computed(() => summarizeSettlementStatements(statements.value));

    async function loadAll() {
      loading.value = true;
      error.value = null;
      try {
        const [queueResponse, orderResponse, reservationResponse, stockResponse, statementResponse] = await Promise.all([
          fetchReviewQueue('pending_review'),
          fetchAdminOrders(),
          fetchAdminInventoryReservations(),
          fetchAdminInventoryStocks(),
          fetchAdminSettlementStatements('generated')
        ]);
        reviewItems.value = queueResponse.items;
        orders.value = orderResponse.orders;
        reservations.value = reservationResponse.reservations;
        stocks.value = stockResponse.stocks;
        statements.value = statementResponse.statements;
      } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : '平台管理数据加载失败';
      } finally {
        loading.value = false;
      }
    }

    async function reloadReviewQueue() {
      const response = await fetchReviewQueue('pending_review');
      reviewItems.value = response.items;
    }

    async function approveReview(item: ReviewQueueItem) {
      actionLoading.value = true;
      error.value = null;
      try {
        await decideProductReview({ productId: item.productId, action: 'approve', actorUserId: adminActorUserId });
        message.value = `${item.name} 已通过审核`;
        await reloadReviewQueue();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品审核通过失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function rejectReview(item: ReviewQueueItem) {
      actionLoading.value = true;
      error.value = null;
      try {
        await decideProductReview({
          productId: item.productId,
          action: 'reject',
          actorUserId: adminActorUserId,
          reason: defaultRejectReason
        });
        message.value = `${item.name} 已驳回审核`;
        await reloadReviewQueue();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品审核驳回失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function publishProduct(item: ReviewQueueItem) {
      actionLoading.value = true;
      error.value = null;
      try {
        await publishProductToPool({ productId: item.productId, actorUserId: adminActorUserId });
        message.value = `${item.name} 已发布到商品池`;
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品池发布失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function reloadGeneratedSettlementStatements() {
      const response = await fetchAdminSettlementStatements('generated');
      statements.value = response.statements;
    }

    async function generateSettlement() {
      actionLoading.value = true;
      error.value = null;
      try {
        const response = await generateSettlementStatement({ merchantId: localSettlementMerchantId });
        message.value = response.statement ? `已生成结算单 ${response.statement.statementNo}` : `${localSettlementMerchantId} 暂无可生成结算单`;
        await reloadGeneratedSettlementStatements();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '结算单生成失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function confirmOfflinePayout(statement: AdminSettlementStatement) {
      actionLoading.value = true;
      error.value = null;
      try {
        await confirmSettlementOfflinePayout({
          statementNo: statement.statementNo,
          paidAt: localSettlementPaidAt,
          payoutReference: `LOCAL-PAYOUT-${statement.statementNo}`,
          payoutRemark: localSettlementPayoutRemark
        });
        message.value = `${statement.statementNo} 已确认线下打款`;
        await reloadGeneratedSettlementStatements();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '线下打款确认失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function reloadOrderReadModels() {
      const [orderResponse, reservationResponse, stockResponse] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminInventoryReservations(),
        fetchAdminInventoryStocks()
      ]);
      orders.value = orderResponse.orders;
      reservations.value = reservationResponse.reservations;
      stocks.value = stockResponse.stocks;
    }

    async function confirmPayment(order: AdminOrder) {
      const payment = order.latestPayment;
      if (!payment) {
        return;
      }

      actionLoading.value = true;
      error.value = null;
      try {
        await processOrderPaymentCallback({
          providerEventId: `LOCAL-PAYMENT-${order.orderNo}`,
          paymentNo: payment.paymentNo,
          providerPaymentNo: `LOCAL-PROVIDER-${payment.paymentNo}`,
          status: 'paid',
          paidAt: localPaymentPaidAt,
          payload: { source: 'admin-vue-local' }
        });
        message.value = `${order.orderNo} 已确认支付成功`;
        await reloadOrderReadModels();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '确认支付失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function requestRefund(order: AdminOrder) {
      const payment = order.latestPayment;
      if (!payment) {
        return;
      }

      actionLoading.value = true;
      error.value = null;
      try {
        const response = await createOrderRefund({
          requestId: `LOCAL-REFUND-${order.orderNo}`,
          paymentNo: payment.paymentNo,
          orderNo: order.orderNo,
          channel: payment.channel,
          refundAmount: order.totalAmount,
          reason: 'after_sale'
        });
        message.value = `${order.orderNo} 已提交退款申请 ${response.refund.refundNo}`;
        await reloadOrderReadModels();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '提交退款失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function confirmRefund(order: AdminOrder) {
      const refund = order.latestRefund;
      if (!refund) {
        return;
      }

      actionLoading.value = true;
      error.value = null;
      try {
        await processOrderRefundCallback({
          providerEventId: `LOCAL-REFUND-CALLBACK-${order.orderNo}`,
          refundNo: refund.refundNo,
          providerRefundNo: `LOCAL-PROVIDER-${refund.refundNo}`,
          status: 'succeeded',
          succeededAt: localRefundSucceededAt,
          payload: { source: 'admin-vue-local' }
        });
        message.value = `${order.orderNo} 已确认退款成功`;
        await reloadOrderReadModels();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '确认退款失败';
      } finally {
        actionLoading.value = false;
      }
    }

    onMounted(() => {
      void loadAll();
    });

    return () =>
      h('main', { class: 'app-shell' }, [
        h('header', { class: 'app-header' }, [
          h('div', [h('p', { class: 'eyebrow' }, 'Vue 3 + Element Plus'), h('h1', '平台管理工作台')]),
          h(ElButton, { type: 'primary', plain: true, loading: loading.value, onClick: loadAll }, () => '刷新')
        ]),
        message.value ? h('p', { class: 'success-message' }, message.value) : null,
        error.value ? h('p', { class: 'error-message' }, error.value) : null,
        h(ElRow, { gutter: 12, class: 'summary-grid' }, () => [
          metric('订单数', `${orderSummary.value.orderCount} 单`),
          metric('商品数', `${orderSummary.value.lineQuantity} 件`),
          metric('订单总额', formatMoney(orderSummary.value.totalAmount)),
          metric('应打款', formatMoney(settlementSummary.value.netAmount))
        ]),
        h('section', { class: 'workspace-grid' }, [
          renderReviewPanel(reviewItems.value, { approveReview, rejectReview, publishProduct }, actionLoading.value),
          renderOrdersPanel(orders.value, { confirmPayment, requestRefund, confirmRefund }, actionLoading.value),
          renderReservationPanel(reservations.value),
          renderStockPanel(stocks.value),
          renderSettlementPanel(statements.value, generateSettlement, confirmOfflinePayout, actionLoading.value)
        ])
      ]);
  }
});

function metric(label: string, value: string) {
  return h(ElCol, { xs: 12, sm: 6 }, () =>
    h(ElCard, { shadow: 'never', class: 'metric-card' }, () => [
      h('p', { class: 'metric-label' }, label),
      h('strong', { class: 'metric-value' }, value)
    ])
  );
}

function renderReviewPanel(
  items: ReviewQueueItem[],
  actions: {
    approveReview: (item: ReviewQueueItem) => Promise<void>;
    rejectReview: (item: ReviewQueueItem) => Promise<void>;
    publishProduct: (item: ReviewQueueItem) => Promise<void>;
  },
  actionLoading: boolean
) {
  return panel('商品审核', [
    items.length === 0
      ? h('p', { class: 'empty-state' }, '暂无待审核商品')
      : h(
          'div',
          { class: 'item-stack' },
          items.map((item) =>
            h('article', { class: 'list-row', key: item.productId }, [
              h('div', [h('strong', item.name), h('p', `${item.code} / ${item.merchant.name} / ${item.franchise.name}`)]),
              h(ElSpace, { wrap: true }, () => [
                h(ElTag, { type: 'warning' }, () => statusLabels[item.status]),
                h(ElTag, () => `${item.skuCount} 个 SKU`),
                h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => actions.approveReview(item) }, () => '通过审核'),
                h(ElButton, { size: 'small', type: 'danger', plain: true, loading: actionLoading, onClick: () => actions.rejectReview(item) }, () => '驳回审核'),
                h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.publishProduct(item) }, () => '发布商品池')
              ]),
              item.primarySku
                ? h('p', { class: 'muted' }, `${item.primarySku.code} / 销售价 ${formatMoney(item.primarySku.priceAmount)}`)
                : null
            ])
          )
        )
  ]);
}

function renderOrdersPanel(
  orders: AdminOrder[],
  actions: {
    confirmPayment: (order: AdminOrder) => Promise<void>;
    requestRefund: (order: AdminOrder) => Promise<void>;
    confirmRefund: (order: AdminOrder) => Promise<void>;
  },
  actionLoading: boolean
) {
  return panel('订单管理', [
    orders.length === 0
      ? h('p', { class: 'empty-state' }, '暂无订单')
      : h(
          'div',
          { class: 'item-stack' },
          orders.map((order) =>
            h('article', { class: 'list-row', key: order.orderNo }, [
              h('div', [h('strong', order.orderNo), h('p', `${order.buyerUserId} / ${order.receiverName ?? '自提'} / ${formatMoney(order.totalAmount)}`)]),
              h(ElSpace, { wrap: true }, () => [
                h(ElTag, { type: order.status === 'paid' ? 'success' : 'info' }, () => label(adminOrderStatusLabels, order.status)),
                h(ElTag, () => `履约 ${order.fulfillmentSummary.totalTasks} 项`),
                h(ElTag, () => `待履约 ${order.fulfillmentSummary.pendingTasks}`)
              ]),
              h('p', { class: 'muted' }, order.lines.map((line) => `${line.displayName} x${line.quantity}`).join(' / ')),
              h(ElSpace, { wrap: true }, () => [
                canConfirmPayment(order)
                  ? h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => actions.confirmPayment(order) }, () => '确认支付')
                  : null,
                canRequestRefund(order)
                  ? h(ElButton, { size: 'small', type: 'warning', loading: actionLoading, onClick: () => actions.requestRefund(order) }, () => '提交退款')
                  : null,
                canConfirmRefund(order)
                  ? h(ElButton, { size: 'small', type: 'primary', loading: actionLoading, onClick: () => actions.confirmRefund(order) }, () => '确认退款')
                  : null
              ])
            ])
          )
        )
  ]);
}

function renderReservationPanel(reservations: AdminInventoryReservation[]) {
  return panel('库存预占', [
    reservations.length === 0
      ? h('p', { class: 'empty-state' }, '暂无库存预占')
      : h(
          'div',
          { class: 'item-stack' },
          reservations.map((reservation) =>
            h('article', { class: 'list-row', key: reservation.id }, [
              h('strong', reservation.orderNo),
              h('p', `${reservation.productId} / ${reservation.skuId ?? '默认规格'} / ${reservation.merchantId}`),
              h(ElSpace, () => [
                h(ElTag, () => label(adminInventoryReservationStatusLabels, reservation.status)),
                h(ElTag, () => `数量 ${reservation.quantity}`)
              ])
            ])
          )
        )
  ]);
}

function renderStockPanel(stocks: AdminInventoryStock[]) {
  return panel('库存余额', [
    stocks.length === 0
      ? h('p', { class: 'empty-state' }, '暂无库存余额')
      : h(
          'div',
          { class: 'item-stack' },
          stocks.map((stock) =>
            h('article', { class: 'list-row', key: stock.id }, [
              h('strong', stock.stockKey),
              h('p', `${stock.productId} / ${stock.skuId ?? '默认规格'} / ${stock.merchantId}`),
              h(ElSpace, () => [h(ElTag, () => `可用 ${stock.availableQuantity}`), h(ElTag, () => `预占 ${stock.reservedQuantity}`)])
            ])
          )
        )
  ]);
}

function renderSettlementPanel(
  statements: AdminSettlementStatement[],
  generateSettlement: () => Promise<void>,
  confirmOfflinePayout: (statement: AdminSettlementStatement) => Promise<void>,
  actionLoading: boolean
) {
  return panel('结算管理', [
    h('div', { class: 'panel-action-row' }, [
      h(ElButton, { type: 'primary', plain: true, loading: actionLoading, onClick: generateSettlement }, () => '生成结算单')
    ]),
    statements.length === 0
      ? h('p', { class: 'empty-state' }, '暂无结算单')
      : h(
          'div',
          { class: 'item-stack' },
          statements.map((statement) =>
            h('article', { class: 'list-row', key: statement.id }, [
              h('strong', statement.statementNo),
              h('p', `商户 ${statement.merchantId} / 应打款 ${formatMoney(statement.netAmount)}`),
              h(ElSpace, () => [
                h(ElTag, { type: statement.status === 'generated' ? 'warning' : 'success' }, () => label(adminSettlementStatementStatusLabels, statement.status)),
                h(ElTag, () => `明细 ${statement.itemCount} 条`),
                statement.status === 'generated'
                  ? h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => confirmOfflinePayout(statement) }, () => '确认线下打款')
                  : null
              ]),
              statement.payoutReference ? h('p', { class: 'muted' }, `流水 ${statement.payoutReference}`) : null,
              statement.payoutRemark ? h('p', { class: 'muted' }, `备注 ${statement.payoutRemark}`) : null
            ])
          )
        )
  ]);
}

function panel(title: string, children: Array<ReturnType<typeof h> | null>) {
  return h(
    ElCard,
    { shadow: 'never', class: 'workspace-panel', 'aria-label': title },
    {
      header: () => h('h2', title),
      default: () => children
    }
  );
}

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function label(labels: Record<string, string>, value: string) {
  return labels[value] ?? value;
}

function canConfirmPayment(order: AdminOrder) {
  return order.status === 'pending_payment' && order.latestPayment?.status === 'pending';
}

function canRequestRefund(order: AdminOrder) {
  return order.status === 'paid' && order.latestPayment?.status === 'paid';
}

function canConfirmRefund(order: AdminOrder) {
  return order.latestRefund?.status === 'processing';
}
