import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Load cart from storage on mount
    useEffect(() => {
        AsyncStorage.getItem('cart').then((data) => {
            if (data) {
                setCart(JSON.parse(data));
            }
        });
    }, []);

    // Save cart to storage whenever it changes
    useEffect(() => {
        AsyncStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existing = prevCart.find((item) => item.productId === product.id);
            if (existing) {
                return prevCart.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [
                ...prevCart,
                {
                    productId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    quantity: 1,
                    imageUrl: product.imageUrl,
                    category: product.category,
                },
            ];
        });
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.productId === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCart([]);

    const getCartTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = 0;
        const total = subtotal;
        return {
            subtotal,
            tax,
            total,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        };
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
