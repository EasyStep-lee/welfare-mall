import { RefreshCw, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SubmissionQueueItem,
  SubmissionQueueStatus,
  fetchMerchantSubmissionQueue,
  statusLabels,
  submitProductForReview
} from './api';
import './styles.css';

const merchantActorUserId = 'merchant-user-001';
const statuses: SubmissionQueueStatus[] = ['draft', 'rejected'];

export default function App() {
  const [activeStatus, setActiveStatus] = useState<SubmissionQueueStatus>('draft');
  const [items, setItems] = useState<SubmissionQueueItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.productId === selectedProductId) ?? items[0] ?? null,
    [items, selectedProductId]
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

  useEffect(() => {
    void loadQueue(activeStatus);
  }, [activeStatus]);

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
