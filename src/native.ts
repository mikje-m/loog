// Android app only. On the web these helpers do nothing.
import { Capacitor, registerPlugin } from '@capacitor/core';

/** Native helpers (see LoogNativePlugin.java). */
export const LoogNative = registerPlugin<{
  setWindowColor(o: { color: string }): Promise<void>;
  getInsets(): Promise<{ top: number; bottom: number }>;
}>('LoogNative');

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Older Android WebViews (before version 140) are padded below the status bar by Android itself and report
 * env(safe-area-inset-*) as 0. The header then needs less top padding, or it sits too low.
 */
export async function detectPaddedWebView() {
  if (!isNative()) return;
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top)';
    document.body.appendChild(probe);
    const env = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    const { top } = await LoogNative.getInsets();
    if (env === 0 && top > 0) {
      document.documentElement.style.setProperty('--legacy-top', `${top}px`);
      document.documentElement.classList.add('webview-padded');
    }
  } catch {
    /* keep the default layout */
  }
}
