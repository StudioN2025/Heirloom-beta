// ArmyManager.js — Система армий (как в HOI4)

import { addNotification } from '../utils/helpers.js';

const ARMY_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
    '#f43f5e', '#14b8a6', '#a855f7', '#64748b',
];

export class ArmyManager {
    constructor(entities, gameState, world) {
        this.entities = entities;
        this.gs = gameState;
        this.world = world;
        this.armies = [];
        this.nextId = 1;
        this.nextColorIdx = 0;
    }

    createArmy(unitIds) {
        if (!unitIds || unitIds.length < 2) {
            addNotification('Нужно минимум 2 юнита для армии!', 'war');
            return null;
        }

        const e = this.entities;
        const valid = unitIds.filter(id => e.active[id]);
        if (valid.length < 2) {
            addNotification('Недостаточно юнитов!', 'war');
            return null;
        }

        const ownerId = e.owner[valid[0]];
        if (!valid.every(id => e.owner[id] === ownerId)) {
            addNotification('Все юниты должны быть одной страны!', 'war');
            return null;
        }

        for (const id of valid) {
            this.removeFromArmy(id);
        }

        const color = ARMY_COLORS[this.nextColorIdx % ARMY_COLORS.length];
        this.nextColorIdx++;

        const army = {
            id: this.nextId++,
            color,
            name: `Армия ${this.nextId - 1}`,
            unitIds: new Set(valid),
            ownerId,
            frontLine: null,
        };
        this.armies.push(army);

        addNotification(`🎖️ ${army.name} создана (${valid.length} юнитов)`, 'info');
        return army;
    }

    removeFromArmy(unitId) {
        for (const army of this.armies) {
            army.unitIds.delete(unitId);
        }
        this.armies = this.armies.filter(a => a.unitIds.size > 0);
    }

    disbandArmy(armyId) {
        const idx = this.armies.findIndex(a => a.id === armyId);
        if (idx === -1) return;
        addNotification(`🗑️ ${this.armies[idx].name} распущена`, 'info');
        this.armies.splice(idx, 1);
    }

    getArmyForUnit(unitId) {
        return this.armies.find(a => a.unitIds.has(unitId)) || null;
    }

    getArmyUnits(armyId) {
        const army = this.armies.find(a => a.id === armyId);
        if (!army) return [];
        return [...army.unitIds].filter(id => this.entities.active[id]);
    }

    getUnitArmyColor(unitId) {
        const army = this.getArmyForUnit(unitId);
        return army ? army.color : null;
    }

    giveArmyOrder(armyId, targetX, targetY, movementSystem) {
        const army = this.armies.find(a => a.id === armyId);
        if (!army) return false;
        const e = this.entities;

        const units = [...army.unitIds].filter(id =>
            e.active[id] && !e.inCombat[id] && (!e.training || e.training[id] === 0)
        );
        if (!units.length) return false;

        let avgX = 0, avgY = 0;
        for (const uid of units) { avgX += e.x[uid]; avgY += e.y[uid]; }
        avgX /= units.length; avgY /= units.length;

        const dirX = targetX - avgX;
        const dirY = targetY - avgY;
        const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        // Защита от NaN: если len === 0, ставим перпендикуляр (1, 0)
        let perpX = 0, perpY = 0;
        if (len > 0.0001) {
            perpX = -dirY / len;
            perpY = dirX / len;
        } else {
            perpX = 1;
            perpY = 0;
        }

        const targetOwner = this.world.getCell(targetX, targetY);
        const isAttack = targetOwner && targetOwner !== army.ownerId
            && this.gs.isAtWar(army.ownerId, targetOwner);

        let moved = 0;
        const count = units.length;
        for (let i = 0; i < count; i++) {
            const uid = units[i];
            const offset = (i - (count - 1) / 2);

            let tx, ty;
            if (isAttack) {
                tx = targetX + Math.round(perpX * offset);
                ty = targetY + Math.round(perpY * offset);
            } else {
                tx = targetX + Math.round(perpX * offset * 1.5);
                ty = targetY + Math.round(perpY * offset * 1.5);
            }

            if (this.world.getCell(tx, ty) === 0 && !this.world.isWater(tx, ty)) {
                tx = targetX + Math.round(perpX * offset * 0.5);
                ty = targetY + Math.round(perpY * offset * 0.5);
            }

            if (movementSystem.giveOrder(uid, tx, ty)) {
                moved++;
            }
        }

        if (moved > 0) {
            const verb = isAttack ? 'атакует' : 'перемещается';
            addNotification(`🎖️ ${army.name}: ${verb} (${moved} юнитов)`, 'info');
        }
        return moved > 0;
    }

    setFrontLine(armyId, enemyId, movementSystem) {
        const army = this.armies.find(a => a.id === armyId);
        if (!army) return false;

        const borderCells = [];
        const myCells = this.world.getCountryCells(army.ownerId);
        for (const cellKey of myCells) {
            const [x, y] = cellKey.split(',').map(Number);
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                if (this.world.getCell(x + dx, y + dy) === enemyId) {
                    borderCells.push({ x: x + dx, y: y + dy });
                    break;
                }
            }
        }

        if (borderCells.length === 0) {
            addNotification('Нет границы с ' + enemyId.toUpperCase(), 'war');
            return false;
        }

        army.frontLine = { cells: borderCells, enemyId };

        borderCells.sort((a, b) => a.x + a.y - (b.x + b.y));

        const units = [...army.unitIds].filter(id =>
            this.entities.active[id] && !this.entities.inCombat[id]
        );
        for (let i = 0; i < units.length; i++) {
            const cellIdx = i % borderCells.length;
            const target = borderCells[cellIdx];
            let placed = false;
            for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) {
                const tx = target.x + dx, ty = target.y + dy;
                const cellOwner = this.world.getCell(tx, ty);
                if ((cellOwner === army.ownerId || this.gs.areAllies(army.ownerId, cellOwner))
                    && !this.entities.getUnitAt(tx, ty)) {
                    if (movementSystem) movementSystem.giveOrder(units[i], tx, ty);
                    placed = true;
                    break;
                }
            }
            if (!placed && movementSystem) {
                movementSystem.giveOrder(units[i], target.x, target.y);
            }
        }

        addNotification(`🎖️ ${army.name}: привязана к границе ${enemyId.toUpperCase()} (${borderCells.length} клеток)`, 'info');
        return true;
    }

    updateFrontLines(movementSystem) {
        for (const army of this.armies) {
            if (!army.frontLine) continue;

            const units = [...army.unitIds].filter(id =>
                this.entities.active[id] && !this.entities.inCombat[id]
            );
            if (units.length === 0) continue;

            const enemyId = army.frontLine.enemyId;
            const atWar = enemyId && this.gs.isAtWar && this.gs.isAtWar(army.ownerId, enemyId);

            if (atWar) {
                const enemyTargets = [];
                for (const uid of units) {
                    const ux = this.entities.x[uid], uy = this.entities.y[uid];
                    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                        const tx = ux + dx, ty = uy + dy;
                        if (this.world.getCell(tx, ty) === enemyId) {
                            enemyTargets.push({ x: tx, y: ty });
                        }
                    }
                }

                if (enemyTargets.length === 0) {
                    const borderCells = army.frontLine.cells;
                    for (let i = 0; i < units.length; i++) {
                        const uid = units[i];
                        const ux = this.entities.x[uid], uy = this.entities.y[uid];
                        const target = borderCells[i % borderCells.length];
                        if (!target) continue;
                        const dx = Math.sign(target.x - ux);
                        const dy = Math.sign(target.y - uy);
                        const nx = ux + dx, ny = uy + dy;
                        const no = this.world.getCell(nx, ny);
                        if (no && (no === army.ownerId || (this.gs.areAllies && this.gs.areAllies(army.ownerId, no)))
                            && !this.entities.getUnitAt(nx, ny)) {
                            if (movementSystem) movementSystem.giveOrder(uid, nx, ny);
                        }
                    }
                } else {
                    let attackCount = 0;
                    for (let i = 0; i < units.length; i++) {
                        const uid = units[i];
                        if (this.entities.inCombat[uid]) continue;
                        const ux = this.entities.x[uid], uy = this.entities.y[uid];

                        let bestTarget = null, bestDist = Infinity;
                        for (const t of enemyTargets) {
                            const dist = Math.abs(t.x - ux) + Math.abs(t.y - uy);
                            if (dist < bestDist) { bestDist = dist; bestTarget = t; }
                        }
                        if (bestTarget && bestDist <= 3) {
                            if (movementSystem) movementSystem.giveOrder(uid, bestTarget.x, bestTarget.y);
                            attackCount++;
                        } else {
                            const borderCells = army.frontLine.cells;
                            const target = borderCells[i % borderCells.length];
                            if (target) {
                                const dx = Math.sign(target.x - ux);
                                const dy = Math.sign(target.y - uy);
                                const nx = ux + dx, ny = uy + dy;
                                const no = this.world.getCell(nx, ny);
                                if (no && (no === army.ownerId || (this.gs.areAllies && this.gs.areAllies(army.ownerId, no)))
                                    && !this.entities.getUnitAt(nx, ny)) {
                                    if (movementSystem) movementSystem.giveOrder(uid, nx, ny);
                                }
                            }
                        }
                    }
                    if (attackCount > 0 && Math.random() < 0.05) {
                        addNotification('🎖️ ' + army.name + ': атака на ' + enemyId.toUpperCase() + '! (' + attackCount + ' юнитов)', 'war');
                    }
                }
            } else {
                let needsReposition = false;
                for (const uid of units) {
                    const ux = this.entities.x[uid], uy = this.entities.y[uid];
                    let nearBorder = false;
                    for (const bc of army.frontLine.cells) {
                        if (Math.abs(ux - bc.x) <= 1 && Math.abs(uy - bc.y) <= 1) {
                            nearBorder = true;
                            break;
                        }
                    }
                    if (!nearBorder) { needsReposition = true; break; }
                }

                if (!needsReposition) continue;

                const cells = army.frontLine.cells;
                for (let i = 0; i < units.length; i++) {
                    const cellIdx = i % cells.length;
                    const target = cells[cellIdx];
                    for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
                        const tx = target.x + dx, ty = target.y + dy;
                        const cellOwner = this.world.getCell(tx, ty);
                        if ((cellOwner === army.ownerId || (this.gs.areAllies && this.gs.areAllies(army.ownerId, cellOwner)))
                            && !this.entities.getUnitAt(tx, ty)) {
                            if (movementSystem) movementSystem.giveOrder(units[i], tx, ty);
                            break;
                        }
                    }
                }
            }
        }
    }

    update() {
        for (const army of this.armies) {
            for (const uid of army.unitIds) {
                if (!this.entities.active[uid]) {
                    army.unitIds.delete(uid);
                }
            }
        }
        this.armies = this.armies.filter(a => a.unitIds.size > 0);
    }

    getArmiesForCountry(countryId) {
        return this.armies.filter(a => a.ownerId === countryId);
    }
}
