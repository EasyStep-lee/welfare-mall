import { Check, RefreshCw, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  ReviewQueueItem,
  ReviewQueueStatus,
  decideProductReview,
  fetchReviewQueue,
  publishProductToPool,
  statusLabels
} from './api';
import './styles.css';

const adminActorUserId = 'admin-user-001';
const statuses: ReviewQueueStatus[] = ['pending_review', 'approved', 'rejected'];

export default function App() {
  const [activeStatus, setActiveStatus] = useState<ReviewQueueStatus>('pending_review');
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
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

  useEffect(() => {
    void loadQueue(activeStatus);
  }, [activeStatus]);

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
