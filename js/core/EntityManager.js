// EntityManager.js — Компонентная система (массивы вместо объектов) v3

export const UNIT_TYPE = {
    INFANTRY: 0,
    TANK: 1
};

export class EntityManager {
    constructor(maxEntities = 50000) {
        this.maxEntities = maxEntities;
        this.nextId = 1;

        this.active = new Uint8Array(maxEntities);

        this.owner = new Array(maxEntities).fill(null);
        this.type = new Uint8Array(maxEntities);
        this.x = new Int16Array(maxEntities);
        this.y = new Int16Array(maxEntities);
        this.hp = new Uint16Array(maxEntities);
        this.maxHp = new Uint16Array(maxEntities);
        this.training = new Uint8Array(maxEntities);
        this.inCombat = new Uint8Array(maxEntities);
        this.moveCooldown = new Uint8Array(maxEntities);
        this.isShip = new Uint8Array(maxEntities);

        this.paths = new Map();

        this.positionIndex = new Map();
        this.ownerIndex = new Map();

        this._activeIds = null;
        this._activeIdsDirty = true;
    }

    _markActiveDirty() {
        this._activeIdsDirty = true;
        this._activeIds = null;
    }

    get activeIds() {
        if (this._activeIdsDirty) {
            const ids = [];
            for (let i = 1; i < this.nextId; i++) {
                if (this.active[i]) ids.push(i);
            }
            this._activeIds = ids;
            this._activeIdsDirty = false;
        }
        return this._activeIds;
    }

    /**
     * Создать юнита.
     * @param {string} owner
     * @param {number} type
     * @param {number} x
     * @param {number} y
     * @param {number} trainingDays — 0 = готов сразу (ИИ/фокусы), >0 = обучается
     */
    createEntity(owner, type, x, y, trainingDays = 0) {
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
        this.training[id] = trainingDays | 0;
        this.inCombat[id] = 0;
        this.moveCooldown[id] = 0;

        const pkey = `${x},${y}`;
        if (!this.positionIndex.has(pkey)) this.positionIndex.set(pkey, new Set());
        this.positionIndex.get(pkey).add(id);

        if (!this.ownerIndex.has(owner)) this.ownerIndex.set(owner, new Set());
        this.ownerIndex.get(owner).add(id);

        this._markActiveDirty();
        return id;
    }

    /**
     * Уменьшить training у всех юнитов. Вызывается раз в игровой день.
     */
    tickTraining() {
        for (let i = 1; i < this.nextId; i++) {
            if (this.active[i] && this.training[i] > 0) {
                this.training[i]--;
            }
        }
    }

    removeEntity(id) {
        if (!this.active[id]) return;

        const key = `${this.x[id]},${this.y[id]}`;
        const stack = this.positionIndex.get(key);
        if (stack) {
            stack.delete(id);
            if (stack.size === 0) this.positionIndex.delete(key);
        }

        const ownerSet = this.ownerIndex.get(this.owner[id]);
        if (ownerSet) {
            ownerSet.delete(id);
            if (ownerSet.size === 0) this.ownerIndex.delete(this.owner[id]);
        }

        this.active[id] = 0;
        this.paths.delete(id);
        this._markActiveDirty();
    }

    getUnitAt(x, y) {
        const stack = this.positionIndex.get(`${x},${y}`);
        if (!stack) return null;
        for (const id of stack) {
            if (this.active[id]) return id;
        }
        return null;
    }

    getAllUnitsAt(x, y) {
        const stack = this.positionIndex.get(`${x},${y}`);
        if (!stack) return [];
        const result = [];
        for (const id of stack) {
            if (this.active[id]) result.push(id);
        }
        return result;
    }

    moveTo(id, newX, newY) {
        const oldKey = `${this.x[id]},${this.y[id]}`;
        const newKey = `${newX},${newY}`;

        const oldStack = this.positionIndex.get(oldKey);
        if (oldStack) {
            oldStack.delete(id);
            if (oldStack.size === 0) this.positionIndex.delete(oldKey);
        }

        if (!this.positionIndex.has(newKey)) this.positionIndex.set(newKey, new Set());
        this.positionIndex.get(newKey).add(id);

        this.x[id] = newX;
        this.y[id] = newY;
    }

    getEntitiesByOwner(ownerId) {
        const s = this.ownerIndex.get(ownerId);
        if (!s) return [];
        const result = [];
        for (const id of s) {
            if (this.active[id]) result.push(id);
        }
        return result;
    }

    getEntitiesInRadius(cx, cy, radius) {
        const result = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx * dx + dy * dy > radius * radius) continue;
                const stack = this.positionIndex.get(`${cx + dx},${cy + dy}`);
                if (stack) {
                    for (const uid of stack) {
                        if (this.active[uid]) result.push(uid);
                    }
                }
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

    damage(id, amount) {
        this.hp[id] = Math.max(0, this.hp[id] - amount);
        if (this.hp[id] <= 0) {
            this.removeEntity(id);
            return true;
        }
        return false;
    }

    serialize() {
        const entities = [];
        for (const id of this.activeIds) {
            entities.push({
                id,
                owner: this.owner[id],
                type: this.type[id],
                x: this.x[id],
                y: this.y[id],
                hp: this.hp[id],
                training: this.training[id],
                inCombat: this.inCombat[id],
                isShip: this.isShip[id],
                path: this.getPath(id)
            });
        }
        return entities;
    }

    deserialize(data) {
        this.nextId = 1;
        this.positionIndex.clear();
        this.ownerIndex.clear();
        this._markActiveDirty();

        for (const e of data) {
            this.active[e.id] = 1;
            this.owner[e.id] = e.owner;
            this.type[e.id] = e.type;
            this.x[e.id] = e.x;
            this.y[e.id] = e.y;
            this.hp[e.id] = e.hp;
            this.maxHp[e.id] = e.type === UNIT_TYPE.INFANTRY ? 100 : 50;
            this.training[e.id] = e.training || 0;
            this.inCombat[e.id] = e.inCombat || 0;
            this.isShip[e.id] = e.isShip || 0;

            const pkey = `${e.x},${e.y}`;
            if (!this.positionIndex.has(pkey)) this.positionIndex.set(pkey, new Set());
            this.positionIndex.get(pkey).add(e.id);

            if (!this.ownerIndex.has(e.owner)) this.ownerIndex.set(e.owner, new Set());
            this.ownerIndex.get(e.owner).add(e.id);

            if (e.path && e.path.length) {
                this.paths.set(e.id, e.path);
            }

            this.nextId = Math.max(this.nextId, e.id + 1);
        }
    }
}
