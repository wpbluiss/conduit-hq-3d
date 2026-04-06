import * as THREE from 'three/webgpu';

/**
 * Raycaster-based hover detection system.
 * Detects interactable objects under the crosshair/cursor and
 * updates the outline selectedObjects array + shows prompt.
 */
export function createHoverOutline(camera, scene, selectedObjects, promptOverlay) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = 15; // Only detect nearby objects
  const center = new THREE.Vector2(0, 0); // Screen center (crosshair)

  // Tag meshes as interactable with userData.interactable = true
  // and userData.interactLabel = 'Press E to inspect Agent Name'

  let currentHovered = null;
  let hoverGlowTime = 0;

  function update(elapsed) {
    raycaster.setFromCamera(center, camera);

    // Collect interactable meshes
    const intersects = raycaster.intersectObjects(scene.children, true);

    let found = null;
    for (const hit of intersects) {
      // Walk up to find interactable parent
      let obj = hit.object;
      while (obj) {
        if (obj.userData && obj.userData.interactable) {
          found = obj;
          break;
        }
        obj = obj.parent;
      }
      if (found) break;
    }

    if (found !== currentHovered) {
      // Clear previous
      selectedObjects.length = 0;

      if (found) {
        // Add all meshes in the interactable group
        if (found.isMesh) {
          selectedObjects.push(found);
        } else {
          found.traverse(child => {
            if (child.isMesh) selectedObjects.push(child);
          });
        }

        // Show interaction prompt if not already showing elevator/agent prompt
        if (found.userData.interactLabel && promptOverlay) {
          promptOverlay.show(found.userData.interactLabel);
        }
      } else {
        // Only hide if we were showing a hover prompt
        if (currentHovered && currentHovered.userData.interactLabel && promptOverlay) {
          promptOverlay.hide();
        }
      }

      currentHovered = found;
    }

    // Pulse the outline edge color for visual feedback
    hoverGlowTime = elapsed;
  }

  function getCurrentHovered() {
    return currentHovered;
  }

  return { update, getCurrentHovered };
}

/**
 * Mark a group or mesh as interactable for the hover system.
 */
export function markInteractable(obj, label) {
  obj.userData.interactable = true;
  obj.userData.interactLabel = label || 'Press E to interact';
}
