<script lang="ts">
	import '../app.css';
	import '../lib/i18n';
	import { _, isLoading, locale } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import Receipt, { type ReceiptData } from '$lib/components/Receipt.svelte';
	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';

	// Order store
	interface OrderItem {
		id: number;
		name: string;
		price: number;
		quantity: number;
	}

	const orderItems = writable<OrderItem[]>([]);
	let showPaymentModal = false;
	let amountPaid = '';
	let amountInput: HTMLInputElement;
	let showReceipt = false;
	let currentReceipt: ReceiptData | null = null;
	let isProcessingPayment = false;

	// Handle form submission result
	export function handleSubmitResult({ formData, action, cancel }: Parameters<SubmitFunction>[0]) {
		isProcessingPayment = true;
		formData.append('items', JSON.stringify($orderItems));
		formData.append('total', total.toString());
		formData.append('amountPaid', amountPaid);
		formData.append('change', change.toString());

		return async ({ result }) => {
			if (result.type === 'success' && result.data) {
				// Create receipt with the order data
				currentReceipt = {
					id: (result.data as { id: number }).id,
					createdAt: new Date(),
					items: $orderItems.map(item => ({
						name: item.name,
						quantity: item.quantity,
						priceAtTime: item.price
					})),
					totalPrice: total,
					amountPaid: parseFloat(amountPaid),
					change
				};
				
				// Show receipt and clear order
				showReceipt = true;
				clearOrder();
				showPaymentModal = false;
				amountPaid = '';
			} else if (result.type === 'error') {
				console.error('Failed to save order:', result.error);
				// TODO: Show error message to user
			}
			isProcessingPayment = false;
		};
	}

	// Calculate total
	$: total = $orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

	// Calculate change
	$: change = Number(amountPaid) - total;

	function formatPrice(price: number) {
		return new Intl.NumberFormat($locale || 'pt-PT', { style: 'currency', currency: 'EUR' }).format(price);
	}

	// Add item to order
	function addToOrder(product: { id: number; name: string; price: number }) {
		orderItems.update(items => {
			const existingItem = items.find(item => item.id === product.id);
			if (existingItem) {
				return items.map(item => 
					item.id === product.id 
						? { ...item, quantity: item.quantity + 1 }
						: item
				);
			}
			return [...items, { ...product, quantity: 1 }];
		});
	}

	// Set context for child components
	setContext('addToOrder', addToOrder);

	// Remove or decrease quantity
	function removeFromOrder(productId: number) {
		orderItems.update(items => {
			const item = items.find(i => i.id === productId);
			if (item && item.quantity > 1) {
				return items.map(i => 
					i.id === productId 
						? { ...i, quantity: i.quantity - 1 }
						: i
				);
			}
			return items.filter(i => i.id !== productId);
		});
	}

	// Clear order
	function clearOrder() {
		orderItems.set([]);
	}

	// Handle payment
	function handlePayment() {
		showPaymentModal = true;
		amountPaid = '';
	}

	// Handle modal close
	function closePaymentModal() {
		showPaymentModal = false;
		amountPaid = '';
		isProcessingPayment = false;
	}

	// Handle numpad input
	function handleNumpadInput(value: string) {
		if (value === '←') {
			amountPaid = amountPaid.slice(0, -1);
		} else if (value === '.' && !amountPaid.includes('.')) {
			amountPaid += '.';
		} else if (value !== '.') {
			amountPaid += value;
		}
	}

	// Handle form submission
	function handleSubmit() {
		// We don't need to do anything here as we'll handle everything in handleSubmitSuccess
	}

	// Focus input when modal opens
	$: if (showPaymentModal && amountInput) {
		amountInput.focus();
	}
</script>

{#if !$isLoading}
<div class="flex h-screen bg-gray-100">
	<!-- Left Sidebar - Cart Section -->
	<div class="w-1/4 bg-white shadow-lg p-6 overflow-y-auto flex flex-col">
		<h2 class="text-2xl font-bold mb-2">{$_('common.currentOrder')}</h2>
		
		<!-- Total Amount -->
		<div class="text-xl font-bold text-gray-800 mb-4">
			{$_('common.total')}: {formatPrice(total)}
		</div>

		<!-- Order Items -->
		<div class="flex-1 overflow-y-auto mb-4">
			{#if $orderItems.length === 0}
				<p class="text-gray-500 text-center py-4">{$_('common.noItems')}</p>
			{:else}
				<div class="space-y-2">
					{#each $orderItems as item (item.id)}
						<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
							<div class="flex items-center gap-3">
								<span class="font-medium">{item.quantity}x</span>
								<span class="flex-1">{item.name}</span>
							</div>
							<div class="flex items-center gap-3">
								<span>{formatPrice(item.price * item.quantity)}</span>
								<button
									on:click={() => removeFromOrder(item.id)}
									class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
									aria-label={item.quantity > 1 
										? $_('order.decreaseQuantity', { values: { name: item.name } })
										: $_('order.removeItem', { values: { name: item.name } })}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3 mt-auto">
			<button
				on:click={clearOrder}
				class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer text-lg font-medium"
			>
				{$_('common.cancel')}
			</button>
			<button
				on:click={handlePayment}
				disabled={$orderItems.length === 0}
				class="flex-1 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
			>
				{$_('common.payment')}
			</button>
		</div>
	</div>

	<!-- Right Section - Products -->
	<div class="flex-1 p-6 overflow-y-auto relative">
		<!-- Navigation Button -->
		<button
			on:click={() => goto($page.url.pathname === '/settings' ? '/' : '/settings')}
			class="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-800 cursor-pointer"
			aria-label={$page.url.pathname === '/settings' ? $_('common.home') : $_('common.settings')}
		>
			{#if $page.url.pathname === '/settings'}
				<!-- Home Icon -->
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			{:else}
				<!-- Settings Icon -->
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			{/if}
		</button>
		<slot />
	</div>
</div>
{/if}

{#if showPaymentModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
		<form
			method="POST"
			action="?/createOrder"
			use:enhance={handleSubmitResult}
			class="bg-white p-6 rounded-lg shadow-xl w-[500px]"
		>
			<!-- Section 1: Total -->
			<div class="text-center mb-6">
				<h3 class="text-lg font-bold mb-2">{$_('order.proceedToPayment')}</h3>
				<p class="text-2xl font-bold text-gray-800">{formatPrice(total)}</p>
			</div>

			<!-- Section 2: Amount Paid -->
			<div class="mb-6">
				<label for="amount-paid" class="block text-sm font-medium text-gray-700 mb-2">{$_('order.amountPaid')}</label>
				<input
					id="amount-paid"
					type="number"
					bind:this={amountInput}
					bind:value={amountPaid}
					class="w-full text-2xl font-mono text-right border rounded-md px-3 py-2 mb-4"
					placeholder={$_('order.enterAmount')}
					step="0.01"
					min="0"
				/>
				
				<!-- Quick Select Buttons -->
				<div class="grid grid-cols-5 gap-2 mb-4">
					{#each [5, 10, 20, 50] as amount}
						<button
							type="button"
							on:click={() => amountPaid = amount.toString()}
							class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
						>
							{formatPrice(amount)}
						</button>
					{/each}
					<button
						type="button"
						on:click={() => amountPaid = total.toString()}
						class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
					>
						{formatPrice(total)}
					</button>
				</div>

				<!-- Numpad -->
				<div class="grid grid-cols-3 gap-2">
					{#each [7, 8, 9, 4, 5, 6, 1, 2, 3, '.', 0, '←'] as key}
						<button
							type="button"
							on:click={() => handleNumpadInput(key.toString())}
							class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
						>
							{key}
						</button>
					{/each}
				</div>
			</div>

			<!-- Section 3: Change -->
			<div class="mb-6 p-4 bg-gray-50 rounded-md">
				<p class="text-sm font-medium text-gray-700 mb-1">{$_('order.change')}</p>
				<p class="text-xl font-bold {change >= 0 ? 'text-gray-800' : 'text-red-600'}">
					{formatPrice(Math.max(0, change))}
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<button
					type="button"
					on:click={closePaymentModal}
					disabled={isProcessingPayment}
					class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{$_('common.cancel')}
				</button>
				<button
					type="submit"
					disabled={Number(amountPaid) < total || isProcessingPayment}
					class="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isProcessingPayment}
						<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						{$_('common.processing')}
					{:else}
						{$_('common.finish')}
					{/if}
				</button>
			</div>
		</form>
	</div>
{/if}

{#if showReceipt && currentReceipt}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-6 rounded-lg shadow-xl">
			<div class="flex justify-between items-center mb-4 print:hidden">
				<h2 class="text-xl font-bold">{$_('common.print')}</h2>
				<button
					on:click={() => showReceipt = false}
					class="text-gray-500 hover:text-gray-700"
					aria-label={$_('common.close')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<Receipt order={currentReceipt} />
		</div>
	</div>
{/if}
