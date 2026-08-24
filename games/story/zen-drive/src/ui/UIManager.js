class UIManager {
  constructor() {
    this.speedPill = document.getElementById('speed-pill');
    this.biomePill = document.getElementById('biome-pill');
    this.biomeLabel = document.getElementById('biome-label');
    this.biomeFade = document.getElementById('biome-fade');
    this.cruiseBtn = document.getElementById('cruise-btn');
    
    this.loadingScreen = document.getElementById('loading');
    this.loadBar = document.getElementById('load-bar');
    
    this.isCruising = false;
    this.isFading = false;
    
    this.cruiseBtn.addEventListener('click', () => {
      this.isCruising = !this.isCruising;
      this.updateCruiseBtn();
    });
  }

  updateCruiseBtn() {
    if (this.isCruising) {
      this.cruiseBtn.classList.add('active');
      this.cruiseBtn.textContent = '✦ Cruising...';
    } else {
      this.cruiseBtn.classList.remove('active');
      this.cruiseBtn.textContent = '✦ Auto Cruise';
    }
  }

  updateSpeed(speed) {
    // Convert units to km/h (approx)
    const kmh = Math.round(Math.abs(speed) * 2.5);
    this.speedPill.textContent = `${kmh} km/h`;
  }

  setBiomeName(shortName, fullName) {
    this.biomePill.textContent = shortName;
    this.biomeLabel.textContent = fullName;
  }

  triggerBiomeTransition(nextBiome, applyCallback) {
    if (this.isFading) return;
    this.isFading = true;
    
    // Fade to black
    this.biomeFade.style.opacity = '1';
    
    setTimeout(() => {
      // Apply the biome changes internally while screen is black
      applyCallback();
      this.setBiomeName(nextBiome.short, nextBiome.name);
      
      setTimeout(() => {
        // Fade back in
        this.biomeFade.style.opacity = '0';
        this.isFading = false;
        
        // Show big center label
        this.biomeLabel.style.opacity = '1';
        setTimeout(() => {
          this.biomeLabel.style.opacity = '0';
        }, 4000);
      }, 500);
    }, 1600);
  }

  simulateLoading(onComplete) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      this.loadBar.style.width = `${Math.min(progress, 100)}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.loadingScreen.style.opacity = '0';
          setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            onComplete();
          }, 1400);
        }, 500);
      }
    }, 150);
  }
}
