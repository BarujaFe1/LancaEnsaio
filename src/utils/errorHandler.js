import { logError, logWarn } from './logger';

export function installGlobalErrorHandlers() {
  try {
    const ErrorUtilsRef = global?.ErrorUtils;
    if (ErrorUtilsRef?.getGlobalHandler && ErrorUtilsRef?.setGlobalHandler) {
      const defaultHandler = ErrorUtilsRef.getGlobalHandler();
      ErrorUtilsRef.setGlobalHandler((error, isFatal) => {
        logError('JS Fatal Error', error, { isFatal: !!isFatal });
        if (defaultHandler) defaultHandler(error, isFatal);
      });
    } else {
      logWarn('ErrorUtils não disponível: handler global pode não capturar tudo.');
    }
  } catch (e) {
    // não deixa quebrar
  }
}
