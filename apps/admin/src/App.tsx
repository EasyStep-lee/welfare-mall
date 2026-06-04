import { Check, CreditCard, RefreshCw, RotateCcw, Search, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  AdminFulfillmentStatusFilter,
  AdminOrder,
  AdminOrderStatusFilter,
  ReviewQueueItem,
  ReviewQueueStatus,
  adminFulfillmentStatusLabels,
  adminOrderStatusLabels,
  createOrderRefund,
  decideProductReview,
  fetchAdminOrders,
  fetchReviewQueue,
  processOrderPaymentCallback,
  processOrderRefundCallback,
  publishProductToPool,
  statusLabels
} from './api';
import './styles.css';

const adminActorUserId = 'admin-user-001';
const statuses: ReviewQueueStatus[] = ['pending_review', 'approved', 'rejected'];
const orderStatuses: AdminOrderStatusFilter[] = [
  'all',
  'pending_payment',
  'paid',
  'refund_processing',
  'refunded',
  'completed'
];
const fulfillmentStatuses: AdminFulfillmentStatusFilter[] = ['all', 'pending', 'completed'];

export default function App() {
  const [activeStatus, setActiveStatus] = useState<ReviewQueueStatus>('pending_review');
  const [activeOrderStatus, setActiveOrderStatus] = useState<AdminOrderStatusFilter>('all');
  const [activeFulfillmentStatus, setActiveFulfillmentStatus] = useState<AdminFulfillmentStatusFilter>('all');
  const [merchantFilterInput, setMerchantFilterInput] = useState('');
  const [activeMerchantFilter, setActiveMerchantFilter] = useState('');
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.productId === selectedProductId) ?? items[0] ?? null,
    [items, selectedProductId]
  );

  async function loadQueue(status: ReviewQueueStatus) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchReviewQueue(status);
      setItems(response.items);
      setSelectedProductId(response.items[0]?.productId ?? null);
    } catch (loadError) {
      setItems([]);
      setSelectedProductId(null);
      setError(loadError instanceof Error ? loadError.message : '商品审核队列加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders(
    status: AdminOrderStatusFilter = activeOrderStatus,
    fulfillmentStatus: AdminFulfillmentStatusFilter = activeFulfillmentStatus,
    merchantId: string = activeMerchantFilter
  ) {
    try {
      const response = await fetchAdminOrders(status, fulfillmentStatus, merchantId);
      setOrders(response.orders);
    } catch (loadError) {
      setOrders([]);
      setError(loadError instanceof Error ? loadError.message : '订单管理列表加载失败');
    }
  }

  useEffect(() => {
    void loadQueue(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    void loadOrders(activeOrderStatus, activeFulfillmentStatus, activeMerchantFilter);
  }, [activeOrderStatus, activeFulfillmentStatus, activeMerchantFilter]);

  async function approve(item: ReviewQueueItem) {
    await runAction(async () => {
      await decideProductReview({ productId: item.productId, action: 'approve', actorUserId: adminActorUserId });
      setMessage(`${item.name} 已通过审核`);
      await loadQueue(activeStatus);
    });
  }

  async function reject(item: ReviewQueueItem) {
    const reason = window.prompt('驳回原因', item.latestReviewLog?.reason ?? '');
    if (!reason?.trim()) {
      return;
    }

    await runAction(async () => {
      await decideProductReview({
        productId: item.productId,
        action: 'reject',
        actorUserId: adminActorUserId,
        reason: reason.trim()
      });
      setMessage(`${item.name} 已驳回`);
      await loadQueue(activeStatus);
    });
  }

  async function publish(item: ReviewQueueItem) {
    await runAction(async () => {
      await publishProductToPool({ productId: item.productId, actorUserId: adminActorUserId });
      setMessage(`${item.name} 已发布到商品池`);
      await loadQueue(activeStatus);
    });
  }

  async function requestRefund(order: AdminOrder) {
    const payment = order.latestPayment;

    if (!payment) {
      return;
    }

    await runAction(async () => {
      const result = await createOrderRefund({
        requestId: `admin-refund-${order.orderNo}-${Date.now()}`,
        paymentNo: payment.paymentNo,
        orderNo: order.orderNo,
        channel: payment.channel,
        refundAmount: order.totalAmount,
        reason: 'after_sale'
      });
      setMessage(`${order.orderNo} 已提交退款申请 ${result.refund.refundNo}`);
      await loadOrders(activeOrderStatus, activeFulfillmentStatus, activeMerchantFilter);
    });
  }

  async function confirmPayment(order: AdminOrder) {
    const payment = order.latestPayment;

    if (!payment) {
      return;
    }

    await runAction(async () => {
      const result = await processOrderPaymentCallback({
        providerEventId: `admin-payment-${order.orderNo}-${Date.now()}`,
        paymentNo: payment.paymentNo,
        providerPaymentNo: `admin-confirm-${payment.paymentNo}`,
        status: 'paid',
        paidAt: new Date().toISOString(),
        payload: { source: 'admin-order-management' }
      });
      setMessage(`${order.orderNo} 已确认支付成功 ${result.payment.paymentNo}`);
      await loadOrders(activeOrderStatus, activeFulfillmentStatus, activeMerchantFilter);
    });
  }

  async function confirmRefund(order: AdminOrder) {
    const refund = order.latestRefund;

    if (!refund) {
      return;
    }

    await runAction(async () => {
      const result = await processOrderRefundCallback({
        providerEventId: `admin-refund-${order.orderNo}-${Date.now()}`,
        refundNo: refund.refundNo,
        providerRefundNo: `admin-confirm-${refund.refundNo}`,
        status: 'succeeded',
        succeededAt: new Date().toISOString(),
        payload: { source: 'admin-order-management' }
      });
      setMessage(`${order.orderNo} 已确认退款成功 ${result.refund.refundNo}`);
      await loadOrders(activeOrderStatus, activeFulfillmentStatus, activeMerchantFilter);
    });
  }

  function applyMerchantFilter() {
    setActiveMerchantFilter(merchantFilterInput.trim());
  }

  function clearMerchantFilter() {
    setMerchantFilterInput('');
    setActiveMerchantFilter('');
  }

  async function runAction(action: () => Promise<void>) {
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败');
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">商品域基础</p>
          <h1>商品审核工作台</h1>
        </div>
        <button className="icon-button" onClick={() => void loadQueue(activeStatus)} aria-label="刷新队列">
          <RefreshCw size={18} />
        </button>
      </header>

      <nav className="status-tabs" aria-label="审核状态">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={activeStatus === status ? 'active' : ''}
            onClick={() => setActiveStatus(status)}
          >
            {statusLabels[status]}
          </button>
        ))}
      </nav>

      {message ? <div className="notice success">{message}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <section className="order-panel" aria-label="订单管理">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">订单域</p>
            <h2>订单管理</h2>
          </div>
          <span className="queue-count">{orders.length} 单</span>
        </div>
        <nav className="status-tabs panel-status-tabs" aria-label="订单状态">
          {orderStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={activeOrderStatus === status ? 'active' : ''}
              onClick={() => setActiveOrderStatus(status)}
            >
              {adminOrderStatusLabels[status]}
            </button>
          ))}
        </nav>
        <nav className="status-tabs panel-status-tabs" aria-label="履约状态">
          {fulfillmentStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={activeFulfillmentStatus === status ? 'active' : ''}
              onClick={() => setActiveFulfillmentStatus(status)}
            >
              {adminFulfillmentStatusLabels[status]}
            </button>
          ))}
        </nav>
        <div className="order-filter-row">
          <label>
            <span>履约商户</span>
            <input
              aria-label="履约商户"
              value={merchantFilterInput}
              placeholder="merchant-001"
              onChange={(event) => setMerchantFilterInput(event.target.value)}
            />
          </label>
          <button type="button" onClick={applyMerchantFilter}>
            <Search size={15} />
            筛选商户
          </button>
          {activeMerchantFilter ? (
            <button type="button" onClick={clearMerchantFilter}>
              <X size={15} />
              清除商户
            </button>
          ) : null}
        </div>
        <div className="order-list">
          {orders.length === 0 ? <p className="empty-text">暂无订单</p> : null}
          {orders.map((order) => (
            <article className="order-card" key={order.orderNo}>
              <div className="order-card-header">
                <strong>{order.orderNo}</strong>
                <span>{orderStatusLabel(order.status)}</span>
              </div>
              <dl className="order-metrics">
                <div>
                  <dt>买家</dt>
                  <dd>{order.buyerUserId}</dd>
                </div>
                <div>
                  <dt>收货</dt>
                  <dd>{formatReceiver(order)}</dd>
                </div>
                <div>
                  <dt>金额</dt>
                  <dd>合计 {formatMoney(order.totalAmount)}</dd>
                </div>
                <div>
                  <dt>支付</dt>
                  <dd>{formatPayment(order)}</dd>
                </div>
                <div>
                  <dt>履约</dt>
                  <dd>
                    <span>{formatFulfillmentTotal(order)}</span>
                    <span>待履约 {order.fulfillmentSummary.pendingTasks}</span>
                    <span>已完成 {order.fulfillmentSummary.completedTasks}</span>
                  </dd>
                </div>
                {order.latestRefund ? (
                  <div>
                    <dt>退款</dt>
                    <dd>
                      <span>{order.latestRefund.refundNo}</span>
                      <span>{formatRefund(order)}</span>
                    </dd>
                  </div>
                ) : null}
              </dl>
              {formatFulfillmentTasks(order).length > 0 ? (
                <div className="order-fulfillment-tasks">
                  {formatFulfillmentTasks(order).map((task) => (
                    <div className="order-fulfillment-task" key={`${order.orderNo}-${task.taskNo}`}>
                      <strong>{task.taskNo}</strong>
                      {task.merchantId ? <span>商户 {task.merchantId}</span> : null}
                      {task.status ? <span>任务状态 {fulfillmentTaskStatusLabel(task.status)}</span> : null}
                      {task.createdAt ? <span>创建 {formatDateTime(task.createdAt)}</span> : null}
                      {task.completedAt ? <span>完成 {formatDateTime(task.completedAt)}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="order-lines">
                {order.lines.map((line) => (
                  <span key={`${order.orderNo}-${line.displayName}-${line.displaySkuCode ?? 'default'}`}>
                    {line.displayName} x{line.quantity}
                  </span>
                ))}
              </div>
              {canConfirmPayment(order) || canRequestRefund(order) || canConfirmRefund(order) ? (
                <div className="order-actions">
                  {canConfirmPayment(order) ? (
                    <button type="button" onClick={() => void confirmPayment(order)}>
                      <CreditCard size={15} />
                      确认支付成功
                    </button>
                  ) : null}
                  {canRequestRefund(order) ? (
                    <button type="button" onClick={() => void requestRefund(order)}>
                      <RotateCcw size={15} />
                      申请退款
                    </button>
                  ) : null}
                  {canConfirmRefund(order) ? (
                    <button type="button" onClick={() => void confirmRefund(order)}>
                      <Check size={15} />
                      确认退款成功
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="workbench">
        <div className="table-region">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>商户</th>
                <th>加盟商</th>
                <th>主数据</th>
                <th>产地</th>
                <th>动作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>加载中</td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6}>暂无商品</td>
                </tr>
              ) : null}
              {!loading
                ? items.map((item) => (
                    <tr
                      key={item.productId}
                      className={selectedItem?.productId === item.productId ? 'selected' : ''}
                      onClick={() => setSelectedProductId(item.productId)}
                    >
                      <td>
                        <div className="product-cell">
                          <img src={item.primaryImageUrl ?? fallbackImageUrl(item.name)} alt={item.name} />
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.code}</span>
                            <span>{item.category.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.merchant.name}</td>
                      <td>{item.franchise.name}</td>
                      <td>
                        <div className="metric-line">
                          <span>{item.skuCount} 个 SKU</span>
                          <span>{item.imageCount} 张图</span>
                          <span>{item.qualificationCount} 项资质</span>
                        </div>
                      </td>
                      <td>{formatOrigin(item)}</td>
                      <td>
                        <div className="actions">
                          <button type="button" onClick={(event) => actionClick(event, () => approve(item))}>
                            <Check size={15} />
                            通过审核
                          </button>
                          <button type="button" onClick={(event) => actionClick(event, () => reject(item))}>
                            <X size={15} />
                            驳回审核
                          </button>
                          <button
                            type="button"
                            disabled={item.status !== 'approved'}
                            onClick={(event) => actionClick(event, () => publish(item))}
                          >
                            <Send size={15} />
                            发布商品池
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <aside className="detail-panel">
          {selectedItem ? (
            <>
              <img
                className="detail-image"
                src={selectedItem.primaryImageUrl ?? fallbackImageUrl(selectedItem.name)}
                alt={selectedItem.name}
              />
              <h2>{selectedItem.name}</h2>
              <dl>
                <div>
                  <dt>品牌</dt>
                  <dd>{selectedItem.brand?.name ?? '未填写'}</dd>
                </div>
                <div>
                  <dt>参数</dt>
                  <dd>{selectedItem.parameterCount} 项</dd>
                </div>
                <div>
                  <dt>详情图文</dt>
                  <dd>{selectedItem.detailSectionCount} 段</dd>
                </div>
                <div>
                  <dt>最近流转</dt>
                  <dd>{selectedItem.latestReviewLog ? statusActionLabel(selectedItem.latestReviewLog.action) : '无'}</dd>
                </div>
              </dl>
              <div className="review-detail-sections">
                <section className="review-detail-section">
                  <h3>SKU</h3>
                  {selectedItem.primarySku ? (
                    <div className="detail-card">
                      <strong>{selectedItem.primarySku.code}</strong>
                      <span>{selectedItem.primarySku.specText || '未填写规格'}</span>
                      <span>{`销售价 ${formatMoney(selectedItem.primarySku.priceAmount)}`}</span>
                    </div>
                  ) : (
                    <p className="empty-text">暂无 SKU</p>
                  )}
                </section>

                <section className="review-detail-section">
                  <h3>图片</h3>
                  {selectedItem.media.length > 0 ? (
                    <ul className="detail-list">
                      {selectedItem.media.map((media) => (
                        <li key={`${media.type}-${media.url}`}>
                          <strong>{mediaTypeLabel(media.type)}</strong>
                          <span>{media.url}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">暂无图片</p>
                  )}
                </section>

                <section className="review-detail-section">
                  <h3>资质</h3>
                  {selectedItem.qualifications.length > 0 ? (
                    <ul className="detail-list">
                      {selectedItem.qualifications.map((qualification) => (
                        <li key={`${qualification.type}-${qualification.title}`}>
                          <strong>{qualification.title}</strong>
                          <span>{qualification.certificateNo ?? '未填写证书编号'}</span>
                          {qualification.fileUrl ? <span>{qualification.fileUrl}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">暂无资质</p>
                  )}
                </section>

                <section className="review-detail-section">
                  <h3>商品参数</h3>
                  {selectedItem.parameters.length > 0 ? (
                    <ul className="detail-list">
                      {selectedItem.parameters.map((parameter) => (
                        <li key={`${parameter.groupName}-${parameter.name}`}>
                          <strong>{`${parameter.name}: ${parameter.value}`}</strong>
                          <span>{parameter.groupName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">暂无参数</p>
                  )}
                </section>

                <section className="review-detail-section">
                  <h3>详情图文</h3>
                  {selectedItem.detailSections.length > 0 ? (
                    <ul className="detail-list">
                      {selectedItem.detailSections.map((section) => (
                        <li key={`${section.type}-${section.sortOrder}`}>
                          <strong>{section.title ?? detailSectionTypeLabel(section.type)}</strong>
                          {section.content ? <span>{section.content}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">暂无详情图文</p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <p>暂无商品</p>
          )}
        </aside>
      </section>
    </main>
  );
}

function actionClick(event: React.MouseEvent<HTMLButtonElement>, action: () => Promise<void>) {
  event.stopPropagation();
  void action();
}

function formatOrigin(item: ReviewQueueItem) {
  return [item.origin.country, item.origin.province, item.origin.city].filter(Boolean).join(' / ');
}

function statusActionLabel(action: string) {
  const labels: Record<string, string> = {
    submit_review: '提交审核',
    approve: '审核通过',
    reject: '审核驳回'
  };

  return labels[action] ?? action;
}

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function formatReceiver(order: AdminOrder) {
  if (order.fulfillmentType === 'pickup') {
    return order.pickupStoreName ?? '到店自提';
  }

  return [order.receiverName, order.receiverPhone, order.receiverAddress].filter(Boolean).join(' / ');
}

function formatPayment(order: AdminOrder) {
  if (!order.latestPayment) {
    return '未生成支付单';
  }

  return `${paymentChannelLabels[order.latestPayment.channel] ?? order.latestPayment.channel} ${
    paymentStatusLabels[order.latestPayment.status] ?? order.latestPayment.status
  }`;
}

function formatRefund(order: AdminOrder) {
  if (!order.latestRefund) {
    return '无退款单';
  }

  return `${paymentChannelLabels[order.latestRefund.channel] ?? order.latestRefund.channel} ${
    refundStatusLabels[order.latestRefund.status] ?? order.latestRefund.status
  } ${formatMoney(order.latestRefund.refundAmount)}`;
}

function formatFulfillmentTotal(order: AdminOrder) {
  return `履约 ${order.fulfillmentSummary.totalTasks} 项`;
}

function formatFulfillmentTasks(order: AdminOrder) {
  if (order.fulfillmentTasks.length > 0) {
    return order.fulfillmentTasks;
  }

  return order.fulfillmentSummary.taskNos.map((taskNo) => ({
    taskNo,
    merchantId: '',
    status: '',
    createdAt: '',
    completedAt: null
  }));
}

function fulfillmentTaskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: '待履约',
    completed: '履约完成'
  };

  return labels[status] ?? status;
}

function formatDateTime(value: string) {
  const normalized = value.includes('T') ? value : new Date(value).toISOString();
  return normalized.replace('T', ' ').slice(0, 16);
}

function orderStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status;
}

function canRequestRefund(order: AdminOrder) {
  return order.status === 'paid' && order.latestPayment !== null && order.latestPayment.status === 'paid';
}

function canConfirmPayment(order: AdminOrder) {
  return (
    order.status === 'pending_payment' && order.latestPayment !== null && order.latestPayment.status === 'pending'
  );
}

function canConfirmRefund(order: AdminOrder) {
  return order.latestRefund !== null && order.latestRefund.status === 'processing';
}

const orderStatusLabels: Record<string, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  refund_processing: '退款处理中',
  completed: '已完成',
  cancelled: '已取消',
  canceled: '已取消',
  refunded: '已退款'
};

const paymentChannelLabels: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金'
};

const paymentStatusLabels: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  closed: '已关闭',
  refunded: '已退款'
};

const refundStatusLabels: Record<string, string> = {
  processing: '退款处理中',
  succeeded: '退款成功',
  failed: '退款失败'
};

function mediaTypeLabel(type: string) {
  const labels: Record<string, string> = {
    main_image: '主图',
    detail_image: '详情图'
  };

  return labels[type] ?? type;
}

function detailSectionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    text: '文字',
    image: '图片'
  };

  return labels[type] ?? type;
}

function fallbackImageUrl(name: string) {
  const encoded = encodeURIComponent(name.slice(0, 6));
  return `https://placehold.co/320x220/f6f8fb/2f3a4a?text=${encoded}`;
}
