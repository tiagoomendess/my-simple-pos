<script context="module" lang="ts">
    export interface ReceiptData {
        id: number;
        createdAt: Date;
        items: Array<{
            name: string;
            quantity: number;
            priceAtTime: number;
        }>;
        totalPrice: number;
        amountPaid: number;
        change: number;
    }
</script>

<script lang="ts">
    import { formatPrice } from '$lib/utils';
    import { _ } from 'svelte-i18n';

    export let order: ReceiptData;

    function formatDate(date: Date) {
        return new Date(date).toLocaleString('pt-PT', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });
    }

    function printReceipt() {
        window.print();
    }

    // Call print when component is mounted
    import { onMount } from 'svelte';
    onMount(() => {
        printReceipt();
    });
</script>

<!-- Print-specific styles -->
<style>
    @media print {
        @page {
            size: 72mm auto;
            margin: 0;
        }
        .no-print {
            display: none;
        }
        .receipt {
            position: fixed;
            top: 0;
            left: 0;
            width: 72mm;
            page-break-after: avoid;
        }
    }

    .receipt {
        width: 72mm;
        padding: 10px;
        font-family: monospace;
        font-size: 11pt;
        line-height: 1.2;
    }

    .header {
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 1px dashed #000;
        padding-bottom: 10px;
    }

    .business-name {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .business-info {
        font-size: 8pt;
        margin-bottom: 5px;
    }

    .order-info {
        margin-bottom: 10px;
        font-size: 8pt;
        display: flex;
        justify-content: space-between;
    }

    .items {
        margin-bottom: 10px;
        width: 100%;
    }

    .item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
        font-size: 10pt;
    }

    .item-name {
        flex: 1;
        margin-right: 10px;
    }

    .item-quantity {
        margin: 0 7px 0 0;
        font-weight: bold;
    }

    .item-price {
        text-align: right;
    }

    .total {
        border-top: 1px dashed #000;
        margin-top: 10px;
        padding-top: 10px;
        display: flex;
        justify-content: space-between;
        font-weight: bold;
    }

    .payment-info {
        margin-top: 10px;
        font-size: 8pt;
    }

    .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 8pt;
        border-top: 1px dashed #000;
        padding-top: 10px;
    }
</style>

<div class="receipt print:block">
    <div class="header">
        <div class="business-name">Bar da Comissão de Festas</div>
        <div class="business-info">
            Largo da Igreja<br>
            Tamel Santa Leocádia<br>
        </div>
    </div>

    <div class="order-info">
        <span>{$_('orders.orderNumber', { values: { number: order.id } })}</span>
        <span>{formatDate(order.createdAt)}</span>
    </div>

    <div class="items">
        {#each order.items as item}
            <div class="item">
                <span class="item-quantity">{item.quantity}</span>
                <span class="item-name">{item.name}</span>
                <span class="item-price">{formatPrice(item.priceAtTime * item.quantity)}</span>
            </div>
        {/each}
    </div>

    <div class="total">
        <span>{$_('common.total')}</span>
        <span>{formatPrice(order.totalPrice)}</span>
    </div>

    <div class="payment-info">
        <div>{$_('order.amountPaid')}: {formatPrice(order.amountPaid)}</div>
        <div>{$_('order.change')}: {formatPrice(order.change)}</div>
    </div>

    <div class="footer">
        Obrigado pela sua compra!<br>
        Volte sempre!
    </div>
</div>

<!-- Preview button (only shown on screen) -->
 <div class="text-center print:hidden">
    <button
    class="no-print mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
    on:click={printReceipt}
>
    {$_('common.print')}
    </button>
 </div>
