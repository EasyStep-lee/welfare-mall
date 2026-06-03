import { RefreshCw, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  ProductDraftPayload,
  SubmissionQueueItem,
  SubmissionQueueStatus,
  fetchMerchantSubmissionQueue,
  saveProductDraft,
  statusLabels,
  submitProductForReview
} from './api';
import './styles.css';

const merchantActorUserId = 'merchant-user-001';
const statuses: SubmissionQueueStatus[] = ['draft', 'rejected'];
const fixedMerchantContext = {
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-rice'
};

export default function App() {
  const [activeStatus, setActiveStatus] = useState<SubmissionQueueStatus>('draft');
  const [items, setItems] = useState<SubmissionQueueItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
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

  function updateDraftField(field: keyof typeof draftForm, value: string) {
    setDraftForm((current) => ({
      ...current,
      [field]: value
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
