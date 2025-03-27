<script lang="ts">
    import { enhance } from '$app/forms';
    import { locale, _ } from 'svelte-i18n';
    import { formatPrice } from '$lib/utils';
    import type { ActionResult } from '@sveltejs/kit';
    
    export let data;
    
    // Available languages for the selector
    const languages = [
        { code: 'pt', name: 'Português' },
        { code: 'en', name: 'English' }
    ];

    let newCategory = '';
    let newProducts: Record<number, { name: string; price: string; imageFile: File | null }> = {};

    function initNewProduct(categoryId: number) {
        if (!newProducts[categoryId]) {
            newProducts[categoryId] = { name: '', price: '', imageFile: null };
        }
        return newProducts[categoryId];
    }

    function resetNewProduct(categoryId: number) {
        newProducts[categoryId] = { name: '', price: '', imageFile: null };
        newProducts = newProducts; // Trigger reactivity
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && newCategory.trim()) {
            const form = document.getElementById('addCategoryForm') as HTMLFormElement;
            form.requestSubmit();
        }
    }

    function handleImageSelect(event: Event, categoryId: number) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.type === 'image/jpeg' || file.type === 'image/png') {
                initNewProduct(categoryId); // Initialize if needed
                newProducts[categoryId].imageFile = file;
                newProducts = { ...newProducts }; // Trigger reactivity
            } else {
                alert($_('products.invalidImageType'));
                input.value = '';
            }
        }
    }

    function handleProductNameChange(event: Event, categoryId: number) {
        const input = event.target as HTMLInputElement;
        initNewProduct(categoryId); // Initialize if needed
        newProducts[categoryId].name = input.value;
        newProducts = { ...newProducts }; // Trigger reactivity
    }

    function handleProductPriceChange(event: Event, categoryId: number) {
        const input = event.target as HTMLInputElement;
        initNewProduct(categoryId); // Initialize if needed
        newProducts[categoryId].price = input.value;
        newProducts = { ...newProducts }; // Trigger reactivity
    }

    $: currentLocale = $locale || 'pt';

    // Client-side data management
    let categories = data.categories;
    let productsByCategory = data.productsByCategory;

    function handleAddCategory() {
        return async ({ formData, result }: { formData: FormData; result: ActionResult }) => {
            if (result.type === 'success' && result.data) {
                const category = result.data.data as { id: number; name: string };
                const name = formData.get('name') as string;
                categories = [...categories, { ...category, name }];
                productsByCategory = { ...productsByCategory, [category.id]: [] };
                newCategory = '';

                return;
            }

            alert("Error: " + JSON.stringify(result));
        };
    }

    function handleRemoveCategory() {
        return async ({ result }: { result: ActionResult }) => {
            if (result.type === 'success' && result.data) {
                const newCategories = categories;

                categories = newCategories.filter(cat => {
                    return cat.id !== (result.data as { data: { id: number } }).data.id;
                });
                
                const { [(result.data as { data: { id: number } }).data.id]: _, ...rest } = productsByCategory;
                productsByCategory = rest;
                return;
            }

            alert("Error: " + JSON.stringify(result));
        };
    }

    function handleAddProduct() {
        return async ({ formData, result }: { formData: FormData; result: ActionResult }) => {
            if (result.type === 'success' && result.data) {
                const newProductsList = productsByCategory;
                newProductsList[result.data.data.product.categoryId].push(result.data.data.product);
                productsByCategory = newProductsList;
                
                // Clear the form
                const categoryId = result.data.data.product.categoryId;
                newProducts[categoryId] = { name: '', price: '', imageFile: null };
                newProducts = { ...newProducts };
                
                // Clear file input
                const fileInput = document.getElementById(`product-image-${categoryId}`) as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }

                return;
            }

            alert("Error: " + JSON.stringify(result));
        };
    }

    function handleRemoveProduct() {
        return async ({ result }: { result: ActionResult }) => {
            if (result.type === 'success' && result.data) {
                const newProductsList = productsByCategory;
                const categoryId = result.data.data.categoryId;
                const productId = result.data.data.productId;
                newProductsList[categoryId] = newProductsList[categoryId].filter(
                    product => product.id !== productId
                );
                productsByCategory = newProductsList;
                return;
            }

            alert("Error: " + JSON.stringify(result));
        };
    }

    function isProductFormValid(product: { name: string; price: string; imageFile: File | null }) {
        return product.name.trim() && Number(product.price) > 0 && product.imageFile;
    }
</script>

<div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">{$_('settings.title')}</h1>
    
    <div class="space-y-6">
        <!-- Language Settings -->
        <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold mb-4">{$_('settings.languageSection')}</h2>
            <div class="flex gap-4">
                <button
                    on:click={() => locale.set('en')}
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                    English
                </button>
                <button
                    on:click={() => locale.set('pt')}
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                    Português
                </button>
            </div>
        </div>

        <!-- Sales Statistics -->
        <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-xl font-bold mb-4">{$_('settings.salesSection')}</h2>
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{data.stats.totalOrders}</div>
                    <div class="text-sm text-gray-600">{$_('settings.totalOrders')}</div>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{formatPrice(data.stats.totalSales)}</div>
                    <div class="text-sm text-gray-600">{$_('settings.totalSales')}</div>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{formatPrice(data.stats.averageOrderValue)}</div>
                    <div class="text-sm text-gray-600">{$_('settings.averageOrderValue')}</div>
                </div>
            </div>
            <a
                href="/orders"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                {$_('settings.viewOrders')}
            </a>
        </div>

        <!-- Product Categories -->
        <div class="grid grid-cols-1 gap-6">
            

            <!-- Category Cards -->
            {#each categories as category (category.id)}
                {@const products = productsByCategory[category.id] || []}
                {@const hasProducts = products.length > 0}
                {@const newProduct = newProducts[category.id] || { name: '', price: '', imageFile: null }}
                
                <section class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">{category.name}</h3>
                        {#if !hasProducts}
                            <form
                                action="?/removeCategory"
                                method="POST"
                                use:enhance={handleRemoveCategory}
                                class="inline"
                            >
                                <input type="hidden" name="id" value={category.id}>
                                <button
                                    type="submit"
                                    class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                                    aria-label={$_('settings.removeCategory', { values: { name: category.name } })}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </form>
                        {/if}
                    </div>

                    <!-- Products List -->
                    <div class="space-y-4">
                        {#if !hasProducts}
                            <p class="text-gray-500 text-center py-4">{$_('products.noProducts')}</p>
                        {:else}
                            <div class="grid grid-cols-1 gap-4">
                                {#each products as product (product.id)}
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span class="font-medium">{product.name}</span>
                                            <span class="text-gray-600 ml-4">
                                                {new Intl.NumberFormat(currentLocale, { style: 'currency', currency: 'EUR' }).format(product.price)}
                                            </span>
                                        </div>
                                        <form
                                            action="?/removeProduct"
                                            method="POST"
                                            use:enhance={handleRemoveProduct}
                                            class="inline"
                                        >
                                            <input type="hidden" name="id" value={product.id}>
                                            <button
                                                type="submit"
                                                class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                                                aria-label={$_('products.removeProduct', { values: { name: product.name } })}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </form>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Add Product Form -->
                    <form
                        action="?/addProduct"
                        method="POST"
                        use:enhance={handleAddProduct}
                        class="p-4 mt-4 bg-gray-50 rounded-lg"
                        enctype="multipart/form-data"
                    >
                        <input type="hidden" name="categoryId" value={category.id}>
                        <div class="flex items-end gap-4">
                            <div class="flex-1">
                                <label for="product-name-{category.id}" class="block text-sm font-medium text-gray-700 mb-1">
                                    {$_('products.name')}
                                </label>
                                <input
                                    type="text"
                                    id="product-name-{category.id}"
                                    name="name"
                                    value={newProducts[category.id]?.name || ''}
                                    on:input={(e) => handleProductNameChange(e, category.id)}
                                    class="w-full border rounded-md px-3 py-2"
                                    placeholder={$_('products.namePlaceholder')}
                                />
                            </div>
                            <div class="w-32">
                                <label for="product-price-{category.id}" class="block text-sm font-medium text-gray-700 mb-1">
                                    {$_('products.price')}
                                </label>
                                <input
                                    type="number"
                                    id="product-price-{category.id}"
                                    name="price"
                                    value={newProducts[category.id]?.price || ''}
                                    on:input={(e) => handleProductPriceChange(e, category.id)}
                                    min="0"
                                    step="0.01"
                                    class="w-full border rounded-md px-3 py-2"
                                    placeholder={$_('products.pricePlaceholder')}
                                />
                            </div>
                            <div class="w-40">
                                <label for="product-image-{category.id}" class="block text-sm font-medium text-gray-700 mb-1">
                                    {$_('products.image')}
                                </label>
                                <input
                                    type="file"
                                    id="product-image-{category.id}"
                                    name="image"
                                    accept=".jpg,.jpeg,.png"
                                    on:change={(e) => handleImageSelect(e, category.id)}
                                    class="w-full text-sm cursor-pointer"
                                />
                            </div>
                            <button
                                type="submit"
                                class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                disabled={!isProductFormValid(newProduct)}
                            >
                                {$_('products.addProduct')}
                            </button>
                        </div>
                    </form>
                </section>
            {/each}

            <!-- Add Category Card -->
            <section class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">{$_('settings.categoriesSection')}</h2>
                
                <form
                    id="addCategoryForm"
                    action="?/addCategory"
                    method="POST"
                    use:enhance={handleAddCategory}
                    class="flex space-x-4"
                >
                    <input
                        type="text"
                        id="category-input"
                        name="name"
                        bind:value={newCategory}
                        on:keypress={handleKeyPress}
                        placeholder={$_('settings.categoryName')}
                        class="flex-1 border rounded-md px-3 py-2"
                    />
                    <button
                        type="submit"
                        class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        disabled={!newCategory.trim()}
                    >
                        {$_('settings.addCategory')}
                    </button>
                </form>
            </section>
        </div>
    </div>
</div> 