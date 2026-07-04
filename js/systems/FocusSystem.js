// FocusSystem.js — Система национальных фокусов

import { NATIONAL_FOCUSES } from '../data/Units.js';
import { addNotification } from '../utils/helpers.js';

export class FocusSystem {
    constructor(gameState, world, entities) {
        this.gameState = gameState;
        this.world = world;
        this.entities = entities;
        this.FOCUS_DURATION = 70;
    }
    
    getFocusesForCountry() {
        const focuses = NATIONAL_FOCUSES[this.gameState.myCountryId];
        return focuses || [];
    }
    
    getAvailableFocuses() {
        const focuses = this.getFocusesForCountry();
        const completed = this.gameState.completedFocuses || new Set();
        
        return focuses.filter(f => !completed.has(f.id) && this.checkPrerequisites(f.id));
    }
    
    checkPrerequisites(focusId) {
        const focuses = this.getFocusesForCountry();
        const focus = focuses.find(f => f.id === focusId);
        if (!focus || !focus.prereqs || focus.prereqs.length === 0) return true;
        return focus.prereqs.every(prereq => this.gameState.completedFocuses.has(prereq));
    }
    
    startFocus(focusId) {
        const focuses = this.getFocusesForCountry();
        const focus = focuses.find(f => f.id === focusId);
        
        if (!focus) return false;
        if (this.gameState.completedFocuses.has(focus.id)) return false;
        if (this.gameState.activeFocus) return false;
        if (!this.checkPrerequisites(focusId)) return false;
        
        this.gameState.activeFocus = {
            ...focus,
            daysLeft: this.FOCUS_DURATION
        };
        
        addNotification(`⭐ Фокус "${focus.name}" начат!`, 'info');
        return true;
    }
    
    update() {
        const active = this.gameState.activeFocus;
        if (!active) return;
        
        active.daysLeft--;
        
        if (active.daysLeft <= 0) {
            this.applyFocusEffect(active);
            this.gameState.completedFocuses.add(active.id);
            this.gameState.activeFocus = null;
            addNotification(`✅ Фокус "${active.name}" завершён!`, 'info');
        }
    }
    
    applyFocusEffect(focus) {
        const myId = this.gameState.myCountryId;
        
        switch(focus.id) {
            case 'ger_rearm':
                this.gameState.equipment += 1000;
                break;
            case 'ger_danzig':
                this.gameState.addWar(myId, 'poland');
                break;
            case 'ger_axis':
                this.gameState.addAlliance(myId, 'italy');
                this.gameState.addAlliance(myId, 'hungary');
                this.gameState.addAlliance(myId, 'romania');
                break;
            case 'ger_west':
                this.gameState.addWar(myId, 'france');
                this.gameState.addWar(myId, 'belgium');
                this.gameState.addWar(myId, 'netherlands');
                break;
            case 'ger_break_pact':
                this.gameState.addWar(myId, 'ussr');
                for (let i = 0; i < 4; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 1, x + i, y);
                    }
                }
                break;
            case 'ussr_five_year':
                this.addFactories(5);
                break;
            case 'ussr_industry':
                this.addFactories(10);
                this.gameState.equipment += 3000;
                break;
            case 'ussr_fin_war':
                this.gameState.addWar(myId, 'finland');
                break;
            case 'ussr_baltic':
                const balticStates = ['lithuania', 'latvia', 'estonia'];
                for (const baltic of balticStates) {
                    const cells = this.world.getCountryCells(baltic);
                    for (const cell of cells) {
                        const [x, y] = cell.split(',').map(Number);
                        this.world.setCell(x, y, myId);
                    }
                }
                break;
            case 'ussr_defense':
                for (let i = 0; i < 6; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 0, x + i, y);
                    }
                }
                this.gameState.equipment += 2000;
                break;
            case 'fra_maginot':
                this.addFactories(3);
                break;
            case 'fra_colonies':
                for (let i = 0; i < 5; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 0, x + i, y);
                    }
                }
                break;
            case 'fra_allies':
                this.gameState.addAlliance(myId, 'uk');
                this.gameState.addAlliance(myId, 'poland');
                break;
            case 'fra_revanche':
                this.gameState.addWar(myId, 'germany');
                break;
            case 'uk_navy':
                this.addPorts(3);
                this.gameState.equipment += 1000;
                break;
            case 'uk_empire':
                this.addFactories(5);
                this.gameState.equipment += 2000;
                break;
            case 'uk_guarantee':
                this.gameState.addAlliance(myId, 'poland');
                break;
            case 'uk_raf':
                for (let i = 0; i < 4; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 0, x + i, y);
                    }
                }
                this.gameState.equipment += 1000;
                break;
            case 'ita_navy':
                this.addPorts(2);
                break;
            case 'ita_empire':
                this.gameState.equipment += 1000;
                for (let i = 0; i < 2; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 1, x + i, y);
                    }
                }
                break;
            case 'ita_revive':
                this.gameState.addWar(myId, 'yugoslavia');
                this.gameState.addWar(myId, 'greece');
                break;
            case 'ita_allies':
                this.gameState.addAlliance(myId, 'spain');
                this.gameState.addAlliance(myId, 'portugal');
                break;
            case 'pol_army':
                for (let i = 0; i < 3; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 0, x + i, y);
                    }
                }
                break;
            case 'pol_industry':
                this.addFactories(3);
                break;
            case 'pol_allies':
                this.gameState.addAlliance(myId, 'france');
                this.gameState.addAlliance(myId, 'uk');
                break;
            case 'pol_defense':
                for (let i = 0; i < 2; i++) {
                    const cells = Array.from(this.world.getCountryCells(myId));
                    if (cells.length > 0) {
                        const [x, y] = cells[0].split(',').map(Number);
                        this.entities.createEntity(myId, 1, x + i, y);
                    }
                }
                break;
        }
    }
    
    addFactories(count) {
        const myId = this.gameState.myCountryId;
        const cells = Array.from(this.world.getCountryCells(myId));
        let added = 0;
        
        for (const cell of cells) {
            if (added >= count) break;
            const [x, y] = cell.split(',').map(Number);
            if (!this.world.hasBuilding(x, y, 'factory')) {
                this.world.addBuilding(x, y, 'factory');
                added++;
            }
        }
    }
    
    addPorts(count) {
        const myId = this.gameState.myCountryId;
        const cells = Array.from(this.world.getCountryCells(myId));
        let added = 0;
        
        for (const cell of cells) {
            if (added >= count) break;
            const [x, y] = cell.split(',').map(Number);
            const isCoastal = this.isCoastal(x, y);
            if (isCoastal && !this.world.hasBuilding(x, y, 'port')) {
                this.world.addBuilding(x, y, 'port');
                added++;
            }
        }
    }
    
    isCoastal(x, y) {
        const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
        for (const [dx, dy] of neighbors) {
            if (this.world.getCell(x + dx, y + dy) === 0) return true;
        }
        return false;
    }
}
