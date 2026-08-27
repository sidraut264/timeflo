class Car {
  constructor(scene) {
    this.scene = scene;

    // Position and orientation
    this.position = new THREE.Vector3(0, 0.1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.angle = 0; // Yaw angle in radians

    // Physics Config
    this.MAX_SPEED = 36.0;
    this.ACCEL = 18.0;
    this.BRAKE = 30.0;
    this.FRICTION = 6.0;
    this.STEER_SPEED = 2.2;
    this.STEER_RETURN = 4.0;

    this.currentSteer = 0;
    this.rollAngle = 0; // Kept roll for leaning into turns, no pitch

    this.group = new THREE.Group();    // Root (moves in world, stays flat)
    this.chassis = new THREE.Group();  // Body (leans into turns)
    this.group.add(this.chassis);

    this.buildModel();
    scene.add(this.group);
  }

  buildModel() {
    // Main Body (Original dimensions and colors)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d3b6e, roughness: 0.3, metalness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.52, 3.7), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    this.chassis.add(body); // Attached to chassis so it leans

    // Cabin Roof
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x112344, roughness: 0.2, metalness: 0.8 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.0), cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    this.chassis.add(cabin);

    // Windshield / Windows
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xa8cce8, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.7 });
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.42), glassMat);
    windshield.position.set(0, 0.95, 0.81);
    this.chassis.add(windshield);

    // Wheels (Attached to ROOT group so they don't tilt off the ground)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });
    const wheelPos = [
      [-0.95, 0.32, 1.15], [0.95, 0.32, 1.15],
      [-0.95, 0.32, -1.15], [0.95, 0.32, -1.15]
    ];

    this.wheels = [];
    for (const [x, y, z] of wheelPos) {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);

      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.castShadow = true;
      wGroup.add(w);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 12), hubMat);
      hub.rotation.z = Math.PI / 2;
      wGroup.add(hub);

      this.wheels.push(wGroup);
      this.group.add(wGroup);
    }

    // Headlights (Original shape, but with better glowing material and optimized SpotLight)
    for (const sx of [-0.65, 0.65]) {
      const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 2.0 });
      const hl = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), hlMat);
      hl.position.set(sx, 0.55, 1.86);
      this.chassis.add(hl);

      const light = new THREE.SpotLight(0xfff0b0, 1.5, 40, Math.PI / 5, 0.5, 1);
      light.position.set(sx, 0.55, 1.9);
      light.target.position.set(sx, 0.2, 10);
      this.chassis.add(light);
      this.chassis.add(light.target);
    }

    // Taillights (Original shape, glowing material)
    for (const sx of [-0.68, 0.68]) {
      const tlMat = new THREE.MeshStandardMaterial({ color: 0x440000, emissive: 0xff1e00, emissiveIntensity: 1.5 });
      const tl = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), tlMat);
      tl.position.set(sx, 0.55, -1.86);
      tl.rotation.y = Math.PI;
      this.chassis.add(tl);
    }
  }

  update(dt, input, isCruising, roadInfo, sensitivity = 0.5) {
    // 1. Throttle / Braking Logic
    let accel = 0;

    if (isCruising) {
      const targetSpeed = this.MAX_SPEED * 0.72;
      if (this.speed < targetSpeed) accel = this.ACCEL * 0.8;
      else if (this.speed > targetSpeed + 1) accel = -this.FRICTION * 0.5;
    } else {
      if (input.up) accel = this.ACCEL;
      else if (input.down) accel = -this.BRAKE;
    }

    this.speed += accel * dt;

    // Apply Friction / Resistance
    if (accel === 0) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.FRICTION * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.FRICTION * dt);
      }
    }

    this.speed = Math.max(-this.MAX_SPEED * 0.3, Math.min(this.MAX_SPEED, this.speed));

    // 2. Responsive Arcade Steering
    let targetSteer = 0;
    if (input.left) targetSteer = 1.0 * sensitivity;
    else if (input.right) targetSteer = -1.0 * sensitivity;

    if (targetSteer !== 0) {
      this.currentSteer += (targetSteer - this.currentSteer) * this.STEER_SPEED * 5.0 * dt;
    } else {
      this.currentSteer += (0 - this.currentSteer) * this.STEER_RETURN * 3.0 * dt;
    }

    let steerMult = 1.0;
    if (input.drift && Math.abs(this.speed) > 8) {
      steerMult = 1.6;
    }

    const movingRatio = Math.min(Math.abs(this.speed) / 5.0, 1.0);
    this.angle += this.currentSteer * this.STEER_SPEED * steerMult * movingRatio * dt;

    // 3. Auto Cruise Path Following Override
    if (isCruising && roadInfo) {
      const roadCenter = roadInfo.point;
      const roadTangent = roadInfo.tangent;
      const targetYaw = Math.atan2(roadTangent.x, roadTangent.z);

      let angleDiff = targetYaw - this.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      this.angle += angleDiff * 3.0 * dt;

      const dx = roadCenter.x - this.position.x;
      this.position.x += dx * 2.0 * dt;
    }

    // 4. Update Position
    this.velocity.x = Math.sin(this.angle) * this.speed;
    this.velocity.z = Math.cos(this.angle) * this.speed;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    if (roadInfo) {
      const targetY = roadInfo.point.y + 0.05;
      this.position.y += (targetY - this.position.y) * 10.0 * dt;
    }

    // 5. Visual Roll (Chassis lean only, no pitch)
    const targetRoll = -this.currentSteer * (this.speed / this.MAX_SPEED) * 0.18;
    this.rollAngle += (targetRoll - this.rollAngle) * 8.0 * dt;

    // Apply main position and yaw to the Root Group
    this.group.position.copy(this.position);
    this.group.rotation.y = this.angle;

    // Apply Roll to the Chassis
    this.chassis.rotation.z = this.rollAngle;
    this.chassis.rotation.x = 0; // Explicitly keeping pitch flat

    // 6. Wheel Updates
    this.wheels[0].rotation.y = this.currentSteer * 0.45;
    this.wheels[1].rotation.y = this.currentSteer * 0.45;

    const spinRate = (this.speed * dt) / 0.32;
    for (const w of this.wheels) {
      w.children[0].rotation.x += spinRate; // Tire
      w.children[1].rotation.x += spinRate; // Hub
    }
  }
}