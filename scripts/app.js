console.log(window.supabaseClient); // Doit afficher le client Supabase
// Utilisez directement les variables globales
console.log(window.API_PRODUCTS); // Doit afficher l'URL de l'API des produits
console.log(window.API_EXPANSIONS); // Doit afficher l'URL de l'API des extensions
console.log(window.API_TOKEN); // Doit afficher le token API

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    primary: '#FFD700',
                    secondary: '#1E1E1E',
                    background: '#121212',
                    surface: '#1E1E1E',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                },
            },
        },
    },
});

const app = createApp({
    setup() {
        const inventory = ref([]);
        const expansions = ref({});
        const cart = ref([]);
        const userId = ref(generateUserId()); // Génère un ID unique pour l'utilisateur anonyme
        const tab = ref('inventory');
        const searchQuery = ref('');
        const selectedExpansion = ref('');
        const selectedLanguage = ref('');
        const selectedRarity = ref('');
        const selectedReverse = ref('');
        const sortOrder = ref('');
        const imageBaseUrl = ref('https://www.cardtrader.com/images/blueprint/');
        const currentPage = ref(1);
        const itemsPerPage = 20;
        const pseudo = ref(''); // Variable pour stocker le pseudo

        // Animation pour l'ajout au panier
        const showCartAnimation = ref(false);
        const cartAnimationStyle = ref({});

        // Notifications visuelles (toasts)
        const snackbar = reactive({
            show: false,
            message: '',
            color: 'success',
        });

        // Fonction pour afficher des notifications
        function showNotification(message, color = 'success') {
            snackbar.message = message;
            snackbar.color = color;
            snackbar.show = true;

            // Masquer la notification après 3 secondes
            setTimeout(() => {
                snackbar.show = false;
            }, 3000);
        }

        // Fonction pour récupérer les noms des Pokémon en français
        async function fetchFrenchPokemonName(pokemonName) {
            try {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
                if (!response.ok) throw new Error(`Erreur API PokeAPI: ${response.status}`);
                const data = await response.json();
                const frenchName = data.names.find(name => name.language.name === 'fr');
                return frenchName ? frenchName.name : pokemonName; // Retourne le nom français ou le nom anglais par défaut
            } catch (error) {
                console.error("Erreur lors de la récupération du nom français :", error);
                return pokemonName; // Retourne le nom anglais en cas d'erreur
            }
        }

        // Récupérer le panier depuis le localStorage au chargement de la page
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart.value = JSON.parse(savedCart);
        }

        // Fonction pour sauvegarder le panier dans le localStorage
        function saveCartToLocalStorage() {
            localStorage.setItem('cart', JSON.stringify(cart.value));
        }

        // Fonction pour sauvegarder le panier dans Supabase
        async function saveCartToSupabase() {
            const { data, error } = await supabaseClient
                .from('carts')
                .upsert([
                    { user_id: userId.value, cart_data: cart.value }
                ]);

            if (error) {
                console.error('Erreur lors de la sauvegarde du panier:', error);
            } else {
                console.log('Panier sauvegardé avec succès:', data);
            }
        }

        // Fonction pour valider le panier
        async function validateCart() {
            if (cart.value.length === 0) {
                showNotification('Votre panier est vide.', 'error');
                return;
            }

            if (!pseudo.value) {
                showNotification('Veuillez entrer un pseudo pour valider votre panier.', 'error');
                return;
            }

            // Envoyer le panier à Supabase
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([
                    {
                        user_id: userId.value, // Utilise l'ID unique temporaire
                        pseudo: pseudo.value, // Pseudo de l'utilisateur
                        cart_data: cart.value, // Données du panier
                        status: 'pending' // Statut de la commande
                    }
                ]);

            if (error) {
                console.error('Erreur lors de la validation du panier:', error);
                showNotification('Erreur lors de la validation du panier.', 'error');
            } else {
                console.log('Panier validé avec succès:', data);
                showNotification('Votre panier a été validé avec succès.', 'success');
                clearCart(); // Vider le panier après validation
                pseudo.value = ''; // Réinitialiser le champ pseudo
            }
        }

        // Fonction pour générer un ID unique
        function generateUserId() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // Fonction pour ajouter une carte au panier
        function addToCart(card, event) {
            const existingItem = cart.value.find(item => item.blueprintId === card.blueprint_id);
            if (existingItem) {
                if (existingItem.quantity >= card.quantity) {
                    showNotification("Quantité maximale atteinte pour cette carte.", 'error');
                    return;
                }
                existingItem.quantity += 1;
            } else {
                cart.value.push({
                    blueprintId: card.blueprint_id,
                    name: `${card.name_fr || card.name_en} (${expansions.value[card.expansion.id]} ${card.properties_hash.collector_number || 'N/A'})`,
                    price: (card.price_cents / 100),
                    quantity: 1
                });
            }

            // Afficher une notification
            showNotification(`${card.name_fr || card.name_en} ajoutée au panier.`, 'success');

            // Déclencher l'animation
            triggerCartAnimation(event);

            saveCartToLocalStorage(); // Sauvegarder le panier dans le localStorage
        }

        // Fonction pour déclencher l'animation
        function triggerCartAnimation(event) {
            // Récupérer la position du bouton cliqué
            const buttonRect = event.target.getBoundingClientRect();
            const buttonX = buttonRect.left + buttonRect.width / 2;
            const buttonY = buttonRect.top + buttonRect.height / 2;

            // Position de départ de l'icône animée
            cartAnimationStyle.value = {
                left: `${buttonX}px`,
                top: `${buttonY}px`,
            };

            // Afficher l'icône animée
            showCartAnimation.value = true;

            // Masquer l'icône après l'animation
            setTimeout(() => {
                showCartAnimation.value = false;
            }, 800); // Durée de l'animation
        }

        // Fonction pour diminuer la quantité d'un article dans le panier
        function decreaseQuantity(blueprintId) {
            const item = cart.value.find(item => item.blueprintId === blueprintId);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart.value = cart.value.filter(item => item.blueprintId !== blueprintId);
                }
            }
            saveCartToLocalStorage(); // Sauvegarder le panier dans le localStorage
        }

        // Fonction pour augmenter la quantité d'un article dans le panier
        function increaseQuantity(blueprintId, maxQuantity) {
            const item = cart.value.find(item => item.blueprintId === blueprintId);
            if (item) {
                if (item.quantity < maxQuantity) {
                    item.quantity += 1;
                } else {
                    showNotification("Quantité maximale atteinte pour cette carte.", 'error');
                }
            }
            saveCartToLocalStorage(); // Sauvegarder le panier dans le localStorage
        }

        // Fonction pour vider le panier
        function clearCart() {
            cart.value = [];
            showNotification("Le panier a été vidé.", 'info');
            saveCartToLocalStorage(); // Sauvegarder le panier dans le localStorage
        }

        // Fonction pour réinitialiser les filtres
        function resetFilters() {
            searchQuery.value = '';
            selectedExpansion.value = '';
            selectedLanguage.value = '';
            selectedRarity.value = '';
            selectedReverse.value = '';
            sortOrder.value = '';
        }

        // Calcul des propriétés calculées
        const totalPages = computed(() => Math.ceil(filteredCards.value.length / itemsPerPage));
        const paginatedCards = computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            return filteredCards.value.slice(start, end);
        });
        const expansionOptions = computed(() => Object.entries(expansions.value).map(([id, code]) => ({ title: code, value: id })));
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
        const cartTotal = computed(() => cart.value.reduce((total, item) => total + item.price * item.quantity, 0));
        const totalItemsInCart = computed(() => cart.value.reduce((total, item) => total + item.quantity, 0));

        // Fonction pour filtrer les cartes
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

        // Charger les extensions et l'inventaire
        async function fetchExpansions() {
            try {
                const response = await fetch(API_EXPANSIONS, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${API_TOKEN}` }
                });
                if (!response.ok) throw new Error(`Erreur API Expansions: ${response.status}`);
                const data = await response.json();
                data.forEach(exp => expansions.value[exp.id] = exp.code);
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
                const data = await response.json();
                inventory.value = await Promise.all(data.map(async (card) => {
                    const frenchName = await fetchFrenchPokemonName(card.name_en.toLowerCase());
                    return { ...card, name_fr: frenchName };
                }));
            } catch (error) {
                console.error("Erreur API :", error);
            }
        }

        // Initialisation
        fetchExpansions().then(fetchInventory);

        return {
            inventory,
            expansions,
            cart,
            tab,
            searchQuery,
            selectedExpansion,
            selectedLanguage,
            selectedRarity,
            selectedReverse,
            sortOrder,
            imageBaseUrl,
            currentPage,
            itemsPerPage,
            totalPages,
            paginatedCards,
            expansionOptions,
            languageOptions,
            rarityOptions,
            reverseOptions,
            sortOptions,
            cartTotal,
            totalItemsInCart,
            snackbar,
            pseudo,
            showCartAnimation,
            cartAnimationStyle,
            addToCart,
            decreaseQuantity,
            increaseQuantity,
            clearCart,
            resetFilters,
            showNotification,
            validateCart, // Ajout de la fonction validateCart
        };
    }
});

app.use(vuetify);
app.mount('#app');
