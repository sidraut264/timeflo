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
    const character = new Character(engine.scene);
    
    car.position.set(0, 0.1, 0);
    character.position.set(2, 0, 0);

    // Initial Biome Label
    uiManager.setBiomeName(world.biomeManager.current.short, world.biomeManager.current.name);
    uiManager.biomeLabel.style.opacity = '1';
    setTimeout(() => {
      uiManager.biomeLabel.style.opacity = '0';
    }, 4000);
    
    // Default Cruise mode for Car
    setTimeout(() => {
      uiManager.isCruising = true;
      uiManager.updateCruiseBtn();
    }, 800);

    let lastTime = performance.now();
    let camLagX = 0, camLagY = 3.5, camLagZ = -7.5;
    let vKeyDebounce = false;
    let xKeyDebounce = false;
    let tKeyDebounce = false;
    let rKeyDebounce = false;

    // Avatar switch button handler (desktop + mobile)
    const handleAvatarSwitch = () => {
      const nextAv = character.nextAvatar();
      uiManager.updateAvatarName(nextAv);
      if (uiManager.mobileAvatarBtn) uiManager.mobileAvatarBtn.textContent = uiManager.avatarBtn ? uiManager.avatarBtn.textContent : '\ud83d\udc64';
    };
    if (uiManager.avatarBtn) uiManager.avatarBtn.addEventListener('click', handleAvatarSwitch);
    if (uiManager.mobileAvatarBtn) uiManager.mobileAvatarBtn.addEventListener('click', handleAvatarSwitch);

    // Time toggle (desktop time-btn icon)
    if (uiManager.timeBtn) {
      uiManager.timeBtn.addEventListener('click', () => {
        world.biomeManager.toggleTimeOfDay();
        uiManager.updateTimeBtn(world.biomeManager.timeOfDay);
      });
    }

    // Weather toggle (desktop + mobile)
    const handleWeatherToggle = () => {
      world.weatherSystem.toggleWeather();
      uiManager.updateWeatherBtn(world.weatherSystem.type);
    };
    if (uiManager.weatherBtn) uiManager.weatherBtn.addEventListener('click', handleWeatherToggle);
    if (uiManager.mobileWeatherBtn) uiManager.mobileWeatherBtn.addEventListener('click', handleWeatherToggle);

    // Apply default Night biome on start
    world.biomeManager.toggleTimeOfDay(); // starts as 'day', toggle to 'night'
    uiManager.updateTimeBtn('night');

    // Audio init on click or key
    const startAudio = () => {
      audio.init();
      document.removeEventListener('keydown', startAudio);
      if (uiManager.cruiseBtn) uiManager.cruiseBtn.removeEventListener('click', startAudio);
      if (uiManager.modeBtn) uiManager.modeBtn.removeEventListener('click', startAudio);
    };
    document.addEventListener('keydown', startAudio);
    if (uiManager.cruiseBtn) uiManager.cruiseBtn.addEventListener('click', startAudio);
    if (uiManager.modeBtn) uiManager.modeBtn.addEventListener('click', startAudio);

    function animate() {
      requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05); // Clamp dt to max 50ms
      lastTime = now;

      // Handle V key mode switch debounce
      if (input.keys.switchMode) {
        if (!vKeyDebounce) {
          vKeyDebounce = true;
          uiManager.toggleMode();
          if (uiManager.mode === 'CHARACTER') {
            character.position.set(car.position.x + 2.5, car.position.y, car.position.z);
            character.angle = car.angle;
          }
        }
      } else {
        vKeyDebounce = false;
      }

      // Handle X key avatar switch debounce
      if (input.keys.switchAvatar) {
        if (!xKeyDebounce) {
          xKeyDebounce = true;
          const nextAv = character.nextAvatar();
          uiManager.updateAvatarName(nextAv);
        }
      } else {
        xKeyDebounce = false;
      }

      // Handle T key time switch debounce
      if (input.keys.switchTime) {
        if (!tKeyDebounce) {
          tKeyDebounce = true;
          world.biomeManager.toggleTimeOfDay();
          uiManager.updateTimeBtn(world.biomeManager.timeOfDay);
        }
      } else {
        tKeyDebounce = false;
      }

      // Handle R key weather switch debounce
      if (input.keys.switchWeather) {
        if (!rKeyDebounce) {
          rKeyDebounce = true;
          world.weatherSystem.toggleWeather();
          uiManager.updateWeatherBtn(world.weatherSystem.type);
        }
      } else {
        rKeyDebounce = false;
      }

      const activePos = uiManager.mode === 'CAR' ? car.position : character.position;
      const activeSpeed = uiManager.mode === 'CAR' ? car.speed : character.speed;
      const activeAngle = uiManager.mode === 'CAR' ? car.angle : character.angle;

      // Get current road info under player
      const roadInfo = world.getRoadInfoAtZ(activePos.z);

      if (uiManager.mode === 'CAR') {
        // Car Mode
        car.group.visible = true;
        character.group.visible = false;

        car.update(dt, input.keys, uiManager.isCruising, roadInfo, uiManager.sensitivity);
      } else {
        // On Foot Mode (Character)
        car.group.visible = true; // Keep car visible parked on road!
        character.group.visible = true;

        const currentTerrainHeight = world.terrainGenerator.getTerrainHeight(character.position.x, character.position.z);
        character.update(dt, input.keys, uiManager.isCruising, currentTerrainHeight, roadInfo);
      }

      // Update World (Roads, Terrain chunks, Biomes)
      world.update(activePos, activeSpeed, uiManager);

      // Ultra-smooth Follow Camera
      const isCar = uiManager.mode === 'CAR';
      const camDist = isCar ? 7.5 : 4.5;
      const camHeight = isCar ? (3.2 + Math.abs(car.speed) * 0.04) : 2.2;
      
      const targetCamX = activePos.x - Math.sin(activeAngle) * camDist;
      const targetCamY = activePos.y + camHeight;
      const targetCamZ = activePos.z - Math.cos(activeAngle) * camDist;

      const damp = 1.0 - Math.exp(-6.0 * dt);
      camLagX += (targetCamX - camLagX) * damp;
      camLagY += (targetCamY - camLagY) * damp;
      camLagZ += (targetCamZ - camLagZ) * damp;

      engine.camera.position.set(camLagX, camLagY, camLagZ);
      
      const lookAhead = isCar ? 16.0 : 8.0;
      const lookX = activePos.x + Math.sin(activeAngle) * lookAhead;
      const lookY = activePos.y + (isCar ? 1.2 : 1.4);
      const lookZ = activePos.z + Math.cos(activeAngle) * lookAhead;
      
      engine.camera.lookAt(lookX, lookY, lookZ);

      // Update UI and Audio
      uiManager.updateSpeed(activeSpeed);
      audio.update(activeSpeed, isCar ? car.MAX_SPEED : character.runSpeed);

      // Render Scene
      engine.render();
    }

    animate();
  }
});
