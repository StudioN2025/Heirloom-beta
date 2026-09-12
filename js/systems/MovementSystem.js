// MovementSystem.js — Движение по дням через A*

import { addNotification } from '../utils/helpers.js';

export class MovementSystem {
    constructor(world, entities, gameState) {
        this.world    = world;
        this.entities = entities;
        this.gs       = gameState;
        this.orders   = new Map();
    }

    _areAllied(c1, c2) {
        if (c1 === c2) return true;
        if (!this.gs || !this.gs.alliances) return false;
        return this.gs.alliances.some(a => a.has && a.has(c1) && a.has(c2));
    }

    giveOrder(unitId, targetX, targetY) {
        const e = this.entities;
        if (!e.active[unitId]) return false;
        if (e.inCombat[unitId]) {
            addNotification('Юнит в бою!', 'war');
            return false;
        }
        if (e.training && e.training[unitId] > 0) {
            addNotification('Юнит ещё обучается!', 'war');
            return false;
        }

        const sx = e.x[unitId], sy = e.y[unitId];
        if (sx === targetX && sy === targetY) return false;

        const startPort = this.world.hasBuilding(sx, sy, 'port');
        const targetIsWater = this.world.isWater(targetX, targetY);
        const targetIsLand = this.world.getCell(targetX, targetY) !== 0;
        const targetOwner = this.world.getCell(targetX, targetY);
        const sameOwner = targetOwner === e.owner[unitId]
            || this._areAllied(e.owner[unitId], targetOwner);

        const endPort = this.world.hasBuilding(targetX, targetY, 'port');
        if (startPort && endPort && sameOwner) {
            e.moveTo(unitId, targetX, targetY);
            e.isShip[unitId] = 0;
            this.orders.delete(unitId);
            addNotification('🚢 Морская переброска!', 'info');
            return true;
        }

        const dx = Math.abs(targetX - sx);
        const dy = Math.abs(targetY - sy);
        if (dx + dy === 1) {
            let targetOk = targetIsLand;
            if (targetIsWater && (e.isShip[unitId] || startPort)) targetOk = true;
            if (targetOk) {
                e.moveTo(unitId, targetX, targetY);
                if (targetIsLand) e.isShip[unitId] = 0;
                else if (targetIsWater && startPort) e.isShip[unitId] = 1;
                return true;
            }
        }

        const isShip = e.isShip[unitId];
        const allowWater = isShip === 1 || (targetIsWater && startPort);

        const path = this._findPath(sx, sy, targetX, targetY, e.owner[unitId], allowWater);
        if (!path || path.length === 0) {
            addNotification('Путь не найден!', 'war');
            return false;
        }

        this.orders.set(unitId, { path, targetX, targetY });
        return true;
    }

    getOrderProgress(unitId) {
        return this.orders.has(unitId) ? this.orders.get(unitId) : null;
    }

    hasOrder(unitId) { return this.orders.has(unitId); }
    cancelOrder(unitId) { this.orders.delete(unitId); }

    update() {
        this._moveUnits();
    }

    _moveUnits() {
        const e = this.entities;

        for (const [unitId, order] of this.orders) {
            if (!e.active[unitId]) { this.orders.delete(unitId); continue; }
            if (e.inCombat[unitId]) continue;
            if (!order.path.length) { this.orders.delete(unitId); continue; }

            const hasPort = this.world.hasBuilding(e.x[unitId], e.y[unitId], 'port');
            const isShip = e.isShip[unitId];

            for (let step = 0; step < 2; step++) {
                if (!order.path.length) { this.orders.delete(unitId); break; }

                const next = order.path[0];
                const [nx, ny] = next.split(',').map(Number);

                const isWater = this.world.isWater(nx, ny);
                const cellOwner = this.world.getCell(nx, ny);
                const isLand = cellOwner !== 0;

                if (!e.isShip[unitId] && isWater && hasPort) {
                    e.isShip[unitId] = 1;
                }

                if (e.isShip[unitId]) {
                    if (isWater) {
                        // ok
                    } else if (isLand) {
                        const isFriendly = cellOwner === e.owner[unitId] || this._areAllied(e.owner[unitId], cellOwner);
                        const isEnemy = cellOwner !== 0 && cellOwner !== e.owner[unitId] && !isFriendly;
                        const hasPort2 = this.world.hasBuilding(nx, ny, 'port');

                        if (isFriendly || hasPort2) {
                            e.moveTo(unitId, nx, ny);
                            e.isShip[unitId] = 0;
                            order.path.shift();
                            continue;
                        } else if (isEnemy) {
                            const enemy = e.getUnitAt(nx, ny);
                            if (enemy && e.active[enemy]) {
                                this.orders.delete(unitId);
                                break;
                            }
                            e.moveTo(unitId, nx, ny);
                            e.isShip[unitId] = 0;
                            this.world.setCell(nx, ny, e.owner[unitId]);
                            order.path.shift();
                            addNotification('⚓ Десант!', 'info');
                            continue;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                // Занята другим юнитом? Проверяем ДО захвата клетки
                const occupant = e.getUnitAt(nx, ny);
                if (occupant && occupant !== unitId) {
                    const occOwner = e.owner[occupant];
                    const myOwner = e.owner[unitId];
                    if (occOwner !== myOwner && !this._areAllied(myOwner, occOwner)) {
                        if (!e.inCombat[unitId] && !e.inCombat[occupant]) {
                            e.moveTo(unitId, nx, ny);
                            order.path.shift();
                        }
                        break;
                    }
                }

                // Захват вражеской клетки — только если на ней нет чужого юнита
                if (!e.isShip[unitId] && isLand && cellOwner !== 0
                    && cellOwner !== e.owner[unitId]
                    && !this._areAllied(e.owner[unitId], cellOwner)) {
                    this.world.setCell(nx, ny, e.owner[unitId]);
                }

                e.moveTo(unitId, nx, ny);
                if (isLand) e.isShip[unitId] = 0;
                order.path.shift();
            }
        }
    }

    _findPath(sx, sy, ex, ey, ownerId, allowWater = false) {
        const MAX = 1500;
        const h = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);

        const open = [{ x: sx, y: sy, g: 0, f: h(sx, sy) }];
        const cameFrom = new Map();
        const best = new Map();
        const k = (x, y) => `${x},${y}`;
        best.set(k(sx, sy), 0);
        let steps = 0;

        while (open.length && steps++ < MAX) {
            let mi = 0;
            for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i;
            const cur = open.splice(mi, 1)[0];
            const ck = k(cur.x, cur.y);

            if (cur.x === ex && cur.y === ey) {
                const path = [];
                let node = ck;
                while (cameFrom.has(node)) { path.unshift(node); node = cameFrom.get(node); }
                return path;
            }

            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = cur.x + dx, ny = cur.y + dy;
                const nk = k(nx, ny);
                const cellOwner = this.world.getCell(nx, ny);
                const isWater = this.world.isWater(nx, ny);

                if (!allowWater) {
                    if (isWater) continue;
                    if (cellOwner === 0 && !isWater) continue;

                    if (cellOwner !== 0 && cellOwner !== ownerId) {
                        const isAllied = this._areAllied(ownerId, cellOwner);
                        const isAtWar = this.gs && this.gs.isAtWar && this.gs.isAtWar(ownerId, cellOwner);
                        if (!isAllied && !isAtWar) continue;
                    }
                }

                if (allowWater) {
                    if (isWater) {
                        // ok
                    } else {
                        continue;
                    }
                }

                const ng = cur.g + 1;
                if (!best.has(nk) || ng < best.get(nk)) {
                    best.set(nk, ng);
                    cameFrom.set(nk, ck);
                    open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny) });
                }
            }
        }
        return null;
    }
}
