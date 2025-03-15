const { useState, useEffect } = React;

const App = () => {
    const [inventory, setInventory] = useState([]);
    const [expansions, setExpansions] = useState({});
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExpansion, setSelectedExpansion] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedRarity, setSelectedRarity] = useState('');
    const [selectedReverse, setSelectedReverse] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;
    const [showCartAnimation, setShowCartAnimation] = useState(false);
    const [cartAnimationStyle, setCartAnimationStyle] = useState({});
    const [snackbar, setSnackbar] = useState({ show: false, message: '', color: 'success' });

    const imageBaseUrl = 'https://www.cardtrader.com/images/blueprint/';

    // Fonction pour ajouter une carte au panier
    const addToCart = (card, event) => {
        const existingItem = cart.find(item => item.blueprintId === card.blueprint_id);
        if (existingItem) {
            if (existingItem.quantity >= card.quantity) {
                showNotification("Quantité maximale atteinte pour cette carte.", 'error');
                return;
            }
            existingItem.quantity += 1;
        } else {
            setCart([...cart, {
                blueprintId: card.blueprint_id,
                name: card.name_fr || card.name_en,
                extension: expansions[card.expansion.id],
                price: (card.price_cents / 100),
                quantity: 1,
                maxQuantity: card.quantity,
                condition: card.condition || 'Non spécifiée',
                collectorNumber: card.properties_hash.collector_number || 'N/A'
            }]);
        }
        showNotification(`${card.name_fr || card.name_en} ajoutée au panier.`, 'success');
        triggerCartAnimation(event);
        saveCartToLocalStorage(cart);
    };

    // Fonction pour déclencher l'animation du panier
    const triggerCartAnimation = (event) => {
        const buttonRect = event.target.getBoundingClientRect();
        const buttonX = buttonRect.left + buttonRect.width / 2;
        const buttonY = buttonRect.top + buttonRect.height / 2;
        setCartAnimationStyle({
            left: `${buttonX}px`,
            top: `${buttonY}px`,
        });
        setShowCartAnimation(true);
        setTimeout(() => {
            setShowCartAnimation(false);
        }, 800);
    };

    // Fonction pour afficher une notification
    const showNotification = (message, color = 'success') => {
        setSnackbar({ show: true, message, color });
        setTimeout(() => {
            setSnackbar({ ...snackbar, show: false });
        }, 3000);
    };

    // Fonction pour réinitialiser les filtres
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedExpansion('');
        setSelectedLanguage('');
        setSelectedRarity('');
        setSelectedReverse('');
        setSelectedCondition('');
        setSortOrder('');
    };

    // Fonction pour normaliser les chaînes de caractères
    const normalizeString = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    };

    // Fonction pour filtrer les cartes
    const filteredCards = inventory.filter(card => {
        if (searchQuery) {
            const searchTerm = normalizeString(searchQuery);
            const nameEn = normalizeString(card.name_en);
            const nameFr = normalizeString(card.name_fr);
            if (!nameEn.includes(searchTerm) && !nameFr.includes(searchTerm)) return false;
        }
        if (selectedExpansion && card.expansion.id != selectedExpansion) return false;
        if (selectedLanguage && card.properties_hash.pokemon_language != selectedLanguage) return false;
        if (selectedRarity && card.properties_hash.pokemon_rarity != selectedRarity) return false;
        if (selectedReverse !== "" && card.properties_hash.pokemon_reverse.toString() !== selectedReverse) return false;
        if (selectedCondition && card.condition !== selectedCondition) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    const paginatedCards = filteredCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Charger les extensions et l'inventaire
    useEffect(() => {
        const fetchExpansions = async () => {
            try {
                const response = await fetch(API_EXPANSIONS, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${API_TOKEN}` }
                });
                if (!response.ok) throw new Error(`Erreur API Expansions: ${response.status}`);
                const data = await response.json();
                const expansionsMap = {};
                data.forEach(exp => expansionsMap[exp.id] = exp.name);
                setExpansions(expansionsMap);
            } catch (error) {
                console.error("Erreur lors du chargement des extensions :", error);
            }
        };

        const fetchInventory = async () => {
            try {
                const response = await fetch(API_PRODUCTS, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
                });
                if (!response.ok) throw new Error(`Erreur API Produits: ${response.status}`);
                const data = await response.json();
                const inventoryWithFrenchNames = await Promise.all(data.map(async (card) => {
                    const frenchName = await fetchFrenchPokemonName(card.name_en.toLowerCase());
                    return { ...card, name_fr: frenchName, condition: card.properties_hash.condition || 'Non spécifiée' };
                }));
                setInventory(inventoryWithFrenchNames);
            } catch (error) {
                console.error("Erreur API :", error);
            }
        };

        fetchExpansions().then(fetchInventory);
    }, []);

    return (
        <div>
            <header>
                <h1><a href="/inventory.html">Carameche</a></h1>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button>Rechercher</button>
                </div>
                <div>
                    <a href="/inventory.html">Accueil</a>
                    <a href="/cart.html">Panier ({cart.reduce((total, item) => total + item.quantity, 0)})</a>
                </div>
            </header>

            <div className="filters">
                <h2>Filtres</h2>
                <select value={selectedExpansion} onChange={(e) => setSelectedExpansion(e.target.value)}>
                    <option value="">Extension</option>
                    {Object.entries(expansions).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                    <option value="">Langue</option>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="jp">Japonais</option>
                </select>
                <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)}>
                    <option value="">Rareté</option>
                    <option value="Common">Commun</option>
                    <option value="Uncommon">Peu Commun</option>
                    <option value="Rare">Rare</option>
                    <option value="Holo Rare">Holo</option>
                    <option value="Promo">Promo</option>
                    <option value="Ultra Rare">Ultra Rare</option>
                    <option value="Secret Rare">Secret Rare</option>
                    <option value="Rare Holo EX">Rare Holo EX</option>
                    <option value="Double Rare">Double Rare</option>
                    <option value="Triple Rare">Triple Rare</option>
                    <option value="Illustration Rare">Illustration Rare</option>
                </select>
                <select value={selectedReverse} onChange={(e) => setSelectedReverse(e.target.value)}>
                    <option value="">Type de carte</option>
                    <option value="true">Cartes Reverse</option>
                    <option value="false">Cartes Normales</option>
                </select>
                <select value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)}>
                    <option value="">Condition</option>
                    <option value="Mint">Mint</option>
                    <option value="Near Mint">Near Mint</option>
                    <option value="Slightly Played">Slightly Played</option>
                    <option value="Moderately Played">Moderately Played</option>
                    <option value="Played">Played</option>
                    <option value="Heavily Played">Heavily Played</option>
                    <option value="Poor">Poor</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="">Trier par</option>
                    <option value="asc">Tri Ascendant</option>
                    <option value="desc">Tri Descendant</option>
                </select>
                <button onClick={resetFilters}>Réinitialiser les filtres</button>
            </div>

            <div className="inventory-grid">
                {paginatedCards.map(card => (
                    <div key={card.blueprint_id} className="card">
                        <div className="ribbon-container">
                            <img
                                src={`${imageBaseUrl}${card.blueprint_id}.jpg`}
                                alt={card.name_fr || card.name_en}
                                className={`card-image ${card.properties_hash.pokemon_reverse ? 'reverse-glow' : ''}`}
                            />
                            {card.properties_hash.pokemon_reverse && <div className="ribbon">Reverse</div>}
                        </div>
                        <div className="card-details">
                            <h3 className="card-name">{card.name_fr || card.name_en}</h3>
                            <p className="card-expansion">{expansions[card.expansion.id]}</p>
                            <p className="card-rarity">{card.properties_hash.pokemon_rarity}</p>
                            <p className="card-condition">{card.condition || 'Non spécifiée'}</p>
                            <p className="card-price">{(card.price_cents / 100).toFixed(2)} €</p>
                            <div className="card-quantity">{card.quantity || 0} disponible(s)</div>
                            <button onClick={(e) => addToCart(card, e)}>Ajouter au panier</button>
                        </div>
                    </div>
                ))}
            </div>

            {snackbar.show && (
                <div className="snackbar" style={{ backgroundColor: snackbar.color }}>
                    {snackbar.message}
                    <button onClick={() => setSnackbar({ ...snackbar, show: false })}>Fermer</button>
                </div>
            )}

            {showCartAnimation && (
                <div className="cart-animation-icon" style={cartAnimationStyle}>
                    <i className="mdi mdi-cart"></i>
                </div>
            )}
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
