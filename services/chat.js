import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

// Determine backend URL
const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:5000`; // Use the same IP as Expo
    }
    return 'http://localhost:5000';
};

const API_URL = getBackendUrl();

export const getChatHistory = async (otherUserId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/chat/history/${user.id}/${otherUserId}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        return { data, error: null };
    } catch (e) {
        console.error("Chat fetch error:", e);
        return { data: null, error: e.message };
    }
};

export const getInbox = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/chat/inbox/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch inbox');
        const data = await response.json();
        return { data, error: null };
    } catch (e) {
        console.error("Inbox fetch error:", e);
        return { data: null, error: e.message };
    }
}

export const updateMessage = async (id, updates) => {
    const { data, error } = await supabase
        .from('Message')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};
