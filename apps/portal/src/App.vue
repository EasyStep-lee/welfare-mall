<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  createPortalOrder,
  fetchProductPoolCatalog,
  fetchProductPoolItemDetail,
  type PortalCheckoutOrder,
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

const loading = ref(true);
const error = ref<string | null>(null);
const productPools = ref<ProductPoolCatalog[]>([]);
const detailLoading = ref(false);
const detailError = ref<string | null>(null);
const selectedDetail = ref<ProductPoolItemDetail | null>(null);
const checkoutLoading = ref(false);
const checkoutError = ref<string | null>(null);
const createdOrder = ref<PortalCheckoutOrder | null>(null);

const totalItems = computed(() => productPools.value.reduce((total, pool) => total + pool.items.length, 0));
const originText = computed(() => {
  const origin = selectedDetail.value?.product.origin;
  if (!origin) {
    return '产地信息待补充';
  }

  return [origin.country, origin.province, origin.city, origin.description].filter(Boolean).join(' / ');
});

onMounted(() => {
  void loadCatalog();
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

async function openProductDetail(item: ProductPoolCatalogItem) {
  detailLoading.value = true;
  detailError.value = null;
  selectedDetail.value = null;
  checkoutError.value = null;
  createdOrder.value = null;

  try {
    selectedDetail.value = await fetchProductPoolItemDetail(item.id);
  } catch (loadError) {
    detailError.value = loadError instanceof Error ? loadError.message : '商品详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

function closeProductDetail() {
  detailError.value = null;
  checkoutError.value = null;
  selectedDetail.value = null;
  createdOrder.value = null;
}

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

function statusText(status: string) {
  return status === 'pending_payment' ? '待支付' : status;
}

function createCheckoutRequestId(itemId: string) {
  const safeItemId = itemId.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `portal-checkout-${safeItemId}-${Date.now()}`;
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
      fulfillment: {
        type: 'delivery',
        ...localDelivery
      }
    });
    createdOrder.value = result.order;
  } catch (submitError) {
    checkoutError.value = submitError instanceof Error ? submitError.message : '订单创建失败';
  } finally {
    checkoutLoading.value = false;
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
              <p>数量 1，配送至 {{ localDelivery.receiverAddress }}</p>
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
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>
