
        const { createApp, ref, reactive, computed } = Vue;

        const API_PRODUCTS = 'https://api.cardtrader.com/api/v2/products/export';
        const API_EXPANSIONS = 'https://api.cardtrader.com/api/v2/expansions/export';
        const API_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJjYXJkdHJhZGVyLXByb2R1Y3Rpb24iLCJzdWIiOiJhcHA6MTM5MzgiLCJhdWQiOiJhcHA6MTM5MzgiLCJleHAiOjQ4OTU2MzQ3MTcsImp0aSI6IjQxMjA3NmNjLTcyZTEtNDljOC1iODA2LTE3OTJiNmU3N2JhMyIsImlhdCI6MTczOTk2MTExNywibmFtZSI6Ik5lcm96YnJpY2tzIEFwcCAyMDI1MDIwODE3NDkxOSJ9.PkkEXit3MvxmVij_e5Eyz55k_3EYgQF-2ln9goSfMbQD3mIpDVrSkQa010BfnF9IR1L8fvswAyxk56qiUr2LKm2KXX0iKAvVRR373A3XEDwgNtGGBBAR-rxh8raL1hW8e4AH_bps1tVFTrdZ_W-Odg5egSxLFIxnLgi0a9It5KVeVkjdgLmxYuaCXspgml9TXfgJcJ2GH62izvB5eUsAj4NhobpH5q_Pyfbyw2cJu4HmilQjBSOm4NsmRW7Nd692tNT2semj1Oh1UqV1xel2WewtLaWlUAVHYt2LSMWrEw_kx9Yjk9Kz-rM67tk0nXosKklnIigJpcrmRUXf-O7qJA';

        const app = createApp({
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

                // Options pour les filtres
                const expansionOptions = computed(() => {
                    return Object.entries(expansions.value).map(([id, code]) => ({ title: code, value: id }));
                });

                const languageOptions = [
                    { title: 'Anglais', value: 'en' },
                    { title: 'Japonais', value: 'jp' }
                ];

                const rarityOptions = [
                    { title: 'Commun', value: 'Common' },
                    { title: 'Peu Commun', value: 'Uncommon' },
                    { title: 'Rare', value: 'Rare' }
                ];

                const reverseOptions = [
                    { title: 'Cartes Inversées', value: 'true' },
                    { title: 'Cartes Normales', value: 'false' }
                ];

                const sortOptions = [
                    { title: 'Tri Ascendant', value: 'asc' },
                    { title: 'Tri Descendant', value: 'desc' }
                ];

                // Charger les extensions
                async function fetchExpansions() {
                    try {
                        const response = await fetch(API_EXPANSIONS, {
                            method: "GET",
                            headers: { "Authorization": `Bearer ${API_TOKEN}` }
                        });
                        if (!response.ok) throw new Error(`Erreur API Expansions: ${response.status}`);
                        const data = await response.json();
                        data.forEach(exp => {
                            expansions.value[exp.id] = exp.code; // Stocke le code de l'extension
                        });
                    } catch (error) {
                        console.error("Erreur lors du chargement des extensions :", error);
                    }
                }

                // Charger l'inventaire
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

                // Filtrer les cartes
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

                // Ajouter une carte au panier
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

                // Calculer le total du panier
                const cartTotal = computed(() => {
                    return cart.value.reduce((total, item) => total + item.price * item.quantity, 0);
                });

                // Diminuer la quantité d'une carte dans le panier
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

                // Augmenter la quantité d'une carte dans le panier
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

                // Vider le panier
                function clearCart() {
                    cart.value = [];
                }

                // Basculer entre les modes d'affichage
                function toggleView() {
                    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
                }

                // Charger les données au démarrage
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
                    imageBaseUrl,
                    expansionOptions,
                    languageOptions,
                    rarityOptions,
                    reverseOptions,
                    sortOptions,
                    filteredCards,
                    cartTotal,
                    addToCart,
                    decreaseQuantity,
                    increaseQuantity,
                    clearCart,
                    toggleView
                };
            }
        });

        app.use(Vuetify.createVuetify());
        app.mount('#app');
