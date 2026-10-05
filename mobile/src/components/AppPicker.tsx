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
      box-sizing: border-box !important;
      color: #FFFFFF !important;
      background-color: #0F1115 !important;
      border: none !important;
      outline: none !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      padding: 0 38px 0 14px !important;
      height: 50px !important;
      width: 100% !important;
      max-width: 100% !important;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2334C759' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 18px;
      cursor: pointer;
    }
    select option {
      color: #FFFFFF !important;
      background-color: #1A1D25 !important;
      padding: 8px 12px !important;
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
