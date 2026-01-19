import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signInWithEmail, signInWithGoogle } from '../../services/auth';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (user) {
            // Prevent redirect if we are in the Reset Password flow (Sign In screen might still be mounted in stack)
            const inResetFlow = segments[0] === 'auth' && (segments[1] === 'reset-password' || segments[1] === 'verify-reset-otp');

            if (!inResetFlow) {
                router.replace('/(tabs)');
            }
        }
    }, [user, segments]);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        setLoading(true);
        const { error } = await signInWithEmail(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);
        if (error) {
            Alert.alert('Error', error.message || 'Failed to sign in with Google');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                className="flex-1 bg-background"
            >
                <View className="flex-1 justify-center items-center px-6 py-8">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4 shadow-lg border-2 border-black">
                            <MaterialCommunityIcons name="paw" size={40} color="black" />
                        </View>
                        <Text className="text-4xl font-bold text-text mb-2">Welcome Back!</Text>
                        <Text className="text-text-secondary text-base">Sign in to continue your journey</Text>
                    </View>

                    {/* Form Container */}
                    <View className="w-full max-w-md">
                        {/* Email Input */}
                        <View className="mb-4">
                            <View className="flex-row items-center bg-white border-2 border-black h-14 px-4 shadow-sm">
                                <MaterialCommunityIcons name="email-outline" size={22} color="#666" />
                                <TextInput
                                    className="flex-1 ml-3 text-base font-medium text-text"
                                    placeholder="Email Address"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="mb-6">
                            <View className="flex-row items-center bg-white border-2 border-black h-14 px-4 shadow-sm">
                                <MaterialCommunityIcons name="lock-outline" size={22} color="#666" />
                                <TextInput
                                    className="flex-1 ml-3 text-base font-medium text-text"
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="ml-2"
                                >
                                    <MaterialCommunityIcons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>


                        {/* Forgot Password Link */}
                        <TouchableOpacity
                            className="self-end mb-6"
                            onPress={() => router.push('/auth/forgot-password')}
                        >
                            <Text className="text-text-secondary font-medium">Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            className="w-full h-14 bg-primary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none mb-6"
                            onPress={handleSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text className="text-black font-bold text-lg">Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-px bg-border" />
                            <Text className="mx-4 text-text-secondary text-sm font-medium">OR</Text>
                            <View className="flex-1 h-px bg-border" />
                        </View>

                        {/* Google Sign In Button */}
                        <TouchableOpacity
                            className="w-full h-14 bg-white items-center justify-center border-2 border-black shadow-md active:translate-y-1 active:shadow-none flex-row mb-8"
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
                            <Text className="text-black font-bold text-base ml-3">Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <TouchableOpacity
                            onPress={() => router.push('/auth/signup')}
                            className="items-center"
                        >
                            <Text className="text-text-secondary text-base">
                                Don't have an account?{' '}
                                <Text className="text-primary font-bold">Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
}
