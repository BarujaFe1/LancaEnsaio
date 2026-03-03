// Para que serve: Configurações com seção "Equipe" (mostra organização e permite entrar por código).
// Onde colar: substitua este arquivo no seu projeto em /src/screens/SettingsScreen.js

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getRawBackupData } from '../services/db';
import { exportJsonBackup } from '../utils/exporters';
import { useTheme } from '../theme/ThemeProvider';
import SelectModal from '../components/SelectModal';
import { getMyOrg, joinOrgByCode } from '../services/org';

const KEY_ALERT_DAYS = 'gem_alert_days';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const styles = makeStyles(theme);

  const { user, profile, signOut, refreshProfile, saveProfileName } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [alertDays, setAlertDays] = useState('21');
  const [loading, setLoading] = useState(false);

  const [orgInfo, setOrgInfo] = useState(null);
  const [orgCode, setOrgCode] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile?.full_name]);

  useEffect(() => {
    AsyncStorage.getItem(KEY_ALERT_DAYS).then(v => {
      if (v) setAlertDays(v);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const org = await getMyOrg();
        setOrgInfo(org);
      } catch {}
    })();
  }, [user?.id]);

  const onSaveProfile = async () => {
    try {
      setLoading(true);
      await saveProfileName(fullName.trim());
      await refreshProfile();
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const onSaveSettings = async () => {
    try {
      await AsyncStorage.setItem(KEY_ALERT_DAYS, String(alertDays || '21'));
      Alert.alert('Sucesso', 'Configurações salvas.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar configuração.');
    }
  };

  const onExportBackup = async () => {
    try {
      const data = await getRawBackupData();
      await exportJsonBackup(data, 'maestro-backup-manual.json');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar backup.');
    }
  };

  const onJoinOrg = async () => {
    try {
      if (!orgCode.trim()) return Alert.alert('Atenção', 'Informe o código da equipe.');
      await joinOrgByCode(orgCode.trim());
      const org = await getMyOrg();
      setOrgInfo(org);
      setOrgCode('');
      Alert.alert('Sucesso', 'Você entrou na equipe. Agora tudo é coletivo.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao entrar na equipe.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aparência</Text>
        <SelectModal
          label="Tema"
          value={mode}
          options={[
            { label: 'Sistema', value: 'system' },
            { label: 'Claro', value: 'light' },
            { label: 'Escuro', value: 'dark' }
          ]}
          onChange={(v) => setMode(v)}
          searchable={false}
          allowClear={false}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Equipe (uso coletivo)</Text>

        {orgInfo ? (
          <>
            <Text style={styles.info}>Organização: {orgInfo.name}</Text>
            <Text style={styles.info}>
              Código da equipe: <Text style={{ fontWeight: '900' }}>{orgInfo.join_code}</Text>
            </Text>
            <Text style={styles.info}>
              Todos os dados do app são compartilhados entre os membros desta organização.
            </Text>
          </>
        ) : (
          <Text style={styles.info}>Você ainda não entrou na equipe.</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Código (ex.: GEMVGS-2026)"
          placeholderTextColor={theme.colors.placeholder}
          value={orgCode}
          onChangeText={setOrgCode}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onJoinOrg}>
          <Text style={styles.primaryText}>Entrar na equipe</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>
        <Text style={styles.info}>E-mail: {user?.email || '(convidado)'} </Text>
        <Text style={styles.info}>Função: {profile?.role || 'instrutor'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome do instrutor"
          placeholderTextColor={theme.colors.placeholder}
          value={fullName}
          onChangeText={setFullName}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onSaveProfile} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Salvando...' : 'Salvar perfil'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alertas analíticos</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Dias sem registro para alerta (X)"
          placeholderTextColor={theme.colors.placeholder}
          value={alertDays}
          onChangeText={setAlertDays}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={onSaveSettings}>
          <Text style={styles.secondaryText}>Salvar alertas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backup / exportação</Text>
        <Text style={styles.info}>Backup manual JSON dos dados visíveis.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onExportBackup}>
          <Text style={styles.secondaryText}>Exportar backup JSON</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          Este aplicativo foi desenvolvido para o Grupo de Estudo Musical de Vargem Grande do Sul.
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 12 },
    card: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
    cardTitle: { fontWeight: '900', color: theme.colors.text, marginBottom: 8 },
    info: { color: theme.colors.textMuted, marginBottom: 6, fontSize: 13, fontWeight: '700' },
    input: { backgroundColor: theme.colors.inputBg, color: theme.colors.inputText, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, marginBottom: 10, fontWeight: '700' },
    primaryBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondaryBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },
    logoutBtn: { backgroundColor: theme.colors.danger, padding: 14, borderRadius: 12, alignItems: 'center' },
    logoutText: { color: '#fff', fontWeight: '900' },
    footerBox: { marginTop: 12, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12 },
    footerText: { color: theme.colors.textMuted, fontWeight: '800' }
  });
}
