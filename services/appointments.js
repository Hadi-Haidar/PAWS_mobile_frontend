import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    };
};

// Get user's pets for selection
export const getUserPets = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments/pets`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch pets' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching user pets:', error);
        return { data: null, error: error.message };
    }
};

// Get user's appointments
export const getAppointments = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch appointments' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return { data: null, error: error.message };
    }
};

// Get schedule alerts (rescheduled appointments)
export const getScheduleAlerts = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments/alerts`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch alerts' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching schedule alerts:', error);
        return { data: null, error: error.message };
    }
};

// Get available time slots for a date
export const getAvailableSlots = async (date) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments/slots?date=${date}`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch slots' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching available slots:', error);
        return { data: null, error: error.message };
    }
};

// Get list of vets
export const getVets = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments/vets`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to fetch vets' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching vets:', error);
        return { data: null, error: error.message };
    }
};

// Book a new appointment
export const bookAppointment = async (petId, date, bookingReason, vetId, isEmergency = false) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                petId,
                date,
                bookingReason,
                vetId,
                isEmergency,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to book appointment' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error booking appointment:', error);
        return { data: null, error: error.message };
    }
};

// Cancel an appointment
export const cancelAppointment = async (id) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/appointments/${id}`, {
            method: 'DELETE',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Failed to cancel appointment' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return { data: null, error: error.message };
    }
};
