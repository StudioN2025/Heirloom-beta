// World.js — Упрощённая версия с Map

export class World {
    constructor() {
        this.cells = new Map(); // "x,y" -> countryId
        this.buildings = new Map(); // "x,y" -> Set(buildingTypes)
        this.countryCache = new Map(); // countryId -> Set(cellKeys)
        this.bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
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
    
    debugCheckCells() {
        console.log(`📊 Всего клеток: ${this.cells.size}, стран: ${this.countryCache.size}`);
        return this.cells.size;
    }
    
    serialize() {
        return {
            cells: Array.from(this.cells.entries()),
            buildings: Array.from(this.buildings.entries()).map(([k, v]) => [k, Array.from(v)]),
            bounds: this.bounds,
            version: '3.0'
        };
    }
    
    static deserialize(data) {
        const world = new World();
        for (const [key, owner] of data.cells) {
            const [x, y] = key.split(',').map(Number);
            world.setCell(x, y, owner);
        }
        for (const [key, buildings] of data.buildings) {
            for (const building of buildings) {
                const [x, y] = key.split(',').map(Number);
                world.addBuilding(x, y, building);
            }
        }
        world.bounds = data.bounds;
        return world;
    }
}
