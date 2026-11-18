package com.mikje.loog;

import android.graphics.Color;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Small native helpers for the web app. */
@CapacitorPlugin(name = "LoogNative")
public class LoogNativePlugin extends Plugin {
    /** Colours the window behind the system bars so the status and navigation bars match the in-app theme. */
    @PluginMethod
    public void setWindowColor(PluginCall call) {
        String color = call.getString("color");
        if (color == null) {
            call.reject("color is required");
            return;
        }
        final int c;
        try {
            c = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            call.reject("not a colour: " + color);
            return;
        }
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(c);
            call.resolve();
        });
    }

    /** The system bar sizes in CSS pixels, so the web app can lay out correctly on older WebViews. */
    @PluginMethod
    public void getInsets(PluginCall call) {
        View decor = getActivity().getWindow().getDecorView();
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
        Insets bars = insets == null
            ? Insets.NONE
            : insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
        float density = getActivity().getResources().getDisplayMetrics().density;
        JSObject result = new JSObject();
        result.put("top", bars.top / density);
        result.put("bottom", bars.bottom / density);
        call.resolve(result);
    }
}
