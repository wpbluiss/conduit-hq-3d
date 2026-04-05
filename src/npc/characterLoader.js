import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/**
 * Character Loader — Loads rigged soldier.glb model, clones for each agent,
 * applies department-specific colors, and exposes bone references for animation.
 *
 * Fallback: if model loading fails, returns null (caller uses procedural agent).
 */

// Department clothing colors (applied to body mesh)
const DEPT_BODY_COLORS = {
  Sales:        [0x1a237e, 0x1a1a50, 0x1e2060],
  Marketing:    [0x00695c, 0x005a4a, 0x004d40],
  Engineering:  [0x37474f, 0x333844, 0x3a3e45],
  Content:      [0x4a148c, 0x5c1a9a, 0x6a1b7a],
  Intelligence: [0x263238, 0x1e272e, 0x2a3036],
  Operations:   [0x33691e, 0x2e5a1a, 0x3a6e22],
  Monitoring:   [0x1a1a1e, 0x161618, 0x1e1e22],
  Lobby:        [0x1565c0, 0x1a5aaa, 0x1060b0],
};

// Skin tone variety
const SKIN_TONES = [0xFFDBAC, 0xF1C27D, 0xE0AC69, 0xC68642, 0x8D5524, 0x5C3A1E];

// Cache the base model data
let cachedModelData = null;
let loadAttempted = false;

/**
 * Pre-load the base character model. Call once during init.
 */
export async function preloadCharacterModel() {
  // Soldier.glb is too heavy (~80K tris per clone, 480K+ per floor).
  // Procedural articulated characters (createAgentModel) are lighter and more controllable.
  // Keeping this function as a no-op for now until lighter rigged models are available.
  loadAttempted = true;
  console.log('[CHARACTER] Using procedural articulated characters (lighter, better perf)');
  return false;
}

/**
 * Create a character instance for an agent.
 * Returns: { model, bones, mixer, playIdle } or null if model unavailable.
 *
 * @param {number} agentIndex — Agent index for color variety
 * @param {string} department — Department name for suit color
 * @param {number} floorY — Floor Y position
 */
export function createCharacterInstance(agentIndex, department, floorY) {
  if (!cachedModelData) return null;

  // Clone using SkeletonUtils for proper skinned mesh cloning
  const clonedScene = SkeletonUtils.clone(cachedModelData.scene);

  // Deep clone materials and apply department colors
  const bodyColor = getDeptColor(agentIndex, department);
  const skinColor = SKIN_TONES[agentIndex % SKIN_TONES.length];

  clonedScene.traverse(child => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
      child.castShadow = true;
      child.receiveShadow = true;

      const name = (child.name || '').toLowerCase();
      // Apply skin tone to head/hands, suit color to body
      if (name.includes('head') || name.includes('hand') || name.includes('face')) {
        child.material.color.setHex(skinColor);
      } else {
        child.material.color.setHex(bodyColor);
      }
    }
  });

  // Scale to seated height (~0.9m visible above desk)
  const box = new THREE.Box3().setFromObject(clonedScene);
  const height = box.max.y - box.min.y;
  const targetHeight = 1.6; // slightly shorter than standing
  clonedScene.scale.setScalar(targetHeight / height);

  // Ground feet
  const scaledBox = new THREE.Box3().setFromObject(clonedScene);
  clonedScene.position.y = -scaledBox.min.y;

  // Find key bones for procedural animation
  const bones = {};
  clonedScene.traverse(obj => {
    if (obj.isBone) {
      const n = obj.name.toLowerCase();
      if (n.includes('spine') && !bones.spine) bones.spine = obj;
      if (n.includes('head') && !bones.head) bones.head = obj;
      if ((n.includes('leftforearm') || n.includes('left_forearm') || (n.includes('left') && n.includes('forearm'))) && !bones.leftForearm) bones.leftForearm = obj;
      if ((n.includes('rightforearm') || n.includes('right_forearm') || (n.includes('right') && n.includes('forearm'))) && !bones.rightForearm) bones.rightForearm = obj;
      if ((n.includes('leftarm') || n.includes('left_arm') || (n.includes('left') && n.includes('arm') && !n.includes('forearm'))) && !bones.leftUpperArm) bones.leftUpperArm = obj;
      if ((n.includes('rightarm') || n.includes('right_arm') || (n.includes('right') && n.includes('arm') && !n.includes('forearm'))) && !bones.rightUpperArm) bones.rightUpperArm = obj;
      if (n.includes('neck') && !bones.neck) bones.neck = obj;
    }
  });

  // Setup animation mixer
  const mixer = new THREE.AnimationMixer(clonedScene);
  let idleAction = null;

  if (cachedModelData.animations?.length > 0) {
    const idleClip = cachedModelData.animations.find(a => a.name.toLowerCase().includes('idle'))
      || cachedModelData.animations[0];
    if (idleClip) {
      idleAction = mixer.clipAction(idleClip);
      idleAction.play();
    }
  }

  return {
    model: clonedScene,
    bones,
    mixer,
    idleAction,
  };
}

function getDeptColor(index, department) {
  const colors = DEPT_BODY_COLORS[department] || DEPT_BODY_COLORS.Sales;
  return colors[index % colors.length];
}

/**
 * Check if character model is available.
 */
export function isCharacterModelAvailable() {
  return cachedModelData !== null;
}
