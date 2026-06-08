<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  cancelPortalOrder,
  confirmPortalPayment,
  confirmPortalRefund,
  createPortalOrder,
  createPortalPayment,
  createPortalRefund,
  fetchProductPoolCatalog,
  fetchProductPoolItemDetail,
  fetchPortalOrderDetail,
  fetchPortalOrders,
  type PortalCheckoutOrder,
  type PortalOrderRecord,
  type PortalPayment,
  type PortalRefund,
  type ProductPoolCatalog,
  type ProductPoolCatalogItem,
  type ProductPoolItemDetail
} from './api';

const localBuyerUserId = 'local-user-001';
const localDelivery = {
  receiverName: '本地用户',
  receiverPhone: '13800000000',
  receiverAddress: '本地联调地址'
};
const localPickup = {
  pickupStoreName: '商户自提'
};
type CheckoutFulfillmentMode = 'delivery' | 'pickup';

const loading = ref(true);
const error = ref<string | null>(null);
const productPools = ref<ProductPoolCatalog[]>([]);
const detailLoading = ref(false);
const detailError = ref<string | null>(null);
const selectedDetail = ref<ProductPoolItemDetail | null>(null);
const checkoutLoading = ref(false);
const checkoutError = ref<string | null>(null);
const createdOrder = ref<PortalCheckoutOrder | null>(null);
const checkoutFulfillmentMode = ref<CheckoutFulfillmentMode>('delivery');
const ordersLoading = ref(true);
const ordersError = ref<string | null>(null);
const orders = ref<PortalOrderRecord[]>([]);
const orderDetailLoading = ref(false);
const orderDetailError = ref<string | null>(null);
const selectedOrder = ref<PortalOrderRecord | null>(null);
const paymentLoading = ref(false);
const paymentError = ref<string | null>(null);
const createdPayment = ref<PortalPayment | null>(null);
const paymentConfirmLoading = ref(false);
const paymentConfirmError = ref<string | null>(null);
const confirmedPaymentMessage = ref<string | null>(null);
const orderCancelLoading = ref(false);
const orderCancelError = ref<string | null>(null);
const orderCancelMessage = ref<string | null>(null);
const refundLoading = ref(false);
const refundError = ref<string | null>(null);
const refundMessage = ref<string | null>(null);
const createdRefund = ref<PortalRefund | null>(null);
const refundConfirmLoading = ref(false);
const refundConfirmError = ref<string | null>(null);
const refundConfirmMessage = ref<string | null>(null);

const totalItems = computed(() => productPools.value.reduce((total, pool) => total + pool.items.length, 0));
const originText = computed(() => {
  const origin = selectedDetail.value?.product.origin;
  if (!origin) {
    return '产地信息待补充';
  }

  return [origin.country, origin.province, origin.city, origin.description].filter(Boolean).join(' / ');
});
const checkoutSummary = computed(() =>
  checkoutFulfillmentMode.value === 'pickup'
    ? `数量 1，商户自提 ${selectedDetail.value?.product.merchantId ?? '待选择商户'}`
    : `数量 1，配送至 ${localDelivery.receiverAddress}`
);

onMounted(() => {
  void Promise.all([loadCatalog(), loadLocalOrders()]);
});

async function loadCatalog() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetchProductPoolCatalog();
    productPools.value = response.productPools;
  } catch (loadError) {
    productPools.value = [];
    error.value = loadError instanceof Error ? loadError.message : '商品池加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadLocalOrders() {
  ordersLoading.value = true;
  ordersError.value = null;

  try {
    const response = await fetchPortalOrders(localBuyerUserId);
    orders.value = response.orders ?? [];
  } catch (loadError) {
    orders.value = [];
    ordersError.value = loadError instanceof Error ? loadError.message : '订单列表加载失败';
  } finally {
    ordersLoading.value = false;
  }
}

async function openProductDetail(item: ProductPoolCatalogItem) {
  detailLoading.value = true;
  detailError.value = null;
  selectedDetail.value = null;
  resetCheckout();

  try {
    selectedDetail.value = await fetchProductPoolItemDetail(item.id);
  } catch (loadError) {
    detailError.value = loadError instanceof Error ? loadError.message : '商品详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

async function openOrderDetail(order: PortalOrderRecord) {
  await openOrderDetailByOrderNo(order.orderNo);
}

async function openOrderDetailByOrderNo(orderNo: string) {
  orderDetailLoading.value = true;
  orderDetailError.value = null;
  selectedOrder.value = null;
  paymentError.value = null;
  createdPayment.value = null;
  resetPaymentConfirmation();
  resetOrderCancellation();
  resetRefundRequest();

  try {
    const response = await fetchPortalOrderDetail({
      orderNo,
      buyerUserId: localBuyerUserId
    });
    selectedOrder.value = response.order;
  } catch (loadError) {
    orderDetailError.value = loadError instanceof Error ? loadError.message : '订单详情加载失败';
  } finally {
    orderDetailLoading.value = false;
  }
}

function closeOrderDetail() {
  orderDetailError.value = null;
  paymentError.value = null;
  resetPaymentConfirmation();
  resetOrderCancellation();
  resetRefundRequest();
  selectedOrder.value = null;
  createdPayment.value = null;
}

function closeProductDetail() {
  detailError.value = null;
  resetCheckout();
  selectedDetail.value = null;
}

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function statusText(status: string) {
  const labels: Record<string, string> = {
    pending_payment: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消',
    refund_processing: '退款中',
    refunded: '已退款'
  };

  return labels[status] ?? status;
}

function paymentStatusText(status: string) {
  const labels: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败'
  };

  return labels[status] ?? status;
}

function paymentChannelText(channel: string) {
  const labels: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金'
  };

  return labels[channel] ?? channel;
}

function paymentSummaryText(payment: PortalPayment) {
  return `${paymentChannelText(payment.channel)} · ${paymentStatusText(payment.status)}`;
}

function refundStatusText(status: string) {
  const labels: Record<string, string> = {
    processing: '退款处理中',
    succeeded: '退款成功',
    failed: '退款失败'
  };

  return labels[status] ?? status;
}

function fulfillmentTaskStatusText(status: string) {
  const labels: Record<string, string> = {
    pending: '待履约',
    completed: '已完成'
  };

  return labels[status] ?? status;
}

function hasFulfillmentProgress(order: PortalOrderRecord) {
  return (order.fulfillmentSummary?.totalTasks ?? 0) > 0;
}

function orderLineMerchantText(order: PortalOrderRecord) {
  const merchantIds = [
    ...new Set(order.lines.map((line) => line.merchantId).filter((merchantId): merchantId is string => Boolean(merchantId)))
  ];

  return merchantIds.length > 0 ? merchantIds.join(' / ') : '待确认';
}

function createCheckoutRequestId(itemId: string) {
  const safeItemId = itemId.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `portal-checkout-${safeItemId}-${Date.now()}`;
}

function selectCheckoutFulfillmentMode(mode: CheckoutFulfillmentMode) {
  checkoutFulfillmentMode.value = mode;
  checkoutError.value = null;
  createdOrder.value = null;
}

function resetCheckout() {
  checkoutError.value = null;
  createdOrder.value = null;
  checkoutFulfillmentMode.value = 'delivery';
}

function checkoutFulfillmentPayload() {
  if (checkoutFulfillmentMode.value === 'pickup') {
    return {
      type: 'pickup' as const,
      ...localPickup
    };
  }

  return {
    type: 'delivery' as const,
    ...localDelivery
  };
}

function createPaymentRequestId(orderNo: string) {
  const safeOrderNo = orderNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `portal-payment-${safeOrderNo}-${Date.now()}`;
}

function createRefundRequestId(orderNo: string) {
  const safeOrderNo = orderNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `portal-refund-${safeOrderNo}-${Date.now()}`;
}

function createRefundCallbackEventId(orderNo: string) {
  const safeOrderNo = orderNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `LOCAL-PORTAL-REFUND-${safeOrderNo}`;
}

function createPaymentCallbackEventId(orderNo: string) {
  const safeOrderNo = orderNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `LOCAL-PORTAL-PAYMENT-${safeOrderNo}`;
}

function createProviderRefundNo(refundNo: string) {
  const safeRefundNo = refundNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `LOCAL-PORTAL-PROVIDER-${safeRefundNo}`;
}

function createProviderPaymentNo(paymentNo: string) {
  const safePaymentNo = paymentNo.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `LOCAL-PORTAL-PROVIDER-${safePaymentNo}`;
}

function canConfirmLatestPayment(order: PortalOrderRecord) {
  return order.status === 'pending_payment' && order.latestPayment?.status === 'pending';
}

function canCreateLocalPayment(order: PortalOrderRecord) {
  return order.status === 'pending_payment' && order.latestPayment?.status !== 'pending';
}

function canCancelOrder(order: PortalOrderRecord) {
  return order.status === 'pending_payment';
}

function canRequestRefund(order: PortalOrderRecord) {
  return order.status === 'paid' && order.latestPayment?.status === 'paid' && !order.latestRefund;
}

function canConfirmLatestRefund(order: PortalOrderRecord) {
  return order.status === 'refund_processing' && order.latestRefund?.status === 'processing';
}

function resetPaymentConfirmation() {
  paymentConfirmError.value = null;
  confirmedPaymentMessage.value = null;
}

function resetOrderCancellation() {
  orderCancelError.value = null;
  orderCancelMessage.value = null;
}

function resetRefundRequest() {
  refundError.value = null;
  refundMessage.value = null;
  createdRefund.value = null;
  refundConfirmError.value = null;
  refundConfirmMessage.value = null;
}

async function submitLocalOrder() {
  if (!selectedDetail.value) {
    checkoutError.value = '请先选择商品';
    return;
  }

  checkoutLoading.value = true;
  checkoutError.value = null;
  createdOrder.value = null;

  try {
    const result = await createPortalOrder({
      requestId: createCheckoutRequestId(selectedDetail.value.id),
      buyerUserId: localBuyerUserId,
      productPoolItemId: selectedDetail.value.id,
      quantity: 1,
      welfareCardPaymentAmount: 0,
      fulfillment: checkoutFulfillmentPayload()
    });
    createdOrder.value = result.order;
    await loadLocalOrders();
  } catch (submitError) {
    checkoutError.value = submitError instanceof Error ? submitError.message : '订单创建失败';
  } finally {
    checkoutLoading.value = false;
  }
}

async function submitLocalPayment() {
  if (!selectedOrder.value) {
    paymentError.value = '请先选择订单';
    return;
  }

  paymentLoading.value = true;
  paymentError.value = null;
  createdPayment.value = null;

  try {
    const result = await createPortalPayment({
      requestId: createPaymentRequestId(selectedOrder.value.orderNo),
      orderNo: selectedOrder.value.orderNo,
      channel: 'wechat',
      totalAmount: selectedOrder.value.totalAmount,
      welfareCardPayableAmount: selectedOrder.value.welfareCardPayableAmount,
      cashPayableAmount: selectedOrder.value.cashPayableAmount
    });
    createdPayment.value = result.payment;
    selectedOrder.value = {
      ...selectedOrder.value,
      latestPayment: result.payment
    };
    await loadLocalOrders();
  } catch (submitError) {
    paymentError.value = submitError instanceof Error ? submitError.message : '支付单创建失败';
  } finally {
    paymentLoading.value = false;
  }
}

async function confirmLatestPayment() {
  if (!selectedOrder.value?.latestPayment) {
    paymentConfirmError.value = '请先创建支付单';
    return;
  }

  const orderNo = selectedOrder.value.orderNo;
  const paymentNo = selectedOrder.value.latestPayment.paymentNo;

  paymentConfirmLoading.value = true;
  paymentConfirmError.value = null;
  confirmedPaymentMessage.value = null;

  try {
    await confirmPortalPayment({
      providerEventId: createPaymentCallbackEventId(orderNo),
      paymentNo,
      providerPaymentNo: createProviderPaymentNo(paymentNo),
      status: 'paid',
      paidAt: new Date().toISOString(),
      payload: { source: 'portal-local-payment' }
    });

    await loadLocalOrders();
    const response = await fetchPortalOrderDetail({
      orderNo,
      buyerUserId: localBuyerUserId
    });
    selectedOrder.value = response.order;
    confirmedPaymentMessage.value = '支付已确认';
  } catch (confirmError) {
    paymentConfirmError.value = confirmError instanceof Error ? confirmError.message : '支付确认失败';
  } finally {
    paymentConfirmLoading.value = false;
  }
}

async function cancelSelectedOrder() {
  if (!selectedOrder.value) {
    orderCancelError.value = '请先选择订单';
    return;
  }

  if (!canCancelOrder(selectedOrder.value)) {
    orderCancelError.value = '当前订单不可取消';
    return;
  }

  orderCancelLoading.value = true;
  orderCancelError.value = null;
  orderCancelMessage.value = null;

  try {
    const response = await cancelPortalOrder({
      orderNo: selectedOrder.value.orderNo,
      buyerUserId: localBuyerUserId,
      reason: 'user_cancel'
    });
    selectedOrder.value = response.order;
    orderCancelMessage.value = '订单已取消';
    await loadLocalOrders();
  } catch (cancelError) {
    orderCancelError.value = cancelError instanceof Error ? cancelError.message : '订单取消失败';
  } finally {
    orderCancelLoading.value = false;
  }
}

async function requestSelectedOrderRefund() {
  if (!selectedOrder.value?.latestPayment) {
    refundError.value = '请先选择已支付订单';
    return;
  }

  if (!canRequestRefund(selectedOrder.value)) {
    refundError.value = '当前订单不可申请退款';
    return;
  }

  const orderNo = selectedOrder.value.orderNo;
  const payment = selectedOrder.value.latestPayment;

  refundLoading.value = true;
  refundError.value = null;
  refundMessage.value = null;
  createdRefund.value = null;

  try {
    const result = await createPortalRefund({
      requestId: createRefundRequestId(orderNo),
      paymentNo: payment.paymentNo,
      orderNo,
      channel: 'wechat',
      refundAmount: selectedOrder.value.totalAmount,
      reason: 'after_sale'
    });

    createdRefund.value = result.refund;
    await loadLocalOrders();
    const response = await fetchPortalOrderDetail({
      orderNo,
      buyerUserId: localBuyerUserId
    });
    selectedOrder.value = response.order;
    refundMessage.value = '退款申请已提交';
  } catch (requestError) {
    refundError.value = requestError instanceof Error ? requestError.message : '退款申请失败';
  } finally {
    refundLoading.value = false;
  }
}

async function confirmLatestRefund() {
  if (!selectedOrder.value?.latestRefund) {
    refundConfirmError.value = '请先选择退款单';
    return;
  }

  if (!canConfirmLatestRefund(selectedOrder.value)) {
    refundConfirmError.value = '当前退款不可确认';
    return;
  }

  const orderNo = selectedOrder.value.orderNo;
  const refundNo = selectedOrder.value.latestRefund.refundNo;

  refundConfirmLoading.value = true;
  refundConfirmError.value = null;
  refundConfirmMessage.value = null;

  try {
    await confirmPortalRefund({
      providerEventId: createRefundCallbackEventId(orderNo),
      refundNo,
      providerRefundNo: createProviderRefundNo(refundNo),
      status: 'succeeded',
      succeededAt: new Date().toISOString(),
      payload: { source: 'portal-local-refund' }
    });

    await loadLocalOrders();
    const response = await fetchPortalOrderDetail({
      orderNo,
      buyerUserId: localBuyerUserId
    });
    selectedOrder.value = response.order;
    refundConfirmMessage.value = '退款已确认';
  } catch (confirmError) {
    refundConfirmError.value = confirmError instanceof Error ? confirmError.message : '退款确认失败';
  } finally {
    refundConfirmLoading.value = false;
  }
}
</script>

<template>
  <main class="portal-shell">
    <header class="portal-topbar">
      <div>
        <p class="eyebrow">商品池</p>
        <h1>企业福利商品目录</h1>
      </div>
      <button type="button" class="refresh-button" @click="loadCatalog">刷新</button>
    </header>

    <section class="summary-band">
      <div>
        <span>可选商品</span>
        <strong>{{ totalItems }}</strong>
      </div>
      <div>
        <span>启用商品池</span>
        <strong>{{ productPools.length }}</strong>
      </div>
    </section>

    <section class="orders-section" aria-live="polite">
      <div class="section-heading">
        <div>
          <p class="eyebrow">本地用户</p>
          <h2>我的订单</h2>
        </div>
        <button type="button" class="secondary-button" :disabled="ordersLoading" @click="loadLocalOrders">
          {{ ordersLoading ? '刷新中' : '刷新订单' }}
        </button>
      </div>

      <p v-if="ordersLoading" class="state-text compact">订单加载中</p>
      <p v-else-if="ordersError" class="state-text error">{{ ordersError }}</p>
      <p v-else-if="orders.length === 0" class="state-text compact">暂无订单</p>
      <div v-else class="order-list">
        <button
          v-for="order in orders"
          :key="order.orderNo"
          type="button"
          class="order-row"
          :aria-label="`查看订单 ${order.orderNo} 详情`"
          @click="openOrderDetail(order)"
        >
          <span>{{ order.orderNo }}</span>
          <strong>{{ formatMoney(order.totalAmount) }}</strong>
          <em>{{ statusText(order.status) }}</em>
          <small v-if="order.latestPayment" class="order-payment-summary">
            最近支付 {{ order.latestPayment.paymentNo }} · {{ paymentSummaryText(order.latestPayment) }}
          </small>
          <small class="order-payment-summary">履约商户 {{ orderLineMerchantText(order) }}</small>
          <small v-if="hasFulfillmentProgress(order)" class="order-payment-summary">
            履约 待履约 {{ order.fulfillmentSummary?.pendingTasks ?? 0 }} · 已完成
            {{ order.fulfillmentSummary?.completedTasks ?? 0 }}
          </small>
        </button>
      </div>
    </section>

    <section v-if="orderDetailLoading || orderDetailError || selectedOrder" class="order-detail-section" aria-live="polite">
      <div class="section-heading">
        <div>
          <p class="eyebrow">订单详情</p>
          <h2>{{ selectedOrder?.orderNo ?? '正在加载订单详情' }}</h2>
        </div>
        <button type="button" class="secondary-button" @click="closeOrderDetail">关闭订单</button>
      </div>

      <p v-if="orderDetailLoading" class="state-text compact">订单详情加载中</p>
      <p v-else-if="orderDetailError" class="state-text error">{{ orderDetailError }}</p>
      <div v-else-if="selectedOrder" class="order-detail-body">
        <div class="order-facts">
          <div>
            <span>订单状态</span>
            <strong>{{ statusText(selectedOrder.status) }}</strong>
          </div>
          <div>
            <span>订单金额</span>
            <strong>{{ formatMoney(selectedOrder.totalAmount) }}</strong>
          </div>
          <div>
            <span>收货人</span>
            <strong>{{ selectedOrder.receiverName ?? '待补充' }}</strong>
          </div>
          <div>
            <span>配送地址</span>
            <strong>{{ selectedOrder.receiverAddress ?? selectedOrder.pickupStoreName ?? '待补充' }}</strong>
          </div>
        </div>
        <div v-if="selectedOrder.pickupCode" class="pickup-code-row">
          <span>取货码</span>
          <strong>{{ selectedOrder.pickupCode }}</strong>
        </div>
        <div class="order-line-list">
          <article v-for="line in selectedOrder.lines" :key="line.id" class="order-line">
            <img :src="line.displayImageUrl" :alt="line.displayName" />
            <div>
              <h3>{{ line.displayName }}</h3>
              <p>{{ line.displaySkuCode ?? '默认规格' }} · x{{ line.quantity }}</p>
              <p>履约商户 {{ line.merchantId ?? '待确认' }}</p>
            </div>
            <strong>{{ formatMoney(line.lineTotalAmount) }}</strong>
          </article>
        </div>
        <section v-if="canCancelOrder(selectedOrder) || orderCancelError || orderCancelMessage" class="payment-block">
          <div>
            <h3>订单操作</h3>
            <p>待支付订单可由本地买家主动取消</p>
          </div>
          <button
            v-if="canCancelOrder(selectedOrder)"
            type="button"
            class="secondary-button"
            :aria-label="`取消订单 ${selectedOrder.orderNo}`"
            :disabled="orderCancelLoading"
            @click="cancelSelectedOrder"
          >
            {{ orderCancelLoading ? '取消中' : '取消订单' }}
          </button>
          <p v-if="orderCancelError" class="checkout-message error">{{ orderCancelError }}</p>
          <p v-if="orderCancelMessage" class="checkout-message success">{{ orderCancelMessage }}</p>
        </section>
        <section v-if="hasFulfillmentProgress(selectedOrder)" class="fulfillment-block">
          <div>
            <h3>履约进度</h3>
            <p>
              待履约 {{ selectedOrder.fulfillmentSummary?.pendingTasks ?? 0 }} · 已完成
              {{ selectedOrder.fulfillmentSummary?.completedTasks ?? 0 }}
            </p>
          </div>
          <div class="fulfillment-task-list">
            <article v-for="task in selectedOrder.fulfillmentTasks ?? []" :key="task.taskNo" class="fulfillment-task">
              <strong>{{ task.taskNo }}</strong>
              <span>{{ fulfillmentTaskStatusText(task.status) }}</span>
            </article>
          </div>
        </section>
        <section v-if="selectedOrder.latestPayment" class="payment-block persisted-payment">
          <div>
            <h3>最近支付</h3>
            <p>{{ paymentSummaryText(selectedOrder.latestPayment) }}</p>
          </div>
          <div class="checkout-result">
            <span>支付单</span>
            <strong>{{ selectedOrder.latestPayment.paymentNo }}</strong>
            <p>{{ formatMoney(selectedOrder.latestPayment.cashPayableAmount) }}</p>
          </div>
          <p
            v-if="createdPayment?.paymentNo === selectedOrder.latestPayment.paymentNo"
            class="checkout-message success"
          >
            支付单创建成功
          </p>
          <button
            v-if="canConfirmLatestPayment(selectedOrder)"
            type="button"
            class="checkout-button"
            :aria-label="`确认支付单 ${selectedOrder.latestPayment.paymentNo} 支付成功`"
            :disabled="paymentConfirmLoading"
            @click="confirmLatestPayment"
          >
            {{ paymentConfirmLoading ? '确认中' : '确认支付成功' }}
          </button>
          <p v-if="paymentConfirmError" class="checkout-message error">{{ paymentConfirmError }}</p>
          <p v-if="confirmedPaymentMessage" class="checkout-message success">{{ confirmedPaymentMessage }}</p>
        </section>
        <section
          v-if="canRequestRefund(selectedOrder) || selectedOrder.latestRefund || refundError || refundMessage"
          class="payment-block"
        >
          <div>
            <h3>售后退款</h3>
            <p>已支付订单可发起全额退款申请</p>
          </div>
          <button
            v-if="canRequestRefund(selectedOrder)"
            type="button"
            class="secondary-button"
            :aria-label="`为订单 ${selectedOrder.orderNo} 申请退款`"
            :disabled="refundLoading"
            @click="requestSelectedOrderRefund"
          >
            {{ refundLoading ? '提交中' : '申请退款' }}
          </button>
          <p v-if="refundError" class="checkout-message error">{{ refundError }}</p>
          <p v-if="refundMessage" class="checkout-message success">{{ refundMessage }}</p>
          <div v-if="selectedOrder.latestRefund ?? createdRefund" class="checkout-result">
            <span>退款单</span>
            <strong>{{ (selectedOrder.latestRefund ?? createdRefund)?.refundNo }}</strong>
            <p>{{ refundStatusText((selectedOrder.latestRefund ?? createdRefund)?.status ?? '') }}</p>
          </div>
          <button
            v-if="selectedOrder.latestRefund && canConfirmLatestRefund(selectedOrder)"
            type="button"
            class="checkout-button"
            :aria-label="`确认退款单 ${selectedOrder.latestRefund.refundNo} 退款成功`"
            :disabled="refundConfirmLoading"
            @click="confirmLatestRefund"
          >
            {{ refundConfirmLoading ? '确认中' : '确认退款成功' }}
          </button>
          <p v-if="refundConfirmError" class="checkout-message error">{{ refundConfirmError }}</p>
          <p v-if="refundConfirmMessage" class="checkout-message success">{{ refundConfirmMessage }}</p>
        </section>
        <section v-if="canCreateLocalPayment(selectedOrder)" class="payment-block">
          <div>
            <h3>本地支付</h3>
            <p>微信支付 · 应付 {{ formatMoney(selectedOrder.cashPayableAmount) }}</p>
          </div>
          <button
            type="button"
            class="checkout-button"
            :aria-label="`为订单 ${selectedOrder.orderNo} 发起支付`"
            :disabled="paymentLoading"
            @click="submitLocalPayment"
          >
            {{ paymentLoading ? '创建中' : '发起支付' }}
          </button>
          <p v-if="paymentError" class="checkout-message error">{{ paymentError }}</p>
          <div v-if="createdPayment" class="checkout-result">
            <span>支付单创建成功</span>
            <strong>{{ createdPayment.paymentNo }}</strong>
            <p>{{ paymentChannelText(createdPayment.channel) }} · {{ paymentStatusText(createdPayment.status) }}</p>
          </div>
        </section>
      </div>
    </section>

    <p v-if="loading" class="state-text">加载中</p>
    <p v-else-if="error" class="state-text error">{{ error }}</p>
    <p v-else-if="totalItems === 0" class="state-text">暂无可展示商品</p>

    <div v-else class="pool-list">
      <section v-for="pool in productPools" :key="pool.id" class="pool-section">
        <div class="pool-heading">
          <div>
            <h2>{{ pool.name }}</h2>
            <p>{{ pool.code }}</p>
          </div>
          <span>{{ pool.items.length }} 个商品</span>
        </div>

        <div v-if="pool.items.length === 0" class="state-text compact">暂无可展示商品</div>
        <div v-else class="product-grid">
          <button
            v-for="item in pool.items"
            :key="item.id"
            type="button"
            class="product-card"
            :aria-label="`查看 ${item.displayName} 详情`"
            @click="openProductDetail(item)"
          >
            <img :src="item.displayImageUrl" :alt="item.displayName" />
            <div class="product-body">
              <h3>{{ item.displayName }}</h3>
              <p>{{ item.displaySkuCode ?? '默认规格' }}</p>
              <strong>{{ formatMoney(item.displayPriceAmount) }}</strong>
            </div>
          </button>
        </div>
      </section>
    </div>

    <section v-if="detailLoading || detailError || selectedDetail" class="detail-section" aria-live="polite">
      <div class="detail-heading">
        <div>
          <p class="eyebrow">商品详情</p>
          <h2>{{ selectedDetail?.displayName ?? '正在加载商品详情' }}</h2>
        </div>
        <button type="button" class="close-button" @click="closeProductDetail">关闭详情</button>
      </div>

      <p v-if="detailLoading" class="state-text compact">详情加载中</p>
      <p v-else-if="detailError" class="state-text error">{{ detailError }}</p>
      <div v-else-if="selectedDetail" class="detail-layout">
        <img :src="selectedDetail.displayImageUrl" :alt="selectedDetail.displayName" class="detail-image" />
        <div class="detail-content">
          <div class="detail-price-row">
            <strong>{{ formatMoney(selectedDetail.displayPriceAmount) }}</strong>
            <span>{{ selectedDetail.displaySkuCode ?? selectedDetail.sku?.code ?? '默认规格' }}</span>
          </div>
          <dl class="detail-facts">
            <div>
              <dt>商品编码</dt>
              <dd>{{ selectedDetail.product.code }}</dd>
            </div>
            <div>
              <dt>履约商户</dt>
              <dd>{{ selectedDetail.product.merchantId }}</dd>
            </div>
            <div>
              <dt>品牌</dt>
              <dd>{{ selectedDetail.product.brand?.name ?? '未设置品牌' }}</dd>
            </div>
            <div>
              <dt>分类</dt>
              <dd>{{ selectedDetail.product.category?.name ?? '未设置分类' }}</dd>
            </div>
            <div>
              <dt>产地</dt>
              <dd>{{ originText }}</dd>
            </div>
            <div v-if="selectedDetail.sku?.specText">
              <dt>规格</dt>
              <dd>{{ selectedDetail.sku.specText }}</dd>
            </div>
          </dl>

          <section v-if="selectedDetail.product.parameters.length > 0" class="detail-block">
            <h3>商品参数</h3>
            <ul>
              <li v-for="parameter in selectedDetail.product.parameters" :key="`${parameter.groupName}-${parameter.name}`">
                <span>{{ parameter.name }}</span>
                <strong>{{ parameter.value }}</strong>
              </li>
            </ul>
          </section>

          <section v-if="selectedDetail.product.qualifications.length > 0" class="detail-block">
            <h3>资质信息</h3>
            <ul>
              <li v-for="qualification in selectedDetail.product.qualifications" :key="qualification.title">
                <span>{{ qualification.title }}</span>
                <strong>{{ qualification.certificateNo ?? '证书待上传' }}</strong>
              </li>
            </ul>
          </section>

          <section v-if="selectedDetail.product.detailSections.length > 0" class="detail-block">
            <h3>图文说明</h3>
            <article v-for="section in selectedDetail.product.detailSections" :key="`${section.title}-${section.sortOrder}`">
              <h4>{{ section.title ?? '商品说明' }}</h4>
              <p>{{ section.content }}</p>
            </article>
          </section>

          <section class="checkout-block">
            <div>
              <h3>本地下单</h3>
              <p>{{ checkoutSummary }}</p>
            </div>
            <div class="checkout-mode-control" aria-label="履约方式">
              <button
                type="button"
                class="mode-button"
                :class="{ active: checkoutFulfillmentMode === 'delivery' }"
                aria-label="选择配送履约方式"
                :aria-pressed="checkoutFulfillmentMode === 'delivery'"
                @click="selectCheckoutFulfillmentMode('delivery')"
              >
                配送
              </button>
              <button
                type="button"
                class="mode-button"
                :class="{ active: checkoutFulfillmentMode === 'pickup' }"
                aria-label="选择商户自提履约方式"
                :aria-pressed="checkoutFulfillmentMode === 'pickup'"
                @click="selectCheckoutFulfillmentMode('pickup')"
              >
                商户自提
              </button>
            </div>
            <button
              type="button"
              class="checkout-button"
              :aria-label="`为 ${selectedDetail.displayName} 创建订单`"
              :disabled="checkoutLoading"
              @click="submitLocalOrder"
            >
              {{ checkoutLoading ? '创建中' : '立即下单' }}
            </button>
            <p v-if="checkoutError" class="checkout-message error">{{ checkoutError }}</p>
            <div v-if="createdOrder" class="checkout-result">
              <span>订单创建成功</span>
              <strong>{{ createdOrder.orderNo }}</strong>
              <p>{{ statusText(createdOrder.status) }} · {{ formatMoney(createdOrder.totalAmount) }}</p>
              <button
                type="button"
                class="secondary-button"
                :aria-label="`查看订单 ${createdOrder.orderNo} 详情并支付`"
                :disabled="orderDetailLoading"
                @click="openOrderDetailByOrderNo(createdOrder.orderNo)"
              >
                {{ orderDetailLoading ? '加载订单中' : '查看订单并支付' }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>
