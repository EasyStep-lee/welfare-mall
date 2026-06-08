import { ElButton, ElCard, ElCol, ElRow, ElSpace, ElTag } from 'element-plus';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import {
  AdminFulfillmentStatusFilter,
  AdminInventoryReservation,
  AdminInventoryReservationStatusFilter,
  AdminInventoryStock,
  AdminOrder,
  AdminOrderStatusFilter,
  AdminSettlementStatement,
  AdminSettlementStatementStatusFilter,
  ReviewQueueItem,
  ReviewQueueStatus,
  adminFulfillmentStatusLabels,
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
import { buildSettlementCsv } from './settlementExport';
import { summarizeSettlementStatements } from './settlementSummary';

const adminActorUserId = 'admin-user-001';
const defaultRejectReason = '资料不完整';
const localSettlementMerchantId = 'merchant-local-review';
const localSettlementPaidAt = '2026-06-06T08:00:00.000Z';
const localSettlementPayoutRemark = '本地线下打款确认';
const localPaymentPaidAt = '2026-06-06T08:10:00.000Z';
const localRefundSucceededAt = '2026-06-06T08:20:00.000Z';

type OrderLookupForm = {
  merchantId: string;
  taskNo: string;
};

type ReservationLookupForm = {
  merchantId: string;
  orderNo: string;
};

type StockLookupForm = {
  merchantId: string;
  productId: string;
  skuId: string;
};

export default defineComponent({
  name: 'AdminApp',
  setup() {
    const reviewItems = ref<ReviewQueueItem[]>([]);
    const reviewStatus = ref<ReviewQueueStatus>('pending_review');
    const orderStatus = ref<AdminOrderStatusFilter>('all');
    const orderFulfillmentStatus = ref<AdminFulfillmentStatusFilter>('all');
    const orderFilters = ref<OrderLookupForm>({ merchantId: '', taskNo: '' });
    const reservationStatus = ref<AdminInventoryReservationStatusFilter>('all');
    const reservationFilters = ref<ReservationLookupForm>({ merchantId: '', orderNo: '' });
    const stockFilters = ref<StockLookupForm>({ merchantId: '', productId: '', skuId: '' });
    const settlementStatus = ref<AdminSettlementStatementStatusFilter>('generated');
    const settlementMerchantId = ref('');
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
          fetchReviewQueue(reviewStatus.value),
          fetchAdminOrders(orderStatus.value, orderFulfillmentStatus.value, orderFilters.value.merchantId, orderFilters.value.taskNo),
          fetchAdminInventoryReservations(reservationStatus.value, reservationFilters.value.merchantId, reservationFilters.value.orderNo),
          fetchAdminInventoryStocks(stockFilters.value.merchantId, stockFilters.value.productId, stockFilters.value.skuId),
          fetchAdminSettlementStatements(settlementStatus.value, settlementMerchantId.value)
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

    async function reloadReviewQueue(status: ReviewQueueStatus = reviewStatus.value) {
      reviewStatus.value = status;
      const response = await fetchReviewQueue(status);
      reviewItems.value = response.items;
    }

    async function approveReview(item: ReviewQueueItem) {
      actionLoading.value = true;
      error.value = null;
      try {
        await decideProductReview({ productId: item.productId, action: 'approve', actorUserId: adminActorUserId });
        message.value = `${item.name} 已通过审核`;
        await reloadReviewQueue('approved');
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
        await reloadReviewQueue('rejected');
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
        await reloadReviewQueue('approved');
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品池发布失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function loadSettlementStatements(status: AdminSettlementStatementStatusFilter = settlementStatus.value) {
      settlementStatus.value = status;
      const response = await fetchAdminSettlementStatements(status, settlementMerchantId.value);
      statements.value = response.statements;
    }

    function updateSettlementMerchantId(value: string) {
      settlementMerchantId.value = value;
    }

    async function generateSettlement() {
      actionLoading.value = true;
      error.value = null;
      try {
        const response = await generateSettlementStatement({ merchantId: localSettlementMerchantId });
        message.value = response.statement ? `已生成结算单 ${response.statement.statementNo}` : `${localSettlementMerchantId} 暂无可生成结算单`;
        await loadSettlementStatements('generated');
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
        await loadSettlementStatements();
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '线下打款确认失败';
      } finally {
        actionLoading.value = false;
      }
    }

    function exportSettlementCsv() {
      const csv = buildSettlementCsv(statements.value);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-settlements-${settlementStatus.value}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    async function reloadOrderReadModels() {
      const [orderResponse, reservationResponse, stockResponse] = await Promise.all([
        fetchAdminOrders(orderStatus.value, orderFulfillmentStatus.value, orderFilters.value.merchantId, orderFilters.value.taskNo),
        fetchAdminInventoryReservations(reservationStatus.value, reservationFilters.value.merchantId, reservationFilters.value.orderNo),
        fetchAdminInventoryStocks(stockFilters.value.merchantId, stockFilters.value.productId, stockFilters.value.skuId)
      ]);
      orders.value = orderResponse.orders;
      reservations.value = reservationResponse.reservations;
      stocks.value = stockResponse.stocks;
    }

    async function loadOrders(status: AdminOrderStatusFilter = orderStatus.value, fulfillmentStatus: AdminFulfillmentStatusFilter = orderFulfillmentStatus.value) {
      orderStatus.value = status;
      orderFulfillmentStatus.value = fulfillmentStatus;
      const response = await fetchAdminOrders(status, fulfillmentStatus, orderFilters.value.merchantId, orderFilters.value.taskNo);
      orders.value = response.orders;
    }

    async function loadReservations(status: AdminInventoryReservationStatusFilter = reservationStatus.value) {
      reservationStatus.value = status;
      const response = await fetchAdminInventoryReservations(status, reservationFilters.value.merchantId, reservationFilters.value.orderNo);
      reservations.value = response.reservations;
    }

    async function loadStocks() {
      const response = await fetchAdminInventoryStocks(stockFilters.value.merchantId, stockFilters.value.productId, stockFilters.value.skuId);
      stocks.value = response.stocks;
    }

    function updateOrderFilter(field: keyof OrderLookupForm, value: string) {
      orderFilters.value = { ...orderFilters.value, [field]: value };
    }

    function updateReservationFilter(field: keyof ReservationLookupForm, value: string) {
      reservationFilters.value = { ...reservationFilters.value, [field]: value };
    }

    function updateStockFilter(field: keyof StockLookupForm, value: string) {
      stockFilters.value = { ...stockFilters.value, [field]: value };
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
          renderReviewPanel(
            reviewItems.value,
            reviewStatus.value,
            { approveReview, rejectReview, publishProduct, loadReviewStatus: reloadReviewQueue },
            actionLoading.value
          ),
          renderOrdersPanel(
            orders.value,
            orderStatus.value,
            orderFulfillmentStatus.value,
            orderFilters.value,
            { confirmPayment, requestRefund, confirmRefund, loadOrders, updateOrderFilter },
            actionLoading.value
          ),
          renderReservationPanel(reservations.value, reservationStatus.value, reservationFilters.value, { loadReservations, updateReservationFilter }, actionLoading.value),
          renderStockPanel(stocks.value, stockFilters.value, { loadStocks, updateStockFilter }, actionLoading.value),
          renderSettlementPanel(
            statements.value,
            settlementStatus.value,
            settlementMerchantId.value,
            { generateSettlement, confirmOfflinePayout, loadSettlementStatements, updateSettlementMerchantId, exportSettlementCsv },
            actionLoading.value
          )
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
  activeStatus: ReviewQueueStatus,
  actions: {
    approveReview: (item: ReviewQueueItem) => Promise<void>;
    rejectReview: (item: ReviewQueueItem) => Promise<void>;
    publishProduct: (item: ReviewQueueItem) => Promise<void>;
    loadReviewStatus: (status: ReviewQueueStatus) => Promise<void>;
  },
  actionLoading: boolean
) {
  return panel('商品审核', [
    h('div', { class: 'panel-action-row' }, [
      h(ElButton, { type: activeStatus === 'pending_review' ? 'primary' : 'default', plain: activeStatus !== 'pending_review', onClick: () => actions.loadReviewStatus('pending_review') }, () => '待审核'),
      h(ElButton, { type: activeStatus === 'approved' ? 'primary' : 'default', plain: activeStatus !== 'approved', onClick: () => actions.loadReviewStatus('approved') }, () => '已通过'),
      h(ElButton, { type: activeStatus === 'rejected' ? 'primary' : 'default', plain: activeStatus !== 'rejected', onClick: () => actions.loadReviewStatus('rejected') }, () => '已驳回')
    ]),
    items.length === 0
      ? h('p', { class: 'empty-state' }, reviewEmptyText(activeStatus))
      : h(
          'div',
          { class: 'item-stack' },
          items.map((item) =>
            h('article', { class: 'list-row', key: item.productId }, [
              h('div', [h('strong', item.name), h('p', `${item.code} / ${item.merchant.name} / ${item.franchise.name}`)]),
              h(ElSpace, { wrap: true }, () => [
                h(ElTag, { type: reviewTagType(item.status) }, () => statusLabels[item.status]),
                h(ElTag, () => `${item.skuCount} 个 SKU`),
                item.status === 'pending_review'
                  ? h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => actions.approveReview(item) }, () => '通过审核')
                  : null,
                item.status === 'pending_review'
                  ? h(ElButton, { size: 'small', type: 'danger', plain: true, loading: actionLoading, onClick: () => actions.rejectReview(item) }, () => '驳回审核')
                  : null,
                item.status === 'approved'
                  ? h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.publishProduct(item) }, () => '发布商品池')
                  : null
              ]),
              item.primarySku
                ? h('p', { class: 'muted' }, `${item.primarySku.code} / 销售价 ${formatMoney(item.primarySku.priceAmount)}`)
                : null,
              renderReviewMasterData(item)
            ])
          )
        )
  ]);
}

function renderReviewMasterData(item: ReviewQueueItem) {
  return h('div', { class: 'review-detail-sections' }, [
    h('div', { class: 'review-detail-summary' }, [
      h(ElTag, { type: 'info' }, () => item.category.name),
      h(ElTag, { type: 'info' }, () => item.brand?.name ?? '无品牌'),
      h(ElTag, { type: 'info' }, () => formatOrigin(item.origin))
    ]),
    item.primarySku
      ? h('section', { class: 'review-detail-section' }, [
          h('h3', 'SKU'),
          h('div', { class: 'detail-card' }, [
            h('strong', item.primarySku.code),
            h('span', item.primarySku.specText),
            h('span', `销售价 ${formatMoney(item.primarySku.priceAmount)}`),
            h('span', `市场价 ${formatMoney(item.primarySku.marketPriceAmount)}`)
          ])
        ])
      : renderEmptyDetailSection('SKU', '暂无 SKU 明细'),
    renderMediaSection(item),
    renderQualificationSection(item),
    renderParameterSection(item),
    renderDetailSectionSnapshots(item)
  ]);
}

function renderMediaSection(item: ReviewQueueItem) {
  if (item.media.length === 0) {
    return renderEmptyDetailSection('图片', '暂无图片');
  }

  return h('section', { class: 'review-detail-section' }, [
    h('h3', '图片'),
    h(
      'ul',
      { class: 'detail-list' },
      item.media.map((media) =>
        h('li', { key: `${media.type}-${media.sortOrder}` }, [
          h('strong', mediaTypeLabel(media.type)),
          h('span', media.url),
          h('span', `排序 ${media.sortOrder}`)
        ])
      )
    )
  ]);
}

function renderQualificationSection(item: ReviewQueueItem) {
  if (item.qualifications.length === 0) {
    return renderEmptyDetailSection('资质', '暂无资质');
  }

  return h('section', { class: 'review-detail-section' }, [
    h('h3', '资质'),
    h(
      'ul',
      { class: 'detail-list' },
      item.qualifications.map((qualification) =>
        h('li', { key: `${qualification.type}-${qualification.title}` }, [
          h('strong', qualification.title),
          h('span', qualification.certificateNo ? `证书号 ${qualification.certificateNo}` : '无证书号'),
          qualification.fileUrl ? h('span', qualification.fileUrl) : null
        ])
      )
    )
  ]);
}

function renderParameterSection(item: ReviewQueueItem) {
  if (item.parameters.length === 0) {
    return renderEmptyDetailSection('参数', '暂无参数');
  }

  return h('section', { class: 'review-detail-section' }, [
    h('h3', '参数'),
    h(
      'ul',
      { class: 'detail-list' },
      item.parameters.map((parameter) =>
        h('li', { key: `${parameter.groupName}-${parameter.name}-${parameter.sortOrder}` }, [
          h('strong', parameter.groupName),
          h('span', `${parameter.name}: ${parameter.value}`)
        ])
      )
    )
  ]);
}

function renderDetailSectionSnapshots(item: ReviewQueueItem) {
  if (item.detailSections.length === 0) {
    return renderEmptyDetailSection('图文说明', '暂无图文说明');
  }

  return h('section', { class: 'review-detail-section' }, [
    h('h3', '图文说明'),
    h(
      'ul',
      { class: 'detail-list' },
      item.detailSections.map((section) =>
        h('li', { key: `${section.type}-${section.sortOrder}` }, [
          h('strong', section.title ?? '未命名图文'),
          section.content ? h('span', section.content) : h('span', '暂无内容')
        ])
      )
    )
  ]);
}

function renderEmptyDetailSection(title: string, text: string) {
  return h('section', { class: 'review-detail-section' }, [h('h3', title), h('p', { class: 'empty-text' }, text)]);
}

function renderOrdersPanel(
  orders: AdminOrder[],
  activeStatus: AdminOrderStatusFilter,
  activeFulfillmentStatus: AdminFulfillmentStatusFilter,
  filters: OrderLookupForm,
  actions: {
    confirmPayment: (order: AdminOrder) => Promise<void>;
    requestRefund: (order: AdminOrder) => Promise<void>;
    confirmRefund: (order: AdminOrder) => Promise<void>;
    loadOrders: (status?: AdminOrderStatusFilter, fulfillmentStatus?: AdminFulfillmentStatusFilter) => Promise<void>;
    updateOrderFilter: (field: keyof OrderLookupForm, value: string) => void;
  },
  actionLoading: boolean
) {
  return panel('订单管理', [
    renderOrderFilters(activeStatus, activeFulfillmentStatus, filters, actions, actionLoading),
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
              renderOrderFulfillmentTasks(order),
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

function renderOrderFulfillmentTasks(order: AdminOrder) {
  if (order.fulfillmentTasks.length === 0) {
    return null;
  }

  return h('div', { class: 'order-fulfillment-tasks' }, [
    h('strong', '履约任务'),
    ...order.fulfillmentTasks.map((task) =>
      h('div', { class: 'order-fulfillment-task', key: task.taskNo }, [
        h('strong', task.taskNo),
        h('span', task.merchantId),
        h('span', label(adminFulfillmentStatusLabels, task.status)),
        task.completedAt ? h('span', `完成 ${task.completedAt}`) : null
      ])
    )
  ]);
}

function renderOrderFilters(
  activeStatus: AdminOrderStatusFilter,
  activeFulfillmentStatus: AdminFulfillmentStatusFilter,
  filters: OrderLookupForm,
  actions: {
    loadOrders: (status?: AdminOrderStatusFilter, fulfillmentStatus?: AdminFulfillmentStatusFilter) => Promise<void>;
    updateOrderFilter: (field: keyof OrderLookupForm, value: string) => void;
  },
  actionLoading: boolean
) {
  const orderStatusOptions: Array<{ value: AdminOrderStatusFilter; label: string }> = [
    { value: 'all', label: '全部订单' },
    { value: 'pending_payment', label: label(adminOrderStatusLabels, 'pending_payment') },
    { value: 'paid', label: label(adminOrderStatusLabels, 'paid') },
    { value: 'refund_processing', label: label(adminOrderStatusLabels, 'refund_processing') },
    { value: 'refunded', label: label(adminOrderStatusLabels, 'refunded') },
    { value: 'completed', label: label(adminOrderStatusLabels, 'completed') }
  ];
  const fulfillmentOptions: Array<{ value: AdminFulfillmentStatusFilter; label: string }> = [
    { value: 'all', label: '全部履约' },
    { value: 'pending', label: label(adminFulfillmentStatusLabels, 'pending') },
    { value: 'completed', label: label(adminFulfillmentStatusLabels, 'completed') }
  ];

  return h('div', { class: 'filter-stack' }, [
    h(
      'div',
      { class: 'panel-action-row' },
      orderStatusOptions.map((option) =>
        h(
          ElButton,
          {
            size: 'small',
            type: activeStatus === option.value ? 'primary' : 'default',
            plain: activeStatus !== option.value,
            loading: actionLoading,
            onClick: () => actions.loadOrders(option.value, activeFulfillmentStatus)
          },
          () => option.label
        )
      )
    ),
    h(
      'div',
      { class: 'panel-action-row' },
      fulfillmentOptions.map((option) =>
        h(
          ElButton,
          {
            size: 'small',
            type: activeFulfillmentStatus === option.value ? 'primary' : 'default',
            plain: activeFulfillmentStatus !== option.value,
            loading: actionLoading,
            onClick: () => actions.loadOrders(activeStatus, option.value)
          },
          () => option.label
        )
      )
    ),
    h('div', { class: 'lookup-row' }, [
      textInput('商户ID', filters.merchantId, (value) => actions.updateOrderFilter('merchantId', value)),
      textInput('任务号', filters.taskNo, (value) => actions.updateOrderFilter('taskNo', value)),
      h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.loadOrders() }, () => '查询订单')
    ])
  ]);
}

function renderReservationPanel(
  reservations: AdminInventoryReservation[],
  activeStatus: AdminInventoryReservationStatusFilter,
  filters: ReservationLookupForm,
  actions: {
    loadReservations: (status?: AdminInventoryReservationStatusFilter) => Promise<void>;
    updateReservationFilter: (field: keyof ReservationLookupForm, value: string) => void;
  },
  actionLoading: boolean
) {
  return panel('库存预占', [
    renderReservationFilters(activeStatus, filters, actions, actionLoading),
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

function renderReservationFilters(
  activeStatus: AdminInventoryReservationStatusFilter,
  filters: ReservationLookupForm,
  actions: {
    loadReservations: (status?: AdminInventoryReservationStatusFilter) => Promise<void>;
    updateReservationFilter: (field: keyof ReservationLookupForm, value: string) => void;
  },
  actionLoading: boolean
) {
  const reservationOptions: Array<{ value: AdminInventoryReservationStatusFilter; label: string }> = [
    { value: 'all', label: '全部预占' },
    { value: 'reserved', label: label(adminInventoryReservationStatusLabels, 'reserved') },
    { value: 'released', label: label(adminInventoryReservationStatusLabels, 'released') }
  ];

  return h('div', { class: 'filter-stack' }, [
    h(
      'div',
      { class: 'panel-action-row' },
      reservationOptions.map((option) =>
        h(
          ElButton,
          {
            size: 'small',
            type: activeStatus === option.value ? 'primary' : 'default',
            plain: activeStatus !== option.value,
            loading: actionLoading,
            onClick: () => actions.loadReservations(option.value)
          },
          () => option.label
        )
      )
    ),
    h('div', { class: 'lookup-row' }, [
      textInput('预占商户ID', filters.merchantId, (value) => actions.updateReservationFilter('merchantId', value)),
      textInput('预占订单号', filters.orderNo, (value) => actions.updateReservationFilter('orderNo', value)),
      h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.loadReservations() }, () => '查询预占')
    ])
  ]);
}

function renderStockPanel(
  stocks: AdminInventoryStock[],
  filters: StockLookupForm,
  actions: {
    loadStocks: () => Promise<void>;
    updateStockFilter: (field: keyof StockLookupForm, value: string) => void;
  },
  actionLoading: boolean
) {
  return panel('库存余额', [
    h('div', { class: 'lookup-row' }, [
      textInput('库存商户ID', filters.merchantId, (value) => actions.updateStockFilter('merchantId', value)),
      textInput('商品ID', filters.productId, (value) => actions.updateStockFilter('productId', value)),
      textInput('SKU ID', filters.skuId, (value) => actions.updateStockFilter('skuId', value)),
      h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.loadStocks() }, () => '查询库存')
    ]),
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

function textInput(labelText: string, value: string, onValue: (value: string) => void) {
  return h('label', { class: 'lookup-field' }, [
    h('span', labelText),
    h('input', {
      value,
      onInput: (event: Event) => onValue((event.target as HTMLInputElement).value)
    })
  ]);
}

function renderSettlementPanel(
  statements: AdminSettlementStatement[],
  activeStatus: AdminSettlementStatementStatusFilter,
  merchantId: string,
  actions: {
    generateSettlement: () => Promise<void>;
    confirmOfflinePayout: (statement: AdminSettlementStatement) => Promise<void>;
    loadSettlementStatements: (status?: AdminSettlementStatementStatusFilter) => Promise<void>;
    updateSettlementMerchantId: (value: string) => void;
    exportSettlementCsv: () => void;
  },
  actionLoading: boolean
) {
  const statusOptions: Array<{ value: AdminSettlementStatementStatusFilter; label: string }> = [
    { value: 'generated', label: label(adminSettlementStatementStatusLabels, 'generated') },
    { value: 'paid_offline', label: label(adminSettlementStatementStatusLabels, 'paid_offline') },
    { value: 'all', label: label(adminSettlementStatementStatusLabels, 'all') }
  ];

  return panel('结算管理', [
    h('div', { class: 'filter-stack' }, [
      h(
        'div',
        { class: 'panel-action-row' },
        statusOptions.map((option) =>
          h(
            ElButton,
            {
              size: 'small',
              type: activeStatus === option.value ? 'primary' : 'default',
              plain: activeStatus !== option.value,
              loading: actionLoading,
              onClick: () => actions.loadSettlementStatements(option.value)
            },
            () => option.label
          )
        )
      ),
      h('div', { class: 'lookup-row' }, [
        textInput('结算商户ID', merchantId, actions.updateSettlementMerchantId),
        h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: () => actions.loadSettlementStatements() }, () => '查询结算'),
        h(ElButton, { size: 'small', type: 'primary', plain: true, loading: actionLoading, onClick: actions.exportSettlementCsv }, () => '导出结算CSV'),
        h(ElButton, { size: 'small', type: 'success', plain: true, loading: actionLoading, onClick: actions.generateSettlement }, () => '生成结算单')
      ])
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
                  ? h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => actions.confirmOfflinePayout(statement) }, () => '确认线下打款')
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

function reviewEmptyText(status: ReviewQueueStatus) {
  if (status === 'approved') {
    return '暂无已通过商品';
  }
  if (status === 'rejected') {
    return '暂无已驳回商品';
  }
  return '暂无待审核商品';
}

function reviewTagType(status: ReviewQueueStatus) {
  if (status === 'approved') {
    return 'success';
  }
  if (status === 'rejected') {
    return 'danger';
  }
  return 'warning';
}

function formatOrigin(origin: ReviewQueueItem['origin']) {
  return origin.description ?? [origin.country, origin.province, origin.city].filter(Boolean).join('');
}

function mediaTypeLabel(type: string) {
  if (type === 'main_image') {
    return '主图';
  }
  if (type === 'detail_image') {
    return '详情图';
  }
  return type;
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
