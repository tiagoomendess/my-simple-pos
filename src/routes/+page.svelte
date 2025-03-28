<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { getContext } from 'svelte';

  export let data;
  
  let categories = data.categories;
  let productsByCategory = data.productsByCategory;
  let activeCategory = categories[0]?.id;
  
  // Get addToOrder function from layout context
  const addToOrder = getContext<(product: { id: number; name: string; price: number }) => void>('addToOrder');
  
  function setActiveCategory(categoryId: number) {
    activeCategory = categoryId;
  }

  // Default product image if none is provided
  const defaultProductImage = 'https://placehold.co/400x400/e2e8f0/64748b?text=Produto';

  // Format price in EUR
  function formatPrice(price: number) {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
  }
</script>

<div class="h-full flex flex-col">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-800">{$_('common.products')}</h1>
  </div>

  <!-- Category Tabs -->
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex space-x-8">
      {#each categories as category (category.id)}
        <button
          class="py-4 px-1 border-b-2 font-medium text-sm cursor-pointer {activeCategory === category.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          on:click={() => setActiveCategory(category.id)}
        >
          {category.name}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Products Grid -->
  <div class="mt-6">
    {#each categories as category (category.id)}
      {#if activeCategory === category.id}
        {#if !productsByCategory[category.id]?.length}
          <div class="text-center py-8">
            <p class="text-gray-500">{$_('products.noProducts')}</p>
          </div>
        {:else}
          <div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {#each productsByCategory[category.id] as product (product.id)}
              <button 
                class="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                on:click={() => addToOrder(product)}
              >
                <!-- Product Image -->
                <div 
                  class="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style="background-image: url('{product.image || defaultProductImage}')"
                ></div>
                
                <!-- Product Info Overlay -->
                <div class="absolute inset-x-0 bottom-0 bg-gray-800 bg-opacity-50 text-white p-2">
                  <p class="font-medium text-sm truncate">{product.name}</p>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>
