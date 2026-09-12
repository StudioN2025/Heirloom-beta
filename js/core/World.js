// World.js — Карта с клетками, зданиями и рельефом

const TERRAIN_TYPES = ['plain', 'forest', 'mountain', 'urban', 'desert'];
const TERRAIN_WEIGHTS = [50, 20, 10, 10, 10]; // процент вероятности
const TERRAIN_BONUS = { plain: 1.0, forest: 1.3, mountain: 1.5, urban: 1.4, desert: 0.9 };

export class World {
    constructor() {
        this.cells = new Map();
        this.waterCells = new Set();
        this.buildings = new Map();
        this.cellStats = new Map();
        this.countryCache = new Map();
        this.bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        this.capitals = {}; // { countryId: { x, y, name } }
    }

    setCapital(countryId, x, y, name) {
        this.capitals[countryId] = { x: x, y: y, name: name || countryId };
    }

    getCapital(countryId) {
        return this.capitals[countryId] || null;
    }

    getAllCapitals() {
        return this.capitals;
    }

    // Добавить водную клетку (невидимая, для флота)
    setWater(x, y) {
        const key = `${x},${y}`;
        this.waterCells.add(key);
        // Обновляем границы
        this.bounds.minX = Math.min(this.bounds.minX, x);
        this.bounds.maxX = Math.max(this.bounds.maxX, x);
        this.bounds.minY = Math.min(this.bounds.minY, y);
        this.bounds.maxY = Math.max(this.bounds.maxY, y);
    }

    isWater(x, y) {
        return this.waterCells.has(`${x},${y}`);
    }

    // Проверяет — можно ли двигаться на клетку (суша ИЛИ вода с портом)
    isPassable(x, y, hasPortOnStart) {
        const land = this.getCell(x, y);
        if (land !== 0) return true; // суша
        if (this.isWater(x, y) && hasPortOnStart) return true; // вода с порта
        return false;
    }
    
    setCell(x, y, countryId) {
        const key = `${x},${y}`;
        const oldId = this.cells.get(key);
        
        if (oldId !== countryId) {
            this.cells.set(key, countryId);
            
            // Обновляем границы
            this.bounds.minX = Math.min(this.bounds.minX, x);
            this.bounds.maxX = Math.max(this.bounds.maxX, x);
            this.bounds.minY = Math.min(this.bounds.minY, y);
            this.bounds.maxY = Math.max(this.bounds.maxY, y);
            
            // Обновляем кэш стран
            if (oldId !== undefined) {
                const oldSet = this.countryCache.get(oldId);
                if (oldSet) oldSet.delete(key);
            }
            if (countryId !== 0 && countryId !== undefined) {
                if (!this.countryCache.has(countryId)) {
                    this.countryCache.set(countryId, new Set());
                }
                this.countryCache.get(countryId).add(key);
            }
        }
    }
    
    getCell(x, y) {
        const key = `${x},${y}`;
        return this.cells.get(key) || 0;
    }
    
    addBuilding(x, y, buildingType) {
        const key = `${x},${y}`;
        if (!this.buildings.has(key)) {
            this.buildings.set(key, new Set());
        }
        this.buildings.get(key).add(buildingType);
    }
    
    hasBuilding(x, y, buildingType) {
        const key = `${x},${y}`;
        const buildings = this.buildings.get(key);
        return buildings ? buildings.has(buildingType) : false;
    }
    
    getCountryCells(countryId) {
        return this.countryCache.get(countryId) || new Set();
    }
    
    getAllCountries() {
        return Array.from(this.countryCache.keys());
    }
    
    getNeighbors(x, y) {
        return [
            this.getCell(x + 1, y),
            this.getCell(x - 1, y),
            this.getCell(x, y + 1),
            this.getCell(x, y - 1)
        ];
    }
    
    getBorderWith(countryId, enemyId) {
        const cells = this.getCountryCells(countryId);
        const borders = [];
        
        for (const cell of cells) {
            const [x, y] = cell.split(',').map(Number);
            const neighbors = this.getNeighbors(x, y);
            if (neighbors.some(n => n === enemyId)) {
                borders.push(cell);
            }
        }
        
        return borders;
    }
    
    getTerrain(x, y) {
        const key = `${x},${y}`;
        const stats = this.cellStats.get(key);
        return stats ? stats.terrain : 'plain';
    }

    setTerrain(x, y, terrain) {
        const key = `${x},${y}`;
        if (!this.cellStats.has(key)) this.cellStats.set(key, {});
        this.cellStats.get(key).terrain = terrain;
    }

    getTerrainBonus(x, y) {
        return TERRAIN_BONUS[this.getTerrain(x, y)] || 1.0;
    }

    generateTerrain() {
        // Weighted random terrain selection
        const totalWeight = TERRAIN_WEIGHTS.reduce((a, b) => a + b, 0);
        for (const key of this.cells.keys()) {
            if (this.cellStats.has(key)) continue; // не перезаписываем
            let roll = Math.random() * totalWeight;
            let terrain = TERRAIN_TYPES[0];
            for (let i = 0; i < TERRAIN_TYPES.length; i++) {
                roll -= TERRAIN_WEIGHTS[i];
                if (roll <= 0) { terrain = TERRAIN_TYPES[i]; break; }
            }
            this.cellStats.set(key, { terrain });
        }
    }

    debugCheckCells() {
        console.log(`📊 Всего клеток: ${this.cells.size}, стран: ${this.countryCache.size}`);
        return this.cells.size;
    }
    
    serialize() {
        // Компактный формат: "x,y:owner" на строку вместо массива пар
        const cellsArr = [];
        for (const [key, owner] of this.cells) cellsArr.push(`${key}:${owner}`);

        const blds = [];
        for (const [key, buildings] of this.buildings) blds.push(`${key}:${[...buildings].join(',')}`);

        const stats = [];
        for (const [key, s] of this.cellStats) stats.push(`${key}:${JSON.stringify(s)}`);

        return {
            cells: cellsArr.join('|'),
            buildings: blds.join('|'),
            cellStats: stats.join('|'),
            bounds: this.bounds,
            capitals: this.capitals,
            v: '5'
        };
    }

    static deserialize(data) {
        const world = new World();
        if (data.cells) {
            for (const entry of data.cells.split('|')) {
                const [pos, owner] = entry.split(':');
                const [x, y] = pos.split(',').map(Number);
                world.setCell(x, y, owner);
            }
        }
        if (data.buildings) {
            for (const entry of data.buildings.split('|')) {
                const [pos, blds] = entry.split(':');
                const [x, y] = pos.split(',').map(Number);
                for (const b of blds.split(',')) world.addBuilding(x, y, b);
            }
        }
        if (data.cellStats) {
            const entries = typeof data.cellStats === 'string' ? data.cellStats.split('|') : [];
            for (const entry of entries) {
                const colonIdx = entry.indexOf(':');
                if (colonIdx === -1) continue;
                const pos = entry.substring(0, colonIdx);
                const json = entry.substring(colonIdx + 1);
                try { world.cellStats.set(pos, JSON.parse(json)); } catch(e) {}
            }
        }
        world.bounds = data.bounds || { minX: -50, maxX: 50, minY: -50, maxY: 50 };
        if (data.capitals) world.capitals = data.capitals;
        return world;
    }
}
