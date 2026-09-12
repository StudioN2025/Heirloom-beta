// FocusSystem.js — Система фокусов

import { addNotification } from '../utils/helpers.js';
import { FOCUS_TREE } from '../data/FocusTree.js';

export { FOCUS_TREE };

export class FocusSystem {
    constructor(gameState, world, entities) {
        this.gameState = gameState;
        this.world = world;
        this.entities = entities;
        this.FOCUS_DURATION = 70;
    }

    getFocusesForCountry(countryId) {
        const id = countryId || this.gameState.myCountryId;
        // Берём из window._FOCUS_TREE (загружено из папки focuses/)
        const tree = window._FOCUS_TREE || {};
        return Object.values(tree).filter(f => f.country === id);
    }

    checkPrerequisites(focusId) {
        const tree = window._FOCUS_TREE || {};
        const focus = tree[focusId];
        if (!focus) return false;
        if (!focus.prereqs || focus.prereqs.length === 0) return true;
        const completed = this.gameState.completedFocuses || new Set();
        return focus.prereqs.every(p => completed.has(p));
    }

    startFocus(focusId) {
        const tree = window._FOCUS_TREE || {};
        const focus = tree[focusId];
        if (!focus) return false;
        const completed = this.gameState.completedFocuses || new Set();
        if (completed.has(focus.id)) return false;
        if (this.gameState.activeFocus) return false;
        if (!this.checkPrerequisites(focusId)) return false;

        this.gameState.activeFocus = { ...focus, daysLeft: this.FOCUS_DURATION };
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
        const eff = focus.effect;
        if (!eff) return;

        if (eff.equipment) this.gameState.equipment += eff.equipment;
        if (eff.manpower) this.gameState.manpower = Math.min(this.gameState.manpower + eff.manpower, this.gameState.maxManpower || 99999);
        if (eff.factories) this._addFactories(eff.factories);
        if (eff.ports) this._addPorts(eff.ports);
        if (eff.war) this.gameState.addWar(myId, eff.war, this.world);
        if (eff.allies) eff.allies.forEach(a => this.gameState.addAlliance(myId, a));
        if (eff.annex) {
            for (const c of eff.annex) {
                const cells = this.world.getCountryCells(c);
                for (const cell of cells) {
                    const [x, y] = cell.split(',').map(Number);
                    this.world.setCell(x, y, myId);
                }
            }
        }
        if (eff.infantry) {
            for (let i = 0; i < eff.infantry; i++) {
                const cells = Array.from(this.world.getCountryCells(myId));
                if (cells.length > 0) {
                    const [x, y] = cells[Math.floor(Math.random() * cells.length)].split(',').map(Number);
                    this.entities.createEntity(myId, 0, x + (i % 3), y + Math.floor(i / 3));
                }
            }
        }
        if (eff.tanks) {
            for (let i = 0; i < eff.tanks; i++) {
                const cells = Array.from(this.world.getCountryCells(myId));
                if (cells.length > 0) {
                    const [x, y] = cells[Math.floor(Math.random() * cells.length)].split(',').map(Number);
                    this.entities.createEntity(myId, 1, x + (i % 3), y + Math.floor(i / 3));
                }
            }
        }
    }

    _addFactories(count) {
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

    _addPorts(count) {
        const myId = this.gameState.myCountryId;
        const cells = Array.from(this.world.getCountryCells(myId));
        let added = 0;
        for (const cell of cells) {
            if (added >= count) break;
            const [x, y] = cell.split(',').map(Number);
            if (this._isCoastal(x, y) && !this.world.hasBuilding(x, y, 'port')) {
                this.world.addBuilding(x, y, 'port');
                added++;
            }
        }
    }

    _isCoastal(x, y) {
        for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            if (this.world.getCell(x + dx, y + dy) === 0) return true;
        }
        return false;
    }
}
