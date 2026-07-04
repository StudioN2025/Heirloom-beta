// MovementSystem.js — Движение по дням через A*

import { addNotification } from '../utils/helpers.js';

export class MovementSystem {
    constructor(world, entities, gameState) {
        this.world    = world;
        this.entities = entities;
        this.gs       = gameState;
        this.orders   = new Map(); // unitId → { path, targetX, targetY }
    }

    _areAllied(c1, c2) {
        if (c1 === c2) return true;
        if (!this.gs || !this.gs.alliances) return false;
        return this.gs.alliances.some(a => a.has && a.has(c1) && a.has(c2));
    }

    // Выдать приказ на движение
    giveOrder(unitId, targetX, targetY) {
        const e = this.entities;
        if (!e.active[unitId]) return false;
        if (e.inCombat[unitId]) {
            addNotification('Юнит в бою!', 'war');
            return false;
        }

        const sx = e.x[unitId], sy = e.y[unitId];
        if (sx === targetX && sy === targetY) return false;

        const path = this._findPath(sx, sy, targetX, targetY, e.owner[unitId]);
        if (!path || path.length === 0) {
            addNotification('Путь не найден!', 'war');
            return false;
        }

        this.orders.set(unitId, { path, targetX, targetY });
        addNotification(`Приказ выдан — ${path.length} клеток`, 'info');
        return true;
    }

    getOrderProgress(unitId) {
        return this.orders.has(unitId) ? this.orders.get(unitId) : null;
    }

    hasOrder(unitId) { return this.orders.has(unitId); }
    cancelOrder(unitId) { this.orders.delete(unitId); }

    // Вызывается раз в игровой день из main.js
    update() {
        this._moveUnits();
    }

    _moveUnits() {
        const e = this.entities;

        for (const [unitId, order] of this.orders) {
            if (!e.active[unitId]) { this.orders.delete(unitId); continue; }
            if (e.inCombat[unitId]) continue;
            if (!order.path.length) { this.orders.delete(unitId); continue; }

            // Двигаем 2 клетки за день
            for (let step = 0; step < 2; step++) {
                if (!order.path.length) { this.orders.delete(unitId); break; }

                const next = order.path[0];
                const [nx, ny] = next.split(',').map(Number);

                // Проверяем — вода?
                if (this.world.getCell(nx, ny) === 0) {
                    this.orders.delete(unitId);
                    addNotification('Путь заблокирован водой!', 'war');
                    break;
                }

                // Проверяем — вражеская территория? Если да, начать бой
                const cellOwner = e.owner[unitId] ? this.world.getCell(nx, ny) : 0;
                if (cellOwner !== 0 && cellOwner !== e.owner[unitId]
                    && !this._areAllied(e.owner[unitId], cellOwner)) {
                    // Вражеская клетка — атакуем если есть враг, иначе захватываем
                    const enemy = e.getUnitAt(nx, ny);
                    if (enemy && e.active[enemy] && e.owner[enemy] !== e.owner[unitId]) {
                        addNotification('⚔️ Встреча с врагом!', 'war');
                        this.orders.delete(unitId);
                        break;
                    }
                    // Захватываем пустую вражескую клетку
                    this.world.setCell(nx, ny, e.owner[unitId]);
                }

                // Проверяем — занята другим юнитом? Ждём
                const occupant = e.getUnitAt(nx, ny);
                if (occupant && occupant !== unitId) {
                    // Юнит на пути — ждём следующий день, не удаляем приказ
                    break;
                }

                // Всё ок — делаем шаг
                e.moveTo(unitId, nx, ny);
                order.path.shift();
            }
        }
    }

    // A* поиск пути (по суше, через союзников, мимо врагов)
    _findPath(sx, sy, ex, ey, ownerId) {
        const MAX = 500;
        const h = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);

        const open = [{ x: sx, y: sy, g: 0, f: h(sx, sy) }];
        const cameFrom = new Map();
        const best = new Map();
        const key = (x, y) => `${x},${y}`;
        best.set(key(sx, sy), 0);
        let steps = 0;

        while (open.length && steps++ < MAX) {
            // pop min-f
            let mi = 0;
            for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i;
            const cur = open.splice(mi, 1)[0];
            const ck = key(cur.x, cur.y);

            if (cur.x === ex && cur.y === ey) {
                const path = [];
                let node = ck;
                while (cameFrom.has(node)) { path.unshift(node); node = cameFrom.get(node); }
                return path;
            }

            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = cur.x + dx, ny = cur.y + dy;
                const nk = key(nx, ny);
                const cellOwner = this.world.getCell(nx, ny);

                // Вода — нельзя
                if (cellOwner === 0) continue;

                // Вражеская территория — только если цель на ней, иначе обходим
                const isEnemy = cellOwner !== ownerId && cellOwner !== 0
                    && !this._areAllied(ownerId, cellOwner);
                if (isEnemy && !(nx === ex && ny === ey)) continue;

                // Вражеский юнит на клетке — нельзя проходить
                const occupant = this.entities.getUnitAt(nx, ny);
                if (occupant && this.entities.active[occupant]
                    && this.entities.owner[occupant] !== ownerId
                    && !this._areAllied(ownerId, this.entities.owner[occupant])) {
                    continue;
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
