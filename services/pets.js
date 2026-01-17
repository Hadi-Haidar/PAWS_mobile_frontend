

import { supabase } from '../lib/supabase';

export const getPets = async ({ page = 1, limit = 20, type, search, region, ownerId } = {}) => {
    const offset = (page - 1) * limit;
    let query = supabase
        .from('Pet')
        .select('*', { count: 'exact' });

    if (ownerId) {
        query = query.eq('ownerId', ownerId);
    } else {
        // Main feed: only show available pets
        query = query.eq('status', 'Stray');
    }
    if (type) query = query.eq('type', type);
    if (region) query = query.ilike('location', `%${region}%`);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('createdAt', { ascending: false });

    if (error) {
        console.warn('Supabase error (using mock data):', error.message);
        return {
            data: [
                {
                    id: 1,
                    name: 'Buddy',
                    type: 'Dog',
                    breed: 'Golden Retriever',
                    location: 'Cairo, Egypt',
                    description: 'Friendly and energetic golden retriever who loves playing fetch.',
                    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'],
                    ownerId: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
                    contactName: 'Ahmed Ali'
                },
                {
                    id: 2,
                    name: 'Luna',
                    type: 'Cat',
                    breed: 'Siamese',
                    location: 'Giza, Egypt',
                    description: 'Calm and affectionate Siamese cat looking for a quiet home.',
                    images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80'],
                    ownerId: '123e4567-e89b-12d3-a456-426614174001', // Mock UUID
                    contactName: 'Sarah Smith'
                },
            ],
            error: null,
            count: 2
        };
    }

    return { data, error, count };
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
        .select('role')
        .eq('id', pet.ownerId)
        .single();

    if (owner) {
        pet.ownerRole = owner.role;
    }

    return { data: pet, error: null };
};

// Helper to get auth headers (copied from other services)
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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

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
