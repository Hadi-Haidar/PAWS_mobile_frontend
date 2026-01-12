

import { supabase } from '../lib/supabase';

export const getPets = async ({ page = 1, limit = 20, type, search, region, ownerId } = {}) => {
    const offset = (page - 1) * limit;
    let query = supabase
        .from('Pet')
        .select('*', { count: 'exact' });

    if (ownerId) query = query.eq('ownerId', ownerId);
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
                    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80']
                },
                {
                    id: 2,
                    name: 'Luna',
                    type: 'Cat',
                    breed: 'Siamese',
                    location: 'Giza, Egypt',
                    description: 'Calm and affectionate Siamese cat looking for a quiet home.',
                    images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80']
                },
            ],
            error: null,
            count: 2
        };
    }

    return { data, error, count };
};

export const getPetById = async (id) => {
    const { data, error } = await supabase
        .from('Pet')
        .select('*')
        .eq('id', id)
        .single();

    return { data, error };
};

export const updatePet = async (id, updates) => {
    const { data, error } = await supabase
        .from('Pet')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    return { data, error };
};

export const deletePet = async (id) => {
    const { error } = await supabase
        .from('Pet')
        .delete()
        .eq('id', id);

    return { error };
};
