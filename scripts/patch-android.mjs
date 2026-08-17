import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
const appMain = path.join(androidRoot, 'app', 'src', 'main');
const resRoot = path.join(appMain, 'res');
const gradlePath = path.join(androidRoot, 'app', 'build.gradle');
const manifestPath = path.join(appMain, 'AndroidManifest.xml');
const brandingRoot = path.join(root, 'android-branding');

const packageName = 'com.tarhimsaz.app';
const versionCode = '2';
const versionName = '1.0.1';
const iconName = 'tarhimsaz_launcher';
const roundIconName = 'tarhimsaz_launcher_round';
const splashLogoName = 'tarhimsaz_splash_logo';
const splashPlaceholderName = 'tarhimsaz_splash_placeholder';
const splashBackgroundName = 'tarhimsaz_splash_background';
const splashDurationMs = 1000;
const splashFadeDurationMs = 180;
const appUserAgentToken = 'TarhimSazApp/1.0.1';

function requireFile(filePath, message) {
  if (!fs.existsSync(filePath)) throw new Error(message);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function setXmlAttribute(tag, attribute, value) {
  const expression = new RegExp(`${attribute}="[^"]*"`);
  if (expression.test(tag)) return tag.replace(expression, `${attribute}="${value}"`);
  return tag.replace(/^<\w+/, (opening) => `${opening}\n        ${attribute}="${value}"`);
}

function removeStyleByName(xml, styleName) {
  const escaped = styleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return xml.replace(
    new RegExp(`\\s*<style\\s+name=["']${escaped}["'][^>]*(?:\\/>|>[\\s\\S]*?<\\/style>)`, 'g'),
    '',
  );
}

function appendBeforeResourcesEnd(xml, block) {
  if (!/<\/resources>/.test(xml)) throw new Error('فایل resource فاقد تگ پایانی resources است.');
  return xml.replace(/<\/resources>/, `${block}\n</resources>`);
}

function copyLauncherIcons() {
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const folder = `mipmap-${density}`;
    const sourceDir = path.join(brandingRoot, folder);
    const targetDir = path.join(resRoot, folder);
    fs.mkdirSync(targetDir, { recursive: true });

    for (const fileName of [`${iconName}.png`, `${roundIconName}.png`]) {
      const source = path.join(sourceDir, fileName);
      const target = path.join(targetDir, fileName);
      requireFile(source, `فایل آیکون آماده پیدا نشد: android-branding/${folder}/${fileName}`);
      fs.copyFileSync(source, target);
    }
  }

  // هیچ adaptive icon هم‌نامی نباید bitmap تأییدشده را override کند.
  for (const qualifier of ['mipmap-anydpi-v26', 'mipmap-anydpi-v33']) {
    for (const fileName of [`${iconName}.xml`, `${roundIconName}.xml`]) {
      fs.rmSync(path.join(resRoot, qualifier, fileName), { force: true });
    }
  }
}

function copySplashLogo() {
  const source = path.join(brandingRoot, 'drawable-nodpi', `${splashLogoName}.png`);
  const target = path.join(resRoot, 'drawable-nodpi', `${splashLogoName}.png`);
  requireFile(source, `فایل Splash پیدا نشد: android-branding/drawable-nodpi/${splashLogoName}.png`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function writeTransparentSystemSplashIcon() {
  writeFile(
    path.join(resRoot, 'drawable', `${splashPlaceholderName}.xml`),
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="1dp"
    android:height="1dp"
    android:viewportWidth="1"
    android:viewportHeight="1">
    <path
        android:fillColor="#00000000"
        android:pathData="M0,0h1v1h-1z" />
</vector>
`,
  );
}

function configureColors() {
  const colorsPath = path.join(resRoot, 'values', 'colors.xml');
  let colors = fs.existsSync(colorsPath)
    ? fs.readFileSync(colorsPath, 'utf8')
    : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';

  colors = colors.replace(
    new RegExp(`\\s*<color\\s+name=["']${splashBackgroundName}["'][^>]*>[\\s\\S]*?<\\/color>`, 'g'),
    '',
  );
  colors = appendBeforeResourcesEnd(
    colors,
    `    <color name="${splashBackgroundName}">#FFFFFF</color>`,
  );
  writeFile(colorsPath, colors);
}

function configureLaunchThemes() {
  // نسخه‌های قبلی این تم را در qualifierهای مختلف اضافه می‌کردند؛ ابتدا همه پاک می‌شوند.
  if (fs.existsSync(resRoot)) {
    for (const entry of fs.readdirSync(resRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('values')) continue;
      const stylesPath = path.join(resRoot, entry.name, 'styles.xml');
      if (!fs.existsSync(stylesPath)) continue;
      const cleaned = removeStyleByName(
        fs.readFileSync(stylesPath, 'utf8'),
        'AppTheme.NoActionBarLaunch',
      );
      fs.writeFileSync(stylesPath, cleaned);
    }
  }

  const baseStylesPath = path.join(resRoot, 'values', 'styles.xml');
  requireFile(baseStylesPath, 'android/app/src/main/res/values/styles.xml پیدا نشد.');
  let baseStyles = fs.readFileSync(baseStylesPath, 'utf8');
  baseStyles = appendBeforeResourcesEnd(
    baseStyles,
    `
    <!-- پنجره سفید تا پیش از آماده‌شدن Activity؛ لوگوی کامل را MainActivity نشان می‌دهد. -->
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:windowBackground">@color/${splashBackgroundName}</item>
        <item name="android:windowDisablePreview">false</item>
    </style>`,
  );
  fs.writeFileSync(baseStylesPath, baseStyles);

  // Android 12+ همیشه Splash سیستمی دارد. آیکون آن شفاف می‌شود تا ماسک گرد دیده نشود.
  const v31StylesPath = path.join(resRoot, 'values-v31', 'styles.xml');
  let v31Styles = fs.existsSync(v31StylesPath)
    ? fs.readFileSync(v31StylesPath, 'utf8')
    : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';
  v31Styles = removeStyleByName(v31Styles, 'AppTheme.NoActionBarLaunch');
  v31Styles = appendBeforeResourcesEnd(
    v31Styles,
    `
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:windowBackground">@color/${splashBackgroundName}</item>
        <item name="android:windowSplashScreenBackground">@color/${splashBackgroundName}</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/${splashPlaceholderName}</item>
        <item name="android:windowSplashScreenAnimationDuration">0</item>
    </style>`,
  );
  writeFile(v31StylesPath, v31Styles);
}

function configureGradle() {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`)
    // نسخه قبلی از AndroidX SplashScreen استفاده می‌کرد؛ دیگر لازم نیست.
    .replace(/^\s*implementation\s+["']androidx\.core:core-splashscreen:[^"']+["']\s*$/gm, '');
  fs.writeFileSync(gradlePath, gradle);
}

function writeMainActivity() {
  const javaDir = path.join(appMain, 'java', ...packageName.split('.'));
  const mainActivityPath = path.join(javaDir, 'MainActivity.java');
  fs.mkdirSync(javaDir, { recursive: true });

  const source = `package ${packageName};

import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String LOCAL_HOME = "https://localhost/";
    private static final String APP_USER_AGENT_TOKEN = "${appUserAgentToken}";
    private static final long BRANDED_SPLASH_DURATION_MS = ${splashDurationMs}L;
    private static final long BRANDED_SPLASH_FADE_MS = ${splashFadeDurationMs}L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureSystemBars();
        configureSafeContentInsets();
        configureAppUserAgent();
        registerBackHandler();

        // فقط در ایجاد تازه Activity نمایش داده می‌شود؛ Back داخل WebView آن را دوباره اجرا نمی‌کند.
        if (savedInstanceState == null) {
            showBrandedLaunchOverlay();
        }
    }

    private void configureSystemBars() {
        // Android 15+ نمایش edge-to-edge را اجباری می‌کند. رفتار پنجره را در همه
        // نسخه‌ها یکسان می‌کنیم و فضای امن را جداگانه به WebView می‌دهیم.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        );
    }

    private void configureSafeContentInsets() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        View content = findViewById(android.R.id.content);
        if (webView == null || content == null) return;

        ViewGroup.LayoutParams rawParams = webView.getLayoutParams();
        if (!(rawParams instanceof ViewGroup.MarginLayoutParams)) return;

        ViewGroup.MarginLayoutParams initialParams =
            (ViewGroup.MarginLayoutParams) rawParams;
        final int initialLeft = initialParams.leftMargin;
        final int initialTop = initialParams.topMargin;
        final int initialRight = initialParams.rightMargin;
        final int initialBottom = initialParams.bottomMargin;

        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets safeInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
            );

            ViewGroup.MarginLayoutParams params =
                (ViewGroup.MarginLayoutParams) webView.getLayoutParams();
            params.leftMargin = initialLeft + safeInsets.left;
            params.topMargin = initialTop + safeInsets.top;
            params.rightMargin = initialRight + safeInsets.right;
            params.bottomMargin = initialBottom + safeInsets.bottom;
            webView.setLayoutParams(params);

            // فضای امن کاملاً روی قاب WebView اعمال شده است؛ مصرف Insets مانع
            // دوباره‌اعمال‌شدن آن داخل CSS صفحه و ایجاد فاصله دوبرابر می‌شود.
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
    }

    private void configureAppUserAgent() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;

        String currentUserAgent = webView.getSettings().getUserAgentString();
        if (currentUserAgent == null) currentUserAgent = "";

        // capacitor.config.json نیز همین شناسه را اضافه می‌کند؛ این بخش فقط یک محافظ بومی است.
        if (!currentUserAgent.contains("TarhimSazApp/")) {
            String separator = currentUserAgent.trim().isEmpty() ? "" : " ";
            webView.getSettings().setUserAgentString(
                currentUserAgent.trim() + separator + APP_USER_AGENT_TOKEN
            );
        }
    }

    private void showBrandedLaunchOverlay() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;

        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.WHITE);
        overlay.setClickable(true);
        overlay.setFocusable(true);
        overlay.setImportantForAccessibility(
            View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        );

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.${splashLogoName});
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        logo.setAdjustViewBounds(true);

        int shortestSide = Math.min(
            getResources().getDisplayMetrics().widthPixels,
            getResources().getDisplayMetrics().heightPixels
        );
        int preferredSize = Math.round(shortestSide * 0.82f);
        int logoSize = Math.min(preferredSize, dpToPx(500));

        FrameLayout.LayoutParams logoParams = new FrameLayout.LayoutParams(
            logoSize,
            logoSize,
            Gravity.CENTER
        );
        overlay.addView(logo, logoParams);

        content.addView(
            overlay,
            new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        overlay.postDelayed(() -> {
            if (overlay.getParent() == null) return;
            overlay.animate()
                .alpha(0f)
                .setDuration(BRANDED_SPLASH_FADE_MS)
                .withEndAction(() -> {
                    ViewGroup parent = (ViewGroup) overlay.getParent();
                    if (parent != null) parent.removeView(overlay);
                })
                .start();
        }, BRANDED_SPLASH_DURATION_MS);
    }

    private void registerBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                String currentUrl = webView != null ? webView.getUrl() : null;

                // در هر ابزار یا صفحه سایت، Back به خانه محلی اپ برمی‌گردد.
                if (webView != null && !isLocalHomeUrl(currentUrl)) {
                    webView.stopLoading();
                    webView.loadUrl(LOCAL_HOME);
                    return;
                }

                // در خانه اپ، Back برنامه را به پس‌زمینه می‌برد.
                moveTaskToBack(true);
            }
        });
    }

    private boolean isLocalHomeUrl(String url) {
        if (url == null || url.trim().isEmpty()) return false;

        Uri uri = Uri.parse(url);
        if (!"localhost".equalsIgnoreCase(uri.getHost())) return false;

        String path = uri.getPath();
        return path == null
            || path.isEmpty()
            || "/".equals(path)
            || "/index.html".equals(path);
    }

    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }
}
`;

  writeFile(mainActivityPath, source);

  const javaRoot = path.join(appMain, 'java');
  for (const oldPath of [
    path.join(javaRoot, 'co', 'median', 'android', 'pkkxyj', 'MainActivity.java'),
  ]) {
    if (oldPath !== mainActivityPath) fs.rmSync(oldPath, { force: true });
  }
}

function configureManifest() {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  const applicationMatch = manifest.match(/<application\b[\s\S]*?>/);
  if (!applicationMatch) throw new Error('تگ application در AndroidManifest.xml پیدا نشد.');

  let applicationTag = applicationMatch[0];
  applicationTag = setXmlAttribute(applicationTag, 'android:icon', `@mipmap/${iconName}`);
  applicationTag = setXmlAttribute(applicationTag, 'android:roundIcon', `@mipmap/${roundIconName}`);
  applicationTag = setXmlAttribute(applicationTag, 'android:allowBackup', 'false');
  applicationTag = setXmlAttribute(applicationTag, 'android:usesCleartextTraffic', 'false');
  applicationTag = setXmlAttribute(applicationTag, 'android:enableOnBackInvokedCallback', 'true');
  manifest = manifest.replace(applicationMatch[0], applicationTag);

  const activityTags = [...manifest.matchAll(/<activity\b[^>]*>/g)];
  const activityMatch = activityTags.find((match) =>
    /android:name="(?:\.MainActivity|com\.tarhimsaz\.app\.MainActivity)"/.test(match[0]),
  );
  if (!activityMatch) throw new Error('تگ MainActivity در AndroidManifest.xml پیدا نشد.');

  const activityTag = setXmlAttribute(
    activityMatch[0],
    'android:theme',
    '@style/AppTheme.NoActionBarLaunch',
  );
  manifest = manifest.replace(activityMatch[0], activityTag);
  fs.writeFileSync(manifestPath, manifest);
}

requireFile(gradlePath, 'android/app/build.gradle پیدا نشد. ابتدا پروژه Android را بسازید.');
requireFile(manifestPath, 'AndroidManifest.xml پیدا نشد.');
requireFile(path.join(root, 'resources', 'icon-source.jpg'), 'resources/icon-source.jpg پیدا نشد.');
requireFile(
  path.join(brandingRoot, 'drawable-nodpi', `${splashLogoName}.png`),
  'لوگوی Splash سفارشی پیدا نشد.',
);

configureGradle();
copyLauncherIcons();
copySplashLogo();
writeTransparentSystemSplashIcon();
configureColors();
configureLaunchThemes();
writeMainActivity();
configureManifest();

// جلوگیری از استفاده Gradle از منابع کامپایل‌شده نسخه قبلی.
fs.rmSync(path.join(androidRoot, 'app', 'build'), { recursive: true, force: true });

console.log(`Android patched: ${packageName}, versionCode ${versionCode}, versionName ${versionName}`);
console.log(`Launcher icon: @mipmap/${iconName}`);
console.log(`Splash: full logo on white for ${splashDurationMs} ms; no circular system logo`);
console.log('Back: remote tool/page -> local app home; local home -> background');
console.log(`User-Agent: ${appUserAgentToken}`);
