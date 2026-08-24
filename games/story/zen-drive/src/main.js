// Zen Drive - Main Entry
document.addEventListener('DOMContentLoaded', () => {
  const uiManager = new UIManager();
  
  uiManager.simulateLoading(() => {
    initGame();
  });

  function initGame() {
    const engine = new Engine();
    const input = new InputManager();
    const audio = new AudioManager();
    
    const world = new World(engine.scene, engine.renderer);
    const car = new Car(engine.scene);
    
    car.position.set(0, 0.1, 0);

    // Initial Biome Label
    uiManager.setBiomeName(world.biomeManager.current.short, world.biomeManager.current.name);
    uiManager.biomeLabel.style.opacity = '1';
    setTimeout(() => {
      uiManager.biomeLabel.style.opacity = '0';
    }, 4000);
    
    // Default Cruise mode
    setTimeout(() => {
      uiManager.isCruising = true;
      uiManager.updateCruiseBtn();
    }, 800);

    let lastTime = performance.now();
    let camLagX = 0, camLagY = 3.5, camLagZ = -7.5;

    // Audio init on click or key
    const startAudio = () => {
      audio.init();
      document.removeEventListener('keydown', startAudio);
      uiManager.cruiseBtn.removeEventListener('click', startAudio);
    };
    document.addEventListener('keydown', startAudio);
    uiManager.cruiseBtn.addEventListener('click', startAudio);

    function animate() {
      requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05); // Clamp dt to max 50ms (20fps minimum)
      lastTime = now;

      // Get current road info under car
      const roadInfo = world.getRoadInfoAtZ(car.position.z);

      // Update Car Physics & Position
      car.update(dt, input.keys, uiManager.isCruising, roadInfo);

      // Update World (Roads, Terrain chunks, Biomes)
      world.update(car.position, car.speed, uiManager);

      // Ultra-smooth Follow Camera
      const camDist = 7.5;
      const camHeight = 3.2 + Math.abs(car.speed) * 0.04;
      
      const targetCamX = car.position.x - Math.sin(car.angle) * camDist;
      const targetCamY = car.position.y + camHeight;
      const targetCamZ = car.position.z - Math.cos(car.angle) * camDist;

      // Smooth lerp (exponential decay dampening)
      const damp = 1.0 - Math.exp(-6.0 * dt);
      camLagX += (targetCamX - camLagX) * damp;
      camLagY += (targetCamY - camLagY) * damp;
      camLagZ += (targetCamZ - camLagZ) * damp;

      engine.camera.position.set(camLagX, camLagY, camLagZ);
      
      // Look point ahead of car
      const lookAhead = 16.0;
      const lookX = car.position.x + Math.sin(car.angle) * lookAhead;
      const lookY = car.position.y + 1.2;
      const lookZ = car.position.z + Math.cos(car.angle) * lookAhead;
      
      engine.camera.lookAt(lookX, lookY, lookZ);

      // Update UI and Audio
      uiManager.updateSpeed(car.speed);
      audio.update(car.speed, car.MAX_SPEED);

      // Render Scene
      engine.render();
    }

    animate();
  }
});
