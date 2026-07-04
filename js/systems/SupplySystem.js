// SupplySystem.js — Система снабжения и котлов

export class SupplySystem {
    constructor(world, entities, gameState) {
        this.world = world;
        this.entities = entities;
        this.gameState = gameState;
        this.tickCounter = 0;
        this.TICK_INTERVAL = 5; // Раз в 5 дней
    }
    
    update() {
        this.tickCounter++;
        if (this.tickCounter < this.TICK_INTERVAL) return;
        this.tickCounter = 0;
        
        this.checkPockets();
    }
    
    checkPockets() {
        const countries = this.world.getAllCountries();
        
        for (const countryId of countries) {
            const cells = this.world.getCountryCells(countryId);
            if (cells.size <= 5) continue;
            
            const groups = this.findConnectedGroups(countryId, cells);
            if (groups.length <= 1) continue;
            
            // Проверяем каждую группу кроме самой большой
            for (let i = 1; i < groups.length; i++) {
                const group = groups[i];
                if (this.isGroupSurrounded(group, countryId)) {
                    this.applySupplyPenalty(group, countryId);
                }
            }
        }
    }
    
    findConnectedGroups(countryId, cells) {
        const visited = new Set();
        const groups = [];
        
        for (const cell of cells) {
            if (visited.has(cell)) continue;
            
            const group = new Set();
            const queue = [cell];
            visited.add(cell);
            
            while (queue.length > 0) {
                const current = queue.shift();
                group.add(current);
                
                const [x, y] = current.split(',').map(Number);
                const neighbors = [
                    `${x+1},${y}`, `${x-1},${y}`,
                    `${x},${y+1}`, `${x},${y-1}`
                ];
                
                for (const neighbor of neighbors) {
                    if (cells.has(neighbor) && !visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                    }
                }
            }
            
            groups.push(group);
        }
        
        groups.sort((a, b) => b.size - a.size);
        return groups;
    }
    
    isGroupSurrounded(group, countryId) {
        for (const cell of group) {
            const [x, y] = cell.split(',').map(Number);
            const neighbors = this.world.getNeighbors(x, y);
            
            // Если есть сосед, который не в группе и не враг — не окружены
            for (const neighborOwner of neighbors) {
                if (neighborOwner === 0) return false; // вода
                if (neighborOwner === countryId) continue;
                if (!this.gameState.isAtWar(countryId, neighborOwner)) return false;
            }
        }
        
        return true;
    }
    
    applySupplyPenalty(group, countryId) {
        const penalty = 2 + Math.floor(Math.random() * 4);
        
        for (const cell of group) {
            const [x, y] = cell.split(',').map(Number);
            const unitId = this.entities.getUnitAt(x, y);
            
            if (unitId !== null && this.entities.owner[unitId] === countryId) {
                this.entities.damage(unitId, penalty);
            }
        }
    }
}
