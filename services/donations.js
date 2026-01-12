
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// Get auth token for API calls
const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
};

// Create a payment intent
export const createDonationIntent = async (amount, currency = 'USD', message = '') => {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_URL}/api/donations/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, currency, message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create payment intent');
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error creating donation intent:', error);
        return { data: null, error: error.message };
    }
};

// Confirm donation after successful payment
export const confirmDonation = async (paymentIntentId, amount, currency = 'USD', message = '') => {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_URL}/api/donations/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ paymentIntentId, amount, currency, message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to confirm donation');
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error confirming donation:', error);
        return { data: null, error: error.message };
    }
};

// Get donation history
export const getDonationHistory = async () => {
    try {
        const token = await getAuthToken();

        if (!token) {
            // Not logged in, return empty
            return { data: { donations: [], total: 0, count: 0 }, error: null };
        }

        const response = await fetch(`${API_URL}/api/donations/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch donations');
        }

        return { data, error: null };
    } catch (error) {
        // Only log once, not spam
        if (!getDonationHistory._hasLoggedError) {
            console.warn('Donation history unavailable:', error.message);
            getDonationHistory._hasLoggedError = true;
        }
        // Return empty data on error so UI doesn't break
        return { data: { donations: [], total: 0, count: 0 }, error: error.message };
    }
};
