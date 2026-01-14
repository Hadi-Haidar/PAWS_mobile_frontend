import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };
    }
    return { 'Content-Type': 'application/json' };
};

// Get all products
export const getProducts = async (category = null) => {
    try {
        let url = `${API_URL}/api/shop/products`;
        if (category && category !== 'All') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { data: null, error: error.message };
    }
};

// Get single product by ID
export const getProductById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/shop/products/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching product:', error);
        return { data: null, error: error.message };
    }
};

// Create order payment intent
export const createOrderIntent = async (items, totalAmount) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/shop/order/create-intent`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ items, totalAmount })
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to create order' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error creating order intent:', error);
        return { data: null, error: error.message };
    }
};

// Confirm order after payment
export const confirmOrder = async (paymentIntentId, items, totalAmount) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/shop/order/confirm`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ paymentIntentId, items, totalAmount })
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to confirm order' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error confirming order:', error);
        return { data: null, error: error.message };
    }
};

// Get order history
export const getOrderHistory = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/shop/orders/history`, {
            method: 'GET',
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch orders' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching order history:', error);
        return { data: null, error: error.message };
    }
};
