// DataLoader.js — Загрузчик карты с фабриками и портами

export class DataLoader {
    async loadMap(url, world) {
        console.log(`📥 Загрузка карты: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        const gridData = data.gridData;
        const total = Object.keys(gridData).length;
        let loaded = 0;
        
        // Определяем границы
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [pos, owner] of Object.entries(gridData)) {
            const [x, y] = pos.split(',').map(Number);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        world.bounds = { minX, maxX, minY, maxY };
        console.log(`📐 Границы: X[${minX}..${maxX}], Y[${minY}..${maxY}]`);
        
        // Загружаем клетки
        for (const [pos, owner] of Object.entries(gridData)) {
            const [x, y] = pos.split(',').map(Number);
            world.setCell(x, y, owner);
            
            loaded++;
            if (loaded % 1000 === 0) {
                console.log(`📥 Загрузка карты: ${Math.floor(loaded / total * 100)}%`);
                await this.delay(0);
            }
        }
        
        // Загружаем фабрики и порты из cellStats
        const cellStats = data.cellStats || {};
        let factoriesLoaded = 0;
        let portsLoaded = 0;
        
        // Если в JSON нет cellStats, создаём тестовые фабрики для крупных стран
        const hasCellStats = Object.keys(cellStats).length > 0;
        
        if (hasCellStats) {
            for (const [pos, stats] of Object.entries(cellStats)) {
                const [x, y] = pos.split(',').map(Number);
                
                if (stats.factories && stats.factories > 0) {
                    for (let i = 0; i < stats.factories; i++) {
                        world.addBuilding(x, y, 'factory');
                        factoriesLoaded++;
                    }
                }
                
                if (stats.buildings && stats.buildings.includes('port')) {
                    world.addBuilding(x, y, 'port');
                    portsLoaded++;
                }
            }
        } else {
            // ТЕСТОВЫЕ ФАБРИКИ: добавляем фабрики в столицы крупных стран
            console.log('⚠️ Нет cellStats в JSON, создаём тестовые фабрики...');
            
            // Собираем все страны и их клетки
            const countryCells = new Map();
            for (const [pos, owner] of Object.entries(gridData)) {
                if (!countryCells.has(owner)) countryCells.set(owner, []);
                countryCells.get(owner).push(pos);
            }
            
            // Для каждой крупной страны добавляем фабрики в первые 3 клетки
            for (const [countryId, cells] of countryCells.entries()) {
                if (cells.length >= 30) { // Крупные страны
                    const addCount = Math.min(5, Math.floor(cells.length / 20));
                    for (let i = 0; i < addCount && i < cells.length; i++) {
                        const [x, y] = cells[i].split(',').map(Number);
                        world.addBuilding(x, y, 'factory');
                        factoriesLoaded++;
                        
                        // Добавляем порт если клетка у воды
                        const isCoastal = this.isCoastal(x, y, gridData);
                        if (isCoastal && i < 2) {
                            world.addBuilding(x, y, 'port');
                            portsLoaded++;
                        }
                    }
                } else if (cells.length >= 10) { // Средние страны
                    const [x, y] = cells[0].split(',').map(Number);
                    world.addBuilding(x, y, 'factory');
                    factoriesLoaded++;
                }
            }
        }
        
        console.log(`✅ Загружено построек: ${factoriesLoaded} заводов, ${portsLoaded} портов`);

        // Автоматически добавляем порты на побережье (если их нет)
        if (portsLoaded === 0) {
            for (const posKey of Object.keys(gridData)) {
                const [x, y] = posKey.split(',').map(Number);
                if (this.isCoastal(x, y, gridData) && !world.hasBuilding(x, y, 'port')) {
                    // Каждая 3-я прибрежная клетка получает порт
                    if ((x + y) % 3 === 0) {
                        world.addBuilding(x, y, 'port');
                        portsLoaded++;
                    }
                }
            }
            console.log(`✅ Автоматически добавлено ${portsLoaded} портов`);
        }

        // Вода — всё что дальше 5 клеток от края карты
        const MARGIN = 5;
        for (let x = minX - MARGIN; x <= maxX + MARGIN; x++) {
            for (let y = minY - MARGIN; y <= maxY + MARGIN; y++) {
                if (!gridData[`${x},${y}`]) {
                    world.setWater(x, y);
                }
            }
        }
        console.log(`✅ Водных клеток: ${world.waterCells.size}`);

        // Загружаем столицы
        if (data.capitals) {
            for (const [cid, cap] of Object.entries(data.capitals)) {
                world.setCapital(cid, cap.x, cap.y, cap.name);
            }
            console.log(`✅ Столицы: ${Object.keys(data.capitals).length}`);
        }

        const totalCells = world.debugCheckCells();
        console.log(`✅ Карта загружена: ${total} клеток в JSON, ${totalCells} клеток в мире`);
        
        return world;
    }
    
    isCoastal(x, y, gridData) {
        const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
        for (const [dx, dy] of neighbors) {
            if (!gridData[`${x+dx},${y+dy}`]) return true;
        }
        return false;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
