// AStar.js — Быстрый поиск пути с бинарной кучей

class BinaryHeap {
    constructor(scoreFunction) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }
    
    push(element) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    }
    
    bubbleUp(n) {
        const element = this.content[n];
        while (n > 0) {
            const parentN = Math.floor((n - 1) / 2);
            const parent = this.content[parentN];
            if (this.scoreFunction(element) >= this.scoreFunction(parent)) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }
    
    pop() {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    }
    
    sinkDown(n) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);
        
        while (true) {
            let child2N = (n + 1) * 2;
            let child1N = child2N - 1;
            let swap = null;
            let child1Score = null;
            
            if (child1N < length) {
                child1Score = this.scoreFunction(this.content[child1N]);
                if (child1Score < elemScore) swap = child1N;
            }
            
            if (child2N < length) {
                const child2Score = this.scoreFunction(this.content[child2N]);
                if (child2Score < (swap === null ? elemScore : child1Score)) swap = child2N;
            }
            
            if (swap === null) break;
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
    
    isEmpty() {
        return this.content.length === 0;
    }
}

export class AStarFinder {
    constructor(world) {
        this.world = world;
        this.alliances = [];
    }
    
    setAlliances(alliances) {
        this.alliances = alliances || [];
    }
    
    _areAllied(c1, c2) {
        if (c1 === c2) return true;
        return this.alliances.some(a => a.has && a.has(c1) && a.has(c2));
    }
    
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    findPath(startX, startY, endX, endY, ownerId) {
        const openSet = new BinaryHeap(node => node.f);
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        
        const startKey = `${startX},${startY}`;
        gScore.set(startKey, 0);
        openSet.push({ x: startX, y: startY, f: this.heuristic(startX, startY, endX, endY) });
        
        while (!openSet.isEmpty()) {
            const current = openSet.pop();
            const currentKey = `${current.x},${current.y}`;
            
            if (current.x === endX && current.y === endY) {
                const path = [];
                let node = currentKey;
                while (cameFrom.has(node)) {
                    path.unshift(node);
                    node = cameFrom.get(node);
                }
                return path;
            }
            
            closedSet.add(currentKey);
            
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                const nKey = `${nx},${ny}`;
                
                if (closedSet.has(nKey)) continue;
                
                const cellOwner = this.world.getCell(nx, ny);
                if (cellOwner === 0) continue;
                
                // Разрешаем движение через свою и союзную территорию
                const isPassable = cellOwner === ownerId || this._areAllied(ownerId, cellOwner);
                if (!isPassable) continue;
                
                const tentativeG = (gScore.get(currentKey) || 0) + 1;
                const existingG = gScore.get(nKey);
                
                if (existingG === undefined || tentativeG < existingG) {
                    cameFrom.set(nKey, currentKey);
                    gScore.set(nKey, tentativeG);
                    const f = tentativeG + this.heuristic(nx, ny, endX, endY);
                    openSet.push({ x: nx, y: ny, f });
                }
            }
        }
        
        return null;
    }
}
