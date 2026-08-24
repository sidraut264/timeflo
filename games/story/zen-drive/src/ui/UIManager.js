class UIManager {
  constructor() {
    this.speedPill = document.getElementById('speed-pill');
    this.biomePill = document.getElementById('biome-pill');
    this.biomeLabel = document.getElementById('biome-label');
    this.biomeFade = document.getElementById('biome-fade');
    this.cruiseBtn = document.getElementById('cruise-btn');
    this.modeBtn = document.getElementById('mode-btn');
    this.avatarBtn = document.getElementById('avatar-btn');
    
    this.loadingScreen = document.getElementById('loading');
    this.loadBar = document.getElementById('load-bar');
    
    this.isCruising = false;
    this.isFading = false;
    this.mode = 'CAR'; // 'CAR' or 'CHARACTER'
    
    this.cruiseBtn.addEventListener('click', () => {
      this.isCruising = !this.isCruising;
      this.updateCruiseBtn();
    });

    this.modeBtn.addEventListener('click', () => {
      this.toggleMode();
    });
  }

  toggleMode() {
    this.mode = this.mode === 'CAR' ? 'CHARACTER' : 'CAR';
    this.updateModeBtn();
    this.updateCruiseBtn();
  }

  updateAvatarName(avatarKey) {
    if (!this.avatarBtn) return;
    const labels = {
      SOLDIER:     '👤 Soldier',
      RATAMAHATTA: '👾 Ratamahatta',
      ELF:         '🧝 Elf Girl',
      MANNEQUIN:   '🤖 Mannequin'
    };
    this.avatarBtn.textContent = labels[avatarKey] || '👤 Character';
  }

  updateModeBtn() {
    if (this.mode === 'CHARACTER') {
      this.modeBtn.classList.add('active');
      this.modeBtn.textContent = '🚶 On Foot';
      if (this.avatarBtn) this.avatarBtn.style.display = 'block';
    } else {
      this.modeBtn.classList.remove('active');
      this.modeBtn.textContent = '🚗 Drive Mode';
      if (this.avatarBtn) this.avatarBtn.style.display = 'none';
    }
  }

  updateCruiseBtn() {
    if (this.mode === 'CHARACTER') {
      if (this.isCruising) {
        this.cruiseBtn.classList.add('active');
        this.cruiseBtn.textContent = '✦ Auto Walk';
      } else {
        this.cruiseBtn.classList.remove('active');
        this.cruiseBtn.textContent = '✦ Auto Walk';
      }
    } else {
      if (this.isCruising) {
        this.cruiseBtn.classList.add('active');
        this.cruiseBtn.textContent = '✦ Cruising...';
      } else {
        this.cruiseBtn.classList.remove('active');
        this.cruiseBtn.textContent = '✦ Auto Cruise';
      }
    }
  }

  updateSpeed(speed) {
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
    
    this.biomeFade.style.opacity = '1';
    
    setTimeout(() => {
      applyCallback();
      this.setBiomeName(nextBiome.short, nextBiome.name);
      
      setTimeout(() => {
        this.biomeFade.style.opacity = '0';
        this.isFading = false;
        
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
      progress += Math.random() * 20;
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
    }, 120);
  }
}
