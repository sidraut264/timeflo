class Character {
  constructor(scene) {
    this.scene    = scene;
    this.position = new THREE.Vector3(0, 0, 0);
    this.angle    = 0;
    this.speed    = 0;

    // Movement speeds
    this.walkSpeed   = 8.0;
    this.runSpeed    = 22.0;
    this.rotateSpeed = 8.0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Avatar order cycle
    this.currentAvatar = 'SOLDIER';
    const AVATARS = ['SOLDIER', 'RATAMAHATTA', 'ELF', 'MANNEQUIN'];

    // Sub-groups per avatar
    this.soldierGroup     = new THREE.Group();
    this.ratamahattaGroup = new THREE.Group();
    this.elfGroup         = new THREE.Group();
    this.mannequinGroup   = new THREE.Group();

    this.group.add(this.soldierGroup);
    this.group.add(this.ratamahattaGroup);
    this.group.add(this.elfGroup);
    this.group.add(this.mannequinGroup);

    // ── Soldier (GLTF) ──────────────────────────────────
    this.soldierMixer       = null;
    this.soldierActions     = {};
    this.currentSoldierAct  = 'Idle';

    // ── Ratamahatta (MD2) ────────────────────────────────
    this.md2Character    = null;
    this.md2Loaded       = false;
    this.md2PendingAnim  = 'stand';
    this.currentMD2Anim  = 'stand';

    // ── Elf Girl (Collada) ───────────────────────────────
    this.elfMixer      = null;
    this.elfActions    = {};
    this.currentElfAct = null;
    this.elfLoaded     = false;
    this.elfPendingAnim = null;

    // ── Shared procedural animation clock ───────────────
    this.animTime      = 0;   // seconds, advances every update
    this.animState     = 'idle'; // 'idle' | 'walk' | 'run'
    // Joint registries for procedural rigs
    this.mannequinJoints = {};
    this.elfJoints       = {};

    this._buildArticulatedMannequin();
    this._buildArticulatedElfFallback();
    this.loadSoldierGLTF();
    this.loadRatamahattaMD2();
    this.loadElfCollada();

    this.updateAvatarVisibility();
  }

  // ─────────────────────────────────────────────────────
  //  Visibility
  // ─────────────────────────────────────────────────────
  updateAvatarVisibility() {
    this.soldierGroup.visible     = this.currentAvatar === 'SOLDIER';
    this.ratamahattaGroup.visible = this.currentAvatar === 'RATAMAHATTA';
    this.elfGroup.visible         = this.currentAvatar === 'ELF';
    this.mannequinGroup.visible   = this.currentAvatar === 'MANNEQUIN';
  }

  nextAvatar() {
    const order = ['SOLDIER', 'RATAMAHATTA', 'ELF', 'MANNEQUIN'];
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

  // ─────────────────────────────────────────────────────
  //  Articulated Mannequin  (full rig, procedural anim)
  // ─────────────────────────────────────────────────────
  _buildArticulatedMannequin() {
    const J = this.mannequinJoints;
    const grp = this.mannequinGroup;

    const bodyMat  = new THREE.MeshStandardMaterial({ color: 0x3a6090, roughness: 0.5, metalness: 0.3 });
    const skinMat  = new THREE.MeshStandardMaterial({ color: 0xe8c0a0, roughness: 0.8 });
    const limbMat  = new THREE.MeshStandardMaterial({ color: 0x4a78b0, roughness: 0.45, metalness: 0.2 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x8aa8cc, roughness: 0.3, metalness: 0.6 });

    // ── Root (hips) ─────────────────────────────────────
    J.root = new THREE.Group();
    J.root.position.y = 0.92;
    grp.add(J.root);

    // Pelvis
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.22, 8), bodyMat);
    pelvis.castShadow = true;
    J.root.add(pelvis);

    // Torso pivot (at pelvis top)
    J.torso = new THREE.Group();
    J.torso.position.y = 0.11;
    J.root.add(J.torso);

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.58, 8), bodyMat);
    torsoMesh.position.y = 0.29;
    torsoMesh.castShadow = true;
    J.torso.add(torsoMesh);

    // Head
    J.head = new THREE.Group();
    J.head.position.y = 0.63;
    J.torso.add(J.head);
    this._sphere(0.17, skinMat, J.head, 0.17);

    // ── Left shoulder → upper-arm → forearm ─────────────
    J.lShoulder = new THREE.Group();
    J.lShoulder.position.set(-0.29, 0.52, 0);
    J.torso.add(J.lShoulder);
    this._sphere(0.055, jointMat, J.lShoulder, 0);

    J.lUpperArm = this._limb(0.055, 0.048, 0.32, limbMat, J.lShoulder);
    this._sphere(0.05, jointMat, J.lUpperArm, -0.32);

    J.lElbow = new THREE.Group();
    J.lElbow.position.y = -0.32;
    J.lUpperArm.add(J.lElbow);
    J.lForearm = this._limb(0.048, 0.038, 0.28, limbMat, J.lElbow);
    this._sphere(0.037, skinMat, J.lForearm, -0.28);

    // ── Right shoulder → upper-arm → forearm ────────────
    J.rShoulder = new THREE.Group();
    J.rShoulder.position.set(0.29, 0.52, 0);
    J.torso.add(J.rShoulder);
    this._sphere(0.055, jointMat, J.rShoulder, 0);

    J.rUpperArm = this._limb(0.055, 0.048, 0.32, limbMat, J.rShoulder);
    this._sphere(0.05, jointMat, J.rUpperArm, -0.32);

    J.rElbow = new THREE.Group();
    J.rElbow.position.y = -0.32;
    J.rUpperArm.add(J.rElbow);
    J.rForearm = this._limb(0.048, 0.038, 0.28, limbMat, J.rElbow);
    this._sphere(0.037, skinMat, J.rForearm, -0.28);

    // ── Left hip → thigh → shin ──────────────────────────
    J.lHip = new THREE.Group();
    J.lHip.position.set(-0.12, -0.11, 0);
    J.root.add(J.lHip);
    this._sphere(0.063, jointMat, J.lHip, 0);

    J.lThigh = this._limb(0.065, 0.057, 0.40, limbMat, J.lHip);
    this._sphere(0.058, jointMat, J.lThigh, -0.40);

    J.lKnee = new THREE.Group();
    J.lKnee.position.y = -0.40;
    J.lThigh.add(J.lKnee);
    J.lShin = this._limb(0.056, 0.043, 0.38, limbMat, J.lKnee);
    this._sphere(0.042, bodyMat, J.lShin, -0.38);

    // ── Right hip → thigh → shin ─────────────────────────
    J.rHip = new THREE.Group();
    J.rHip.position.set(0.12, -0.11, 0);
    J.root.add(J.rHip);
    this._sphere(0.063, jointMat, J.rHip, 0);

    J.rThigh = this._limb(0.065, 0.057, 0.40, limbMat, J.rHip);
    this._sphere(0.058, jointMat, J.rThigh, -0.40);

    J.rKnee = new THREE.Group();
    J.rKnee.position.y = -0.40;
    J.rThigh.add(J.rKnee);
    J.rShin = this._limb(0.056, 0.043, 0.38, limbMat, J.rKnee);
    this._sphere(0.042, bodyMat, J.rShin, -0.38);
  }

  // ─────────────────────────────────────────────────────
  //  Articulated Elf Fallback  (fantasy style, procedural anim)
  //  Used when elf.dae fails to load or has no clips
  // ─────────────────────────────────────────────────────
  _buildArticulatedElfFallback() {
    const J = this.elfJoints;
    const grp = this.elfGroup;

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x4a9050, roughness: 0.55 });
    const skinMat  = new THREE.MeshStandardMaterial({ color: 0xf2c8a0, roughness: 0.75 });
    const hatMat   = new THREE.MeshStandardMaterial({ color: 0x2a6030, roughness: 0.6 });
    const beltMat  = new THREE.MeshStandardMaterial({ color: 0x7b4f1a, roughness: 0.5, metalness: 0.3 });

    // Root
    J.root = new THREE.Group();
    J.root.position.y = 0.88;
    grp.add(J.root);

    // Hips/skirt
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.20, 8), greenMat);
    hips.castShadow = true;
    J.root.add(hips);

    // Torso
    J.torso = new THREE.Group();
    J.torso.position.y = 0.10;
    J.root.add(J.torso);

    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.52, 8), greenMat);
    torsoMesh.position.y = 0.26;
    torsoMesh.castShadow = true;
    J.torso.add(torsoMesh);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.07, 8), beltMat);
    belt.position.y = 0.09;
    J.torso.add(belt);

    // Head
    J.head = new THREE.Group();
    J.head.position.y = 0.57;
    J.torso.add(J.head);
    this._sphere(0.155, skinMat, J.head, 0.155);

    // Pointed hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.155, 0.42, 8), hatMat);
    hat.position.y = 0.46;
    hat.castShadow = true;
    J.head.add(hat);

    // Ears (pointy spheres)
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.12, 6), skinMat);
    earL.position.set(-0.165, 0.17, 0); earL.rotation.z = -Math.PI / 2.3;
    J.head.add(earL);
    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.12, 6), skinMat);
    earR.position.set( 0.165, 0.17, 0); earR.rotation.z =  Math.PI / 2.3;
    J.head.add(earR);

    // ── Left arm ─────────────────────────────────────────
    J.lShoulder = new THREE.Group();
    J.lShoulder.position.set(-0.24, 0.46, 0);
    J.torso.add(J.lShoulder);

    J.lUpperArm = this._limb(0.048, 0.042, 0.28, greenMat, J.lShoulder);
    J.lElbow    = new THREE.Group();
    J.lElbow.position.y = -0.28;
    J.lUpperArm.add(J.lElbow);
    J.lForearm  = this._limb(0.040, 0.032, 0.24, skinMat, J.lElbow);

    // ── Right arm ────────────────────────────────────────
    J.rShoulder = new THREE.Group();
    J.rShoulder.position.set(0.24, 0.46, 0);
    J.torso.add(J.rShoulder);

    J.rUpperArm = this._limb(0.048, 0.042, 0.28, greenMat, J.rShoulder);
    J.rElbow    = new THREE.Group();
    J.rElbow.position.y = -0.28;
    J.rUpperArm.add(J.rElbow);
    J.rForearm  = this._limb(0.040, 0.032, 0.24, skinMat, J.rElbow);

    // ── Left leg ─────────────────────────────────────────
    J.lHip = new THREE.Group();
    J.lHip.position.set(-0.10, -0.10, 0);
    J.root.add(J.lHip);

    J.lThigh = this._limb(0.058, 0.050, 0.36, greenMat, J.lHip);
    J.lKnee  = new THREE.Group();
    J.lKnee.position.y = -0.36;
    J.lThigh.add(J.lKnee);
    J.lShin  = this._limb(0.048, 0.038, 0.34, greenMat, J.lKnee);

    // ── Right leg ────────────────────────────────────────
    J.rHip = new THREE.Group();
    J.rHip.position.set(0.10, -0.10, 0);
    J.root.add(J.rHip);

    J.rThigh = this._limb(0.058, 0.050, 0.36, greenMat, J.rHip);
    J.rKnee  = new THREE.Group();
    J.rKnee.position.y = -0.36;
    J.rThigh.add(J.rKnee);
    J.rShin  = this._limb(0.048, 0.038, 0.34, greenMat, J.rKnee);

    // Mark fallback as built so we skip Collada loading into this group
    J._built = true;
  }

  // ─────────────────────────────────────────────────────
  //  Procedural Animator  (runs every frame for active rig)
  // ─────────────────────────────────────────────────────
  _tickProceduralRig(J, dt, state) {
    // state: 'idle' | 'walk' | 'run'
    const isMoving = state !== 'idle';
    const isRun    = state === 'run';

    const freq   = isRun ? 3.0 : isMoving ? 1.7 : 0.7;
    const legAmp = isRun ? 0.65 : isMoving ? 0.42 : 0.0;
    const armAmp = isRun ? 0.50 : isMoving ? 0.30 : 0.0;

    this.animTime += dt * freq;
    const t = this.animTime;
    const swing = Math.sin(t);       // −1 → +1

    // ── Legs ──────────────────────────────────────────────
    if (J.lHip)  J.lHip.rotation.x  =  swing * legAmp;
    if (J.rHip)  J.rHip.rotation.x  = -swing * legAmp;

    // Knee bends on back-swing (prevents leg from poking through floor)
    const lKneeBend = isMoving ? Math.max(0, -Math.sin(t)) * legAmp * 0.75 : 0;
    const rKneeBend = isMoving ? Math.max(0,  Math.sin(t)) * legAmp * 0.75 : 0;
    if (J.lKnee) J.lKnee.rotation.x = lKneeBend;
    if (J.rKnee) J.rKnee.rotation.x = rKneeBend;

    // ── Arms (opposite phase to legs) ────────────────────
    if (J.lShoulder) J.lShoulder.rotation.x = -swing * armAmp;
    if (J.rShoulder) J.rShoulder.rotation.x =  swing * armAmp;

    // Slight elbow bend while moving
    const elbowBend = isMoving ? 0.18 + Math.abs(swing) * 0.15 : 0;
    if (J.lElbow) J.lElbow.rotation.x = -elbowBend;
    if (J.rElbow) J.rElbow.rotation.x = -elbowBend;

    // ── Body vertical bob ─────────────────────────────────
    const bob = isMoving ? Math.abs(Math.sin(t * 2)) * 0.022 : 0;
    if (J.root) J.root.position.y = (J.root._baseY || 0) + bob;

    // ── Idle: gentle sway + breathe ───────────────────────
    if (!isMoving) {
      const sway = Math.sin(t) * 0.012;
      const breathe = Math.sin(t * 0.9) * 0.008;
      if (J.torso) {
        J.torso.rotation.z = sway;
        J.torso.position.y = (J.torso._baseY || 0) + breathe;
      }
    } else {
      if (J.torso) {
        J.torso.rotation.z = swing * (isRun ? 0.07 : 0.03);
      }
    }

    // ── Head slight look-forward bob ─────────────────────
    if (J.head) {
      J.head.rotation.x = isMoving ? -0.08 - Math.abs(swing) * 0.04 : Math.sin(t * 0.5) * 0.015;
    }
  }

  // Store base Y after building so bob has a reference
  _cacheBaseY(J) {
    if (J.root)  J.root._baseY  = J.root.position.y;
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
      model.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; }});
      this.soldierGroup.add(model);

      this.soldierMixer = new THREE.AnimationMixer(model);
      const a = gltf.animations;
      this.soldierActions = {
        Idle: this.soldierMixer.clipAction(a[0]),
        Run:  this.soldierMixer.clipAction(a[1]),
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
    const old  = this.soldierActions[this.currentSoldierAct];
    const next = this.soldierActions[name];
    this.currentSoldierAct = name;
    if (old)  old.fadeOut(0.3);
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
      const hm  = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
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
  //  Elf Girl (Collada — uses DAE clips when present,
  //  otherwise the articulated fallback rig is used)
  // ─────────────────────────────────────────────────────
  loadElfCollada() {
    if (typeof THREE.ColladaLoader === 'undefined') {
      console.warn('ColladaLoader unavailable – Elf uses procedural fallback.');
      this._cacheBaseY(this.elfJoints);
      return;
    }

    const loader = new THREE.ColladaLoader();
    loader.load(
      'https://threejs.org/examples/models/collada/elf/elf.dae',
      (collada) => {
        const model = collada.scene;
        model.scale.set(0.02, 0.02, 0.02);
        model.rotation.y = Math.PI;
        model.traverse(o => {
          if (o.isMesh || o.isSkinnedMesh) {
            o.castShadow = o.receiveShadow = true;
          }
        });

        // ── Always display the real elf model ──────────────
        // Remove the low-poly fallback procedural rig geometry
        while (this.elfGroup.children.length > 0) {
          this.elfGroup.remove(this.elfGroup.children[0]);
        }
        this.elfGroup.add(model);
        this.elfModel = model;

        // ── Collect clips (r128: only scene.animations is valid) ──
        // collada.animations was deprecated — ignore the getter warning
        const clips = model.animations || [];

        if (clips.length > 0) {
          // ── Use DAE keyframe clips via AnimationMixer ──────
          this.elfMixer = new THREE.AnimationMixer(model);
          const nameOf = c => (c.name || '').toLowerCase();

          const idleClip = clips.find(c => nameOf(c).includes('idle') || nameOf(c).includes('stand')) || clips[0];
          const walkClip = clips.find(c => nameOf(c).includes('walk'))  || clips[Math.min(1, clips.length - 1)];
          const runClip  = clips.find(c => nameOf(c).includes('run'))   || walkClip;

          const make = (clip) => {
            const a = this.elfMixer.clipAction(clip);
            a.setEffectiveWeight(0); a.play();
            return a;
          };
          this.elfActions  = { Idle: make(idleClip), Walk: make(walkClip), Run: make(runClip) };
          this.elfActions.Idle.setEffectiveWeight(1);
          this.currentElfAct = 'Idle';
          console.log(`Elf: ${clips.length} clip(s) found:`, clips.map(c => c.name));

        } else {
          // ── No DAE clips — map her skeleton bones to elfJoints ──
          // so _tickProceduralRig can drive them exactly like the mannequin
          console.log('Elf .dae has no animation clips. Mapping skeleton for procedural anim…');

          const boneMap = {};
          model.traverse(o => {
            if (o.isBone) {
              const n = o.name.toLowerCase();
              boneMap[n] = o;
            }
          });

          // Build elfJoints from real bones (name-heuristic matching)
          const J = this.elfJoints;
          const find = (...keys) => {
            for (const k of keys) {
              for (const [name, bone] of Object.entries(boneMap)) {
                if (name.includes(k)) return bone;
              }
            }
            return null;
          };

          // Hips / root
          J.root  = find('hip', 'pelvis', 'root') || model;
          J.torso = find('spine', 'chest', 'torso');
          J.head  = find('head', 'neck');

          // Arms
          J.lShoulder = find('leftshoulder', 'l_shoulder', 'lshoulder', 'left_arm');
          J.rShoulder = find('rightshoulder', 'r_shoulder', 'rshoulder', 'right_arm');
          J.lElbow    = find('leftelbow', 'l_elbow', 'leftforearm', 'l_forearm');
          J.rElbow    = find('rightelbow', 'r_elbow', 'rightforearm', 'r_forearm');

          // Legs
          J.lHip   = find('leftupleg', 'l_upleg', 'leftthigh', 'l_thigh', 'left_leg');
          J.rHip   = find('rightupleg', 'r_upleg', 'rightthigh', 'r_thigh', 'right_leg');
          J.lKnee  = find('leftleg', 'l_leg', 'leftknee', 'l_knee', 'leftshin');
          J.rKnee  = find('rightleg', 'r_leg', 'rightknee', 'r_knee', 'rightshin');

          console.log('Elf bone mapping:', Object.entries(J).map(([k, v]) => `${k}=${v?.name || 'NOT FOUND'}`).join(', '));
        }

        this.elfLoaded = true;
        if (this.elfPendingAnim) this._applyElfAnim(this.elfPendingAnim);
        this._cacheBaseY(this.elfJoints);
      },
      undefined,
      err => {
        console.warn('elf.dae failed to load:', err);
        // Rebuild the procedural fallback (was cleared when we tried to load)
        this._buildArticulatedElfFallback();
        this._cacheBaseY(this.elfJoints);
      }
    );
  }


  _applyElfAnim(name) {
    if (!this.elfLoaded || !this.elfMixer) return;
    if (this.currentElfAct === name) return;
    const old  = this.elfActions[this.currentElfAct];
    const next = this.elfActions[name];
    if (!next) return;
    this.currentElfAct = name;
    if (old)  old.fadeOut(0.35);
    next.reset(); next.setEffectiveWeight(1.0); next.fadeIn(0.35);
  }

  switchElfAnimation(name) {
    this.elfPendingAnim = name;
    if (this.elfMixer) { this._applyElfAnim(name); }
    // If no mixer, procedural rig handles it via animState in update()
  }

  // ─────────────────────────────────────────────────────
  //  Main Update
  // ─────────────────────────────────────────────────────
  update(dt, input, isAutoWalking, terrainHeight, roadInfo) {
    let dirX = (input.right ? 1 : 0) - (input.left  ? 1 : 0);
    let dirZ = (input.up    ? 1 : 0) - (input.down  ? 1 : 0);
    if (isAutoWalking && dirX === 0 && dirZ === 0) dirZ = 1;

    const isMoving  = dirX !== 0 || dirZ !== 0;
    const isRunning = isMoving && input.shift;

    if (isMoving) {
      const targetAngle = Math.atan2(dirX, dirZ);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      this.angle += diff * this.rotateSpeed * dt;

      this.speed += ((isRunning ? this.runSpeed : this.walkSpeed) - this.speed) * 8 * dt;
      this.position.x += Math.sin(this.angle) * this.speed * dt;
      this.position.z += Math.cos(this.angle) * this.speed * dt;

      if (isAutoWalking && roadInfo) {
        this.position.x += (roadInfo.point.x - this.position.x) * 1.5 * dt;
      }

      const state = isRunning ? 'run' : 'walk';
      this.animState = state;

      if      (this.currentAvatar === 'SOLDIER')     this.switchSoldierAnimation(isRunning ? 'Run' : 'Walk');
      else if (this.currentAvatar === 'RATAMAHATTA')  this.switchMD2Animation(isRunning ? 'run' : 'walk');
      else if (this.currentAvatar === 'ELF')          this.switchElfAnimation(isRunning ? 'Run' : 'Walk');
    } else {
      this.speed += (0 - this.speed) * 10 * dt;
      this.animState = 'idle';
      if      (this.currentAvatar === 'SOLDIER')     this.switchSoldierAnimation('Idle');
      else if (this.currentAvatar === 'RATAMAHATTA')  this.switchMD2Animation('stand');
      else if (this.currentAvatar === 'ELF')          this.switchElfAnimation('Idle');
    }

    // Ground snap
    this.position.y = terrainHeight + 0.05;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.angle;

    // ── Tick animation systems ────────────────────────────
    if (this.soldierMixer) this.soldierMixer.update(dt);
    if (this.md2Character) this.md2Character.update(dt);
    if (this.elfMixer)     this.elfMixer.update(dt);

    // Procedural rigs (Mannequin always; Elf only when no mixer loaded)
    if (this.currentAvatar === 'MANNEQUIN') {
      this._tickProceduralRig(this.mannequinJoints, dt, this.animState);
    }
    if (this.currentAvatar === 'ELF' && !this.elfMixer) {
      this._tickProceduralRig(this.elfJoints, dt, this.animState);
    }
  }
}
