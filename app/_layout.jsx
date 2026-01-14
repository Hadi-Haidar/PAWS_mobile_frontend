
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';

export const unstable_settings = {
    anchor: '(tabs)',
};

const RootLayoutContent = () => {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const colorScheme = useColorScheme();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/auth/signin');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to home if already authenticated
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF6F00" />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
                <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                <Stack.Screen name="add-animal" options={{ headerShown: false }} />
                <Stack.Screen name="pet/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="favorites" options={{ headerShown: false }} />
                <Stack.Screen name="donations" options={{ headerShown: false }} />
                <Stack.Screen name="edit-pet/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="auth/verify-otp" options={{ headerShown: false }} />
                <Stack.Screen name="qr-scanner" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
};

import { StripeProvider } from '@stripe/stripe-react-native';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
                <FavoritesProvider>
                    <CartProvider>
                        <RootLayoutContent />
                    </CartProvider>
                </FavoritesProvider>
            </StripeProvider>
        </AuthProvider>
    );
}
