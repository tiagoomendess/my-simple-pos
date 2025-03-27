<script lang="ts">
    import { _, isLoading, locale } from 'svelte-i18n';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';

    interface OrderItem {
        id: number;
        productId: number;
        quantity: number;
        priceAtTime: number;
        name: string;
    }

    interface Order {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        totalPrice: number;
        items: OrderItem[];
    }

    export let data: {
        orders: Order[];
        totalPages: number;
        currentPage: number;
    };

    let selectedOrder: Order | null = null;
    let showOrderModal = false;

    function formatPrice(price: number) {
        return new Intl.NumberFormat($locale || 'pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleString($locale || 'pt-PT', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    function handleOrderClick(order: Order) {
        selectedOrder = order;
        showOrderModal = true;
    }

    function closeOrderModal() {
        showOrderModal = false;
        selectedOrder = null;
    }

    function handlePageChange(newPage: number) {
        goto(`/orders?page=${newPage}`, { replaceState: true });
    }
</script>

<div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">{$_('orders.title')}</h1>

    <!-- Orders List -->
    <div class="space-y-2">
        {#each data.orders as order}
            <div 
                class="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                on:click={() => handleOrderClick(order)}
            >
                <div class="flex items-center gap-4">
                    <div class="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                    </div>
                    <div class="font-medium">
                        {$_('orders.orderNumber', { values: { number: order.id } })}
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-lg font-bold">
                        {formatPrice(order.totalPrice)}
                    </div>
                    <form
                        method="POST"
                        action="?/deleteOrder"
                        use:enhance
                        on:submit|stopPropagation
                    >
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                            type="submit"
                            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                            aria-label={$_('orders.deleteOrder')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        {/each}
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
        <div class="flex justify-center gap-2 mt-6">
            <button
                on:click={() => handlePageChange(data.currentPage - 1)}
                disabled={data.currentPage === 1}
                class="px-3 py-1 bg-white rounded-md shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {$_('common.previous')}
            </button>
            <span class="px-3 py-1">
                {$_('common.page', { values: { current: data.currentPage, total: data.totalPages } })}
            </span>
            <button
                on:click={() => handlePageChange(data.currentPage + 1)}
                disabled={data.currentPage === data.totalPages}
                class="px-3 py-1 bg-white rounded-md shadow hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {$_('common.next')}
            </button>
        </div>
    {/if}
</div>

<!-- Order Details Modal -->
{#if showOrderModal && selectedOrder}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">
                    {$_('orders.orderDetails', { values: { number: selectedOrder.id } })}
                </h2>
                <button
                    on:click={closeOrderModal}
                    class="text-gray-500 hover:text-gray-700"
                    aria-label={$_('common.close')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="space-y-4">
                <div class="text-sm text-gray-500">
                    {formatDate(selectedOrder.createdAt)}
                </div>

                <div class="space-y-2">
                    {#each selectedOrder.items as item}
                        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div class="flex items-center gap-3">
                                <span class="font-medium">{item.quantity}x</span>
                                <span class="flex-1">{item.name}</span>
                            </div>
                            <span class="font-medium">
                                {formatPrice(item.priceAtTime * item.quantity)}
                            </span>
                        </div>
                    {/each}
                </div>

                <div class="border-t pt-4 mt-4">
                    <div class="flex justify-between items-center text-lg font-bold">
                        <span>{$_('common.total')}</span>
                        <span>{formatPrice(selectedOrder.totalPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if} 