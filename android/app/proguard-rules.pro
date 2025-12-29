# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /Users/zayyar/dev/bright-net/mobile/node_modules/@capacitor/android/capacitor/proguard.txt
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If you are using Google Play Services, uncomment the following line.
#-keep class * extends java.util.ListResourceBundle {
#    protected Object[][] getContents();
#}
#
#-keep public class com.google.android.gms.common.internal.safeparcel.SafeParcelable {
#    public static final *** CREATOR;
#}
#
#-keepnames @com.google.android.gms.common.annotation.KeepName class *
#-keepclassmembernames class * {
#    @com.google.android.gms.common.annotation.KeepName *;
#}
#
#-keepnames class * implements android.os.Parcelable {
#  public static final ** CREATOR;
#}

# Required for AdMob
-keep class com.google.android.gms.ads.** { *; }
-keep interface com.google.android.gms.ads.** { *; }
-keep public class com.google.android.gms.ads.identifier.AdvertisingIdClient {
    public *;
}
-keep public class com.google.android.gms.appset.AppSet {
    public *;
}
