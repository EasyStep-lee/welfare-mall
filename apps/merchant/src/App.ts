import { ElButton, ElCard, ElCol, ElRow, ElSpace, ElTag } from 'element-plus';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import {
  MerchantFulfillmentOrder,
  MerchantSettlementStatement,
  SubmissionQueueItem,
  fetchMerchantFulfillmentOrders,
  fetchMerchantSettlementStatements,
  fetchMerchantSubmissionQueue,
  merchantFulfillmentStatusLabels,
  merchantSettlementStatementStatusLabels,
  statusLabels
} from './api';
import { summarizeMerchantFulfillmentOrders } from './fulfillmentSummary';
import { summarizeSettlementStatements } from './settlementSummary';

const merchantId = 'merchant-001';

export default defineComponent({
  name: 'MerchantApp',
  setup() {
    const fulfillmentOrders = ref<MerchantFulfillmentOrder[]>([]);
    const draftItems = ref<SubmissionQueueItem[]>([]);
    const statements = ref<MerchantSettlementStatement[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

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

    onMounted(() => {
      void loadAll();
    });

    return () =>
      h('main', { class: 'app-shell' }, [
        h('header', { class: 'app-header' }, [
          h('div', [h('p', { class: 'eyebrow' }, 'Vue 3 + Element Plus'), h('h1', '商户运营工作台')]),
          h(ElButton, { type: 'primary', plain: true, loading: loading.value, onClick: loadAll }, () => '刷新')
        ]),
        error.value ? h('p', { class: 'error-message' }, error.value) : null,
        h(ElRow, { gutter: 12, class: 'summary-grid' }, () => [
          metric('履约任务', `${fulfillmentSummary.value.taskCount} 单`),
          metric('履约商品', `${fulfillmentSummary.value.lineQuantity} 件`),
          metric('履约总额', formatMoney(fulfillmentSummary.value.totalAmount)),
          metric('应收结算', formatMoney(settlementSummary.value.netAmount))
        ]),
        h('section', { class: 'workspace-grid' }, [
          renderFulfillmentPanel(fulfillmentOrders.value),
          renderDraftPanel(draftItems.value),
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

function renderFulfillmentPanel(orders: MerchantFulfillmentOrder[]) {
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
                h(ElButton, { size: 'small', type: 'primary' }, () => '确认完成')
              ]),
              h('p', { class: 'muted' }, order.lines.map((line) => `${line.displayName} x${line.quantity}`).join(' / ')),
              h('p', { class: 'muted' }, order.receiverName ? `${order.receiverName} / ${order.receiverPhone} / ${order.receiverAddress}` : order.pickupStoreName ?? '自提')
            ])
          )
        )
  ]);
}

function renderDraftPanel(items: SubmissionQueueItem[]) {
  return panel('商品草稿', [
    h('div', { class: 'draft-form' }, [
      h('label', ['商品编码', h('input', { value: 'P-RICE-001', readonly: true })]),
      h('label', ['商品名称', h('input', { value: '东北五常大米福利装', readonly: true })]),
      h(ElButton, { type: 'primary', plain: true }, () => '保存草稿')
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
                h(ElButton, { size: 'small', type: 'success' }, () => '提交审核')
              ])
            ])
          )
        )
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
