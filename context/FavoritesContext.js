
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load favorites from local storage on mount
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const storedFavorites = await AsyncStorage.getItem('user_favorites');
                if (storedFavorites) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            } catch (error) {
                console.error('Failed to load favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, []);

    // Toggle favorite status
    const toggleFavorite = async (pet) => {
        try {
            let newFavorites;
            const exists = favorites.find(f => f.id === pet.id);

            if (exists) {
                // Remove
                newFavorites = favorites.filter(f => f.id !== pet.id);
            } else {
                // Add
                // We store the essential fields to display in the list without re-fetching
                newFavorites = [...favorites, pet];
            }

            setFavorites(newFavorites);
            await AsyncStorage.setItem('user_favorites', JSON.stringify(newFavorites));
        } catch (error) {
            console.error('Failed to update favorites:', error);
            Alert.alert('Error', 'Could not save favorite status');
        }
    };

    const isFavorite = (petId) => {
        return favorites.some(f => f.id === petId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
