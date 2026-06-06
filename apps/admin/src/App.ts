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
  decideProductReview,
  fetchAdminInventoryReservations,
  fetchAdminInventoryStocks,
  fetchAdminOrders,
  fetchAdminSettlementStatements,
  fetchReviewQueue,
  publishProductToPool,
  statusLabels
} from './api';
import { summarizeAdminOrders } from './orderSummary';
import { summarizeSettlementStatements } from './settlementSummary';

const adminActorUserId = 'admin-user-001';
const defaultRejectReason = '资料不完整';

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
          renderOrdersPanel(orders.value),
          renderReservationPanel(reservations.value),
          renderStockPanel(stocks.value),
          renderSettlementPanel(statements.value)
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

function renderOrdersPanel(orders: AdminOrder[]) {
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
              h('p', { class: 'muted' }, order.lines.map((line) => `${line.displayName} x${line.quantity}`).join(' / '))
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

function renderSettlementPanel(statements: AdminSettlementStatement[]) {
  return panel('结算管理', [
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
                h(ElTag, () => `明细 ${statement.itemCount} 条`)
              ])
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
