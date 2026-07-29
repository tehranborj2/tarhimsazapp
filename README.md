# اپ اندروید ترحیم ساز 1.0.0

اپ ترحیم ساز یک صفحه اصلی محلی و سریع با ۱۲ دسته‌بندی دارد. انتخاب هر دسته، صفحه همان دسته را در سایت ترحیم ساز داخل WebView باز می‌کند.

## مشخصات

- نام برنامه: ترحیم ساز
- Package ID: `com.tarhimsaz.app`
- نسخه: `1.0.0`
- Version Code: `1`
- User-Agent اختصاصی: `TarhimSazApp/1.0.0`
- صفحه اصلی محلی با ۱۲ دسته‌بندی
- Splash سفید با لوگوی کامل
- Back در صفحات سایت: بازگشت به خانه اپ
- Back در خانه اپ: انتقال برنامه به پس‌زمینه

## ساخت نسخه تست

Workflow زیر را از بخش Actions اجرا کنید:

`Build TarhimSaz Test APK`

## ساخت نسخه انتشار

چهار Repository Secret زیر را ثبت کنید:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

سپس Workflow زیر را اجرا کنید:

`Build Signed TarhimSaz APK and AAB`
