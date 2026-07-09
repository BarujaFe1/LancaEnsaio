// mobile/src/components/AppPicker.tsx
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Option = {
  label: string;
  value: string;
};

type AppPickerProps = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: Option[];
  containerStyle?: StyleProp<ViewStyle>;
};

const WEB_PICKER_STYLE_ID = 'lancaensaio-web-picker-theme';

function ensureWebPickerTheme() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(WEB_PICKER_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = WEB_PICKER_STYLE_ID;
  style.textContent = `
    select {
      color: #FFFFFF !important;
      background-color: #0F1115 !important;
      border: none !important;
      outline: none !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      padding: 0 12px !important;
      height: 50px !important;
      width: 100% !important;
      appearance: none;
      -webkit-appearance: none;
    }
    select option {
      color: #FFFFFF !important;
      background-color: #0F1115 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Picker com tema dark consistente no web (select HTML) e no nativo.
 */
export function AppPicker({
  selectedValue,
  onValueChange,
  options,
  containerStyle,
}: AppPickerProps) {
  useEffect(() => {
    ensureWebPickerTheme();
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(value) => onValueChange(String(value))}
        style={styles.picker}
        dropdownIconColor="#34C759"
        mode="dropdown"
      >
        {options.map((opt) => (
          <Picker.Item
            key={`${opt.value}::${opt.label}`}
            label={opt.label}
            value={opt.value}
            color="#FFFFFF"
            style={styles.item}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F1115',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: '#0F1115',
    height: 50,
    width: '100%',
  },
  item: {
    color: '#FFFFFF',
    backgroundColor: '#0F1115',
    fontSize: 15,
  },
});
