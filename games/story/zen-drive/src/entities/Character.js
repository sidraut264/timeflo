class Character {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0, 0);
    this.angle = 0;
    this.speed = 0;

    // Movement speeds
    this.walkSpeed = 8.0;
    this.runSpeed = 22.0;
    this.rotateSpeed = 8.0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Avatar order cycle
    this.currentAvatar = 'SOLDIER';
    const AVATARS = ['SOLDIER', 'RATAMAHATTA', 'ELF', 'MANNEQUIN'];

    // Sub-groups per avatar
    this.soldierGroup = new THREE.Group();
    this.ratamahattaGroup = new THREE.Group();
    this.mannequinGroup = new THREE.Group();

    this.group.add(this.soldierGroup);
    this.group.add(this.ratamahattaGroup);
    this.group.add(this.mannequinGroup);

    // ── Soldier (GLTF) ──────────────────────────────────
    this.soldierMixer = null;
    this.soldierActions = {};
    this.currentSoldierAct = 'Idle';

    // ── Ratamahatta (MD2) ────────────────────────────────
    this.md2Character = null;
    this.md2Loaded = false;
    this.md2PendingAnim = 'stand';
    this.currentMD2Anim = 'stand';

    // ── Shared procedural animation clock ───────────────
    this.animTime = 0;   // seconds, advances every update
    this.animState = 'idle'; // 'idle' | 'walk' | 'run'
    // Joint registries for procedural rigs
    this.mannequinJoints = {};

    this._buildArticulatedMannequin();
    this.loadSoldierGLTF();
    this.loadRatamahattaMD2();

    this.updateAvatarVisibility();
  }

  // ─────────────────────────────────────────────────────
  //  Visibility
  // ─────────────────────────────────────────────────────
  updateAvatarVisibility() {
    this.soldierGroup.visible = this.currentAvatar === 'SOLDIER';
    this.ratamahattaGroup.visible = this.currentAvatar === 'RATAMAHATTA';
    this.mannequinGroup.visible = this.currentAvatar === 'MANNEQUIN';
  }

  nextAvatar() {
    const order = ['SOLDIER', 'RATAMAHATTA', 'MANNEQUIN'];
    const idx = order.indexOf(this.currentAvatar);
    this.currentAvatar = order[(idx + 1) % order.length];
    this.updateAvatarVisibility();
    return this.currentAvatar;
  }

  // ─────────────────────────────────────────────────────
  //  Procedural Rig Builder helpers
  // ─────────────────────────────────────────────────────

  /** Creates a limb segment mesh centred at its local origin top. */
  _limb(rx, ry, len, mat, parent) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rx, ry, len, 7),
      mat
    );
    mesh.position.y = -len / 2;   // pivot is at top of segment
    mesh.castShadow = true;
    g.add(mesh);
    parent.add(g);
    return g;
  }

  _sphere(r, mat, parent, offY) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 9), mat);
    m.castShadow = true;
    if (offY !== undefined) m.position.y = offY;
    parent.add(m);
    return m;
  }

  _createCapsule(radius, length, mat) {
    const group = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), mat);
    cyl.castShadow = cyl.receiveShadow = true;
    group.add(cyl);

    const sphereGeom = new THREE.SphereGeometry(radius, 12, 12);
    const topSphere = new THREE.Mesh(sphereGeom, mat);
    topSphere.position.y = length / 2;
    topSphere.castShadow = topSphere.receiveShadow = true;
    group.add(topSphere);

    const botSphere = new THREE.Mesh(sphereGeom, mat);
    botSphere.position.y = -length / 2;
    botSphere.castShadow = botSphere.receiveShadow = true;
    group.add(botSphere);

    return group;
  }

  // ─────────────────────────────────────────────────────
  //  Articulated Mannequin (Upgraded: Organic & Humanoid)
  // ─────────────────────────────────────────────────────
  _buildArticulatedMannequin() {
    const J = this.mannequinJoints;
    const grp = this.mannequinGroup;

    // Cohesive, stylized humanoid materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.4, metalness: 0.1 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.5, metalness: 0.2 });

    // ── Root (Hips / Center of Mass) ────────────────────
    J.root = new THREE.Group();
    J.root.position.y = 1.05; // Positions feet exactly around y=0
    grp.add(J.root);

    // Pelvis (Composite capsule for smooth organic shape)
    const pelvis = this._createCapsule(0.14, 0.10, bodyMat);
    J.root.add(pelvis);

    // ── Torso ───────────────────────────────────────────
    J.torso = new THREE.Group();
    J.torso.position.y = 0.05; // Sits atop pelvis
    J.root.add(J.torso);

    // Tapered cylinder for broad shoulders -> narrow waist (chest)
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.55, 12), bodyMat);
    torsoMesh.position.y = 0.275;
    torsoMesh.castShadow = torsoMesh.receiveShadow = true;
    J.torso.add(torsoMesh);

    // Subtle waist accent/belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.06, 8), accentMat);
    belt.position.y = 0.08;
    J.torso.add(belt);

    // ── Neck & Head ─────────────────────────────────────
    J.neck = new THREE.Group();
    J.neck.position.y = 0.52;
    J.torso.add(J.neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.10, 8), jointMat);
    neckMesh.position.y = 0.05;
    J.neck.add(neckMesh);

    J.head = new THREE.Group();
    J.head.position.y = 0.10;
    J.neck.add(J.head);

    // Slightly elongated sphere for a more natural head shape
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), bodyMat);
    headMesh.position.y = 0.12;
    headMesh.scale.set(1, 1.15, 1);
    headMesh.castShadow = headMesh.receiveShadow = true;
    J.head.add(headMesh);

    // Stylized "visor" or face detail
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.03), jointMat);
    visor.position.set(0, 0.14, 0.10);
    J.head.add(visor);

    // ── Left Arm ────────────────────────────────────────
    J.lShoulder = new THREE.Group();
    J.lShoulder.position.set(-0.25, 0.48, 0);
    J.torso.add(J.lShoulder);
    J.lShoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), jointMat));

    J.lUpperArm = new THREE.Group();
    J.lShoulder.add(J.lUpperArm);
    // Composite capsule arm
    const lArmMesh = this._createCapsule(0.055, 0.28, bodyMat);
    lArmMesh.position.y = -0.195;
    J.lUpperArm.add(lArmMesh);

    J.lElbow = new THREE.Group();
    J.lElbow.position.y = -0.39; // 0.28 length + 0.055*2 radius
    J.lUpperArm.add(J.lElbow);

    const lForearmMesh = this._createCapsule(0.045, 0.26, bodyMat);
    lForearmMesh.position.y = -0.175;
    J.lElbow.add(lForearmMesh);

    J.lHand = new THREE.Group();
    J.lHand.position.y = -0.35;
    J.lElbow.add(J.lHand);
    const lHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.04), accentMat);
    lHandMesh.position.y = -0.05;
    lHandMesh.castShadow = true;
    J.lHand.add(lHandMesh);

    // ── Right Arm ───────────────────────────────────────
    J.rShoulder = new THREE.Group();
    J.rShoulder.position.set(0.25, 0.48, 0);
    J.torso.add(J.rShoulder);
    J.rShoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), jointMat));

    J.rUpperArm = new THREE.Group();
    J.rShoulder.add(J.rUpperArm);
    const rArmMesh = this._createCapsule(0.055, 0.28, bodyMat);
    rArmMesh.position.y = -0.195;
    J.rUpperArm.add(rArmMesh);

    J.rElbow = new THREE.Group();
    J.rElbow.position.y = -0.39;
    J.rUpperArm.add(J.rElbow);

    const rForearmMesh = this._createCapsule(0.045, 0.26, bodyMat);
    rForearmMesh.position.y = -0.175;
    J.rElbow.add(rForearmMesh);

    J.rHand = new THREE.Group();
    J.rHand.position.y = -0.35;
    J.rElbow.add(J.rHand);
    const rHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.04), accentMat);
    rHandMesh.position.y = -0.05;
    rHandMesh.castShadow = true;
    J.rHand.add(rHandMesh);

    // ── Left Leg ────────────────────────────────────────
    J.lHip = new THREE.Group();
    J.lHip.position.set(-0.10, -0.05, 0);
    J.root.add(J.lHip);
    J.lHip.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), jointMat));

    J.lThigh = new THREE.Group();
    J.lHip.add(J.lThigh);
    const lThighMesh = this._createCapsule(0.07, 0.32, bodyMat);
    lThighMesh.position.y = -0.23; // 0.32/2 + 0.07
    J.lThigh.add(lThighMesh);

    J.lKnee = new THREE.Group();
    J.lKnee.position.y = -0.46; // 0.32 + 0.07*2
    J.lThigh.add(J.lKnee);

    const lShinMesh = this._createCapsule(0.06, 0.32, bodyMat);
    lShinMesh.position.y = -0.22; // 0.32/2 + 0.06
    J.lKnee.add(lShinMesh);

    J.lFoot = new THREE.Group();
    J.lFoot.position.y = -0.44; // 0.32 + 0.06*2
    J.lKnee.add(J.lFoot);
    // Foot positioned slightly forward for natural stance
    const lFootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), jointMat);
    lFootMesh.position.set(0, -0.04, 0.06);
    lFootMesh.castShadow = true;
    J.lFoot.add(lFootMesh);

    // ── Right Leg ───────────────────────────────────────
    J.rHip = new THREE.Group();
    J.rHip.position.set(0.10, -0.05, 0);
    J.root.add(J.rHip);
    J.rHip.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), jointMat));

    J.rThigh = new THREE.Group();
    J.rHip.add(J.rThigh);
    const rThighMesh = this._createCapsule(0.07, 0.32, bodyMat);
    rThighMesh.position.y = -0.23;
    J.rThigh.add(rThighMesh);

    J.rKnee = new THREE.Group();
    J.rKnee.position.y = -0.46;
    J.rThigh.add(J.rKnee);

    const rShinMesh = this._createCapsule(0.06, 0.32, bodyMat);
    rShinMesh.position.y = -0.22;
    J.rKnee.add(rShinMesh);

    J.rFoot = new THREE.Group();
    J.rFoot.position.y = -0.44;
    J.rKnee.add(J.rFoot);
    const rFootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), jointMat);
    rFootMesh.position.set(0, -0.04, 0.06);
    rFootMesh.castShadow = true;
    J.rFoot.add(rFootMesh);

    // Cache base Y positions for animation reference
    this._cacheBaseY(J);
  }

  // ─────────────────────────────────────────────────────
  //  Procedural Animator (Upgraded with Foot Planting)
  // ─────────────────────────────────────────────────────
  _tickProceduralRig(J, dt, state) {
    const isMoving = state !== 'idle';
    const isRun = state === 'run';

    const freq = isRun ? 3.2 : isMoving ? 1.8 : 0.8;
    const legAmp = isRun ? 0.70 : isMoving ? 0.45 : 0.0;
    const armAmp = isRun ? 0.55 : isMoving ? 0.32 : 0.0;

    this.animTime += dt * freq;
    const t = this.animTime;
    const swing = Math.sin(t);

    // ── Legs ──────────────────────────────────────────────
    if (J.lHip) J.lHip.rotation.x = swing * legAmp;
    if (J.rHip) J.rHip.rotation.x = -swing * legAmp;

    // Knee bends on back-swing (prevents leg from poking through floor)
    const lKneeBend = isMoving ? Math.max(0, -Math.sin(t)) * legAmp * 0.8 : 0;
    const rKneeBend = isMoving ? Math.max(0, Math.sin(t)) * legAmp * 0.8 : 0;
    if (J.lKnee) J.lKnee.rotation.x = lKneeBend;
    if (J.rKnee) J.rKnee.rotation.x = rKneeBend;

    // ── Procedural Foot Planting (IK Lite) ────────────────
    // Counter-rotates the foot to keep it flat against the ground when the leg bends
    if (J.lFoot) J.lFoot.rotation.x = -(J.lHip.rotation.x + J.lKnee.rotation.x) * 0.8;
    if (J.rFoot) J.rFoot.rotation.x = -(J.rHip.rotation.x + J.rKnee.rotation.x) * 0.8;

    // ── Arms (opposite phase to legs) ────────────────────
    if (J.lShoulder) J.lShoulder.rotation.x = -swing * armAmp;
    if (J.rShoulder) J.rShoulder.rotation.x = swing * armAmp;

    // Natural elbow bend while moving, relaxed at idle
    const elbowBend = isMoving ? 0.20 + Math.abs(swing) * 0.15 : 0.10;
    if (J.lElbow) J.lElbow.rotation.x = -elbowBend;
    if (J.rElbow) J.rElbow.rotation.x = -elbowBend;

    // Slight hand sway for organic feel
    if (J.lHand) J.lHand.rotation.z = swing * 0.1;
    if (J.rHand) J.rHand.rotation.z = -swing * 0.1;

    // ── Body vertical bob ─────────────────────────────────
    const bob = isMoving ? Math.abs(Math.sin(t * 2)) * 0.025 : 0;
    if (J.root) J.root.position.y = (J.root._baseY || 1.05) + bob;

    // ── Idle: gentle sway + breathe ───────────────────────
    if (!isMoving) {
      const sway = Math.sin(t) * 0.015;
      const breathe = Math.sin(t * 0.9) * 0.010;
      if (J.torso) {
        J.torso.rotation.z = sway;
        J.torso.position.y = (J.torso._baseY || 0) + breathe;
      }
      if (J.head) J.head.rotation.y = Math.sin(t * 0.3) * 0.05; // Idle head turn
    } else {
      if (J.torso) {
        J.torso.rotation.z = swing * (isRun ? 0.08 : 0.04);
        J.torso.rotation.x = isRun ? 0.05 : 0.02; // Slight forward lean when moving
      }
    }

    // ── Head slight look-forward bob ─────────────────────
    if (J.head) {
      J.head.rotation.x = isMoving ? -0.06 - Math.abs(swing) * 0.03 : Math.sin(t * 0.5) * 0.015;
    }
  }


  // Store base Y after building so bob has a reference
  _cacheBaseY(J) {
    if (J.root) J.root._baseY = J.root.position.y;
    if (J.torso) J.torso._baseY = J.torso.position.y;
  }

  // ─────────────────────────────────────────────────────
  //  Soldier (GLTF)
  // ─────────────────────────────────────────────────────
  loadSoldierGLTF() {
    if (typeof THREE.GLTFLoader === 'undefined') return;
    const loader = new THREE.GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.1, 1.1, 1.1);
      model.rotation.y = Math.PI;
      model.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
      this.soldierGroup.add(model);

      this.soldierMixer = new THREE.AnimationMixer(model);
      const a = gltf.animations;
      this.soldierActions = {
        Idle: this.soldierMixer.clipAction(a[0]),
        Run: this.soldierMixer.clipAction(a[1]),
        Walk: this.soldierMixer.clipAction(a[3])
      };
      for (const k in this.soldierActions) {
        const ac = this.soldierActions[k];
        ac.enabled = true;
        ac.setEffectiveTimeScale(1);
        ac.setEffectiveWeight(k === 'Idle' ? 1 : 0);
      }
      this.soldierActions.Idle.play();
    }, undefined, err => console.warn('Soldier.glb:', err));
  }

  switchSoldierAnimation(name) {
    if (!this.soldierMixer || this.currentSoldierAct === name) return;
    const old = this.soldierActions[this.currentSoldierAct];
    const next = this.soldierActions[name];
    this.currentSoldierAct = name;
    if (old) old.fadeOut(0.3);
    if (next) { next.reset(); next.setEffectiveWeight(1.0); next.fadeIn(0.3); next.play(); }
  }

  // ─────────────────────────────────────────────────────
  //  Ratamahatta (MD2)
  // ─────────────────────────────────────────────────────
  loadRatamahattaMD2() {
    if (typeof THREE.MD2Character !== 'undefined') {
      this.md2Character = new THREE.MD2Character();
      this.md2Character.scale = 0.035;
      this.md2Character.onLoadComplete = () => {
        this.md2Loaded = true;
        this.md2Character.setAnimation(this.md2PendingAnim);
        this.currentMD2Anim = this.md2PendingAnim;
        if (this.md2Character.weapons?.length > 0) this.md2Character.setWeapon(0);
      };
      this.md2Character.loadParts({
        baseUrl: 'https://threejs.org/examples/models/md2/ratamahatta/',
        body: 'ratamahatta.md2',
        skins: ['ratamahatta.png', 'ctf_b.png', 'ctf_r.png'],
        weapons: [['weapon.md2', 'weapon.png']]
      });
      this.ratamahattaGroup.add(this.md2Character.root);
      this.md2Character.root.rotation.y = Math.PI;
    } else {
      // Low-poly fallback
      const mat = new THREE.MeshStandardMaterial({ color: 0xc84020, roughness: 0.4, metalness: 0.6 });
      const hm = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4), mat);
      b.position.y = 1.05; b.castShadow = true; this.ratamahattaGroup.add(b);
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), hm);
      h.position.y = 1.75; h.castShadow = true; this.ratamahattaGroup.add(h);
    }
  }

  switchMD2Animation(animName) {
    this.md2PendingAnim = animName;
    if (!this.md2Loaded || !this.md2Character?.meshBody) return;
    if (this.currentMD2Anim === animName) return;
    this.currentMD2Anim = animName;
    this.md2Character.setAnimation(animName);
  }

  // ─────────────────────────────────────────────────────
  //  Main Update
  // ─────────────────────────────────────────────────────
  update(dt, input, isAutoWalking, terrainHeight, roadInfo) {
    let dirX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dirZ = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    if (isAutoWalking && dirX === 0 && dirZ === 0) dirZ = 1;

    const isMoving = dirX !== 0 || dirZ !== 0;
    const isRunning = isMoving && input.shift;

    if (isMoving) {
      const targetAngle = Math.atan2(dirX, dirZ);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += diff * this.rotateSpeed * dt;

      this.speed += ((isRunning ? this.runSpeed : this.walkSpeed) - this.speed) * 8 * dt;
      this.position.x += Math.sin(this.angle) * this.speed * dt;
      this.position.z += Math.cos(this.angle) * this.speed * dt;

      if (isAutoWalking && roadInfo) {
        this.position.x += (roadInfo.point.x - this.position.x) * 1.5 * dt;
      }

      const state = isRunning ? 'run' : 'walk';
      this.animState = state;

      if (this.currentAvatar === 'SOLDIER') this.switchSoldierAnimation(isRunning ? 'Run' : 'Walk');
      else if (this.currentAvatar === 'RATAMAHATTA') this.switchMD2Animation(isRunning ? 'run' : 'walk');
    } else {
      this.speed += (0 - this.speed) * 10 * dt;
      this.animState = 'idle';
      if (this.currentAvatar === 'SOLDIER') this.switchSoldierAnimation('Idle');
      else if (this.currentAvatar === 'RATAMAHATTA') this.switchMD2Animation('stand');
    }

    // Ground snap
    this.position.y = terrainHeight + 0.05;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.angle;

    // ── Tick animation systems ────────────────────────────
    if (this.soldierMixer) this.soldierMixer.update(dt);
    if (this.md2Character) this.md2Character.update(dt);

    // Procedural rigs (Mannequin always)
    if (this.currentAvatar === 'MANNEQUIN') {
      this._tickProceduralRig(this.mannequinJoints, dt, this.animState);
    }
  }
}
