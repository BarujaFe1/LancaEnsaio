import React, { useMemo, useState } from 'react';
import {
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function SelectModal({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecionar',
  searchable = true,
  allowClear = true
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = useMemo(() => {
    const found = options?.find((o) => o.value === value);
    return found?.label || '';
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!searchable) return options || [];
    const q = search.trim().toLowerCase();
    if (!q) return options || [];
    return (options || []).filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, search, searchable]);

  return (
    <View style={{ marginBottom: 10 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={styles.field}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
      >
        <Text style={[styles.fieldText, !selectedLabel && { color: theme.colors.placeholder }]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || 'Selecionar'}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.close}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {searchable && (
            <TextInput
              style={styles.search}
              placeholder="Buscar..."
              placeholderTextColor={theme.colors.placeholder}
              value={search}
              onChangeText={setSearch}
            />
          )}

          {allowClear && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <Text style={styles.clearText}>Limpar seleção</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <TouchableOpacity
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    label: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },

    field: {
      backgroundColor: theme.colors.inputBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    fieldText: { fontWeight: '800', color: theme.colors.inputText },
    chev: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '900' },

    modalWrap: { flex: 1, backgroundColor: theme.colors.bg },
    modalHeader: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    close: { color: theme.colors.accent, fontWeight: '900' },

    search: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      marginHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12
    },

    clearBtn: {
      marginHorizontal: 12,
      marginTop: 10,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center'
    },
    clearText: { color: theme.colors.text, fontWeight: '900' },

    item: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10
    },
    itemActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.chipBg
    },
    itemText: { color: theme.colors.text, fontWeight: '800' },
    itemTextActive: { color: theme.colors.accent, fontWeight: '900' }
  });
}
