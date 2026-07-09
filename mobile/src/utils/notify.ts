// mobile/src/utils/notify.ts
import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * Alert cross-platform: usa window.alert/confirm no web
 * (Alert.alert do RN Web não renderiza dialog nativo de forma confiável).
 */
export function notify(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const body = message ? `${title}\n\n${message}` : title;

    if (buttons && buttons.length > 1) {
      const cancel = buttons.find((b) => b.style === 'cancel');
      const action =
        buttons.find((b) => b.style === 'destructive') ||
        buttons.find((b) => b !== cancel) ||
        buttons[buttons.length - 1];

      if (window.confirm(body)) {
        action?.onPress?.();
      } else {
        cancel?.onPress?.();
      }
      return;
    }

    window.alert(body);
    buttons?.[0]?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
}
