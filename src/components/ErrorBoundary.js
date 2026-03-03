import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { logError } from '../utils/logger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Erro inesperado' };
  }

  componentDidCatch(error, info) {
    logError('Render ErrorBoundary', error, { componentStack: info?.componentStack || null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>O app encontrou um erro</Text>
        <Text style={{ color: '#374151', marginBottom: 14 }}>{this.state.message}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center' }}
          onPress={() => this.setState({ hasError: false, message: '' })}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Tentar continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
