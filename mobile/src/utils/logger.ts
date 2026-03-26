export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) console.log('[debug]', ...args);
  },
  error: (...args: any[]) => {
    console.log('[error]', ...args);
  }
};
