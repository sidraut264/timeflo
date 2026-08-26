class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.type = 'CLEAR'; // 'CLEAR', 'RAIN', 'SNOW'
    this.particleCount = 5000;
    
    // Geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount); // custom velocity per particle

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i] = 0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    // Materials
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    // Mesh
    this.particleSystem = new THREE.Points(this.geometry, this.rainMaterial);
    this.particleSystem.visible = false;
    this.scene.add(this.particleSystem);
  }

  setWeather(type) {
    this.type = type;
    if (this.type === 'CLEAR') {
      this.particleSystem.visible = false;
    } else if (this.type === 'RAIN') {
      this.particleSystem.material = this.rainMaterial;
      this.particleSystem.visible = true;
    } else if (this.type === 'SNOW') {
      this.particleSystem.material = this.snowMaterial;
      this.particleSystem.visible = true;
    }
  }

  toggleWeather() {
    const types = ['CLEAR', 'RAIN', 'SNOW'];
    const idx = types.indexOf(this.type);
    const nextIdx = (idx + 1) % types.length;
    this.setWeather(types[nextIdx]);
  }

  update(carPos, speed, deltaTime) {
    if (this.type === 'CLEAR') return;

    this.particleSystem.position.set(carPos.x, 0, carPos.z);

    const positions = this.geometry.attributes.position.array;
    const velocities = this.geometry.attributes.velocity.array;

    const dt = deltaTime || 0.016;
    const isRain = this.type === 'RAIN';
    
    for (let i = 0; i < this.particleCount; i++) {
      velocities[i] -= isRain ? (0.1 + Math.random() * 0.1) : (0.01 + Math.random() * 0.02);
      
      positions[i * 3 + 1] += velocities[i];
      // Wind / Car movement influence
      positions[i * 3 + 2] += (isRain ? 0.2 : 0.05) - speed * dt * 0.5;

      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 50;
        velocities[i] = 0;
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}
