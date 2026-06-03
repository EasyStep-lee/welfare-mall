<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchProductPoolCatalog, type ProductPoolCatalog } from './api';

const loading = ref(true);
const error = ref<string | null>(null);
const productPools = ref<ProductPoolCatalog[]>([]);

const totalItems = computed(() => productPools.value.reduce((total, pool) => total + pool.items.length, 0));

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

function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
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
          <article v-for="item in pool.items" :key="item.id" class="product-card">
            <img :src="item.displayImageUrl" :alt="item.displayName" />
            <div class="product-body">
              <h3>{{ item.displayName }}</h3>
              <p>{{ item.displaySkuCode ?? '默认规格' }}</p>
              <strong>{{ formatMoney(item.displayPriceAmount) }}</strong>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
