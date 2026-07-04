// QueueSystem.js — Очереди обучения войск и строительства

import { addNotification } from '../utils/helpers.js';

// Стоимость и время обучения/строительства
export const TRAIN_DEFS = {
    infantry: { name: 'Пехота',    icon: '💂', equipment: 100, manpower: 1000, days: 7  },
    tank:     { name: 'Танк',      icon: '🚜', equipment: 800, manpower: 500,  days: 21 },
};

export const BUILD_DEFS = {
    factory:  { name: 'Завод',     icon: '🏭', equipment: 500, days: 14 },
    port:     { name: 'Порт',      icon: '⚓', equipment: 300, days: 10 },
    fort:     { name: 'Укрепление',icon: '🛡️', equipment: 200, days: 7  },
};

export class QueueSystem {
    constructor(world, entities, gameState) {
        this.world      = world;
        this.entities   = entities;
        this.gs         = gameState;

        // [{ type:'train'|'build', id, x, y, daysLeft, totalDays, unitType?, buildingType? }]
        this.queue = [];
        this._nextId = 1;
    }

    // Добавить обучение юнита (x,y — клетка где появится)
    queueTrain(unitType, x, y) {
        const def = TRAIN_DEFS[unitType];
        if (!def) return false;

        if (this.gs.equipment < def.equipment) {
            addNotification(`❌ Нужно ${def.equipment} снаряжения!`, 'war'); return false;
        }
        if (this.gs.manpower < def.manpower) {
            addNotification(`❌ Нужно ${def.manpower} людей!`, 'war'); return false;
        }
        if (this.world.getCell(x, y) !== this.gs.myCountryId) {
            addNotification('❌ Только на своей территории!', 'war'); return false;
        }

        this.gs.equipment -= def.equipment;
        this.gs.manpower  -= def.manpower;

        this.queue.push({
            id: this._nextId++, type: 'train',
            unitType, x, y,
            daysLeft: def.days, totalDays: def.days,
            label: `${def.icon} ${def.name} (${x},${y})`
        });
        addNotification(`⏳ Обучение ${def.name} начато — ${def.days} дней`, 'info');
        return true;
    }

    // Добавить строительство здания
    queueBuild(buildingType, x, y) {
        const def = BUILD_DEFS[buildingType];
        if (!def) return false;

        if (this.gs.equipment < def.equipment) {
            addNotification(`❌ Нужно ${def.equipment} снаряжения!`, 'war'); return false;
        }
        if (this.world.getCell(x, y) !== this.gs.myCountryId) {
            addNotification('❌ Только на своей территории!', 'war'); return false;
        }
        if (this.world.hasBuilding(x, y, buildingType)) {
            addNotification('❌ Здесь уже есть такое здание!', 'war'); return false;
        }

        this.gs.equipment -= def.equipment;

        this.queue.push({
            id: this._nextId++, type: 'build',
            buildingType, x, y,
            daysLeft: def.days, totalDays: def.days,
            label: `${def.icon} ${def.name} (${x},${y})`
        });
        addNotification(`⏳ Строительство ${def.name} начато — ${def.days} дней`, 'info');
        return true;
    }

    // Вызывается раз в игровой день
    update() {
        const done = [];
        for (const item of this.queue) {
            item.daysLeft--;
            if (item.daysLeft <= 0) done.push(item);
        }
        this.queue = this.queue.filter(i => i.daysLeft > 0);

        for (const item of done) {
            if (item.type === 'train') {
                const typeNum = item.unitType === 'tank' ? 1 : 0;
                // Если клетка ещё наша — ставим туда или рядом
                let placed = false;
                for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
                    const nx = item.x + dx, ny = item.y + dy;
                    if (this.world.getCell(nx, ny) === this.gs.myCountryId
                        && !this.entities.getUnitAt(nx, ny)) {
                        this.entities.createEntity(this.gs.myCountryId, typeNum, nx, ny);
                        placed = true;
                        break;
                    }
                }
                const def = TRAIN_DEFS[item.unitType];
                if (placed) addNotification(`✅ ${def.icon} ${def.name} обучен!`, 'info');
                else        addNotification(`⚠️ ${def.name} обучен, но негде разместить!`, 'war');
            }

            if (item.type === 'build') {
                if (this.world.getCell(item.x, item.y) === this.gs.myCountryId) {
                    this.world.addBuilding(item.x, item.y, item.buildingType);
                    const def = BUILD_DEFS[item.buildingType];
                    addNotification(`✅ ${def.icon} ${def.name} построен!`, 'info');
                }
            }
        }
    }

    getQueue() { return [...this.queue]; }

    cancel(id) {
        const idx = this.queue.findIndex(i => i.id === id);
        if (idx === -1) return;
        const item = this.queue[idx];
        // Возвращаем половину ресурсов
        if (item.type === 'train') {
            const def = TRAIN_DEFS[item.unitType];
            this.gs.equipment += Math.floor(def.equipment / 2);
            this.gs.manpower  += Math.floor(def.manpower  / 2);
        } else {
            const def = BUILD_DEFS[item.buildingType];
            this.gs.equipment += Math.floor(def.equipment / 2);
        }
        this.queue.splice(idx, 1);
        addNotification('❌ Заказ отменён, возвращено 50% ресурсов', 'info');
    }
}
