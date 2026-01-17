import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

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

export const getActivities = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/activities`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching activities:', error);
        return { data: [], error: error.message };
    }
};
