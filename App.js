import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { installGlobalErrorHandlers } from './src/utils/errorHandler';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

function ThemedNav() {
  const { theme } = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.card,
      border: theme.colors.border,
      text: theme.colors.text,
      primary: theme.colors.accent
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    TextInput.defaultProps = TextInput.defaultProps || {};
    if (!TextInput.defaultProps.placeholderTextColor) {
      TextInput.defaultProps.placeholderTextColor = '#6b7280';
    }
    installGlobalErrorHandlers();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <ThemedNav />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
