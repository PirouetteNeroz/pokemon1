const app = Vue.createApp({
    data() {
        return {
            searchQuery: '',
            selectedExpansion: '',
            selectedLanguage: '',
            selectedRarity: '',
            selectedReverse: '',
            cart: [],
            viewMode: 'grid',
            expansions: {},
            inventory: [],
            imageBaseUrl: 'https://www.cardtrader.com/images/blueprint/',
        };
    },
    methods: {
        toggleView() {
            // Permet de changer entre la vue en grille et en liste
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        },
        addToCart(card) {
            // Ajoute une carte au panier
            const item = this.cart.find(c => c.blueprintId === card.blueprint_id);
            if (item) {
                item.quantity++;  // Si la carte est déjà dans le panier, on augmente la quantité
            } else {
                this.cart.push({
                    blueprintId: card.blueprint_id,
                    name: card.name_en,
                    price: card.price_cents / 100,
                    quantity: 1,
                });
            }
        },
        clearCart() {
            // Vide le panier
            this.cart = [];
        },
        removeFromCart(card) {
            // Enlève une carte du panier
            const index = this.cart.findIndex(item => item.blueprintId === card.blueprintId);
            if (index !== -1) {
                this.cart.splice(index, 1);
            }
        },
        getFilteredInventory() {
            // Filtrer l'inventaire en fonction des sélections des filtres
            return this.inventory.filter(card => {
                const matchesQuery = card.name_en.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesExpansion = !this.selectedExpansion || card.expansion_id === this.selectedExpansion;
                const matchesLanguage = !this.selectedLanguage || card.language === this.selectedLanguage;
                const matchesRarity = !this.selectedRarity || card.rarity === this.selectedRarity;
                const matchesReverse = this.selectedReverse === '' || (this.selectedReverse === 'Oui' ? card.reverse : !card.reverse);

                return matchesQuery && matchesExpansion && matchesLanguage && matchesRarity && matchesReverse;
            });
        },
    },
    mounted() {
        // Récupère les données des produits et des expansions au démarrage
        fetch('https://api.cardtrader.com/api/v2/products/export')
            .then(res => res.json())
            .then(data => {
                this.inventory = data;  // On récupère l'inventaire des cartes
            });

        fetch('https://api.cardtrader.com/api/v2/expansions/export')
            .then(res => res.json())
            .then(data => {
                // On met à jour l'objet expansions avec les codes des expansions
                this.expansions = data.reduce((acc, expansion) => {
                    acc[expansion.id] = expansion.code;
                    return acc;
                }, {});
            });
    },
});

app.use(Vuetify);

app.mount('#app');
