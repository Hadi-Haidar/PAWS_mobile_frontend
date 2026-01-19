
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

export const createReport = async (reportData) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/reports`, {
            method: 'POST',
            headers,
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit report');
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error('Error creating report:', error);
        return { data: null, error: error.message };
    }
};

export const getMyReports = async () => {
    // In future, filtering by user ID on backend or passing query param
    // For now, reuse getReports if backend filters, or simple fetch
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/reports`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        // Since backend currently returns ALL reports (for Admin), 
        // we might ideally filter on client or update backend. 
        // But for "Support Page" creation request, we primarily need "Submit".
        return { data: data.data, error: null };
    } catch (e) {
        return { data: [], error: e.message };
    }
};
