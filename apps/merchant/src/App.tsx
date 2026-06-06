import { Download, RefreshCw, Search, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  completeMerchantFulfillmentOrder,
  fetchMerchantFulfillmentOrders,
  fetchMerchantSettlementStatements,
  merchantFulfillmentStatusLabels,
  merchantSettlementStatementStatusLabels,
  ProductDraftPayload,
  MerchantFulfillmentOrder,
  MerchantFulfillmentStatusFilter,
  MerchantSettlementStatement,
  MerchantSettlementStatementStatusFilter,
  SubmissionQueueItem,
  SubmissionQueueStatus,
  fetchMerchantSubmissionQueue,
  saveProductDraft,
  statusLabels,
  submitProductForReview
} from './api';
import { summarizeMerchantFulfillmentOrders } from './fulfillmentSummary';
import { buildSettlementCsv } from './settlementExport';
import { summarizeSettlementStatements } from './settlementSummary';
import './styles.css';

const merchantActorUserId = 'merchant-user-001';
const statuses: SubmissionQueueStatus[] = ['draft', 'rejected'];
const fulfillmentStatuses: MerchantFulfillmentStatusFilter[] = ['paid', 'completed'];
const settlementStatementStatuses: MerchantSettlementStatementStatusFilter[] = ['generated', 'paid_offline', 'all'];
const fixedMerchantContext = {
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-rice'
};

export default function App() {
  const [activeStatus, setActiveStatus] = useState<SubmissionQueueStatus>('draft');
  const [activeFulfillmentStatus, setActiveFulfillmentStatus] = useState<MerchantFulfillmentStatusFilter>('paid');
  const [activeSettlementStatus, setActiveSettlementStatus] =
    useState<MerchantSettlementStatementStatusFilter>('generated');
  const [orderNoLookupInput, setOrderNoLookupInput] = useState('');
  const [taskNoLookupInput, setTaskNoLookupInput] = useState('');
  const [activeOrderNoLookup, setActiveOrderNoLookup] = useState('');
  const [activeTaskNoLookup, setActiveTaskNoLookup] = useState('');
  const [items, setItems] = useState<SubmissionQueueItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [fulfillmentOrders, setFulfillmentOrders] = useState<MerchantFulfillmentOrder[]>([]);
  const [settlementStatements, setSettlementStatements] = useState<MerchantSettlementStatement[]>([]);
  const [pickupCodeInputs, setPickupCodeInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState({
    code: 'P-RICE-001',
    name: '东北五常大米福利装',
    originProvince: '黑龙江',
    originCity: '哈尔滨',
    priceYuan: '69.90',
    mainImageUrl: 'https://img.example.com/rice-main.jpg',
    detailImageUrl: 'https://img.example.com/rice-detail.jpg',
    qualificationFileUrl: 'https://img.example.com/certs/rice-origin.pdf',
    parameterText: '净含量 5kg',
    detailText: '适合企业福利发放。'
  });

  const selectedItem = useMemo(
    () => items.find((item) => item.productId === selectedProductId) ?? items[0] ?? null,
    [items, selectedProductId]
  );
  const settlementSummary = useMemo(
    () => summarizeSettlementStatements(settlementStatements),
    [settlementStatements]
  );
  const fulfillmentSummary = useMemo(
    () => summarizeMerchantFulfillmentOrders(fulfillmentOrders),
    [fulfillmentOrders]
  );

  async function loadQueue(status: SubmissionQueueStatus) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMerchantSubmissionQueue(status);
      setItems(response.items);
      setSelectedProductId(response.items[0]?.productId ?? null);
    } catch (loadError) {
      setItems([]);
      setSelectedProductId(null);
      setError(loadError instanceof Error ? loadError.message : '商品提审队列加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadFulfillmentOrders(
    status: MerchantFulfillmentStatusFilter = activeFulfillmentStatus,
    orderNo: string = activeOrderNoLookup,
    taskNo: string = activeTaskNoLookup
  ) {
    setError(null);
    try {
      const response = await fetchMerchantFulfillmentOrders(fixedMerchantContext.merchantId, status, { orderNo, taskNo });
      setFulfillmentOrders(response.orders);
    } catch (loadError) {
      setFulfillmentOrders([]);
      setError(loadError instanceof Error ? loadError.message : '履约订单加载失败');
    }
  }

  async function loadSettlementStatements(status: MerchantSettlementStatementStatusFilter = activeSettlementStatus) {
    setError(null);
    try {
      const response = await fetchMerchantSettlementStatements(fixedMerchantContext.merchantId, status);
      setSettlementStatements(response.statements);
    } catch (loadError) {
      setSettlementStatements([]);
      setError(loadError instanceof Error ? loadError.message : '结算单列表加载失败');
    }
  }

  useEffect(() => {
    void loadQueue(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    void loadFulfillmentOrders(activeFulfillmentStatus, activeOrderNoLookup, activeTaskNoLookup);
  }, [activeFulfillmentStatus, activeOrderNoLookup, activeTaskNoLookup]);

  useEffect(() => {
    void loadSettlementStatements(activeSettlementStatus);
  }, [activeSettlementStatus]);

  async function submit(item: SubmissionQueueItem) {
    setError(null);
    setMessage(null);
    try {
      await submitProductForReview({ productId: item.productId, actorUserId: merchantActorUserId });
      setMessage(`${item.name} 已提交审核`);
      await loadQueue(activeStatus);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交审核失败');
    }
  }

  async function saveDraft() {
    setError(null);
    setMessage(null);
    try {
      const payload = toDraftPayload(draftForm);
      await saveProductDraft({ payload, actorUserId: merchantActorUserId });
      setMessage(`${payload.name} 草稿已保存`);
      await loadQueue('draft');
      setActiveStatus('draft');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存草稿失败');
    }
  }

  async function completeFulfillmentOrder(order: MerchantFulfillmentOrder) {
    setError(null);
    setMessage(null);
    try {
      await completeMerchantFulfillmentOrder({
        merchantId: fixedMerchantContext.merchantId,
        orderNo: order.orderNo,
        pickupCode: order.fulfillmentType === 'pickup' ? pickupCodeInputs[order.taskNo]?.trim() : undefined
      });
      setMessage(`${order.orderNo} 已确认完成`);
      setPickupCodeInputs((current) => {
        const next = { ...current };
        delete next[order.taskNo];
        return next;
      });
      await loadFulfillmentOrders(activeFulfillmentStatus, activeOrderNoLookup, activeTaskNoLookup);
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : '确认履约完成失败');
    }
  }

  function applyFulfillmentLookup() {
    setActiveOrderNoLookup(orderNoLookupInput.trim());
    setActiveTaskNoLookup(taskNoLookupInput.trim());
  }

  function clearFulfillmentLookup() {
    setOrderNoLookupInput('');
    setTaskNoLookupInput('');
    setActiveOrderNoLookup('');
    setActiveTaskNoLookup('');
  }

  function exportSettlementStatements() {
    if (settlementStatements.length === 0) {
      setMessage(null);
      setError('暂无可导出的结算单');
      return;
    }

    const csv = buildSettlementCsv(settlementStatements);
    downloadTextFile(createSettlementExportFilename(activeSettlementStatus), csv);
    setError(null);
    setMessage(`已导出 ${settlementStatements.length} 张结算单`);
  }

  function updateDraftField(field: keyof typeof draftForm, value: string) {
    setDraftForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updatePickupCodeInput(taskNo: string, value: string) {
    setPickupCodeInputs((current) => ({
      ...current,
      [taskNo]: value
    }));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">商户商品中心</p>
          <h1>商品提审工作台</h1>
        </div>
        <button className="icon-button" onClick={() => void loadQueue(activeStatus)} aria-label="刷新商品">
          <RefreshCw size={18} />
        </button>
      </header>

      <nav className="status-tabs" aria-label="商品提审状态">
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

      <section className="settlement-panel" aria-label="商户结算">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">结算对账</p>
            <h2>商户结算</h2>
          </div>
          <span className="queue-count">{settlementStatements.length} 张</span>
        </div>
        <nav className="status-tabs panel-status-tabs" aria-label="结算状态">
          {settlementStatementStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={activeSettlementStatus === status ? 'active' : ''}
              onClick={() => setActiveSettlementStatus(status)}
            >
              {merchantSettlementStatementStatusLabels[status]}
            </button>
          ))}
        </nav>
        <div className="settlement-export-row">
          <button type="button" className="submit-button" onClick={exportSettlementStatements} disabled={settlementStatements.length === 0}>
            <Download size={15} />
            导出结算CSV
          </button>
        </div>
        <div className="settlement-summary-panel" aria-label="结算汇总">
          <strong>结算汇总</strong>
          <span>汇总结算单 {settlementSummary.statementCount} 张</span>
          <span>汇总明细 {settlementSummary.itemCount} 条</span>
          <span>汇总总额 {formatMoney(settlementSummary.grossAmount)}</span>
          <span>汇总退款抵扣 {formatMoney(settlementSummary.refundOffsetAmount)}</span>
          <span>汇总调整 {formatSignedMoney(settlementSummary.adjustmentAmount)}</span>
          <span>汇总应收 {formatMoney(settlementSummary.netAmount)}</span>
        </div>
        <div className="settlement-list">
          {settlementStatements.length === 0 ? <p className="empty-text">暂无结算单</p> : null}
          {settlementStatements.map((statement) => (
            <article className="settlement-card" key={statement.statementNo}>
              <div className="settlement-card-header">
                <strong>{statement.statementNo}</strong>
                <span className={`settlement-status ${statement.status}`}>{settlementStatementStatusLabel(statement.status)}</span>
              </div>
              <div className="settlement-summary">
                <span>生成 {formatDateTime(statement.generatedAt)}</span>
                {statement.paidAt ? <span>打款 {formatDateTime(statement.paidAt)}</span> : null}
                {statement.payoutReference ? <span>流水 {statement.payoutReference}</span> : null}
                {statement.payoutRemark ? <span>备注 {statement.payoutRemark}</span> : null}
                <span>明细 {statement.itemCount} 条</span>
                <span>总额 {formatMoney(statement.grossAmount)}</span>
                <span>退款抵扣 {formatMoney(statement.refundOffsetAmount)}</span>
                <span>调整 {formatSignedMoney(statement.adjustmentAmount)}</span>
                <span>应收 {formatMoney(statement.netAmount)}</span>
              </div>
              <div className="settlement-bill-list">
                {statement.items.map((item) => (
                  <div className="settlement-bill-row" key={item.id}>
                    <strong>{item.orderNo}</strong>
                    <span>{`${item.productId} / ${item.skuId ?? '默认规格'}`}</span>
                    <span>账单 {formatMoney(item.netAmount)}</span>
                    <span>{settlementBillItemStatusLabel(item.status)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fulfillment-panel" aria-label="履约订单">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">订单履约</p>
            <h2>履约订单</h2>
          </div>
          <span className="queue-count">{fulfillmentOrders.length} 单</span>
        </div>
        <nav className="status-tabs panel-status-tabs" aria-label="履约状态">
          {fulfillmentStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={activeFulfillmentStatus === status ? 'active' : ''}
              onClick={() => setActiveFulfillmentStatus(status)}
            >
              {merchantFulfillmentStatusLabels[status]}
            </button>
          ))}
        </nav>
        <div className="fulfillment-filter-row">
          <label>
            履约订单号
            <input
              aria-label="履约订单号"
              value={orderNoLookupInput}
              onChange={(event) => setOrderNoLookupInput(event.target.value)}
            />
          </label>
          <label className="task-filter-field">
            履约任务号
            <input
              aria-label="履约任务号"
              value={taskNoLookupInput}
              onChange={(event) => setTaskNoLookupInput(event.target.value)}
            />
          </label>
          <button type="button" className="submit-button" onClick={applyFulfillmentLookup}>
            <Search size={15} />
            筛选履约
          </button>
          {activeOrderNoLookup || activeTaskNoLookup ? (
            <button type="button" className="submit-button secondary-action" onClick={clearFulfillmentLookup}>
              <X size={15} />
              清除履约
            </button>
          ) : null}
        </div>
        <div className="queue-summary-panel" aria-label="履约汇总">
          <strong>履约汇总</strong>
          <span>汇总任务 {fulfillmentSummary.taskCount} 单</span>
          <span>汇总商品 {fulfillmentSummary.lineQuantity} 件</span>
          <span>汇总总额 {formatMoney(fulfillmentSummary.totalAmount)}</span>
          <span>汇总福利卡 {formatMoney(fulfillmentSummary.welfareCardPayableAmount)}</span>
          <span>汇总现金 {formatMoney(fulfillmentSummary.cashPayableAmount)}</span>
          <span>配送任务 {fulfillmentSummary.deliveryTasks} 单</span>
          <span>自提任务 {fulfillmentSummary.pickupTasks} 单</span>
        </div>
        <div className="fulfillment-list">
          {fulfillmentOrders.length === 0 ? <p className="empty-text">暂无待履约订单</p> : null}
          {fulfillmentOrders.map((order) => (
            <article className="fulfillment-card" key={order.taskNo}>
              <div className="fulfillment-card-header">
                <strong>{order.orderNo}</strong>
                <span>{formatPayment(order)}</span>
              </div>
              <div className="fulfillment-task-meta">
                <span>任务 {order.taskNo}</span>
                <span>任务状态 {formatFulfillmentTaskStatus(order)}</span>
                <span>创建 {formatDateTime(order.createdAt)}</span>
                {order.completedAt ? <span>完成 {formatDateTime(order.completedAt)}</span> : null}
              </div>
              <p>{formatReceiver(order)}</p>
              {order.pickupCode ? <p className="pickup-code">取货码 {order.pickupCode}</p> : null}
              <div className="fulfillment-lines">
                {order.lines.map((line) => (
                  <span key={`${order.orderNo}-${line.displayName}-${line.displaySkuCode ?? 'default'}`}>
                    {line.displayName} x{line.quantity}
                  </span>
                ))}
              </div>
              <div className="fulfillment-card-footer">
                <span>合计 {formatMoney(order.totalAmount)}</span>
                <span>现金 {formatMoney(order.cashPayableAmount)}</span>
                <span>福利卡 {formatMoney(order.welfareCardPayableAmount)}</span>
              </div>
              {order.status === 'paid' ? (
                <div className="fulfillment-actions">
                  {order.fulfillmentType === 'pickup' ? (
                    <label className="pickup-code-verification">
                      核销取货码
                      <input
                        aria-label="核销取货码"
                        value={pickupCodeInputs[order.taskNo] ?? ''}
                        onChange={(event) => updatePickupCodeInput(order.taskNo, event.target.value)}
                      />
                    </label>
                  ) : null}
                  <button type="button" className="submit-button" onClick={() => void completeFulfillmentOrder(order)}>
                    确认完成
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="editor-panel" aria-label="商品草稿编辑">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">商品主数据</p>
            <h2>新建商品草稿</h2>
          </div>
          <button type="button" className="primary-button" onClick={() => void saveDraft()}>
            保存草稿
          </button>
        </div>
        <div className="editor-grid">
          <label>
            商品编码
            <input value={draftForm.code} onChange={(event) => updateDraftField('code', event.target.value)} />
          </label>
          <label>
            商品名称
            <input value={draftForm.name} onChange={(event) => updateDraftField('name', event.target.value)} />
          </label>
          <label>
            销售价
            <input value={draftForm.priceYuan} onChange={(event) => updateDraftField('priceYuan', event.target.value)} />
          </label>
          <label>
            产地省份
            <input value={draftForm.originProvince} onChange={(event) => updateDraftField('originProvince', event.target.value)} />
          </label>
          <label>
            产地城市
            <input value={draftForm.originCity} onChange={(event) => updateDraftField('originCity', event.target.value)} />
          </label>
          <label>
            主图地址
            <input value={draftForm.mainImageUrl} onChange={(event) => updateDraftField('mainImageUrl', event.target.value)} />
          </label>
          <label>
            详情图地址
            <input value={draftForm.detailImageUrl} onChange={(event) => updateDraftField('detailImageUrl', event.target.value)} />
          </label>
          <label>
            资质文件
            <input
              value={draftForm.qualificationFileUrl}
              onChange={(event) => updateDraftField('qualificationFileUrl', event.target.value)}
            />
          </label>
          <label>
            商品参数
            <input value={draftForm.parameterText} onChange={(event) => updateDraftField('parameterText', event.target.value)} />
          </label>
          <label className="wide-field">
            详情图文
            <textarea value={draftForm.detailText} onChange={(event) => updateDraftField('detailText', event.target.value)} />
          </label>
        </div>
      </section>

      <section className="workbench">
        <div className="table-region">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>状态</th>
                <th>加盟商</th>
                <th>主数据完整度</th>
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
                  <td colSpan={6}>暂无可提交商品</td>
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
                            <span>{item.category.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span>
                      </td>
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
                        <button type="button" className="submit-button" onClick={(event) => actionClick(event, () => submit(item))}>
                          <Send size={15} />
                          提交审核
                        </button>
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
                  <dt>商品参数</dt>
                  <dd>{selectedItem.parameterCount} 项</dd>
                </div>
                <div>
                  <dt>详情图文</dt>
                  <dd>{selectedItem.detailSectionCount} 段</dd>
                </div>
                <div>
                  <dt>最近驳回原因</dt>
                  <dd>{selectedItem.latestReviewLog?.reason ?? '无'}</dd>
                </div>
              </dl>
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

function formatOrigin(item: SubmissionQueueItem) {
  return [item.origin.country, item.origin.province, item.origin.city].filter(Boolean).join(' / ');
}

function fallbackImageUrl(name: string) {
  const encoded = encodeURIComponent(name.slice(0, 6));
  return `https://placehold.co/320x220/eef6f5/24524d?text=${encoded}`;
}

function formatPayment(order: MerchantFulfillmentOrder) {
  if (!order.latestPayment) {
    return '未生成支付单';
  }

  return `${paymentChannelLabels[order.latestPayment.channel] ?? order.latestPayment.channel} ${
    paymentStatusLabels[order.latestPayment.status] ?? order.latestPayment.status
  }`;
}

function formatReceiver(order: MerchantFulfillmentOrder) {
  if (order.fulfillmentType === 'pickup') {
    return order.pickupStoreName ?? '到店自提';
  }

  return [order.receiverName, order.receiverPhone, order.receiverAddress].filter(Boolean).join(' / ');
}

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function formatSignedMoney(amount: number) {
  if (amount < 0) {
    return `-¥${Math.abs(amount / 100).toFixed(2)}`;
  }

  return formatMoney(amount);
}

function formatFulfillmentTaskStatus(order: MerchantFulfillmentOrder) {
  return merchantFulfillmentStatusLabels[order.status as MerchantFulfillmentStatusFilter] ?? order.status;
}

function formatDateTime(value: string) {
  return value.slice(0, 16).replace('T', ' ');
}

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

function settlementStatementStatusLabel(status: string) {
  const labels: Record<string, string> = {
    generated: '待打款',
    paid_offline: '已线下打款'
  };

  return labels[status] ?? status;
}

function settlementBillItemStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_settlement: '待结算',
    statement_generated: '已出结算单',
    paid_offline: '已线下打款',
    reversed: '已冲销'
  };

  return labels[status] ?? status;
}

function createSettlementExportFilename(status: MerchantSettlementStatementStatusFilter) {
  return `merchant-settlements-${fixedMerchantContext.merchantId}-${status}.csv`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toDraftPayload(form: {
  code: string;
  name: string;
  originProvince: string;
  originCity: string;
  priceYuan: string;
  mainImageUrl: string;
  detailImageUrl: string;
  qualificationFileUrl: string;
  parameterText: string;
  detailText: string;
}): ProductDraftPayload {
  const priceAmount = Math.max(1, Math.round(Number(form.priceYuan || '0') * 100));
  const trimmedCode = form.code.trim();
  const trimmedName = form.name.trim();

  return {
    ...fixedMerchantContext,
    code: trimmedCode,
    name: trimmedName,
    originCountry: '中国',
    originProvince: form.originProvince.trim(),
    originCity: form.originCity.trim(),
    originDescription: `${form.originProvince.trim()}${form.originCity.trim()}产区`,
    skus: [
      {
        code: `SKU-${trimmedCode}`,
        priceAmount,
        marketPriceAmount: priceAmount,
        costPriceAmount: Math.max(1, Math.round(priceAmount * 0.7)),
        barcode: '',
        specs: [{ name: '规格', value: '标准装' }],
        weightGrams: 1000,
        volumeMilliliters: 1000
      }
    ],
    media: [
      { type: 'main_image', url: form.mainImageUrl.trim(), sortOrder: 1, altText: `${trimmedName}主图` },
      { type: 'detail_image', url: form.detailImageUrl.trim(), sortOrder: 2, altText: `${trimmedName}详情图` }
    ],
    qualifications: [
      {
        type: 'origin_certificate',
        title: '产地证明',
        certificateNo: `${trimmedCode}-ORIGIN`,
        fileUrl: form.qualificationFileUrl.trim(),
        validFrom: '2026-06-01',
        validTo: '2027-06-01'
      }
    ],
    parameters: [
      {
        groupName: '基础参数',
        name: '商品参数',
        value: form.parameterText.trim(),
        valueType: 'text',
        sortOrder: 1
      }
    ],
    detailSections: [
      {
        type: 'text',
        title: '详情图文',
        content: form.detailText.trim(),
        sortOrder: 1
      }
    ]
  };
}
