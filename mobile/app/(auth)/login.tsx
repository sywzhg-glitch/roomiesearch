import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import { authApi } from "@shared/api/auth";
import { useAuthStore } from "@mobile/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email.trim().toLowerCase(), password);
      await setAuth(token, user);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Login failed. Check your credentials.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">R</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">Welcome back</Text>
          <Text className="text-gray-500 mt-1">Sign in to RoomieSearch</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base bg-gray-50"
              placeholder="alice@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base bg-gray-50"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-brand-600 rounded-xl py-4 items-center mt-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">Don&apos;t have an account? </Text>
          <Link href="/(auth)/signup">
            <Text className="text-brand-600 font-semibold">Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
