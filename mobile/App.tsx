import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { ChargingStartScreen } from './src/screens/ChargingStartScreen';
import { ChargingActiveStackScreen } from './src/screens/ChargingActiveStackScreen';
import { ChargingSummaryScreen } from './src/screens/ChargingSummaryScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <LanguageProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="QR" component={QRScannerScreen} />
            <Stack.Screen name="ChargingStart" component={ChargingStartScreen} />
            <Stack.Screen
              name="ChargingActive"
              component={ChargingActiveStackScreen}
            />
            <Stack.Screen
              name="ChargingSummary"
              component={ChargingSummaryScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
