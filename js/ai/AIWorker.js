// AIWorker.js — Web Worker для ИИ

self.onmessage = (e) => {
    const data = e.data;
    const orders = [];
    
    // Простая ИИ логика
    const { countryId, cellCount, factories, militaryPower, borders, enemies, tech } = data;
    
    // Если есть враги
    if (enemies.length > 0 && borders.length > 0) {
        // Атакуем
        const targetBorder = borders[Math.floor(Math.random() * borders.length)];
        const [bx, by] = targetBorder.split(',').map(Number);
        
        // Ищем юнита для атаки
        orders.push({
            type: 'move',
            fromX: bx - 1, fromY: by,
            toX: bx, toY: by
        });
    }
    
    // Строим заводы если мало
    if (factories < Math.floor(cellCount * 0.1) && borders.length > 0) {
        const pos = borders[0];
        orders.push({
            type: 'build_factory',
            pos: pos
        });
    }
    
    // Нанимаем юнитов если мало
    if (militaryPower < Math.max(3, Math.floor(cellCount * 0.05))) {
        const pos = borders.length > 0 ? borders[0] : null;
        if (pos) {
            orders.push({
                type: 'recruit',
                unitType: tech.tank > 1 && Math.random() > 0.7 ? 'tank' : 'infantry',
                pos: pos
            });
        }
    }
    
    self.postMessage({ countryId, orders });
};
