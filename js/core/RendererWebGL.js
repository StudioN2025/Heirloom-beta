// RendererWebGL.js — Полный рендер с юнитами

export class RendererWebGL {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 0.6 };
        this.cameraInitialized = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.frameCount = 0;
    }
    
    render(world, entities, gameState, production) {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const bounds = world.bounds;
        
        // Если нет данных, показываем загрузку
        if (bounds.minX === Infinity || world.cells.size === 0) {
            ctx.fillStyle = '#1a3a4a';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Загрузка карты...', this.canvas.width/2, this.canvas.height/2);
            ctx.fillStyle = '#888888';
            ctx.font = '12px monospace';
            ctx.fillText(`Клеток: ${world.cells.size}`, this.canvas.width/2, this.canvas.height/2 + 30);
            return;
        }
        
        // Инициализация камеры
        if (!this.cameraInitialized) {
            const worldWidth = (bounds.maxX - bounds.minX + 2) * 20;
            const worldHeight = (bounds.maxY - bounds.minY + 2) * 20;
            const centerX = ((bounds.minX + bounds.maxX) / 2) * 20;
            const centerY = ((bounds.minY + bounds.maxY) / 2) * 20;
            
            this.camera.x = centerX;
            this.camera.y = centerY;
            
            const zoomX = this.canvas.width / worldWidth;
            const zoomY = this.canvas.height / worldHeight;
            this.camera.zoom = Math.min(zoomX, zoomY, 1.2) * 0.9;
            this.cameraInitialized = true;
            
            console.log(`🎥 Камера: центр (${centerX}, ${centerY}), зум ${this.camera.zoom.toFixed(3)}`);
        }
        
        // Очистка экрана
        ctx.fillStyle = '#1a3a4a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const zoom = this.camera.zoom;
        const invZoom = 1 / zoom;
        const halfWidth = this.canvas.width / 2 * invZoom;
        const halfHeight = this.canvas.height / 2 * invZoom;
        const camX = this.canvas.width / 2 - this.camera.x * zoom;
        const camY = this.canvas.height / 2 - this.camera.y * zoom;
        const size = 20 * zoom;
        
        let startX = Math.floor((this.camera.x - halfWidth) / 20);
        let endX = Math.ceil((this.camera.x + halfWidth) / 20);
        let startY = Math.floor((this.camera.y - halfHeight) / 20);
        let endY = Math.ceil((this.camera.y + halfHeight) / 20);
        
        startX = Math.max(startX, bounds.minX - 1);
        endX = Math.min(endX, bounds.maxX + 1);
        startY = Math.max(startY, bounds.minY - 1);
        endY = Math.min(endY, bounds.maxY + 1);
        
        // Группируем клетки по цвету для пакетного рисования
        const colorBuckets = new Map();
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const owner = world.getCell(x, y);
                if (owner === 0) continue;
                
                const screenX = x * 20 * zoom + camX;
                const screenY = y * 20 * zoom + camY;
                
                if (screenX + size < -50 || screenX > this.canvas.width + 50 || 
                    screenY + size < -50 || screenY > this.canvas.height + 50) continue;
                
                const color = this.getCountryColor(owner);
                if (!colorBuckets.has(color)) colorBuckets.set(color, []);
                colorBuckets.get(color).push(screenX, screenY);
            }
        }
        
        // Рисуем все клетки одного цвета за один проход
        let cellsDrawn = 0;
        for (const [color, coords] of colorBuckets) {
            ctx.fillStyle = color;
            for (let i = 0; i < coords.length; i += 2) {
                ctx.fillRect(coords[i], coords[i + 1], size, size);
                cellsDrawn++;
            }
        }
        
        // Границы — один общий Path2D (гораздо быстрее чем strokeRect на каждую клетку)
        if (size > 4) {
            const borderPath = new Path2D();
            for (const [color, coords] of colorBuckets) {
                for (let i = 0; i < coords.length; i += 2) {
                    borderPath.rect(coords[i], coords[i + 1], size, size);
                }
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke(borderPath);
        }
        
        // Иконки построек (только если достаточно зума)
        if (size > 12) {
            const emojiSize = Math.max(8, Math.min(14, size * 0.55));
            ctx.font = `${emojiSize}px "Segoe UI Emoji"`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    const owner = world.getCell(x, y);
                    if (owner === 0) continue;
                    
                    const hasPort = world.hasBuilding(x, y, 'port');
                    const hasFactory = world.hasBuilding(x, y, 'factory');
                    if (!hasPort && !hasFactory) continue;
                    
                    const screenX = x * 20 * zoom + camX;
                    const screenY = y * 20 * zoom + camY;
                    
                    let yOffset = 2;
                    if (hasPort) {
                        ctx.fillStyle = '#3b82f6';
                        ctx.fillText('⚓', screenX + 2, screenY + yOffset);
                        yOffset += size * 0.45;
                    }
                    if (hasFactory) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText('🏭', screenX + 2, screenY + yOffset);
                    }
                }
            }
        }
        
        // Рисуем юнитов
        let unitsDrawn = 0;
        const unitFontSize = Math.max(12, size * 0.7);
        ctx.font = `${unitFontSize}px "Segoe UI Emoji"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 1; i < entities.nextId; i++) {
            if (!entities.active[i]) continue;
            
            const screenX = entities.x[i] * 20 * zoom + camX;
            const screenY = entities.y[i] * 20 * zoom + camY;
            
            if (screenX + size < -50 || screenX > this.canvas.width + 50 || 
                screenY + size < -50 || screenY > this.canvas.height + 50) continue;
            
            if (entities.owner[i] === gameState.myCountryId) {
                ctx.fillStyle = '#ffffff';
            } else if (gameState.isAtWar && gameState.isAtWar(gameState.myCountryId, entities.owner[i])) {
                ctx.fillStyle = '#ff6666';
            } else {
                ctx.fillStyle = '#cccccc';
            }
            
            const icon = entities.type[i] === 0 ? '💂' : '🚜';
            ctx.fillText(icon, screenX + size / 2, screenY + size / 2);
            
            if (entities.hp[i] < entities.maxHp[i] && size > 15) {
                const hpPercent = entities.hp[i] / entities.maxHp[i];
                const barWidth = size * 0.6;
                const barX = screenX + (size - barWidth) / 2;
                const barY = screenY + size - 3;
                
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(barX, barY, barWidth, 3);
                ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
                ctx.fillRect(barX, barY, barWidth * hpPercent, 3);
            }
            
            unitsDrawn++;
        }
        
        // Выделенный юнит
        const selectedId = gameState.selectedUnitId;
        if (selectedId && entities.active[selectedId]) {
            const screenX = entities.x[selectedId] * 20 * zoom + camX;
            const screenY = entities.y[selectedId] * 20 * zoom + camY;
            
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - 2, screenY - 2, size + 4, size + 4);

            // Линия к цели если есть приказ
            // (путь хранится в movementSystem — не тянем сюда, просто подсветка достаточна)
        }

        // Отрисовка очередей обучения и строительства (из ProductionSystem)
        const playerQueue = production ? production.getPlayerQueue() : (gameState.trainingQueue || []);
        if (size > 8 && playerQueue.length) {
            for (const item of playerQueue) {
                const sx = item.x * 20 * zoom + camX;
                const sy = item.y * 20 * zoom + camY;
                if (sx < -size || sx > this.canvas.width + size || sy < -size || sy > this.canvas.height + size) continue;

                const isUnit = item.type === 'unit';
                ctx.fillStyle = isUnit ? 'rgba(59,130,246,0.35)' : 'rgba(234,179,8,0.35)';
                ctx.fillRect(sx, sy, size, size);

                const pct = 1 - item.daysLeft / item.totalDays;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(sx, sy + size - 4, size, 4);
                ctx.fillStyle = isUnit ? '#3b82f6' : '#eab308';
                ctx.fillRect(sx, sy + size - 4, size * pct, 4);

                if (size > 14) {
                    ctx.font = `${Math.max(10, size * 0.55)}px "Segoe UI Emoji"`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    const icon = isUnit ? (item.unitType === 'tank' ? '🛡️' : '🪖') : '🏗️';
                    ctx.fillText(icon, sx + size / 2, sy + size / 2 - 2);
                }
            }
        }

        // Лог производительности
        this.frameCount++;
        if (this.frameCount >= 60) {
            this.frameCount = 0;
            console.log(`🎨 Рендер: ${cellsDrawn} клеток, ${unitsDrawn} юнитов`);
        }
    }
    
    getCountryColor(countryId) {
        const colors = {
            germany: '#3a3a3a',
            ussr: '#990000',
            poland: '#ffc0cb',
            france: '#3b82f6',
            uk: '#ef4444',
            italy: '#166534',
            spain: '#fbbf24',
            portugal: '#105d10',
            netherlands: '#f97316',
            belgium: '#eab308',
            luxembourg: '#67e8f9',
            switzerland: '#dc2626',
            romania: '#eab308',
            hungary: '#166534',
            bulgaria: '#105d10',
            finland: '#ffffff',
            czechoslovakia: '#3b82f6',
            austria: '#ef4444',
            denmark: '#ef4444',
            greece: '#60a5fa',
            yugoslavia: '#1e3a8a',
            lithuania: '#065f46',
            latvia: '#8b0000',
            estonia: '#4682b4',
            slovakia: '#60a5fa',
            turkey: '#c8102e'
        };
        return colors[countryId] || '#666666';
    }
    
    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        return {
            x: Math.floor(((canvasX - this.canvas.width / 2) / this.camera.zoom + this.camera.x) / 20),
            y: Math.floor(((canvasY - this.canvas.height / 2) / this.camera.zoom + this.camera.y) / 20)
        };
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cameraInitialized = false;
    }
    
    setCamera(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }
    
    zoom(delta, mouseX, mouseY) {
        const before = this.screenToWorld(mouseX, mouseY);
        const newZoom = this.camera.zoom * (delta > 0 ? 0.9 : 1.1);
        this.camera.zoom = Math.min(Math.max(newZoom, 0.1), 5);
        const after = this.screenToWorld(mouseX, mouseY);
        this.camera.x += (before.x - after.x) * 20;
        this.camera.y += (before.y - after.y) * 20;
    }
}
