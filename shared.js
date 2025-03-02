// shared.js
const { createClient } = supabase;

// Configuration Supabase
const supabaseUrl = 'https://aibrhuoxwqwqbkhjhote.supabase.co'; // Remplacez par votre URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYnJodW94d3F3cWJraGpob3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MTUxNzIsImV4cCI6MjA1NjA5MTE3Mn0.Lz_P5ZIUwL5mqIuMjJn3pxWnYV8SwprKUuDEnSOHii0'; // Remplacez par votre clé Supabase
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const API_PRODUCTS = 'https://api.cardtrader.com/api/v2/products/export';
const API_EXPANSIONS = 'https://api.cardtrader.com/api/v2/expansions/export';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJjYXJkdHJhZGVyLXByb2R1Y3Rpb24iLCJzdWIiOiJhcHA6MTM5MzgiLCJhdWQiOiJhcHA6MTM5MzgiLCJleHAiOjQ4OTU2MzQ3MTcsImp0aSI6IjQxMjA3NmNjLTcyZTEtNDljOC1iODA2LTE3OTJiNmU3N2JhMyIsImlhdCI6MTczOTk2MTExNywibmFtZSI6Ik5lcm96YnJpY2tzIEFwcCAyMDI1MDIwODE3NDkxOSJ9.PkkEXit3MvxmVij_e5Eyz55k_3EYgQF-2ln9goSfMbQD3mIpDVrSkQa010BfnF9IR1L8fvswAyxk56qiUr2LKm2KXX0iKAvVRR373A3XEDwgNtGGBBAR-rxh8raL1hW8e4AH_bps1tVFTrdZ_W-Odg5egSxLFIxnLgi0a9It5KVeVkjdgLmxYuaCXspgml9TXfgJcJ2GH62izvB5eUsAj4NhobpH5q_Pyfbyw2cJu4HmilQjBSOm4NsmRW7Nd692tNT2semj1Oh1UqV1xel2WewtLaWlUAVHYt2LSMWrEw_kx9Yjk9Kz-rM67tk0nXosKklnIigJpcrmRUXf-O7qJA'; // Remplacez par votre token API

// Fonction pour générer un ID unique
function generateUserId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Fonction pour sauvegarder le panier dans le localStorage
function saveCartToLocalStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Fonction pour récupérer le panier depuis le localStorage
function getCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
}

// Fonction pour sauvegarder le panier dans Supabase
async function saveCartToSupabase(userId, cart) {
    const { data, error } = await supabaseClient
        .from('carts')
        .upsert([
            { user_id: userId, cart_data: cart }
        ]);

    if (error) {
        console.error('Erreur lors de la sauvegarde du panier:', error);
    } else {
        console.log('Panier sauvegardé avec succès:', data);
    }
}

    // Exemple d'utilisation de fetchFrenchPokemonName
    async function loadPokemonNames() {
        const pokemonNames = ['pikachu', 'bulbasaur', 'charmander'];
        for (const name of pokemonNames) {
            const frenchName = await fetchFrenchPokemonName(name);
            console.log(`${name} en français : ${frenchName}`);
        }
    }

    loadPokemonNames();

// Fonction pour valider le panier
async function validateCart(userId, cart, pseudo) {
    if (cart.length === 0) {
        return { success: false, message: 'Votre panier est vide.' };
    }

    if (!pseudo) {
        return { success: false, message: 'Veuillez entrer un pseudo pour valider votre panier.' };
    }

    // Envoyer le panier à Supabase
    const { data, error } = await supabaseClient
        .from('orders')
        .insert([
            {
                user_id: userId,
                pseudo: pseudo,
                cart_data: cart,
                status: 'pending'
            }
        ]);

    if (error) {
        console.error('Erreur lors de la validation du panier:', error);
        return { success: false, message: 'Erreur lors de la validation du panier.' };
    } else {
        console.log('Panier validé avec succès:', data);
        return { success: true, message: 'Votre panier a été validé avec succès.' };
    }
}


async function fetchFrenchPokemonName(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
        if (!response.ok) throw new Error(`Erreur API PokeAPI: ${response.status}`);
        const data = await response.json();

        // Recherche du nom en français
        const frenchName = data.names.find(name => name.language.name === 'fr');
        if (frenchName) {
            return frenchName.name; // Retourne le nom français
        } else {
            console.warn(`Aucun nom français trouvé pour ${pokemonName}. Utilisation du nom anglais.`);
            return pokemonName; // Retourne le nom anglais par défaut
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du nom français :", error);
        return pokemonName; // Retourne le nom anglais en cas d'erreur
    }
}

// Exportez la fonction pour qu'elle soit utilisable dans d'autres fichiers
export { fetchFrenchPokemonName, generateUserId, saveCartToLocalStorage, getCartFromLocalStorage, saveCartToSupabase, validateCart, API_PRODUCTS, API_EXPANSIONS, API_TOKEN, supabaseClient };
