import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsScreen from '../screens/StudentsScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MethodsScreen from '../screens/MethodsScreen';
import TeachersScreen from '../screens/TeachersScreen';
import LessonLaunchesScreen from '../screens/LessonLaunchesScreen';
import LogsScreen from '../screens/LogsScreen';

import DrawerMenuButton from '../components/DrawerMenuButton';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function StudentsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        headerLeft: () => <DrawerMenuButton navigation={navigation} color={theme.colors.text} />
      })}
    >
      <Stack.Screen name="StudentsList" component={StudentsScreen} options={{ title: 'Alunos' }} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} options={{ title: 'Aluno' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        sceneContainerStyle: { backgroundColor: theme.colors.bg },
        drawerStyle: { backgroundColor: theme.colors.card },
        drawerActiveTintColor: theme.colors.accent,
        drawerInactiveTintColor: theme.colors.textMuted
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Alunos" component={StudentsStack} options={{ headerShown: false }} />
      <Drawer.Screen name="Lançamentos" component={LessonLaunchesScreen} />
      <Drawer.Screen name="Métodos" component={MethodsScreen} />
      <Drawer.Screen name="Professores" component={TeachersScreen} />
      <Drawer.Screen name="Relatórios" component={ReportsScreen} />
      <Drawer.Screen name="Configurações" component={SettingsScreen} />
      <Drawer.Screen name="Logs" component={LogsScreen} />
    </Drawer.Navigator>
  );
}
