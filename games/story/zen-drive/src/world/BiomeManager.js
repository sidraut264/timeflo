const DAY_BIOMES = [
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
    sky: [0x081830, 0x144078, 0x3888d0], fog: { color: 0x4090d8, near: 60, far: 420 },
    ground: 0x4e6040, road: 0x262830, dash: 0xeef4ff, ambient: 0.68, sunCol: 0xfff6d8, sunStr: 1.9,
    sunPos: [200, 170, -300], exposure: 1.1, treeCount: 90, spread: 90, hRange: [6, 16], treeType: 'palm',
  },
  {
    id: 'savanna', name: 'Dry Savanna', short: 'Savanna',
    sky: [0x2b5b84, 0x5a8fb4, 0xd0c4a8], fog: { color: 0xc0b490, near: 40, far: 450 },
    ground: 0x8c7841, road: 0x302a24, dash: 0xfff0c0, ambient: 0.75, sunCol: 0xffe8b0, sunStr: 2.0,
    sunPos: [100, 150, -100], exposure: 1.15, treeCount: 110, spread: 140, hRange: [5, 12], treeType: 'savanna',
  },
  {
    id: 'swamp', name: 'Murky Swamp', short: 'Swamp',
    sky: [0x152520, 0x3a5040, 0x768870], fog: { color: 0x5a6b5c, near: 15, far: 180 },
    ground: 0x1a2e15, road: 0x1c1e18, dash: 0x889988, ambient: 0.55, sunCol: 0xd0e8d0, sunStr: 1.1,
    sunPos: [40, 90, -120], exposure: 0.9, treeCount: 190, spread: 60, hRange: [8, 17], treeType: 'swamp',
  },
  {
    id: 'volcanic', name: 'Volcanic Ash', short: 'Volcanic',
    sky: [0x100a0a, 0x2a1515, 0x602a2a], fog: { color: 0x3a1a1a, near: 25, far: 250 },
    ground: 0x1a1515, road: 0x111111, dash: 0xff4400, ambient: 0.40, sunCol: 0xff6644, sunStr: 1.4,
    sunPos: [-120, 100, -180], exposure: 1.0, treeCount: 80, spread: 100, hRange: [4, 10], treeType: 'volcanic',
  },
];

const NIGHT_BIOMES = [
  {
    id: 'forest', name: 'Midnight Forest', short: 'Forest',
    sky: [0x020305, 0x070f1a, 0x12243b],
    fog: { color: 0x09121a, near: 30, far: 200 },
    ground: 0x0a1508, road: 0x111113, dash: 0x666666,
    ambient: 0.15, sunCol: 0x8aa8d6, sunStr: 0.4,
    sunPos: [80, 140, -160], exposure: 1.0,
    treeCount: 220, spread: 80, hRange: [7, 18],
    treeType: 'pine',
  },
  {
    id: 'autumn', name: 'Autumn Night', short: 'Autumn',
    sky: [0x050204, 0x1a0a06, 0x38180a],
    fog: { color: 0x180b06, near: 20, far: 180 },
    ground: 0x170a04, road: 0x12100e, dash: 0x776644,
    ambient: 0.15, sunCol: 0xc48f6c, sunStr: 0.5,
    sunPos: [-130, 80, -110], exposure: 1.1,
    treeCount: 170, spread: 75, hRange: [5, 14],
    treeType: 'autumn',
  },
  {
    id: 'desert', name: 'Moonlit Desert', short: 'Desert',
    sky: [0x03060a, 0x0a141a, 0x223344],
    fog: { color: 0x161e24, near: 40, far: 250 },
    ground: 0x221a12, road: 0x151210, dash: 0x777777,
    ambient: 0.2, sunCol: 0xa8b4c2, sunStr: 0.6,
    sunPos: [160, 220, -220], exposure: 1.2,
    treeCount: 70, spread: 120, hRange: [2, 6],
    treeType: 'cactus',
  },
  {
    id: 'snow', name: 'Arctic Night', short: 'Snow',
    sky: [0x020408, 0x081022, 0x1c304a],
    fog: { color: 0x121a24, near: 25, far: 190 },
    ground: 0x1a2228, road: 0x141418, dash: 0x777777,
    ambient: 0.25, sunCol: 0x98b0d4, sunStr: 0.45,
    sunPos: [65, 100, -190], exposure: 0.95,
    treeCount: 150, spread: 70, hRange: [4, 12],
    treeType: 'snowPine',
  },
  {
    id: 'blossom', name: 'Night Blossom', short: 'Blossom',
    sky: [0x050204, 0x180a14, 0x331a28],
    fog: { color: 0x1c1018, near: 25, far: 200 },
    ground: 0x101a0c, road: 0x141216, dash: 0x664455,
    ambient: 0.15, sunCol: 0xb488a0, sunStr: 0.4,
    sunPos: [-90, 120, -130], exposure: 1.05,
    treeCount: 170, spread: 65, hRange: [5, 13],
    treeType: 'blossom',
  },
  {
    id: 'coastal', name: 'Midnight Coast', short: 'Coastal',
    sky: [0x010306, 0x040a14, 0x0c1e30],
    fog: { color: 0x0a1422, near: 40, far: 240 },
    ground: 0x121810, road: 0x101014, dash: 0x556677,
    ambient: 0.2, sunCol: 0x88aacc, sunStr: 0.5,
    sunPos: [200, 170, -300], exposure: 1.1,
    treeCount: 90, spread: 90, hRange: [6, 16],
    treeType: 'palm',
  },
  {
    id: 'savanna', name: 'Savanna Night', short: 'Savanna',
    sky: [0x020305, 0x070f1a, 0x12243b], fog: { color: 0x151e28, near: 30, far: 300 },
    ground: 0x2a281e, road: 0x151310, dash: 0x666655, ambient: 0.2, sunCol: 0x99aacc, sunStr: 0.5,
    sunPos: [100, 150, -100], exposure: 1.0, treeCount: 110, spread: 140, hRange: [5, 12], treeType: 'savanna',
  },
  {
    id: 'swamp', name: 'Midnight Swamp', short: 'Swamp',
    sky: [0x010302, 0x050f0a, 0x0f1a14], fog: { color: 0x0c1510, near: 10, far: 140 },
    ground: 0x0d140a, road: 0x10110e, dash: 0x334433, ambient: 0.1, sunCol: 0x668877, sunStr: 0.3,
    sunPos: [40, 90, -120], exposure: 0.85, treeCount: 190, spread: 60, hRange: [8, 17], treeType: 'swamp',
  },
  {
    id: 'volcanic', name: 'Cooling Lava', short: 'Volcanic',
    sky: [0x000000, 0x0a0202, 0x1a0505], fog: { color: 0x0f0303, near: 20, far: 200 },
    ground: 0x110a0a, road: 0x0a0a0a, dash: 0x992200, ambient: 0.15, sunCol: 0xaa3322, sunStr: 0.6,
    sunPos: [-120, 100, -180], exposure: 0.95, treeCount: 80, spread: 100, hRange: [4, 10], treeType: 'volcanic',
  },
];

const SUNSET_BIOMES = [
  {
    id: 'forest', name: 'Sunset Forest', short: 'Forest',
    sky: [0x1a0a1e, 0x8b3a2a, 0xf59c50],
    fog: { color: 0xc2663a, near: 35, far: 260 },
    ground: 0x2a1e0e, road: 0x1e1a14, dash: 0xffcc88,
    ambient: 0.45, sunCol: 0xff8040, sunStr: 1.8,
    sunPos: [180, 18, -80], exposure: 1.15,
    treeCount: 220, spread: 80, hRange: [7, 18],
    treeType: 'pine',
  },
  {
    id: 'autumn', name: 'Sunset Valley', short: 'Autumn',
    sky: [0x1e0c06, 0xb04010, 0xf9a030],
    fog: { color: 0xd86030, near: 30, far: 220 },
    ground: 0x3a1808, road: 0x1e180e, dash: 0xffdb70,
    ambient: 0.45, sunCol: 0xff6020, sunStr: 2.2,
    sunPos: [-200, 12, -60], exposure: 1.2,
    treeCount: 170, spread: 75, hRange: [5, 14],
    treeType: 'autumn',
  },
  {
    id: 'desert', name: 'Desert Dusk', short: 'Desert',
    sky: [0x1c0c18, 0x7a2c20, 0xf0a050],
    fog: { color: 0xc07040, near: 50, far: 360 },
    ground: 0x7a4020, road: 0x281c10, dash: 0xffdd99,
    ambient: 0.55, sunCol: 0xff7030, sunStr: 2.0,
    sunPos: [220, 10, -40], exposure: 1.25,
    treeCount: 70, spread: 120, hRange: [2, 6],
    treeType: 'cactus',
  },
  {
    id: 'snow', name: 'Twilight Snow', short: 'Snow',
    sky: [0x180818, 0x704060, 0xf0b090],
    fog: { color: 0xb07868, near: 25, far: 200 },
    ground: 0xb0907a, road: 0x201c1a, dash: 0xffddb0,
    ambient: 0.40, sunCol: 0xff9060, sunStr: 1.5,
    sunPos: [190, 14, -70], exposure: 1.1,
    treeCount: 150, spread: 70, hRange: [4, 12],
    treeType: 'snowPine',
  },
  {
    id: 'blossom', name: 'Blossom Dusk', short: 'Blossom',
    sky: [0x1e0810, 0x9a3850, 0xf48870],
    fog: { color: 0xc06868, near: 30, far: 230 },
    ground: 0x2c1c18, road: 0x1a1218, dash: 0xffaa88,
    ambient: 0.42, sunCol: 0xff7050, sunStr: 1.7,
    sunPos: [-190, 10, -50], exposure: 1.1,
    treeCount: 170, spread: 65, hRange: [5, 13],
    treeType: 'blossom',
  },
  {
    id: 'coastal', name: 'Coastal Sunset', short: 'Coastal',
    sky: [0x140610, 0x8a3830, 0xf09060],
    fog: { color: 0xc07050, near: 45, far: 320 },
    ground: 0x3a2a18, road: 0x201814, dash: 0xffcc88,
    ambient: 0.48, sunCol: 0xff6830, sunStr: 2.1,
    sunPos: [240, 8, -30], exposure: 1.2,
    treeCount: 90, spread: 90, hRange: [6, 16],
    treeType: 'palm',
  },
  {
    id: 'savanna', name: 'Savanna Dusk', short: 'Savanna',
    sky: [0x180a1e, 0x8b3a2a, 0xf59c50], fog: { color: 0xd87b40, near: 35, far: 350 },
    ground: 0x6a4825, road: 0x221a15, dash: 0xffcc88, ambient: 0.5, sunCol: 0xff7030, sunStr: 1.8,
    sunPos: [140, 12, -90], exposure: 1.1, treeCount: 110, spread: 140, hRange: [5, 12], treeType: 'savanna',
  },
  {
    id: 'swamp', name: 'Swamp Twilight', short: 'Swamp',
    sky: [0x101510, 0x4a3a2a, 0x857050], fog: { color: 0x605540, near: 15, far: 160 },
    ground: 0x202a15, road: 0x151610, dash: 0x998866, ambient: 0.4, sunCol: 0xd09060, sunStr: 1.3,
    sunPos: [60, 8, -100], exposure: 0.95, treeCount: 190, spread: 60, hRange: [8, 17], treeType: 'swamp',
  },
  {
    id: 'volcanic', name: 'Ember Skies', short: 'Volcanic',
    sky: [0x0a0505, 0x3a0a0a, 0x801515], fog: { color: 0x4a1010, near: 25, far: 250 },
    ground: 0x1a0a0a, road: 0x0f0a0a, dash: 0xff4400, ambient: 0.35, sunCol: 0xff3311, sunStr: 1.6,
    sunPos: [-150, 10, -150], exposure: 1.05, treeCount: 80, spread: 100, hRange: [4, 10], treeType: 'volcanic',
  },
];

class BiomeManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.timeOfDay = 'day';
    this.currentIndex = 0;
    this.current = DAY_BIOMES[0];
    
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

  toggleTimeOfDay() {
    // Cycle: night → sunset → day → night
    if (this.timeOfDay === 'night') this.timeOfDay = 'sunset';
    else if (this.timeOfDay === 'sunset') this.timeOfDay = 'day';
    else this.timeOfDay = 'night';
    const sourceArray = this.timeOfDay === 'day' ? DAY_BIOMES
      : this.timeOfDay === 'sunset' ? SUNSET_BIOMES
      : NIGHT_BIOMES;
    this.applyBiome(sourceArray[this.currentIndex], false);
  }

  nextBiome() {
    const sourceArray = this.timeOfDay === 'day' ? DAY_BIOMES
      : this.timeOfDay === 'sunset' ? SUNSET_BIOMES
      : NIGHT_BIOMES;
    this.currentIndex = (this.currentIndex + 1) % sourceArray.length;
    return sourceArray[this.currentIndex];
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
