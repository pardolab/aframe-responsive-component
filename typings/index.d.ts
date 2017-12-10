/// <reference path="./aframe.d.ts" />
/// <reference path="../interfaces/interfaces.ts" />
/// <reference path="../node_modules/@types/three/index.d.ts" />

// Solves Three JS problems with A-Frame.
/**
 * This doesn't import threejs.
 */

import * as three from 'three';

declare global {
  const THREE: typeof three;
}
