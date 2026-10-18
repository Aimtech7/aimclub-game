package co.aimnex.aimfun;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public final class MainActivity extends Activity {
    private WebView web;
    private static final Uri ONLINE = Uri.parse(BuildConfig.WEB_ORIGIN);
    private static final String LOCAL = "appassets.androidplatform.net";
    private static final int MEDIA_REQUEST = 41, OPEN_FILE = 42, SAVE_FILE = 43;
    private PermissionRequest pendingMedia;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingDownload;

    private boolean trusted(Uri uri) {
        return uri != null && "https".equals(uri.getScheme()) && uri.getUserInfo() == null &&
            ((LOCAL.equals(uri.getHost()) && uri.getPort() == -1) ||
             (ONLINE.getHost().equals(uri.getHost()) && ONLINE.getPort() == uri.getPort()));
    }
    private boolean currentTrusted() { return web != null && trusted(Uri.parse(web.getUrl() == null ? "" : web.getUrl())); }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this); setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(true);
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
                if (trusted(uri)) {
                    if (LOCAL.equals(uri.getHost()) && uri.getPath() != null &&
                        (uri.getPath().startsWith("/online") || uri.getPath().startsWith("/downloads") || uri.getPath().startsWith("/diagnostics"))) {
                        view.loadUrl(BuildConfig.WEB_ORIGIN + uri.getEncodedPath() +
                            (uri.getEncodedQuery() == null ? "" : "?" + uri.getEncodedQuery()));
                        return true;
                    }
                    return false;
                }
                if ("https".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) {}
                }
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "AimfunAndroid",
                new java.util.HashSet<>(java.util.Arrays.asList("https://" + LOCAL, BuildConfig.WEB_ORIGIN)),
                (view, message, sourceOrigin, isMainFrame, replyProxy) -> {
                    String body = message.getData();
                    if (!isMainFrame || !trusted(sourceOrigin) || body == null || body.length() > 7 * 1024 * 1024) return;
                    try {
                        org.json.JSONObject payload = new org.json.JSONObject(body);
                        if ("save".equals(payload.optString("type"))) new Downloads().saveDataURL(payload.getString("data"), payload.optString("filename", "Aimfun-download"));
                    } catch (org.json.JSONException ignored) {}
                });
        }
        web.setDownloadListener((url, agent, disposition, mime, length) -> {
            if (!currentTrusted()) return;
            if (url.startsWith("blob:")) {
                if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) { new AlertDialog.Builder(MainActivity.this).setMessage("Update Android System WebView to save exported files.").setPositiveButton("OK", null).show(); return; }
                String quoted = org.json.JSONObject.quote(url);
                String name = org.json.JSONObject.quote(URLUtil.guessFileName(url, disposition, mime));
                web.evaluateJavascript("fetch("+quoted+").then(r=>r.blob()).then(b=>{const f=new FileReader();f.onload=()=>AimfunAndroid.postMessage(JSON.stringify({type:'save',data:f.result,filename:"+name+"}));f.readAsDataURL(b);})", null);
            } else if (url.startsWith("data:")) {
                new Downloads().saveDataURL(url, URLUtil.guessFileName(url, disposition, mime));
            } else if ("https".equals(Uri.parse(url).getScheme())) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (ActivityNotFoundException ignored) {}
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK", (d, w) -> result.confirm()).setOnCancelListener(d -> result.cancel()).show(); return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Yes", (d, w) -> result.confirm()).setNegativeButton("Cancel", (d, w) -> result.cancel()).setOnCancelListener(d -> result.cancel()).show(); return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (!trusted(request.getOrigin()) || pendingMedia != null) { request.deny(); return; }
                    List<String> missing = new ArrayList<>();
                    for (String resource : request.getResources()) {
                        String permission = PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) ? Manifest.permission.RECORD_AUDIO :
                            PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) ? Manifest.permission.CAMERA : null;
                        if (permission == null) { request.deny(); return; }
                        if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED && !missing.contains(permission)) missing.add(permission);
                    }
                    pendingMedia = request;
                    if (missing.isEmpty()) finishMediaRequest();
                    else requestPermissions(missing.toArray(new String[0]), MEDIA_REQUEST);
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) { if (pendingMedia == request) pendingMedia = null; }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!currentTrusted()) { callback.onReceiveValue(null); return true; }
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(intent, OPEN_FILE); }
                catch (ActivityNotFoundException e) { fileCallback.onReceiveValue(null); fileCallback = null; }
                return true;
            }
        });
        if (state != null) web.restoreState(state); else web.loadUrl("https://" + LOCAL + "/index.html");
    }
    private void finishMediaRequest() {
        PermissionRequest request = pendingMedia; pendingMedia = null;
        if (request == null) return;
        if (!currentTrusted() || !trusted(request.getOrigin())) { request.deny(); return; }
        List<String> granted = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) granted.add(resource);
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) granted.add(resource);
        }
        if (granted.isEmpty()) request.deny(); else request.grant(granted.toArray(new String[0]));
    }
    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results); if (requestCode == MEDIA_REQUEST) finishMediaRequest();
    }
    public final class Downloads {
        public void saveDataURL(String data, String filename) {
            // The picker makes every file save explicit; no arbitrary filesystem path is accepted.
            if (data == null || data.length() > 7 * 1024 * 1024 || !data.startsWith("data:")) return;
            int comma = data.indexOf(','); if (comma < 5 || !data.substring(0, comma).endsWith(";base64")) return;
            String mime = data.substring(5, comma - 7);
            if (!mime.matches("application/(json|octet-stream|zip)|text/(calendar|plain)|image/png")) return;
            final byte[] bytes;
            try { bytes = Base64.decode(data.substring(comma + 1), Base64.DEFAULT); } catch (IllegalArgumentException e) { return; }
            if (bytes.length > 5 * 1024 * 1024) return;
            String safeName = filename == null ? "Aimfun-backup.json" : filename.replaceAll("[^A-Za-z0-9._-]", "_");
            if (safeName.isEmpty()) safeName = "Aimfun-download";
            final String name = safeName.length() > 100 ? safeName.substring(0, 100) : safeName;
            runOnUiThread(() -> {
                if (!currentTrusted() || pendingDownload != null) return;
                pendingDownload = bytes;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(intent, SAVE_FILE); } catch (ActivityNotFoundException e) { pendingDownload = null; }
            });
        }
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OPEN_FILE && fileCallback != null) {
            ValueCallback<Uri[]> callback = fileCallback; fileCallback = null;
            List<Uri> uris = new ArrayList<>();
            if (currentTrusted() && resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) for (int i=0;i<data.getClipData().getItemCount();i++) uris.add(data.getClipData().getItemAt(i).getUri());
                else if (data.getData() != null) uris.add(data.getData());
            }
            uris.removeIf(uri -> !"content".equals(uri.getScheme()));
            callback.onReceiveValue(uris.isEmpty() ? null : uris.toArray(new Uri[0]));
        }
        if (requestCode == SAVE_FILE) {
            byte[] bytes = pendingDownload; pendingDownload = null;
            if (bytes != null && resultCode == RESULT_OK && data != null && data.getData() != null && "content".equals(data.getData().getScheme())) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) { if (out != null) out.write(bytes); }
                catch (Exception e) { new AlertDialog.Builder(this).setMessage("Could not save this file. Try again.").setPositiveButton("OK", null).show(); }
            }
        }
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("Exit this game? Saved progress stays. Unsent answers or drawings may be lost.")
            .setPositiveButton("Game library", (d, w) -> web.loadUrl("https://" + LOCAL + "/index.html"))
            .setNeutralButton("Close app", (d, w) -> finish()).setNegativeButton("Keep playing", null).show();
    }
    @Override protected void onPause() { web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null); web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onSaveInstanceState(Bundle outState) { web.saveState(outState); super.onSaveInstanceState(outState); }
    @Override protected void onDestroy() { if (pendingMedia != null) pendingMedia.deny(); if (fileCallback != null) fileCallback.onReceiveValue(null); pendingDownload = null; if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) WebViewCompat.removeWebMessageListener(web, "AimfunAndroid"); web.destroy(); super.onDestroy(); }
}
