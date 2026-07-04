// DiplomacySystem.js — Дипломатическая система (игрок сам решает)

import { addNotification } from '../utils/helpers.js';

export class DiplomacySystem {
    constructor(gameState, world, entities) {
        this.gameState = gameState;
        this.world = world;
        this.entities = entities;
    }
    
    declareWar(targetId) {
        const myId = this.gameState.myCountryId;
        
        if (this.gameState.isAtWar(myId, targetId)) {
            addNotification('Уже в состоянии войны!', 'war');
            return false;
        }
        
        const newAlliances = [];
        for (const alliance of this.gameState.alliances) {
            if (alliance.has(myId) && alliance.has(targetId)) {
                addNotification(`Альянс с ${targetId} разорван!`, 'war');
                continue;
            }
            newAlliances.push(alliance);
        }
        this.gameState.alliances = newAlliances;
        
        this.gameState.addWar(myId, targetId);
        addNotification(`⚔️ ${myId} объявляет войну ${targetId}!`, 'war');
        
        return true;
    }
    
    proposeAlliance(targetId) {
        const myId = this.gameState.myCountryId;
        
        if (this.gameState.isAtWar(myId, targetId)) {
            addNotification('Нельзя заключить альянс с врагом!', 'war');
            return false;
        }
        
        if (this.gameState.areAllies(myId, targetId)) {
            addNotification('Уже в альянсе!', 'info');
            return false;
        }
        
        // Для ИИ — автоматически принимаем? НЕТ! Только для демо-режима
        // Но для игрока — показываем уведомление и ждём ответа?
        // Сейчас просто 80% шанс для упрощения
        
        if (Math.random() < 0.8) {
            this.gameState.addAlliance(myId, targetId);
            addNotification(`🤝 ${myId} и ${targetId} заключили альянс!`, 'info');
        } else {
            addNotification(`❌ ${targetId} отклонил предложение альянса.`, 'info');
        }
        
        return true;
    }
    
    kickFromAlliance(allyId) {
        const myId = this.gameState.myCountryId;
        const newAlliances = [];
        
        for (const alliance of this.gameState.alliances) {
            if (alliance.has(myId) && alliance.has(allyId)) {
                addNotification(`👋 ${allyId} исключён из альянса!`, 'info');
                continue;
            }
            newAlliances.push(alliance);
        }
        
        this.gameState.alliances = newAlliances;
    }
    
    callToWar(allyId) {
        const myId = this.gameState.myCountryId;
        const myEnemies = [];
        
        for (const war of this.gameState.wars) {
            if (war.a === myId) myEnemies.push(war.b);
            if (war.b === myId) myEnemies.push(war.a);
        }
        
        for (const enemy of myEnemies) {
            if (!this.gameState.isAtWar(allyId, enemy)) {
                this.gameState.addWar(allyId, enemy);
            }
        }
        
        addNotification(`📢 ${allyId} вступает в войну на нашей стороне!`, 'war');
    }
    
    checkCapitulation(countryId) {
        const cells = this.world.getCountryCells(countryId);
        
        if (cells.size === 0) {
            this.handleCapitulation(countryId);
            return true;
        }
        
        if (cells.size < 3) {
            addNotification(`💀 ${countryId} КАПИТУЛИРУЕТ!`, 'war');
            this.handleCapitulation(countryId);
            return true;
        }
        
        return false;
    }
    
    handleCapitulation(countryId) {
        let winner = null;
        for (const war of this.gameState.wars) {
            if (war.a === countryId) winner = war.b;
            if (war.b === countryId) winner = war.a;
            if (winner) break;
        }
        
        if (!winner) return;
        
        const cells = this.world.getCountryCells(countryId);
        for (const cell of cells) {
            const [x, y] = cell.split(',').map(Number);
            this.world.setCell(x, y, winner);
        }
        
        const units = this.entities.getEntitiesByOwner(countryId);
        for (const unitId of units) {
            this.entities.removeEntity(unitId);
        }
        
        this.gameState.wars = this.gameState.wars.filter(w => w.a !== countryId && w.b !== countryId);
        
        const newAlliances = [];
        for (const alliance of this.gameState.alliances) {
            const newAlliance = new Set(alliance);
            newAlliance.delete(countryId);
            if (newAlliance.size > 1) {
                newAlliances.push(newAlliance);
            }
        }
        this.gameState.alliances = newAlliances;
        
        if (countryId === this.gameState.myCountryId) {
            addNotification('💀 ВАША СТРАНА КАПИТУЛИРОВАЛА! Игра окончена.', 'war');
            this.gameState.setGameSpeed(0);
            this.gameState.isGameActive = false;
        }
    }
}
