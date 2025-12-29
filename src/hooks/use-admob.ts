
"use client";

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, InterstitialAdPluginEvents } from 'capacitor-admob';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

const BANNER_AD_ID = 'ca-app-pub-2750761696337886/2202360537';
const INTERSTITIAL_AD_ID = 'ca-app-pub-2750761696337886/8823609202';

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize AdMob
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !isInitialized) {
      AdMob.initialize({
        testingDevices: [],
        initializeForTesting: false,
      }).then(() => {
        setIsInitialized(true);
      }).catch(error => console.error("AdMob initialization error:", error));
    }
  }, [isInitialized]);

  // Show Banner Ad
  useEffect(() => {
    if (!isInitialized) return;

    const options: BannerAdOptions = {
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    };
    AdMob.showBanner(options).catch(error => console.error("Banner ad error:", error));

    return () => {
      AdMob.hideBanner().catch(error => console.error("Error hiding banner:", error));
    };
  }, [isInitialized]);
  
  // Prepare Interstitial Ad
  const prepareInterstitial = useCallback(async () => {
    if (!isInitialized) return;
    const options: AdOptions = {
        adId: INTERSTITIAL_AD_ID,
        isTesting: false,
    };
    try {
        await AdMob.prepareInterstitial(options);
    } catch(e) {
        console.error("Error preparing interstitial:", e);
    }
  }, [isInitialized]);

  // Show Interstitial Ad
  const showInterstitial = useCallback(async () => {
    if (!isInitialized) return;
    
    // Add a listener to re-prepare the ad for the next time
    const listener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        prepareInterstitial();
        listener.remove();
    });

    try {
        await AdMob.showInterstitial();
    } catch(e) {
        console.error("Error showing interstitial:", e);
    }
  }, [isInitialized, prepareInterstitial]);

  // Prepare the first interstitial ad when the hook is used
  useEffect(() => {
    if (isInitialized) {
        prepareInterstitial();
    }
  }, [isInitialized, prepareInterstitial]);


  return { showInterstitial, isInitialized };
}
