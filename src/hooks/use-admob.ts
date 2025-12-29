
"use client";

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, InterstitialAdPluginEvents } from 'capacitor-admob';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

const BANNER_AD_ID = 'ca-app-pub-2750761696337886/2202360537';
const INTERSTITIAL_AD_ID = 'ca-app-pub-2750761696337886/8823609202';

let isAdMobInitialized = false;

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(isAdMobInitialized);

  const initializeAdMob = useCallback(async () => {
    if (Capacitor.isNativePlatform() && !isAdMobInitialized) {
      isAdMobInitialized = true;
      try {
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false,
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("AdMob initialization error:", error);
        isAdMobInitialized = false; // Reset on failure
      }
    }
  }, []);

  const showBanner = useCallback(async () => {
    if (!isInitialized) return;
    const options: BannerAdOptions = {
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    };
    try {
      await AdMob.showBanner(options);
    } catch (error) {
      console.error("Banner ad error:", error);
    }
  }, [isInitialized]);

  const prepareInterstitial = useCallback(async () => {
    if (!isInitialized) return;
    const options: AdOptions = {
      adId: INTERSTITIAL_AD_ID,
      isTesting: false,
    };
    try {
      await AdMob.prepareInterstitial(options);
    } catch (e) {
      console.error("Error preparing interstitial:", e);
    }
  }, [isInitialized]);

  const showInterstitial = useCallback(async () => {
    if (!isInitialized) return;

    const listener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      prepareInterstitial();
      listener.remove();
    });

    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.error("Error showing interstitial:", e);
    }
  }, [isInitialized, prepareInterstitial]);

  useEffect(() => {
    // This entire block runs only on the client-side
    initializeAdMob();
  }, [initializeAdMob]);
  
  useEffect(() => {
    if (isInitialized) {
      showBanner();
      prepareInterstitial();
    }
    
    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(error => console.error("Error hiding banner:", error));
      }
    };
  }, [isInitialized, showBanner, prepareInterstitial]);


  return { showInterstitial, isInitialized };
}
