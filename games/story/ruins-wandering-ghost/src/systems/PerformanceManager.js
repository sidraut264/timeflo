import { applyQualitySettings } from "../core/Renderer.js";

export const QUALITY_TIERS = {
    ultra: {
        id: 'ultra',
        pixelRatio: 2.0,
        shadowMapSize: 2048,
        shadowsEnabled: true,
        rubbleScale: 1.0,
        treeShadows: true,
        structureShadows: true
    },
    high: {
        id: 'high',
        pixelRatio: 1.5,
        shadowMapSize: 1024,
        shadowsEnabled: true,
        rubbleScale: 0.5,
        treeShadows: false,
        structureShadows: true
    },
    medium: {
        id: 'medium',
        pixelRatio: 1.0,
        shadowMapSize: 512,
        shadowsEnabled: true,
        rubbleScale: 0.25,
        treeShadows: false,
        structureShadows: true
    },
    low: {
        id: 'low',
        pixelRatio: 0.75,
        shadowMapSize: 512,
        shadowsEnabled: false,
        rubbleScale: 0.0,
        treeShadows: false,
        structureShadows: false
    }
};

const TIER_ORDER = ['low', 'medium', 'high', 'ultra'];

export class PerformanceManager {
    constructor(scene, uiElement) {
        this.scene = scene;
        this.uiElement = uiElement;
        
        this.mode = 'auto'; // 'auto', 'low', 'medium', 'high', 'ultra'
        this.currentTier = 'high'; // internal current tier
        
        this.frameCount = 0;
        this.timeElapsed = 0;
        this.fps = 60;
        
        this.lowFpsTimer = 0;
        this.highFpsTimer = 0;

        // Apply initial
        this.applyTier(this.currentTier);
    }

    setMode(mode) {
        this.mode = mode;
        if (mode !== 'auto') {
            this.applyTier(mode);
        }
        console.log("Quality Mode set to:", mode);
    }

    applyTier(tierId) {
        if (this.currentTier === tierId && this.frameCount > 0) return; // already applied
        this.currentTier = tierId;
        console.log(`Applying Quality Tier: ${tierId}`);
        const config = QUALITY_TIERS[tierId];
        applyQualitySettings(config, this.scene);
    }

    update(delta) {
        this.frameCount++;
        this.timeElapsed += delta;

        // Update FPS every second
        if (this.timeElapsed >= 1.0) {
            this.fps = this.frameCount / this.timeElapsed;
            this.frameCount = 0;
            this.timeElapsed = 0;

            if (this.uiElement) {
                this.uiElement.textContent = `FPS: ${Math.round(this.fps)} | ${this.currentTier.toUpperCase()}`;
            }

            // Auto scaling logic
            if (this.mode === 'auto') {
                if (this.fps < 40) {
                    this.lowFpsTimer += 1.0;
                    this.highFpsTimer = 0;
                } else if (this.fps >= 58) {
                    this.highFpsTimer += 1.0;
                    this.lowFpsTimer = 0;
                } else {
                    this.lowFpsTimer = 0;
                    this.highFpsTimer = 0;
                }

                if (this.lowFpsTimer >= 3.0) {
                    // Downgrade
                    const idx = TIER_ORDER.indexOf(this.currentTier);
                    if (idx > 0) {
                        this.applyTier(TIER_ORDER[idx - 1]);
                    }
                    this.lowFpsTimer = 0;
                } else if (this.highFpsTimer >= 8.0) {
                    // Upgrade
                    const idx = TIER_ORDER.indexOf(this.currentTier);
                    if (idx < TIER_ORDER.length - 1) {
                        this.applyTier(TIER_ORDER[idx + 1]);
                    }
                    this.highFpsTimer = 0;
                }
            }
        }
    }
}
