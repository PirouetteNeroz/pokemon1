const { useState, useEffect } = React;

// Configuration Supabase
const supabaseUrl = 'https://aibrhuoxwqwqbkhjhote.supabase.co'; // Remplacez par votre URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYnJodW94d3F3cWJraGpob3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MTUxNzIsImV4cCI6MjA1NjA5MTE3Mn0.Lz_P5ZIUwL5mqIuMjJn3pxWnYV8SwprKUuDEnSOHii0'; // Remplacez par votre clé Supabase
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const App = () => {
    const [orders, setOrders] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [minAmount, setMinAmount] = useState(null);
    const [sortKey, setSortKey] = useState('pseudo');
    const [sortDirection, setSortDirection] = useState('asc');
    const [collectionOptions, setCollectionOptions] = useState([]);
    const statusOptions = [
        { title: 'En attente', value: 'pending' },
        { title: 'En préparation', value: 'preparing' },
        { title: 'Expédié', value: 'shipped' },
        { title: 'Annulé', value: 'cancelled' }
    ];

    // Récupérer les commandes validées
    const fetchOrders = async () => {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .neq('status', 'cancelled'); // Exclure les commandes annulées

        if (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
        } else {
            setOrders(data);
            setCollectionOptions(extractCollections(data)); // Extraire les collections
        }
    };

    // Extraire les collections disponibles
    const extractCollections = (orders) => {
        const collections = new Set();
        orders.forEach(order => {
            order.cart_data.forEach(item => {
                const collection = item.extension || 'Inconnue';
                collections.add(collection);
            });
        });
        return Array.from(collections).map(collection => ({ title: collection, value: collection }));
    };

    // Trier les commandes
    const sortBy = (key) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Filtrer et trier les commandes
    const filteredOrders = orders
        .filter(order => {
            if (selectedCollection && !order.cart_data.some(item => item.extension === selectedCollection)) {
                return false;
            }
            if (selectedStatus && order.status !== selectedStatus) {
                return false;
            }
            if (minAmount && calculateOrderTotal(order.cart_data) < parseFloat(minAmount)) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortKey === 'pseudo') {
                return sortDirection === 'asc' ? a.pseudo.localeCompare(b.pseudo) : b.pseudo.localeCompare(a.pseudo);
            } else if (sortKey === 'status') {
                return sortDirection === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
            } else if (sortKey === 'total') {
                return sortDirection === 'asc'
                    ? calculateOrderTotal(a.cart_data) - calculateOrderTotal(b.cart_data)
                    : calculateOrderTotal(b.cart_data) - calculateOrderTotal(a.cart_data);
            } else if (sortKey === 'date') {
                return sortDirection === 'asc'
                    ? new Date(a.created_at) - new Date(b.created_at)
                    : new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
        });

    // Calculer le total d'une commande
    const calculateOrderTotal = (cartData) => {
        return cartData.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    // Générer l'URL de l'image de la carte
    const getCardImageUrl = (blueprintId) => {
        return `https://www.cardtrader.com/images/blueprint/${blueprintId}.jpg`;
    };

    // Valider une commande
    const validateOrder = async (orderId) => {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: 'shipped' }) // Mettre à jour le statut à "shipped"
            .eq('id', orderId);

        if (error) {
            console.error('Erreur lors de la validation de la commande:', error);
        } else {
            fetchOrders(); // Recharger les commandes pour refléter le changement
        }
    };

    // Annuler une commande
    const cancelOrder = async (orderId) => {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: 'cancelled' }) // Mettre à jour le statut à "cancelled"
            .eq('id', orderId);

        if (error) {
            console.error('Erreur lors de l\'annulation de la commande:', error);
        } else {
            fetchOrders(); // Recharger les commandes pour refléter le changement
        }
    };

    // Déconnexion de l'admin
    const logout = () => {
        localStorage.removeItem('admin-token'); // Supprimer le token d'authentification
        window.location.href = 'index.html'; // Rediriger vers la page d'accueil
    };

    // Charger les commandes au démarrage
    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div>
            <header>
                <h1>Admin - CardTrader</h1>
                <button onClick={logout}>Déconnexion</button>
            </header>

            <main>
                <div className="admin">
                    <h2>Commandes validées</h2>
                    <div>
                        <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}>
                            <option value="">Filtrer par collection</option>
                            {collectionOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.title}</option>
                            ))}
                        </select>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                            <option value="">Filtrer par statut</option>
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.title}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Montant minimum"
                            value={minAmount || ''}
                            onChange={(e) => setMinAmount(e.target.value)}
                        />
                    </div>

                    {filteredOrders.length > 0 ? (
                        <div>
                            {filteredOrders.map(order => (
                                <div key={order.id}>
                                    <h3>{order.pseudo} - <span>{order.status}</span></h3>
                                    <div>
                                        {order.cart_data.map((item, index) => (
                                            <div key={index}>
                                                <img src={getCardImageUrl(item.blueprintId)} alt={item.name} />
                                                <div>
                                                    <p>{item.name}</p>
                                                    <p>Quantité: {item.quantity}</p>
                                                    <p>Numéro de collection: {item.collectorNumber}</p>
                                                    <p>Prix unitaire: {item.price.toFixed(2)} €</p>
                                                    <p>Total: {(item.price * item.quantity).toFixed(2)} €</p>
                                                    <p>Extension: {item.extension}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p>Total de la commande: {calculateOrderTotal(order.cart_data).toFixed(2)} €</p>
                                    <button onClick={() => validateOrder(order.id)}>Valider</button>
                                    <button onClick={() => cancelOrder(order.id)}>Annuler</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Aucune commande correspondante.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
