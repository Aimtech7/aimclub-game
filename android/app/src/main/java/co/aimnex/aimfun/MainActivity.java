package co.aimnex.aimfun;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public final class MainActivity extends Activity {
    private WebView web;
    private static final String HOST = "truth-dare-social.aimventures.chatgpt.site";
    private static final String LOCAL = "appassets.androidplatform.net";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (LOCAL.equals(uri.getHost())) {
                    String path = uri.getPath();
                    if (path == null || path.endsWith("/")) uri = uri.buildUpon().path((path == null ? "/" : path) + "index.html").build();
                    return loader.shouldInterceptRequest(uri);
                }
                return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if ("https".equals(uri.getScheme()) && LOCAL.equals(host)) {
                    if (uri.getPath() != null && (uri.getPath().startsWith("/online") || uri.getPath().startsWith("/downloads"))) {
                        view.loadUrl("https://" + HOST + uri.getEncodedPath() + (uri.getEncodedQuery() == null ? "" : "?" + uri.getEncodedQuery()));
                        return true;
                    }
                    return false;
                }
                if ("https".equals(uri.getScheme()) && HOST.equals(host)) return false;
                if ("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) {}
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK", (d, w) -> result.confirm()).setOnCancelListener(d -> result.cancel()).show();
                return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Yes", (d, w) -> result.confirm()).setNegativeButton("Cancel", (d, w) -> result.cancel()).setOnCancelListener(d -> result.cancel()).show();
                return true;
            }
        });
        if (state != null) web.restoreState(state);
        else web.loadUrl("https://" + LOCAL + "/index.html");
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("Exit this game? Saved progress stays. Unsent answers or drawings may be lost.")
            .setPositiveButton("Game library", (d, w) -> web.loadUrl("https://" + LOCAL + "/index.html"))
            .setNeutralButton("Close app", (d, w) -> finish()).setNegativeButton("Keep playing", null).show();
    }
    @Override protected void onSaveInstanceState(Bundle outState) { web.saveState(outState); super.onSaveInstanceState(outState); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }
}
