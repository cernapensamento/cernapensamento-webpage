'use client';

import { configureBoneyard } from 'boneyard-js/react';

let configured = false;

export function setupBoneyard() {
  if (configured) return;
  if (typeof window !== 'undefined') {
    try {
      configureBoneyard({
        color: '#e4e2e2',
        darkColor: '#262626',
        animate: 'shimmer',
        shimmerColor: '#f5f3f3',
        darkShimmerColor: '#383838',
      });
      configured = true;
    } catch {
      // Graceful fallback if boneyard configuration is unavailable in current env
    }
  }
}
