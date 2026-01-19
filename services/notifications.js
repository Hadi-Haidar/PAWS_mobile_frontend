import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

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

// Get all notifications
export const getNotifications = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/notifications`, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return { data: [], error: err.message };
    }
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
            method: 'PUT',
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to mark as read');
        }

        return { error: null };
    } catch (err) {
        console.error('Error marking notification as read:', err);
        return { error: err.message };
    }
};

// Clear all notifications or single
export const clearNotifications = async (id = null) => {
    try {
        const headers = await getAuthHeaders();
        const url = id
            ? `${API_URL}/api/notifications/${id}`
            : `${API_URL}/api/notifications`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to clear notifications');
        }

        return { error: null };
    } catch (err) {
        console.error('Error clearing notifications:', err);
        return { error: err.message };
    }
};
