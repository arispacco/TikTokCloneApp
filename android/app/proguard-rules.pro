# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---------------------------------------------------------------------------
# React Native core + Hermes
# Le plugin Gradle React Native et l'AAR react-android fournissent déjà des
# règles "consumer", mais on ajoute des garde-fous explicites pour éviter tout
# élagage agressif (minifyEnabled true + shrinkResources true).
# ---------------------------------------------------------------------------
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}

# JNI / TurboModules / Fabric (nouvelle architecture)
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keepclassmembers class * { native <methods>; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ---------------------------------------------------------------------------
# Firebase / Google Play services (react-native-firebase : app, auth,
# firestore, storage). On garde les modèles et les classes générées.
# ---------------------------------------------------------------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firestore (sérialisation / réflexion sur les POJO)
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <methods>;
}

# ---------------------------------------------------------------------------
# react-native-vision-camera
# ---------------------------------------------------------------------------
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# ---------------------------------------------------------------------------
# OkHttp / Okio (réseau, utilisé par Firebase et le bundler)
# ---------------------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Conserve les numéros de ligne pour des stacktraces lisibles en production.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
