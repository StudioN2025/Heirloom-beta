// EntityManager.js — Компонентная система (массивы вместо объектов)

export const UNIT_TYPE = {
    INFANTRY: 0,
    TANK: 1
};

export class EntityManager {
    constructor(maxEntities = 50000) {
        this.maxEntities = maxEntities;
        this.nextId = 1;
        
        // Плоские массивы (быстрый доступ)
        this.active = new Uint8Array(maxEntities);
        
        // Компоненты (owner — строка-id страны, обычный массив)
        this.owner = new Array(maxEntities).fill(null);
        this.type = new Uint8Array(maxEntities);
        this.x = new Int16Array(maxEntities);
        this.y = new Int16Array(maxEntities);
        this.hp = new Uint16Array(maxEntities);
        this.maxHp = new Uint16Array(maxEntities);
        this.training = new Uint8Array(maxEntities);
        this.inCombat = new Uint8Array(maxEntities);
        this.moveCooldown = new Uint8Array(maxEntities);
        
        // Пути (отдельное хранение)
        this.paths = new Map();
        
        // Индекс для быстрого поиска юнитов по клетке
        this.positionIndex = new Map(); // "x,y" -> unitId
    }
    
    createEntity(owner, type, x, y) {
        const id = this.nextId++;
        
        if (id >= this.maxEntities) {
            console.error('Достигнут лимит юнитов');
            return null;
        }
        
        this.active[id] = 1;
        this.owner[id] = owner;
        this.type[id] = type;
        this.x[id] = x;
        this.y[id] = y;
        this.hp[id] = type === UNIT_TYPE.INFANTRY ? 100 : 50;
        this.maxHp[id] = type === UNIT_TYPE.INFANTRY ? 100 : 50;
        this.training[id] = 10;
        this.inCombat[id] = 0;
        this.moveCooldown[id] = 0;
        
        this.positionIndex.set(`${x},${y}`, id);
        
        return id;
    }
    
    removeEntity(id) {
        if (!this.active[id]) return;
        
        // Удаляем из индекс
        const key = `${this.x[id]},${this.y[id]}`;
        this.positionIndex.delete(key);
        
        this.active[id] = 0;
        this.paths.delete(id);
    }
    
    getUnitAt(x, y) {
        return this.positionIndex.get(`${x},${y}`) || null;
    }
    
    getEntitiesByOwner(ownerId) {
        const result = [];
        for (let i = 1; i < this.nextId; i++) {
            if (this.active[i] && this.owner[i] === ownerId) {
                result.push(i);
            }
        }
        return result;
    }
    
    getEntitiesInRadius(cx, cy, radius) {
        const result = [];
        const radiusSq = radius * radius;
        
        for (let i = 1; i < this.nextId; i++) {
            if (!this.active[i]) continue;
            const dx = this.x[i] - cx;
            const dy = this.y[i] - cy;
            if (dx * dx + dy * dy <= radiusSq) {
                result.push(i);
            }
        }
        return result;
    }
    
    setPath(id, path) {
        this.paths.set(id, path);
        this.moveCooldown[id] = 0;
    }
    
    getPath(id) {
        return this.paths.get(id) || [];
    }
    
    moveTo(id, newX, newY) {
        const oldKey = `${this.x[id]},${this.y[id]}`;
        const newKey = `${newX},${newY}`;
        
        this.positionIndex.delete(oldKey);
        this.positionIndex.set(newKey, id);
        
        this.x[id] = newX;
        this.y[id] = newY;
    }
    
    damage(id, amount) {
        this.hp[id] = Math.max(0, this.hp[id] - amount);
        if (this.hp[id] <= 0) {
            this.removeEntity(id);
            return true; // unit died
        }
        return false; // unit survived
    }
    
    serialize() {
        const entities = [];
        for (let i = 1; i < this.nextId; i++) {
            if (!this.active[i]) continue;
            entities.push({
                id: i,
                owner: this.owner[i],
                type: this.type[i],
                x: this.x[i],
                y: this.y[i],
                hp: this.hp[i],
                training: this.training[i],
                inCombat: this.inCombat[i],
                path: this.getPath(i)
            });
        }
        return entities;
    }
    
    deserialize(data) {
        this.nextId = 1;
        this.positionIndex.clear();
        
        for (const e of data) {
            this.active[e.id] = 1;
            this.owner[e.id] = e.owner;
            this.type[e.id] = e.type;
            this.x[e.id] = e.x;
            this.y[e.id] = e.y;
            this.hp[e.id] = e.hp;
            this.maxHp[e.id] = e.type === UNIT_TYPE.INFANTRY ? 100 : 50;
            this.training[e.id] = e.training;
            this.inCombat[e.id] = e.inCombat;
            
            this.positionIndex.set(`${e.x},${e.y}`, e.id);
            if (e.path && e.path.length) {
                this.paths.set(e.id, e.path);
            }
            
            this.nextId = Math.max(this.nextId, e.id + 1);
        }
    }
}
