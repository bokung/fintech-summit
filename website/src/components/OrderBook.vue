<template>
  <div class="card-wrap">
    <h3 class="card-title">Order Book (USD/XRP)</h3>
    <div class="content">
      <table v-if="offers.length > 0" class="w-full">
        <thead>
        <tr>
          <th class="text-left p-2">Taker Gets (USD)</th>
          <th class="text-left p-2">Taker Pays (XRP)</th>
          <th class="text-left p-2">Quality</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="offer in offers" :key="offer.index" class="border-b border-gray-200">
          <td class="p-2">{{ formatCurrency(offer.TakerGets) }}</td>
          <td class="p-2">{{ formatCurrency(offer.TakerPays) }}</td>
          <td class="p-2">{{ offer.quality }}</td>
        </tr>
        </tbody>
      </table>
      <p v-else>No offers found in the order book.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const offers = ref([]);

onMounted(async () => {
  await fetchOrderBook();
});

async function fetchOrderBook() {
  try {
    const response = await fetch("/order_book"); // Assuming you have a Flask route for this
    if (response.ok) {
      const data = await response.json();
      offers.value = data.offers;
    } else {
      console.error("Failed to fetch order book");
    }
  } catch (error) {
    console.error("Error fetching order book:", error);
  }
}

function formatCurrency(amount) {
  if (typeof amount === 'string') {
    return drops_to_xrp(amount);
  } else if (typeof amount === 'object' && amount.currency === 'USD') {
    return amount.value;
  }
  return amount;
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>