const BIOMES = [
  {
    id: 'forest', name: 'Pine Forest', short: 'Forest',
    sky: [0x153556, 0x3a7ab0, 0x86b0d8],
    fog: { color: 0x5a90b4, near: 50, far: 350 },
    ground: 0x243e1c, road: 0x252528, dash: 0xeeeac8,
    ambient: 0.65, sunCol: 0xfff4d8, sunStr: 1.3,
    sunPos: [80, 140, -160], exposure: 1.0,
    treeCount: 220, spread: 80, hRange: [7, 18],
    treeType: 'pine',
  },
  {
    id: 'autumn', name: 'Autumn Valley', short: 'Autumn',
    sky: [0x301420, 0x8c3814, 0xf29048],
    fog: { color: 0xd47030, near: 40, far: 280 },
    ground: 0x4e280c, road: 0x24201c, dash: 0xffd880,
    ambient: 0.60, sunCol: 0xffa040, sunStr: 1.6,
    sunPos: [-130, 80, -110], exposure: 1.1,
    treeCount: 170, spread: 75, hRange: [5, 14],
    treeType: 'autumn',
  },
  {
    id: 'desert', name: 'Desert Canyons', short: 'Desert',
    sky: [0x142848, 0x386898, 0xf4c868],
    fog: { color: 0xe2a858, near: 80, far: 500 },
    ground: 0x9e6434, road: 0x342c22, dash: 0xfffae0,
    ambient: 0.80, sunCol: 0xffeb9e, sunStr: 2.2,
    sunPos: [160, 220, -220], exposure: 1.2,
    treeCount: 70, spread: 120, hRange: [2, 6],
    treeType: 'cactus',
  },
  {
    id: 'snow', name: 'Snowy Peaks', short: 'Snow',
    sky: [0x0a1630, 0x204078, 0x90b8e0],
    fog: { color: 0xb8d2ec, near: 30, far: 240 },
    ground: 0xdeeaee, road: 0x2c2c34, dash: 0xffffff,
    ambient: 0.70, sunCol: 0xe8f4ff, sunStr: 1.2,
    sunPos: [65, 100, -190], exposure: 0.95,
    treeCount: 150, spread: 70, hRange: [4, 12],
    treeType: 'snowPine',
  },
  {
    id: 'blossom', name: 'Cherry Blossom', short: 'Blossom',
    sky: [0x241020, 0x9c5878, 0xffd0e8],
    fog: { color: 0xe89ebc, near: 35, far: 260 },
    ground: 0x3a5a2c, road: 0x282630, dash: 0xffbcd8,
    ambient: 0.65, sunCol: 0xffa4c8, sunStr: 1.4,
    sunPos: [-90, 120, -130], exposure: 1.05,
    treeCount: 170, spread: 65, hRange: [5, 13],
    treeType: 'blossom',
  },
  {
    id: 'coastal', name: 'Ocean Cliffs', short: 'Coastal',
    sky: [0x081830, 0x144078, 0x3888d0],
    fog: { color: 0x4090d8, near: 60, far: 420 },
    ground: 0x4e6040, road: 0x262830, dash: 0xeef4ff,
    ambient: 0.68, sunCol: 0xfff6d8, sunStr: 1.9,
    sunPos: [200, 170, -300], exposure: 1.1,
    treeCount: 90, spread: 90, hRange: [6, 16],
    treeType: 'palm',
  },
];

class BiomeManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.currentIndex = 0;
    this.current = BIOMES[0];
    
    // Core lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 800;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    // Fog
    this.scene.fog = new THREE.Fog(0x000000, 10, 100);

    // Sky Dome
    this.buildSky();
    
    this.applyBiome(this.current, true);
  }

  buildSky() {
    const geo = new THREE.SphereGeometry(600, 32, 16);
    geo.scale(-1, 1, 1);
    
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color() },
        mid: { value: new THREE.Color() },
        bot: { value: new THREE.Color() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 top, mid, bot;
        varying vec3 vWorldPosition;
        void main() {
          vec3 point = normalize(vWorldPosition);
          float h = point.y;
          vec3 col = h > 0.0 ? mix(mid, top, h) : mix(mid, bot, clamp(-h * 3.0, 0.0, 1.0));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    
    this.skyMesh = new THREE.Mesh(geo, this.skyMat);
    this.scene.add(this.skyMesh);
  }

  applyBiome(biome, instant = false) {
    this.current = biome;
    
    const fogCol = new THREE.Color(biome.fog.color);
    this.scene.fog.color.copy(fogCol);
    this.scene.fog.near = biome.fog.near;
    this.scene.fog.far = biome.fog.far;
    
    this.scene.background = fogCol; // Sets ambient clear background color matching fog
    
    this.ambientLight.intensity = biome.ambient;
    this.sunLight.color.setHex(biome.sunCol);
    this.sunLight.intensity = biome.sunStr;
    this.sunLight.position.set(...biome.sunPos);
    
    this.skyMat.uniforms.top.value.setHex(biome.sky[0]);
    this.skyMat.uniforms.mid.value.setHex(biome.sky[1]);
    this.skyMat.uniforms.bot.value.setHex(biome.sky[2]);
    
    this.renderer.toneMappingExposure = biome.exposure;
  }

  nextBiome() {
    this.currentIndex = (this.currentIndex + 1) % BIOMES.length;
    return BIOMES[this.currentIndex];
  }

  update(carPos) {
    if (this.skyMesh) {
      this.skyMesh.position.set(carPos.x, carPos.y, carPos.z);
    }
    this.sunLight.position.set(carPos.x + this.current.sunPos[0], carPos.y + this.current.sunPos[1], carPos.z + this.current.sunPos[2]);
    this.sunLight.target.position.copy(carPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
