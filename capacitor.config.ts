import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mikje.loog',
  appName: 'Loog',
  webDir: 'dist',
  backgroundColor: '#0f0a0c',
  android: {
    backgroundColor: '#0f0a0c',
  },
  plugins: {
    // Draws behind the system bars (edge to edge) like the design, and exposes --safe-area-inset-* too.
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
    },
  },
};

export default config;
