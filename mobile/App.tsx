import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet as RNStyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { ChargingStartScreen } from './src/screens/ChargingStartScreen';
import { ChargingActiveStackScreen } from './src/screens/ChargingActiveStackScreen';
import { ChargingSummaryScreen } from './src/screens/ChargingSummaryScreen';
import { UsageScreen } from './src/screens/UsageScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={loadingStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'auth' : 'guest'}
      initialRouteName={isAuthenticated ? 'QR' : 'Login'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="QR" component={QRScannerScreen} />
      <Stack.Screen name="ChargingStart" component={ChargingStartScreen} />
      <Stack.Screen name="ChargingActive" component={ChargingActiveStackScreen} />
      <Stack.Screen name="ChargingSummary" component={ChargingSummaryScreen} />
      <Stack.Screen name="Usage" component={UsageScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const loadingStyles = RNStyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: { color: '#9ca3af', marginTop: 16 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
});
