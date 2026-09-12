// TechSystem.js — Простое дерево: 5 уровней по каждой ветке

import { addNotification } from '../utils/helpers.js';

export const TECH_TREE = {
    industry_1: { id: 'industry_1', name: 'Базовая промышленность', desc: '+5% производство', branch: 'industry', level: 1, cost: 60,  effect: { productionBonus: 0.05 }, icon: '🏭' },
    industry_2: { id: 'industry_2', name: 'Массовое производство', desc: '+10% производство', branch: 'industry', level: 2, cost: 80,  effect: { productionBonus: 0.10 }, icon: '🏭' },
    industry_3: { id: 'industry_3', name: 'Сборочные линии', desc: '+15% производство', branch: 'industry', level: 3, cost: 100, effect: { productionBonus: 0.15 }, icon: '⚙️' },
    industry_4: { id: 'industry_4', name: 'Автоматизация', desc: '+20% производство', branch: 'industry', level: 4, cost: 130, effect: { productionBonus: 0.20 }, icon: '🤖' },
    industry_5: { id: 'industry_5', name: 'Нанотехнологии', desc: '+25% производство', branch: 'industry', level: 5, cost: 160, effect: { productionBonus: 0.25 }, icon: '🔬' },

    infantry_1: { id: 'infantry_1', name: 'Стандартное оружие', desc: '+5% атака/защита', branch: 'infantry', level: 1, cost: 60,  effect: { infantryAttack: 0.05, infantryDefense: 0.05 }, icon: '🔫' },
    infantry_2: { id: 'infantry_2', name: 'Автоматическое оружие', desc: '+10% атака', branch: 'infantry', level: 2, cost: 80,  effect: { infantryAttack: 0.10 }, icon: '🔫' },
    infantry_3: { id: 'infantry_3', name: 'Мотопехота', desc: '+15% атака, +5% защита', branch: 'infantry', level: 3, cost: 100, effect: { infantryAttack: 0.15, infantryDefense: 0.05 }, icon: '🛻' },
    infantry_4: { id: 'infantry_4', name: 'Десант', desc: '+20% атака, +10% защита', branch: 'infantry', level: 4, cost: 130, effect: { infantryAttack: 0.20, infantryDefense: 0.10 }, icon: '🪂' },
    infantry_5: { id: 'infantry_5', name: 'Элитные части', desc: '+25% атака, +15% защита', branch: 'infantry', level: 5, cost: 160, effect: { infantryAttack: 0.25, infantryDefense: 0.15 }, icon: '⭐' },

    tank_1: { id: 'tank_1', name: 'Лёгкие танки', desc: '+5% атака/защита', branch: 'tank', level: 1, cost: 70,  effect: { tankAttack: 0.05, tankDefense: 0.05 }, icon: '🚜' },
    tank_2: { id: 'tank_2', name: 'Средние танки', desc: '+10% атака', branch: 'tank', level: 2, cost: 90,  effect: { tankAttack: 0.10 }, icon: '🚜' },
    tank_3: { id: 'tank_3', name: 'Тяжёлые танки', desc: '+15% атака, +10% броня', branch: 'tank', level: 3, cost: 120, effect: { tankAttack: 0.15, tankArmor: 10 }, icon: '🛡️' },
    tank_4: { id: 'tank_4', name: 'САУ', desc: '+20% атака', branch: 'tank', level: 4, cost: 150, effect: { tankAttack: 0.20 }, icon: '🔥' },
    tank_5: { id: 'tank_5', name: 'Супертанки', desc: '+25% атака, +15% броня', branch: 'tank', level: 5, cost: 180, effect: { tankAttack: 0.25, tankArmor: 15 }, icon: '💀' },
};

export const TECH_BRANCHES = {
    industry: { name: 'Промышленность', color: '#3b82f6', icon: '🏭' },
    infantry: { name: 'Пехота', color: '#22c55e', icon: '💂' },
    tank:     { name: 'Танки', color: '#eab308', icon: '🚜' },
};

export class TechSystem {
    constructor(gameState) {
        this.gameState = gameState;
        if (!this.gameState.countryTech) this.gameState.countryTech = new Map();
        if (!this.gameState.countryResearch) this.gameState.countryResearch = new Map();
    }

    getUnlocked(countryId) {
        if (!this.gameState.countryTech || !(this.gameState.countryTech instanceof Map)) {
            this.gameState.countryTech = new Map();
        }
        if (!this.gameState.countryTech.has(countryId)) {
            this.gameState.countryTech.set(countryId, new Set(['industry_1', 'infantry_1', 'tank_1']));
        }
        return this.gameState.countryTech.get(countryId);
    }

    isUnlocked(countryId, techId) {
        return this.getUnlocked(countryId).has(techId);
    }

    _getPrereq(techId) {
        const tech = TECH_TREE[techId];
        if (!tech || tech.level <= 1) return null;
        return `${tech.branch}_${tech.level - 1}`;
    }

    canResearch(countryId, techId) {
        if (this.isUnlocked(countryId, techId)) return false;
        if (this.getResearchForCountry(countryId)) return false;
        const prereq = this._getPrereq(techId);
        if (prereq && !this.isUnlocked(countryId, prereq)) return false;
        return true;
    }

    getResearchForCountry(countryId) {
        return this.gameState.countryResearch.get(countryId) || null;
    }

    setResearchForCountry(countryId, research) {
        this.gameState.countryResearch.set(countryId, research);
        // Синхронизируем activeResearch для TopBar
        if (countryId === this.gameState.myCountryId) {
            this.gameState.activeResearch = research;
        }
    }

    startResearch(countryId, techId) {
        if (!this.canResearch(countryId, techId)) return false;
        const tech = TECH_TREE[techId];
        this.setResearchForCountry(countryId, { techId, daysLeft: tech.cost });
        if (countryId === this.gameState.myCountryId) {
            addNotification(`🔬 Исследование: ${tech.name}`, 'info');
        }
        return true;
    }

    update() {
        for (const [countryId, active] of this.gameState.countryResearch) {
            if (!active) continue;
            active.daysLeft--;
            if (active.daysLeft <= 0) {
                const unlocked = this.getUnlocked(countryId);
                unlocked.add(active.techId);
                this.setResearchForCountry(countryId, null);
                if (countryId === this.gameState.myCountryId) {
                    const tech = TECH_TREE[active.techId];
                    addNotification(`✅ Изучено: ${tech.name}!`, 'info');
                }
            }
        }
    }

    getEffect(countryId, effectKey) {
        let total = 0;
        const unlocked = this.getUnlocked(countryId);
        if (!unlocked) return 0;
        for (const techId of unlocked) {
            const tech = TECH_TREE[techId];
            if (tech && tech.effect && tech.effect[effectKey] !== undefined) {
                total += tech.effect[effectKey];
            }
        }
        return total;
    }

    getPlayerTech() { return this.getUnlocked(this.gameState.myCountryId); }
    getPlayerResearch() { return this.getResearchForCountry(this.gameState.myCountryId); }
}
