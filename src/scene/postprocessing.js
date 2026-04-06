import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { outline } from 'three/addons/tsl/display/OutlineNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';

/**
 * Post-processing pipeline for Conduit HQ.
 * Bloom + Outline (hover) + Film grain.
 * No MRT — avoids WebGPU r183 MRT incompatibility.
 * Uses RenderPipeline (PostProcessing is deprecated alias).
 */
export function createPostProcessing(renderer, scene, camera) {
  const pipeline = new THREE.RenderPipeline(renderer);

  // --- Scene pass (no MRT — avoids WebGPU compatibility issues) ---
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode('output');

  // --- Bloom: subtle glow on emissive surfaces (signs, LEDs, screens) ---
  // Keep it subtle — crisp visuals, not washed-out haze
  const bloomPass = bloom(scenePassColor, 0.15, 0.3, 0.9);

  // --- Outline pass for hover interaction highlights ---
  const selectedObjects = [];

  const outlinePass = outline(scene, camera, {
    selectedObjects,
    edgeThickness: 1.5,
    edgeGlow: 0.0,
  });

  const { visibleEdge, hiddenEdge } = outlinePass;
  const outlineColor = visibleEdge.mul(3.0).add(hiddenEdge.mul(0.5));

  // --- Compose: scene + bloom + outline ---
  const composed = scenePassColor.add(bloomPass).add(outlineColor);

  // --- Film grain: very subtle noise for cinematic feel ---
  const finalColor = film(composed, 0.03);

  pipeline.outputNode = finalColor;

  return {
    pipeline,           // call pipeline.render() in the loop
    selectedObjects,    // mutate this array to highlight objects
  };
}
