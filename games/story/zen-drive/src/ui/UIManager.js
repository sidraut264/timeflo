class UIManager {
  constructor() {
    this.speedPill = document.getElementById('speed-pill');
    this.biomePill = document.getElementById('biome-pill');
    this.biomeLabel = document.getElementById('biome-label');
    this.biomeFade = document.getElementById('biome-fade');
    // Desktop buttons
    this.cruiseBtn = document.getElementById('cruise-btn');
    this.modeBtn = document.getElementById('mode-btn');
    this.avatarBtn = document.getElementById('avatar-btn');
    this.timeBtn = document.getElementById('time-btn');
    this.weatherBtn = document.getElementById('weather-btn');
    // Mobile settings
    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsPanel = document.getElementById('settings-panel');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');
    this.mobileModeBtn = document.getElementById('mobile-mode-btn');
    this.mobileAvatarBtn = document.getElementById('mobile-avatar-btn');
    this.mobileAvatarPlaceholder = document.getElementById('mobile-avatar-placeholder');
    this.mobileWeatherBtn = document.getElementById('mobile-weather-btn');
    this.mobileCruiseBtn = document.getElementById('mobile-cruise-btn');

    this.loadingScreen = document.getElementById('loading');
    this.loadBar = document.getElementById('load-bar');
    
    this.isCruising = false;
    this.isFading = false;
    this.mode = 'CAR'; // 'CAR' or 'CHARACTER'

    // Desktop cruise/mode listeners
    if (this.cruiseBtn) this.cruiseBtn.addEventListener('click', () => {
      this.isCruising = !this.isCruising;
      this.updateCruiseBtn();
    });
    if (this.modeBtn) this.modeBtn.addEventListener('click', () => this.toggleMode());

    // Mobile settings panel toggle
    if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.openSettings());
    if (this.settingsCloseBtn) this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());
    if (this.mobileCruiseBtn) this.mobileCruiseBtn.addEventListener('click', () => {
      this.isCruising = !this.isCruising;
      this.updateCruiseBtn();
      this.updateMobileCruiseBtn();
    });
    if (this.mobileModeBtn) this.mobileModeBtn.addEventListener('click', () => {
      this.toggleMode();
      this.updateMobileModeBtn();
    });

    this.timeOfDay = 'night';
    this.weather = 'CLEAR';

    // Initialize time button to show night icon
    this.updateTimeBtn('night');
  }

  openSettings() {
    if (this.settingsPanel) this.settingsPanel.classList.add('open');
  }
  closeSettings() {
    if (this.settingsPanel) this.settingsPanel.classList.remove('open');
  }

  updateTimeBtn(timeOfDay) {
    if (!this.timeBtn) return;
    this.timeBtn.textContent = timeOfDay === 'day' ? '☀️' : '🌙';
    this.timeBtn.title = timeOfDay === 'day' ? 'Switch to Night' : 'Switch to Day';
  }

  updateWeatherBtn(weather) {
    const labels = { 'CLEAR': '☁️ Clear', 'RAIN': '🌧️ Rain', 'SNOW': '❄️ Snow' };
    const label = labels[weather] || '☁️ Clear';
    if (this.weatherBtn) this.weatherBtn.textContent = label;
    if (this.mobileWeatherBtn) this.mobileWeatherBtn.textContent = label;
  }

  updateMobileModeBtn() {
    if (!this.mobileModeBtn) return;
    this.mobileModeBtn.textContent = this.mode === 'CAR' ? '🚗 Drive' : '🚶 On Foot';
    this.mobileModeBtn.classList.toggle('active', this.mode === 'CHARACTER');
    // Show/hide character selector in panel
    if (this.mobileAvatarBtn) this.mobileAvatarBtn.style.display = this.mode === 'CHARACTER' ? 'inline-block' : 'none';
    if (this.mobileAvatarPlaceholder) this.mobileAvatarPlaceholder.style.display = this.mode === 'CHARACTER' ? 'none' : 'inline-block';
  }

  updateMobileCruiseBtn() {
    if (!this.mobileCruiseBtn) return;
    this.mobileCruiseBtn.textContent = this.isCruising ? '✦ Cruising...' : '✦ Auto Cruise';
    this.mobileCruiseBtn.classList.toggle('active', this.isCruising);
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
