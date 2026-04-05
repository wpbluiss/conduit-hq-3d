import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map();

/**
 * Load a GLTF/GLB model with caching.
 * Returns { scene, animations, mixer } ready to use.
 */
export async function loadModel(url) {
  if (modelCache.has(url)) {
    // Clone cached model for reuse
    const cached = modelCache.get(url);
    const clone = cached.scene.clone();
    return {
      scene: clone,
      animations: cached.animations,
    };
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        // Cache the original
        modelCache.set(url, {
          scene: gltf.scene,
          animations: gltf.animations,
        });

        resolve({
          scene: gltf.scene,
          animations: gltf.animations,
        });
      },
      undefined,
      (error) => {
        console.warn(`Failed to load model ${url}:`, error);
        reject(error);
      }
    );
  });
}

/**
 * Set up animation mixer and play a named animation.
 * Returns { mixer, actions } for controlling playback.
 */
export function setupAnimations(model, animations) {
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  for (const clip of animations) {
    actions[clip.name] = mixer.clipAction(clip);
  }

  return { mixer, actions };
}
