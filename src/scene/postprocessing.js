import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export function createPostProcessing(renderer, scene, camera) {
  const scenePass = pass(scene, camera);
  scenePass.setMRT(false);

  // Bloom — subtle glow on emissive surfaces (signs, LEDs, screens)
  const bloomPass = bloom(scenePass, 0.3, 0.5, 0.8);

  const postProcessing = new THREE.RenderPipeline(renderer);
  postProcessing.outputNode = bloomPass;

  return { postProcessing };
}
