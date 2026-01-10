import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signInWithGoogle, signUpWithEmail } from '../../services/auth';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            router.replace('/(tabs)');
        }
    }, [user]);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        const { data, error } = await signUpWithEmail(email, password, name);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else if (data?.session) {
            // User auto-logged in (Email confirmation disabled or implicit flow)
            router.replace('/(tabs)');
        } else {
            // User needs to verify email
            Alert.alert(
                'Success',
                'Account created! Please check your email for a verification code.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`),
                    },
                ]
            );
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
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 bg-secondary rounded-full items-center justify-center mb-4 shadow-lg border-2 border-black">
                            <MaterialCommunityIcons name="paw" size={40} color="black" />
                        </View>
                        <Text className="text-4xl font-bold text-text mb-2">Join PAWS</Text>
                        <Text className="text-text-secondary text-base">Create your account to get started</Text>
                    </View>

                    {/* Form Container */}
                    <View className="w-full max-w-md">
                        {/* Name Input */}
                        <View className="mb-4">
                            <View className="flex-row items-center bg-white border-2 border-black h-14 px-4 shadow-sm">
                                <MaterialCommunityIcons name="account-outline" size={22} color="#666" />
                                <TextInput
                                    className="flex-1 ml-3 text-base font-medium text-text"
                                    placeholder="Full Name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>
                        </View>

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
                                    placeholder="Password (min 6 characters)"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password-new"
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

                        {/* Create Account Button */}
                        <TouchableOpacity
                            className="w-full h-14 bg-secondary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none mb-6"
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text className="text-black font-bold text-lg">Create Account</Text>
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
                            <MaterialCommunityIcons name="google" size={24} color="#93C47D" />
                            <Text className="text-black font-bold text-base ml-3">Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <TouchableOpacity
                            onPress={() => router.push('/auth/signin')}
                            className="items-center"
                        >
                            <Text className="text-text-secondary text-base">
                                Already have an account?{' '}
                                <Text className="text-secondary font-bold">Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
