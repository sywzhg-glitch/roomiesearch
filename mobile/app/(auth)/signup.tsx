import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { useState } from "react";
import { authApi } from "@shared/api/auth";
import { useAuthStore } from "@mobile/store/auth";

export default function SignupScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await authApi.register(name.trim(), email.trim().toLowerCase(), password);
      // Auto-login after registration
      const { token, user } = await authApi.login(email.trim().toLowerCase(), password);
      await setAuth(token, user);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Registration failed. Please try again.";
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">R</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Create account</Text>
            <Text className="text-gray-500 mt-1">Start finding your perfect place</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Full name</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base bg-gray-50"
                placeholder="Alice Chen"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                placeholder="Min. 8 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-brand-600 rounded-xl py-4 items-center mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text className="text-brand-600 font-semibold">Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
