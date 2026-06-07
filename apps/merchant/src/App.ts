import { ElButton, ElCard, ElCol, ElRow, ElSpace, ElTag } from 'element-plus';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import type { ProductDraftPayload } from './api';
import {
  MerchantFulfillmentOrder,
  MerchantSettlementStatement,
  SubmissionQueueItem,
  completeMerchantFulfillmentOrder,
  fetchMerchantFulfillmentOrders,
  fetchMerchantSettlementStatements,
  fetchMerchantSubmissionQueue,
  merchantFulfillmentStatusLabels,
  merchantSettlementStatementStatusLabels,
  saveProductDraft,
  statusLabels,
  submitProductForReview
} from './api';
import { summarizeMerchantFulfillmentOrders } from './fulfillmentSummary';
import { summarizeSettlementStatements } from './settlementSummary';

const merchantId = 'merchant-001';
const merchantActorUserId = 'merchant-user-001';
const fixedMerchantContext = {
  merchantId,
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-rice'
};

type MerchantDraftForm = {
  code: string;
  name: string;
  categoryName: string;
  brandName: string;
  originProvince: string;
  originCity: string;
  priceYuan: string;
  specText: string;
  mainImageUrl: string;
  detailImageUrl: string;
  qualificationFileUrl: string;
  parameterText: string;
  detailText: string;
};

export default defineComponent({
  name: 'MerchantApp',
  setup() {
    const fulfillmentOrders = ref<MerchantFulfillmentOrder[]>([]);
    const draftItems = ref<SubmissionQueueItem[]>([]);
    const statements = ref<MerchantSettlementStatement[]>([]);
    const loading = ref(true);
    const actionLoading = ref(false);
    const message = ref<string | null>(null);
    const error = ref<string | null>(null);
    const draftForm = ref({
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      categoryName: '粮油副食',
      brandName: '五常香米',
      originProvince: '黑龙江',
      originCity: '哈尔滨',
      priceYuan: '69.90',
      specText: '标准装',
      mainImageUrl: 'https://img.example.com/rice-main.jpg',
      detailImageUrl: 'https://img.example.com/rice-detail.jpg',
      qualificationFileUrl: 'https://img.example.com/certs/rice-origin.pdf',
      parameterText: '净含量 5kg',
      detailText: '适合企业福利发放。'
    });

    const fulfillmentSummary = computed(() => summarizeMerchantFulfillmentOrders(fulfillmentOrders.value));
    const settlementSummary = computed(() => summarizeSettlementStatements(statements.value));

    async function loadAll() {
      loading.value = true;
      error.value = null;
      try {
        const [fulfillmentResponse, draftResponse, statementResponse] = await Promise.all([
          fetchMerchantFulfillmentOrders(merchantId, 'paid'),
          fetchMerchantSubmissionQueue('draft'),
          fetchMerchantSettlementStatements(merchantId, 'generated')
        ]);
        fulfillmentOrders.value = fulfillmentResponse.orders;
        draftItems.value = draftResponse.items;
        statements.value = statementResponse.statements;
      } catch (loadError) {
        error.value = loadError instanceof Error ? loadError.message : '商户运营数据加载失败';
      } finally {
        loading.value = false;
      }
    }

    async function completeOrder(order: MerchantFulfillmentOrder) {
      actionLoading.value = true;
      error.value = null;
      try {
        await completeMerchantFulfillmentOrder({ merchantId, orderNo: order.orderNo });
        message.value = `${order.orderNo} 已确认完成`;
        const response = await fetchMerchantFulfillmentOrders(merchantId, 'paid');
        fulfillmentOrders.value = response.orders;
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '履约确认失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function submitDraft(item: SubmissionQueueItem) {
      actionLoading.value = true;
      error.value = null;
      try {
        await submitProductForReview({ productId: item.productId, actorUserId: merchantActorUserId });
        message.value = `${item.name} 已提交审核`;
        const response = await fetchMerchantSubmissionQueue('draft');
        draftItems.value = response.items;
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品提交审核失败';
      } finally {
        actionLoading.value = false;
      }
    }

    async function saveDraft() {
      actionLoading.value = true;
      error.value = null;
      try {
        const payload = toProductDraftPayload(draftForm.value);
        await saveProductDraft({ payload, actorUserId: merchantActorUserId });
        message.value = `${payload.name} 草稿已保存`;
        const response = await fetchMerchantSubmissionQueue('draft');
        draftItems.value = response.items;
      } catch (actionError) {
        error.value = actionError instanceof Error ? actionError.message : '商品草稿保存失败';
      } finally {
        actionLoading.value = false;
      }
    }

    function updateDraftField(field: keyof MerchantDraftForm, value: string) {
      draftForm.value = { ...draftForm.value, [field]: value };
    }

    onMounted(() => {
      void loadAll();
    });

    return () =>
      h('main', { class: 'app-shell' }, [
        h('header', { class: 'app-header' }, [
          h('div', [h('p', { class: 'eyebrow' }, 'Vue 3 + Element Plus'), h('h1', '商户运营工作台')]),
          h(ElButton, { type: 'primary', plain: true, loading: loading.value, onClick: loadAll }, () => '刷新')
        ]),
        message.value ? h('p', { class: 'success-message' }, message.value) : null,
        error.value ? h('p', { class: 'error-message' }, error.value) : null,
        h(ElRow, { gutter: 12, class: 'summary-grid' }, () => [
          metric('履约任务', `${fulfillmentSummary.value.taskCount} 单`),
          metric('履约商品', `${fulfillmentSummary.value.lineQuantity} 件`),
          metric('履约总额', formatMoney(fulfillmentSummary.value.totalAmount)),
          metric('应收结算', formatMoney(settlementSummary.value.netAmount))
        ]),
        h('section', { class: 'workspace-grid' }, [
          renderFulfillmentPanel(fulfillmentOrders.value, completeOrder, actionLoading.value),
          renderDraftPanel(draftItems.value, draftForm.value, updateDraftField, saveDraft, submitDraft, actionLoading.value),
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

function renderFulfillmentPanel(
  orders: MerchantFulfillmentOrder[],
  completeOrder: (order: MerchantFulfillmentOrder) => Promise<void>,
  actionLoading: boolean
) {
  return panel('履约订单', [
    orders.length === 0
      ? h('p', { class: 'empty-state' }, '暂无待履约订单')
      : h(
          'div',
          { class: 'item-stack' },
          orders.map((order) =>
            h('article', { class: 'list-row', key: order.id }, [
              h('div', [h('strong', order.orderNo), h('p', `任务 ${order.taskNo}`)]),
              h(ElSpace, { wrap: true }, () => [
                h(ElTag, { type: order.status === 'paid' ? 'warning' : 'success' }, () => label(merchantFulfillmentStatusLabels, order.status)),
                h(ElTag, () => formatMoney(order.totalAmount)),
                h(ElButton, { size: 'small', type: 'primary', loading: actionLoading, onClick: () => completeOrder(order) }, () => '确认完成')
              ]),
              h('p', { class: 'muted' }, order.lines.map((line) => `${line.displayName} x${line.quantity}`).join(' / ')),
              h('p', { class: 'muted' }, order.receiverName ? `${order.receiverName} / ${order.receiverPhone} / ${order.receiverAddress}` : order.pickupStoreName ?? '自提')
            ])
          )
        )
  ]);
}

function renderDraftPanel(
  items: SubmissionQueueItem[],
  draftForm: MerchantDraftForm,
  updateDraftField: (field: keyof MerchantDraftForm, value: string) => void,
  saveDraft: () => Promise<void>,
  submitDraft: (item: SubmissionQueueItem) => Promise<void>,
  actionLoading: boolean
) {
  return panel('商品草稿', [
    h('div', { class: 'draft-form' }, [
      draftInput('商品编码', draftForm.code, (value) => updateDraftField('code', value)),
      draftInput('商品名称', draftForm.name, (value) => updateDraftField('name', value)),
      draftInput('商品分类', draftForm.categoryName, (value) => updateDraftField('categoryName', value), { readonly: true }),
      draftInput('商品品牌', draftForm.brandName, (value) => updateDraftField('brandName', value), { readonly: true }),
      draftInput('产地省份', draftForm.originProvince, (value) => updateDraftField('originProvince', value)),
      draftInput('产地城市', draftForm.originCity, (value) => updateDraftField('originCity', value)),
      draftInput('销售价', draftForm.priceYuan, (value) => updateDraftField('priceYuan', value)),
      draftInput('规格', draftForm.specText, (value) => updateDraftField('specText', value)),
      draftInput('主图地址', draftForm.mainImageUrl, (value) => updateDraftField('mainImageUrl', value), { wide: true }),
      draftInput('详情图地址', draftForm.detailImageUrl, (value) => updateDraftField('detailImageUrl', value), { wide: true }),
      draftInput('资质文件', draftForm.qualificationFileUrl, (value) => updateDraftField('qualificationFileUrl', value), { wide: true }),
      draftTextarea('商品参数', draftForm.parameterText, (value) => updateDraftField('parameterText', value)),
      draftTextarea('图文说明', draftForm.detailText, (value) => updateDraftField('detailText', value)),
      h('div', { class: 'draft-action-row' }, [
        h(ElButton, { type: 'primary', plain: true, loading: actionLoading, onClick: saveDraft }, () => '保存草稿')
      ])
    ]),
    items.length === 0
      ? h('p', { class: 'empty-state' }, '暂无商品草稿')
      : h(
          'div',
          { class: 'item-stack' },
          items.map((item) =>
            h('article', { class: 'list-row', key: item.productId }, [
              h('div', [h('strong', item.name), h('p', `${item.code} / ${item.merchant.name}`)]),
              h(ElSpace, { wrap: true }, () => [
                h(ElTag, { type: 'info' }, () => statusLabels[item.status]),
                h(ElTag, () => `${item.skuCount} 个 SKU`),
                h(ElTag, () => `${item.imageCount} 张图`),
                h(ElButton, { size: 'small', type: 'success', loading: actionLoading, onClick: () => submitDraft(item) }, () => '提交审核')
              ])
            ])
          )
        )
  ]);
}

function draftInput(
  text: string,
  value: string,
  onValue: (value: string) => void,
  options: { readonly?: boolean; wide?: boolean } = {}
) {
  return h('label', { class: options.wide ? 'draft-field wide-field' : 'draft-field' }, [
    h('span', text),
    h('input', {
      value,
      readonly: options.readonly,
      onInput: (event: Event) => onValue((event.target as HTMLInputElement).value)
    })
  ]);
}

function draftTextarea(text: string, value: string, onValue: (value: string) => void) {
  return h('label', { class: 'draft-field wide-field' }, [
    h('span', text),
    h('textarea', {
      value,
      onInput: (event: Event) => onValue((event.target as HTMLTextAreaElement).value)
    })
  ]);
}

function renderSettlementPanel(statements: MerchantSettlementStatement[]) {
  return panel('商户结算', [
    statements.length === 0
      ? h('p', { class: 'empty-state' }, '暂无结算单')
      : h(
          'div',
          { class: 'item-stack' },
          statements.map((statement) =>
            h('article', { class: 'list-row', key: statement.id }, [
              h('strong', statement.statementNo),
              h('p', `商户 ${statement.merchantId} / 应收 ${formatMoney(statement.netAmount)}`),
              h(ElSpace, () => [
                h(ElTag, { type: statement.status === 'generated' ? 'warning' : 'success' }, () => label(merchantSettlementStatementStatusLabels, statement.status)),
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

function toProductDraftPayload(input: MerchantDraftForm): ProductDraftPayload {
  const code = input.code.trim();
  const name = input.name.trim();
  const priceAmount = Math.round(Number(input.priceYuan) * 100);
  const originProvince = input.originProvince.trim();
  const originCity = input.originCity.trim();

  return {
    code,
    name,
    merchantId: fixedMerchantContext.merchantId,
    franchiseId: fixedMerchantContext.franchiseId,
    categoryId: fixedMerchantContext.categoryId,
    brandId: fixedMerchantContext.brandId,
    originCountry: '中国',
    originProvince,
    originCity,
    originDescription: `${originProvince}${originCity}优选产区`,
    skus: [
      {
        code: `SKU-${code}`,
        priceAmount,
        marketPriceAmount: priceAmount,
        costPriceAmount: Math.max(0, priceAmount - 1000),
        barcode: `${code}-BARCODE`,
        specs: [{ name: '规格', value: input.specText.trim() }],
        weightGrams: 5000,
        volumeMilliliters: 5000
      }
    ],
    media: [
      {
        type: 'main_image',
        url: input.mainImageUrl.trim(),
        sortOrder: 1,
        altText: name
      },
      {
        type: 'detail_image',
        url: input.detailImageUrl.trim(),
        sortOrder: 2,
        altText: `${name}详情`
      }
    ],
    qualifications: [
      {
        type: 'origin_certificate',
        title: '产地证明',
        certificateNo: `${code}-CERT`,
        fileUrl: input.qualificationFileUrl.trim(),
        validFrom: '2026-01-01',
        validTo: '2027-01-01'
      }
    ],
    parameters: [
      {
        groupName: '基础参数',
        name: '商品参数',
        value: input.parameterText.trim(),
        valueType: 'text',
        sortOrder: 1
      }
    ],
    detailSections: [
      {
        type: 'text',
        title: '详情图文',
        content: input.detailText.trim(),
        sortOrder: 1
      }
    ]
  };
}
