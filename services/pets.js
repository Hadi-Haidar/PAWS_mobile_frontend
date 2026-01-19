
import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

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

export const getPets = async ({ page = 1, limit = 20, type, search, region, ownerId, source, exclude } = {}) => {
    try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (type) params.append('type', type);
        if (search) params.append('search', search);
        if (region) params.append('region', region);
        if (ownerId) params.append('ownerId', ownerId);
        if (source) params.append('source', source);
        if (exclude) params.append('exclude', exclude);

        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/pets?${params.toString()}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch pets');
        }

        const result = await response.json();
        return { data: result.data, error: null, count: result.meta?.total };
    } catch (error) {
        console.error('Error fetching pets:', error);
        return { data: [], error: error.message, count: 0 };
    }
};

export const getPetById = async (id) => {
    const { data: pet, error } = await supabase
        .from('Pet')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return { data: null, error };

    // Fetch owner role
    const { data: owner } = await supabase
        .from('User')
        .select('role, name')
        .eq('id', pet.ownerId)
        .single();

    if (owner) {
        pet.ownerRole = owner.role;
        pet.ownerName = owner.name;
    }

    return { data: pet, error: null };
};


export const updatePet = async (id, updates) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/pets/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update pet');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error updating pet:', error);
        return { data: null, error: error.message };
    }
};

export const deletePet = async (id) => {
    const { error } = await supabase
        .from('Pet')
        .delete()
        .eq('id', id);

    return { error };
};
