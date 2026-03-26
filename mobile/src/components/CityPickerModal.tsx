import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { filterCityGroups } from '../constants/cidades';
import { theme } from '../theme';

type Row =
  | { type: 'group'; key: string; title: string }
  | { type: 'city'; key: string; label: string };

export function CityPickerModal({
  visible,
  value,
  onClose,
  onSelect
}: {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (city: string) => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    setSearch('');
  }, [visible]);

  const rows = useMemo<Row[]>(() => {
    const groups = filterCityGroups(search);
    const out: Row[] = [];
    groups.forEach((g, gi) => {
      out.push({ type: 'group', key: `g-${gi}-${g.title}`, title: g.title });
      g.items.forEach((city, ci) => out.push({ type: 'city', key: `c-${gi}-${ci}-${city}`, label: city }));
    });
    return out;
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar cidade</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            ref={inputRef}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cidade ou bairro"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />

          <FlatList
            data={rows}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={25}
            maxToRenderPerBatch={30}
            windowSize={10}
            renderItem={({ item }) => {
              if (item.type === 'group') {
                return (
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupHeaderText}>{item.title}</Text>
                  </View>
                );
              }

              const selected = value === item.label;
              return (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.label);
                    onClose();
                  }}
                  style={[styles.cityRow, selected && styles.cityRowSelected]}
                >
                  <Text style={[styles.cityText, selected && styles.cityTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Nenhuma cidade encontrada.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.35)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '86%',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft
  },
  closeBtnText: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: theme.colors.text,
    marginBottom: 10
  },
  groupHeader: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 4
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted
  },
  cityRow: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    borderRadius: 10
  },
  cityRowSelected: {
    backgroundColor: '#EEF0F5'
  },
  cityText: {
    color: theme.colors.text,
    fontSize: 14
  },
  cityTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700'
  },
  emptyWrap: {
    padding: 18,
    alignItems: 'center'
  },
  emptyText: {
    color: theme.colors.textMuted
  }
});
