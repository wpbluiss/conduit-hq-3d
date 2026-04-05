import * as THREE from 'three/webgpu';

export function createProximitySystem(player) {
  const zones = [];
  const _playerPos = new THREE.Vector3();

  function addZone({ position, radius, onEnter, onExit, id, yTolerance }) {
    zones.push({
      position,
      radius,
      onEnter,
      onExit,
      id: id || Math.random().toString(36),
      active: false,
      yTolerance: yTolerance !== undefined ? yTolerance : 5, // default Y tolerance
    });
  }

  function update() {
    _playerPos.copy(player.position);

    for (const zone of zones) {
      // Check Y distance first — only trigger if on same floor
      const dy = Math.abs(_playerPos.y - zone.position.y);
      if (dy > zone.yTolerance) {
        if (zone.active) {
          zone.active = false;
          zone.onExit?.();
        }
        continue;
      }

      // XZ distance check
      const dx = _playerPos.x - zone.position.x;
      const dz = _playerPos.z - zone.position.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      const wasActive = zone.active;
      zone.active = distXZ < zone.radius;

      if (zone.active && !wasActive) {
        zone.onEnter?.();
      }
      if (!zone.active && wasActive) {
        zone.onExit?.();
      }
    }
  }

  function removeZone(id) {
    const idx = zones.findIndex((z) => z.id === id);
    if (idx !== -1) zones.splice(idx, 1);
  }

  return { addZone, removeZone, update };
}
