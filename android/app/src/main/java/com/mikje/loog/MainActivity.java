package com.mikje.loog;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Draw behind the status and navigation bars, like the design. The web app handles the insets.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
