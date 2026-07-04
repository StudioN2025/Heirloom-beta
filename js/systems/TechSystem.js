// TechSystem.js — Система исследований (отдельно для каждой страны)

import { addNotification } from '../utils/helpers.js';

export class TechSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.RESEARCH_DURATION = 100;
        
        // Технологии для разных стран
        if (!this.gameState.countryTech) {
            this.gameState.countryTech = new Map();
        }
        if (!this.gameState.countryResearch) {
            this.gameState.countryResearch = new Map();
        }
    }
    
    getTechForCountry(countryId) {
        if (!this.gameState.countryTech.has(countryId)) {
            this.gameState.countryTech.set(countryId, {
                industry: 1,
                infantry: 1,
                tank: 1
            });
        }
        return this.gameState.countryTech.get(countryId);
    }
    
    setTechForCountry(countryId, tech) {
        this.gameState.countryTech.set(countryId, tech);
    }
    
    getResearchForCountry(countryId) {
        return this.gameState.countryResearch.get(countryId) || null;
    }
    
    setResearchForCountry(countryId, research) {
        this.gameState.countryResearch.set(countryId, research);
    }
    
    canResearch(countryId, techType, level) {
        const tech = this.getTechForCountry(countryId);
        const current = tech[techType];
        if (current >= level) return false;
        if (current + 1 !== level) return false;
        if (this.getResearchForCountry(countryId) !== null) return false;
        return true;
    }
    
    startResearch(countryId, techType, level) {
        if (!this.canResearch(countryId, techType, level)) return false;
        
        this.setResearchForCountry(countryId, {
            type: techType,
            level: level,
            daysLeft: this.RESEARCH_DURATION
        });
        
        if (countryId === this.gameState.myCountryId) {
            addNotification(`🔬 Исследование ${techType} ур.${level} начато!`, 'info');
        }
        return true;
    }
    
    update() {
        // Обновляем исследования для всех стран
        const allCountries = Array.from(this.gameState.countryTech.keys());
        
        for (const countryId of allCountries) {
            const active = this.getResearchForCountry(countryId);
            if (!active) continue;
            
            active.daysLeft--;
            
            if (active.daysLeft <= 0) {
                const tech = this.getTechForCountry(countryId);
                tech[active.type] = active.level;
                this.setTechForCountry(countryId, tech);
                this.setResearchForCountry(countryId, null);
                
                if (countryId === this.gameState.myCountryId) {
                    addNotification(`✅ ${active.type} уровень ${active.level} изучен!`, 'info');
                }
            }
        }
    }
    
    // Для UI игрока
    getPlayerTech() {
        return this.getTechForCountry(this.gameState.myCountryId);
    }
    
    getPlayerResearch() {
        return this.getResearchForCountry(this.gameState.myCountryId);
    }
}
