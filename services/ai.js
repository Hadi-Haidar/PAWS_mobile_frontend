import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    };
};

export const getAiRecommendation = async (answers) => {
    try {
        const headers = await getAuthHeaders();
        console.log('Sending answers to AI:', answers);

        const response = await fetch(`${API_URL}/api/ai/recommend`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || `Server Error ${response.status}`);
            } catch (e) {
                throw new Error(`Server Error ${response.status}: ${errorText}`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};
