class World {
  constructor(scene, renderer) {
    this.scene = scene;

    this.biomeManager = new BiomeManager(scene, renderer);
    this.weatherSystem = new WeatherSystem(scene);
    this.roadGenerator = new RoadGenerator(scene);
    this.terrainGenerator = new TerrainGenerator(scene, this.roadGenerator);
    this.biomeFX = new BiomeFX(scene);

    this.distanceTraveled = 0;
    this.BIOME_CHANGE_DIST = 16000;
  }

  update(carPos, speed, uiManager) {
    // 1. Update Subsystems
    this.biomeManager.update(carPos);
    this.weatherSystem.update(carPos);
    this.roadGenerator.update(carPos.z);

    const biome = this.biomeManager.current;

    // Push biome colors to road/terrain
    this.roadGenerator.setColors(biome.road, biome.dash);
    this.terrainGenerator.setColor(biome.ground);

    this.terrainGenerator.update(carPos.x, carPos.z, biome);
    this.terrainGenerator.animate(performance.now() / 1000);
    this.biomeFX.update(biome, carPos, performance.now() / 1000);

    // 2. Track Distance and Transition Biomes
    this.distanceTraveled += Math.abs(speed);

    if (this.distanceTraveled > this.BIOME_CHANGE_DIST && !uiManager.isFading) {
      this.distanceTraveled = 0;

      const nextBiome = this.biomeManager.nextBiome();

      uiManager.triggerBiomeTransition(nextBiome, () => {
        this.biomeManager.applyBiome(nextBiome);
      });
    }
  }

  getRoadInfoAtZ(z) {
    return this.roadGenerator.getRoadInfoAtZ(z);
  }
}
