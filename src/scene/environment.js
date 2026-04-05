import * as THREE from 'three/webgpu';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export async function createEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);

  return new Promise((resolve) => {
    new HDRLoader().load('/hdri/venice_sunset_1k.hdr', (hdrTexture) => {
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

      const envMap = pmrem.fromEquirectangular(hdrTexture).texture;

      scene.environment = envMap;
      scene.background = envMap;
      scene.backgroundIntensity = 1.4;
      scene.backgroundBlurriness = 0.005;
      console.log('HDR environment loaded successfully');

      hdrTexture.dispose();
      pmrem.dispose();

      resolve(envMap);
    }, undefined, () => {
      console.warn('HDR load failed, falling back to scene-based env map');
      const envRT = pmrem.fromScene(scene, 0.04, 0.1, 1000);
      scene.environment = envRT.texture;
      pmrem.dispose();
      resolve(envRT.texture);
    });
  });
}
