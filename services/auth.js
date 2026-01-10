
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession(); // For web support

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });
    return { data, error };
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

// Verify OTP
export const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    });
    return { data, error };
};

// Google Login (Adapted for Expo)
export const signInWithGoogle = async () => {
    const redirectUrl = makeRedirectUri({
        path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
                prompt: 'select_account',
            },
        },
    });

    if (error) {
        return { error };
    }

    if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'cancel') {
            return { error: { message: 'User cancelled login' } };
        }

        if (result.type === 'success' && result.url) {
            // Extract tokens from the URL fragment (hash)
            // URL looks like: exp://.../auth/callback#access_token=...&refresh_token=...&provider_token=...
            const params = {};
            const urlParts = result.url.split('#');

            if (urlParts.length > 1) {
                const queryString = urlParts[1];
                const pairs = queryString.split('&');
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    params[key] = decodeURIComponent(value);
                });
            }

            if (params.access_token && params.refresh_token) {
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token,
                });

                if (sessionError) {
                    return { error: sessionError };
                }

                return { data: sessionData };
            }
        }
    }

    return { data };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
};
