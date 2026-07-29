# راهنمای انتشار اپ ترحیم ساز

## مشخصات برنامه

- نام: ترحیم ساز
- Package ID: `com.tarhimsaz.app`
- نسخه: `1.0.0`
- Version Code: `1`

## نسخه تست

در GitHub Actions، Workflow زیر را اجرا کنید:

`Build TarhimSaz Test APK`

Artifact خروجی:

`tarhimsaz-v1.0.0-test-apk`

## نسخه امضاشده

چهار مقدار موجود در بسته خصوصی کلید امضا را در مسیر زیر ثبت کنید:

`Settings → Secrets and variables → Actions`

نام Secretها:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

سپس Workflow زیر را اجرا کنید:

`Build Signed TarhimSaz APK and AAB`

Artifact خروجی شامل فایل‌های APK و AAB امضاشده است.

فایل کلید امضا را در مخزن عمومی قرار ندهید و برای انتشار تمام به‌روزرسانی‌های آینده نگهداری کنید.
