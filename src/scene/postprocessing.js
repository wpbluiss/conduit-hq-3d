import * as THREE from 'three/webgpu';
import { pass, mrt, output, normalView, uniform, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { outline } from 'three/addons/tsl/display/OutlineNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';

/**
 * Full post-processing pipeline for Conduit HQ.
 * Bloom + GTAO + Outline (hover) + Film grain + Vignette
 */
export function createPostProcessing(renderer, scene, camera) {
  const postProcessing = new THREE.PostProcessing(renderer);

  // --- Scene pass with MRT for GTAO (depth + normals) ---
  const scenePass = pass(scene, camera);
  scenePass.setMRT(mrt({
    output: output,
    normal: normalView,
  }));

  const scenePassColor = scenePass.getTextureNode('output');
  const scenePassNormal = scenePass.getTextureNode('normal');
  const scenePassDepth = scenePass.getTextureNode('depth');

  // --- Bloom: subtle glow on emissive surfaces (signs, LEDs, screens) ---
  const bloomPass = bloom(scenePassColor, 0.35, 0.4, 0.85);

  // --- GTAO: ambient occlusion for depth and contact shadows ---
  const aoPass = ao(scenePassDepth, scenePassNormal, camera);
  aoPass.distanceExponent = 1.0;
  aoPass.distanceFallOff = 0.4;
  aoPass.radius.value = 0.25;
  aoPass.scale.value = 1.0;
  aoPass.thickness.value = 1.0;

  // --- Outline pass for hover interaction highlights ---
  const selectedObjects = [];
  const edgeStrength = uniform(3.0);
  const edgeGlow = uniform(0.0);
  const edgeThickness = uniform(1.5);
  const visibleEdgeColor = uniform(new THREE.Color(0xffffff));
  const hiddenEdgeColor = uniform(new THREE.Color(0x333333));

  const outlinePass = outline(scene, camera, {
    selectedObjects,
    edgeGlow,
    edgeThickness,
  });

  const { visibleEdge, hiddenEdge } = outlinePass;
  const outlineColor = visibleEdge.mul(visibleEdgeColor).add(
    hiddenEdge.mul(hiddenEdgeColor)
  ).mul(edgeStrength);

  // --- Film grain: subtle noise for cinematic feel ---
  // Apply bloom + AO first, then grain on top
  const litScene = aoPass.getTextureNode().mul(scenePassColor.add(bloomPass));
  const withOutline = litScene.add(outlineColor);
  const finalColor = film(withOutline, 0.06);

  postProcessing.outputNode = finalColor;

  return {
    postProcessing,
    selectedObjects,    // mutate this array to highlight objects
    edgeStrength,
    visibleEdgeColor,
    hiddenEdgeColor,
    edgeThickness,
    edgeGlow,
  };
}
