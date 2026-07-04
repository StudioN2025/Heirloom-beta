// ProductionSystem.js — единая очередь производства для ВСЕХ стран

import { addNotification } from '../utils/helpers.js';

// Стоимость и время обучения (одинаково для всех)
export const UNIT_COSTS = {
    infantry: { equipment: 100, manpower: 1000, days: 30 },
    tank:     { equipment: 800, manpower: 500,  days: 60 },
};
export const BUILDING_COSTS = {
    factory: { equipment: 500, days: 90 },
    port:    { equipment: 300, days: 60 },
};

// Ресурсы ИИ-стран (упрощённо: бесплатно, но время соблюдается)
const AI_RESOURCE_SCALE = 1.0;

export class ProductionSystem {
    constructor(world, entities, gameState, combat) {
        this.world     = world;
        this.entities  = entities;
        this.gs        = gameState;
        this.combat    = combat;

        // countryId → [{ type:'unit'|'building', unitType, buildingType, x, y, daysLeft, totalDays }]
        this.queues = new Map();
    }

    // ── Ставим в очередь (игрок) ──────────────────────────────────────────────

    enqueueTraining(x, y, unitType) {
        const myId = this.gs.myCountryId;
        const cost = UNIT_COSTS[unitType];
        if (!cost) return false;

        if (this.gs.equipment < cost.equipment) {
            addNotification(`⚠️ Нужно ${cost.equipment} снаряжения (есть ${Math.floor(this.gs.equipment)})`, 'war');
            return false;
        }
        if (this.gs.manpower < cost.manpower) {
            addNotification(`⚠️ Нужно ${cost.manpower} манмощи`, 'war');
            return false;
        }
        if (this.world.getCell(x, y) !== myId) {
            addNotification('⚠️ Только на своей территории!', 'war');
            return false;
        }

        this.gs.equipment -= cost.equipment;
        this.gs.manpower  -= cost.manpower;
        this._enqueue(myId, { type: 'unit', unitType, x, y, daysLeft: cost.days, totalDays: cost.days });

        const name = unitType === 'infantry' ? 'Пехота' : 'Танки';
        addNotification(`🪖 ${name} в обучении — ${cost.days} дней`, 'info');
        return true;
    }

    enqueueBuilding(x, y, buildingType) {
        const myId = this.gs.myCountryId;
        const cost = BUILDING_COSTS[buildingType];
        if (!cost) return false;

        if (this.world.getCell(x, y) !== myId) {
            addNotification('⚠️ Только на своей территории!', 'war');
            return false;
        }
        if (this.world.hasBuilding(x, y, buildingType)) {
            addNotification('⚠️ Здание уже есть!', 'war');
            return false;
        }
        const alreadyQueued = (this.queues.get(myId) || []).some(
            q => q.type === 'building' && q.x === x && q.y === y && q.buildingType === buildingType
        );
        if (alreadyQueued) { addNotification('⚠️ Уже в очереди!', 'war'); return false; }
        if (this.gs.equipment < cost.equipment) {
            addNotification(`⚠️ Нужно ${cost.equipment} снаряжения`, 'war');
            return false;
        }

        this.gs.equipment -= cost.equipment;
        this._enqueue(myId, { type: 'building', buildingType, x, y, daysLeft: cost.days, totalDays: cost.days });

        const name = buildingType === 'factory' ? 'Завод' : 'Порт';
        addNotification(`🏗️ ${name} строится — ${cost.days} дней`, 'info');
        return true;
    }

    // ── ИИ ставит в очередь (бесплатно, но время соблюдается) ────────────────

    aiEnqueueUnit(countryId, x, y, unitType) {
        const cost = UNIT_COSTS[unitType];
        if (!cost) return false;
        this._enqueue(countryId, { type: 'unit', unitType, x, y, daysLeft: cost.days, totalDays: cost.days });
        return true;
    }

    aiEnqueueBuilding(countryId, x, y, buildingType) {
        const cost = BUILDING_COSTS[buildingType];
        if (!cost) return false;
        this._enqueue(countryId, { type: 'building', buildingType, x, y, daysLeft: cost.days, totalDays: cost.days });
        return true;
    }

    // ── Обновление (раз в день) ───────────────────────────────────────────────

    update() {
        for (const [countryId, queue] of this.queues) {
            // Считаем сколько заводов у страны (бонус к скорости)
            const factoryBonus = this._countFactories(countryId);
            // 1 завод = +2% скорости (максимум x2)
            const speedMult = Math.min(2.0, 1 + factoryBonus * 0.02);

            const finished = [];
            for (const item of queue) {
                item.daysLeft -= speedMult;
                if (item.daysLeft <= 0) finished.push(item);
            }

            // Убираем завершённые
            this.queues.set(countryId, queue.filter(i => i.daysLeft > 0));

            // Обрабатываем завершённые
            for (const item of finished) {
                if (item.type === 'unit') {
                    this._spawnUnit(countryId, item);
                } else {
                    this._completeBuilding(countryId, item);
                }
            }
        }
    }

    // ── Геттеры для рендерера ─────────────────────────────────────────────────

    getPlayerQueue() {
        return this.queues.get(this.gs.myCountryId) || [];
    }

    getQueueAt(x, y) {
        const myId = this.gs.myCountryId;
        return (this.queues.get(myId) || []).find(q => q.x === x && q.y === y) || null;
    }

    // ── Приватные ─────────────────────────────────────────────────────────────

    _enqueue(countryId, item) {
        if (!this.queues.has(countryId)) this.queues.set(countryId, []);
        this.queues.get(countryId).push(item);
    }

    _spawnUnit(countryId, item) {
        const pos = this._findFreeCell(item.x, item.y, countryId);
        if (!pos) {
            if (countryId === this.gs.myCountryId) {
                addNotification('⚠️ Нет места для размещения юнита!', 'war');
            }
            return;
        }
        const typeNum = item.unitType === 'infantry' ? 0 : 1;
        const uid = this.entities.createEntity(countryId, typeNum, pos.x, pos.y);

        // Инициализируем org в боевой системе
        if (this.combat && this.combat.initUnit) {
            this.combat.initUnit(uid);
        }

        if (countryId === this.gs.myCountryId) {
            const name = item.unitType === 'infantry' ? 'Пехота' : 'Танки';
            addNotification(`✅ ${name} готов!`, 'info');
        }
    }

    _completeBuilding(countryId, item) {
        // Проверяем что клетка ещё наша
        if (this.world.getCell(item.x, item.y) !== countryId) return;
        if (this.world.hasBuilding(item.x, item.y, item.buildingType)) return;
        this.world.addBuilding(item.x, item.y, item.buildingType);

        if (countryId === this.gs.myCountryId) {
            const name = item.buildingType === 'factory' ? 'Завод' : 'Порт';
            addNotification(`🏭 ${name} построен!`, 'info');
        }
    }

    _findFreeCell(cx, cy, ownerId) {
        const queue = [[cx, cy]];
        const visited = new Set([`${cx},${cy}`]);
        while (queue.length) {
            const [x, y] = queue.shift();
            if (this.world.getCell(x, y) === ownerId && !this.entities.getUnitAt(x, y)) {
                return { x, y };
            }
            for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
                const k = `${x+dx},${y+dy}`;
                if (!visited.has(k) && this.world.getCell(x+dx, y+dy) === ownerId) {
                    visited.add(k);
                    queue.push([x+dx, y+dy]);
                }
            }
            if (visited.size > 300) break;
        }
        return null;
    }

    _countFactories(countryId) {
        let n = 0;
        for (const c of this.world.getCountryCells(countryId)) {
            const [x, y] = c.split(',').map(Number);
            if (this.world.hasBuilding(x, y, 'factory')) n++;
        }
        return n;
    }
}
