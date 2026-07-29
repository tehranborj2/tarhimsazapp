import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
process.chdir(root);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, label) {
  console.log(`\n[Android] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`\n[Android] مرحله «${label}» ناموفق بود.`);
    process.exit(result.status || 1);
  }
}

for (const required of [
  'package.json',
  'capacitor.config.json',
  'www/index.html',
  'resources/icon-source.jpg',
  'android-branding/mipmap-mdpi/tarhimsaz_launcher.png',
  'android-branding/mipmap-xxxhdpi/tarhimsaz_launcher.png',
  'android-branding/drawable-nodpi/tarhimsaz_splash_logo.png',
]) {
  if (!fs.existsSync(path.join(root, required))) {
    console.error(`فایل لازم پیدا نشد: ${required}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(root, 'android', 'settings.gradle'))) {
  run(npx, ['cap', 'add', 'android'], 'ساخت پروژه بومی Android');
}

run(npx, ['cap', 'sync', 'android'], 'همگام‌سازی Capacitor');
run(process.execPath, ['scripts/patch-android.mjs'], 'اعمال آیکون، Splash، Back و نسخه');
console.log('\n[Android] پروژه Android آماده Build است؛ مرحله کنترل سخت‌گیرانه حذف شده است.');
