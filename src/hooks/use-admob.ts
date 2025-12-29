
"use client";

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdOptions, InterstitialAdPluginEvents } from 'capacitor-admob';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';

// Ad Unit IDs
const BANNER_AD_ID = 'ca-app-pub-2750761696337886/2202360537';
const INTERSTITIAL_AD_ID = 'ca-app-pub-2750761696337886/8823609202';

// Singleton pattern to prevent re-initialization
let isAdMobInitialized = false;

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(isAdMobInitialized);

  // Safely initialize AdMob only once
  const initializeAdMob = useCallback(async () => {
    // Ensure this only runs on native platforms and hasn't been initialized yet
    if (Capacitor.isNativePlatform() && !isAdMobInitialized) {
      try {
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false,
        });
        isAdMobInitialized = true;
        setIsInitialized(true);
        console.log("AdMob Initialized Successfully");
      } catch (error) {
        console.error("AdMob initialization error:", error);
      }
    } else if (isAdMobInitialized) {
      setIsInitialized(true); // Already initialized in this session
    }
  }, []);

  const showBanner = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const options: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false,
      };
      await AdMob.showBanner(options);
      console.log("Banner Ad should be visible.");
    } catch (error) {
      console.error("Banner ad display error:", error);
    }
  }, [isInitialized]);

  const prepareInterstitial = useCallback(async () => {
    if (!isInitialized) return;
    try {
      const options: AdOptions = {
        adId: INTERSTITIAL_AD_ID,
        isTesting: false,
      };
      await AdMob.prepareInterstitial(options);
      console.log("Interstitial Ad prepared.");
    } catch (e) {
      console.error("Error preparing interstitial:", e);
    }
  }, [isInitialized]);

  const showInterstitial = useCallback(async () => {
    if (!isInitialized) return;
    try {
      console.log("Attempting to show Interstitial Ad.");
      await AdMob.showInterstitial();
    } catch (e) {
      console.error("Error showing interstitial:", e);
      // If it fails to show, we should still try to prepare the next one.
      await prepareInterstitial();
    }
  }, [isInitialized, prepareInterstitial]);

  // Main effect to manage AdMob lifecycle
  useEffect(() => {
    // Only run on the client-side
    if (typeof window !== 'undefined') {
      initializeAdMob();
    }
  }, [initializeAdMob]);

  // Effect for banner ads and preparing interstitials
  useEffect(() => {
    if (isInitialized) {
      showBanner();
      prepareInterstitial();

      // Add a listener to re-prepare the interstitial after it's closed
      const listener = AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log("Interstitial ad dismissed. Preparing next one.");
        prepareInterstitial();
      });

      // Cleanup on component unmount
      return () => {
        listener.remove();
        AdMob.hideBanner().catch(error => console.error("Error hiding banner:", error));
      };
    }
  }, [isInitialized, showBanner, prepareInterstitial]);

  return { showInterstitial, isInitialized };
}
