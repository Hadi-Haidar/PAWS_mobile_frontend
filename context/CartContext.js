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
                // If adding one more would exceed stock, don't change anything
                if (existing.quantity >= product.stock) {
                    return prevCart;
                }
                return prevCart.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // If stock is 0 (should shouldn't happen via UI but good safety), don't add
            if (product.stock <= 0) return prevCart;

            return [
                ...prevCart,
                {
                    productId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    quantity: 1,
                    imageUrl: product.imageUrl,
                    category: product.category,
                    maxStock: product.stock, // Store max stock
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
                    let newQty = item.quantity + delta;

                    // Enforce lower bound
                    newQty = Math.max(1, newQty);

                    // Enforce upper bound if maxStock is known
                    if (item.maxStock !== undefined) {
                        newQty = Math.min(newQty, item.maxStock);
                    }

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
