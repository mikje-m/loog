package com.mikje.loog;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins must be registered before super.onCreate, or the page cannot see them.
        registerPlugin(LoogNativePlugin.class);
        // Must come before EdgeToEdge: BridgeActivity applies the app theme here. Touching the window earlier
        // builds it with the wrong theme and brings back an action bar.
        super.onCreate(savedInstanceState);
        // Draw behind the status and navigation bars, like the design, with no scrim on top.
        // The web app handles the insets and picks the icon colours (SystemBars plugin).
        SystemBarStyle clear = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT);
        EdgeToEdge.enable(this, clear, clear);
    }
}
