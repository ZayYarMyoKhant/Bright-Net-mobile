
"use client";

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, InterstitialAdPluginEvents } from 'capacitor-admob';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

const BANNER_AD_ID = 'ca-app-pub-2750761696337886/2202360537';
const INTERSTITIAL_AD_ID = 'ca-app-pub-2750761696337886/8823609202';

// Use a simple flag to ensure initialization happens only once per app session.
let isAdMobInitialized = false;

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(isAdMobInitialized);

  // This effect will run only once when the hook is first used.
  useEffect(() => {
    // AdMob should only be initialized on native platforms.
    if (Capacitor.isNativePlatform() && !isAdMobInitialized) {
      console.log('AdMob: Initializing...');
      AdMob.initialize({
        testingDevices: [], // Use an empty array for production
        initializeForTesting: false,
      })
      .then(() => {
        console.log('AdMob: Initialized Successfully.');
        isAdMobInitialized = true;
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('AdMob: Initialization failed.', error);
      });
    }
  }, []);

  const showBanner = useCallback(async () => {
    if (!isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      console.log('AdMob: Showing Banner...');
      const options: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false,
      };
      await AdMob.showBanner(options);
      console.log('AdMob: Banner should be visible.');
    } catch (error) {
      console.error('AdMob: Banner display error.', error);
    }
  }, [isInitialized]);

  const prepareInterstitial = useCallback(async () => {
    if (!isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }
    
    try {
      console.log('AdMob: Preparing Interstitial...');
      const options: AdOptions = {
        adId: INTERSTITIAL_AD_ID,
        isTesting: false,
      };
      await AdMob.prepareInterstitial(options);
      console.log('AdMob: Interstitial Ad prepared.');
    } catch (e) {
      console.error('AdMob: Error preparing interstitial.', e);
    }
  }, [isInitialized]);

  const showInterstitial = useCallback(async () => {
    if (!isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }
    
    try {
      console.log('AdMob: Attempting to show Interstitial Ad.');
      await AdMob.showInterstitial();
      console.log('AdMob: showInterstitial completed.');
    } catch (e) {
      console.error('AdMob: Error showing interstitial.', e);
      // Even if showing fails, try to prepare the next one.
      await prepareInterstitial();
    }
  }, [isInitialized, prepareInterstitial]);

  // Main effect to manage ads after initialization
  useEffect(() => {
    if (isInitialized) {
      showBanner();
      prepareInterstitial();

      // Add a listener to re-prepare the interstitial after it's closed
      const listener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('AdMob: Interstitial ad dismissed. Preparing next one.');
        prepareInterstitial();
      });

      // Cleanup on component unmount
      return () => {
        listener.remove();
        AdMob.hideBanner().catch(error => console.error("AdMob: Error hiding banner:", error));
      };
    }
  }, [isInitialized, showBanner, prepareInterstitial]);

  return { showInterstitial, isInitialized };
}
