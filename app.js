const { createApp, ref, reactive, computed } = Vue;

const API_PRODUCTS = 'https://api.cardtrader.com/api/v2/products/export';
const API_EXPANSIONS = 'https://api.cardtrader.com/api/v2/expansions/export';
const API_TOKEN = 'YOUR_API_TOKEN';

createApp({
    setup() {
        const inventory = ref([]);
        const expansions = ref({});
        const viewMode = ref('grid');
        const cart = ref([]);

        const searchQuery = ref('');
        const selectedExpansion = ref('');
        const selectedLanguage = ref('');
        const selectedRarity = ref('');
        const selectedReverse = ref('');
        const sortOrder = ref('');

        const imageBaseUrl = ref('https://www.cardtrader.com/images/blueprint/');

        async function fetchExpansions() {
            try {
                const response = await fetch(API_EXPANSIONS, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${API_TOKEN}` }
                });
                if (!response.ok) throw new Error(`Erreur API Expansions: ${response.status}`);
                const data = await response.json();
                data.forEach(exp => {
                    expansions.value[exp.id] = exp.code;
                });
            } catch (error) {
                console.error("Erreur lors du chargement des extensions :", error);
            }
        }

        async function fetchInventory() {
            try {
                const response = await fetch(API_PRODUCTS, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
                });
                if (!response.ok) throw new Error(`Erreur API Produits: ${response.status}`);
                inventory.value = await response.json();
            } catch (error) {
                console.error("Erreur API :", error);
            }
        }

        const filteredCards = computed(() => {
            let cards = inventory.value.filter(card => {
                if (searchQuery.value && !card.name_en.toLowerCase().includes(searchQuery.value.toLowerCase())) return false;
                if (selectedExpansion.value && card.expansion.id != selectedExpansion.value) return false;
                if (selectedLanguage.value && card.properties_hash.pokemon_language != selectedLanguage.value) return false;
                if (selectedRarity.value && card.properties_hash.pokemon_rarity != selectedRarity.value) return false;
                if (selectedReverse.value !== "" && card.properties_hash.pokemon_reverse.toString() !== selectedReverse.value) return false;
                return true;
            });

            if (sortOrder.value === 'asc') {
                cards.sort((a, b) => a.properties_hash.collector_number - b.properties_hash.collector_number);
            } else if (sortOrder.value === 'desc') {
                cards.sort((a, b) => b.properties_hash.collector_number - a.properties_hash.collector_number);
            }

            return cards;
        });

        function addToCart(card) {
            const existingItem = cart.value.find(item => item.blueprintId === card.blueprint_id);
            if (existingItem) {
                if (existingItem.quantity >= card.quantity) {
                    alert("Quantité maximale atteinte pour cette carte.");
                    return;
                }
                existingItem.quantity += 1;
            } else {
                cart.value.push({
                    blueprintId: card.blueprint_id,
                    name: `${card.name_en} (${expansions.value[card.expansion.id]} ${card.properties_hash.collector_number || 'N/A'})`,
                    price: (card.price_cents / 100),
                    quantity: 1
                });
            }
        }

        const cartTotal = computed(() => {
            return cart.value.reduce((total, item) => total + item.price * item.quantity, 0);
        });

        function decreaseQuantity(blueprintId) {
            const item = cart.value.find(item => item.blueprintId === blueprintId);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart.value = cart.value.filter(item => item.blueprintId !== blueprintId);
                }
            }
        }

        function increaseQuantity(blueprintId, maxQuantity) {
            const item = cart.value.find(item => item.blueprintId === blueprintId);
            if (item) {
                if (item.quantity < maxQuantity) {
                    item.quantity += 1;
                } else {
                    alert("Quantité maximale atteinte pour cette carte.");
                }
            }
        }

        function clearCart() {
            cart.value = [];
        }

        function toggleView() {
            viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
        }

        fetchExpansions().then(fetchInventory);

        return {
            inventory,
            expansions,
            viewMode,
            cart,
            searchQuery,
            selectedExpansion,
            selectedLanguage,
            selectedRarity,
            selectedReverse,
            sortOrder,
            filteredCards,
            cartTotal,
            imageBaseUrl,
            addToCart,
            decreaseQuantity,
            increaseQuantity,
            clearCart,
            toggleView
        };
    }
}).mount('#app');
