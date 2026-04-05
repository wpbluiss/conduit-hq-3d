import * as THREE from 'three/webgpu';
import { createNameTag } from './nameTag.js';
import { LOBBY } from '../constants.js';
import { createAgentModel } from './agentModel.js';
import { initAgentAnimation, captureModelBase } from './agentAnimator.js';

export async function createReceptionist(scene) {
  const group = new THREE.Group();

  const posX = 0.8;
  const posZ = -2.8;

  // Use articulated procedural model for consistent animation
  const { group: agentMesh, parts } = createAgentModel({
    bodyColor: 0x1a1a3e,
    shirtColor: 0x2a2a4e,
    skinColor: 0xc68642,
    accentColor: 0x06b6d4,
    isFemale: true,
  });
  agentMesh.rotation.y = Math.PI * 0.3; // face slightly toward entrance

  group.add(agentMesh);
  group.position.set(posX, LOBBY.floorY, posZ);
  group.userData.model = agentMesh;
  group.userData.parts = parts;
  group.userData.baseY = LOBBY.floorY;

  captureModelBase(group);
  initAgentAnimation(group, 999, 'Operations', 'RECEPTIONIST');

  const tag = createNameTag('RECEPTIONIST', '#06b6d4');
  tag.position.set(0, 1.6, 0);
  group.add(tag);

  scene.add(group);

  return {
    group,
    position: new THREE.Vector3(posX, LOBBY.floorY, posZ),
  };
}
