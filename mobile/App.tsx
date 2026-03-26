// mobile/App.tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { api } from './src/api';

export default function App() {
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarCerebro() {
      try {
        console.log('⏳ Buscando dados do Backend...');
        // Chama a rota /config que criamos no Node.js
        const resposta = await api.get('/config'); 
        
        setCidades(resposta.data.cidades);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível conectar ao servidor. Verifique o IP!');
        setLoading(false);
      }
    }

    carregarCerebro();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🎻 App Orquestra</Text>

      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

      {!loading && !erro && (
        <View style={styles.card}>
          <Text style={styles.subtitulo}>✅ Conectado à Planilha!</Text>
          <Text>Cidades carregadas: {cidades.length}</Text>
          <ScrollView style={styles.lista}>
            {cidades.slice(0, 10).map((cidade, index) => (
              <Text key={index} style={styles.item}>📍 {cidade}</Text>
            ))}
            <Text style={styles.item}>...</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E' },
  subtitulo: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#34C759' },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, width: '85%', maxHeight: 400, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  lista: { marginTop: 15 },
  item: { fontSize: 16, color: '#3A3A3C', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  erro: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold', textAlign: 'center', padding: 20 }
});