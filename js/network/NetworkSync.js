// NetworkSync.js — Синхронизация игрового состояния между хостом и клиентами
// Host-authoritative: хост — источник правды, клиенты применяют его состояние.
//
// ВАЖНО: PeerJS использует binarypack для сериализации. На больших объектах
// (>100 КБ) он падает с RangeError. Поэтому:
//   1. Все сообщения идут через JSON.stringify — binarypack получает строку.
//   2. Большие сообщения (world) разбиваются на чанки по 4 КБ.

import { addNotification } from '../utils/helpers.js';

export class NetworkSync {
    constructor(networkManager, world, entities, gameState) {
        this.net = networkManager;
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        // Хост: рассылка дельты раз в N дней
        this.STATE_BROADCAST_INTERVAL = 3;
        this.lastBroadcastDay = -1;

        this.enabled = false;

        // Чанки для больших сообщений
        this._chunkBuffer = new Map(); // key → { parts: [], total: N, msgType }

        // Колбэки
        this.onInitialStateApplied = null;
        this.onDayTick = null;
        this.onStateDelta = null;
    }

    enable() {
        this.enabled = true;
        console.log('[Sync] Активирован. Хост:', this.net.isHost);
    }

    disable() {
        this.enabled = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОТПРАВКА С РАЗБИВКОЙ НА ЧАНКИ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Отправить сообщение всем клиентам.
     * Если сообщение большое — разбить на чанки.
     */
    _sendToAll(msg) {
        let json;
        try {
            json = JSON.stringify(msg);
        } catch (e) {
            console.error('[Sync] Ошибка JSON.stringify:', e);
            return;
        }

        const len = json.length;
        const CHUNK_SIZE = 4000; // 4 КБ на чанк

        if (len <= CHUNK_SIZE) {
            // Маленькое — отправляем сразу
            console.log('[Sync] Отправка', msg.type, 'размер:', len);
            this._sendRaw(json);
        } else {
            // Большое — разбиваем на чанки
            const chunkId = 'chunk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            const totalChunks = Math.ceil(len / CHUNK_SIZE);

            console.log('[Sync] Отправка', msg.type, 'размер:', len, 'чанков:', totalChunks);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, len);
                const part = json.slice(start, end);

                const chunkMsg = JSON.stringify({
                    type: '_chunk',
                    chunkId: chunkId,
                    index: i,
                    total: totalChunks,
                    msgType: msg.type,
                    data: part
                });

                this._sendRaw(chunkMsg);
            }
        }
    }

    _sendRaw(json) {
        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                try {
                    conn.send(json);
                } catch (e) {
                    console.error('[Sync] Send error:', e);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОБРАБОТКА ЧАНКОВ
    // ═══════════════════════════════════════════════════════════════════════

    _handleChunk(data) {
        const key = data.chunkId;

        if (!this._chunkBuffer.has(key)) {
            this._chunkBuffer.set(key, {
                parts: new Array(data.total),
                total: data.total,
                received: 0,
                msgType: data.msgType
            });
        }

        const buffer = this._chunkBuffer.get(key);
        if (buffer.parts[data.index] === undefined) {
            buffer.parts[data.index] = data.data;
            buffer.received++;
        }

        // Все чанки получены?
        if (buffer.received === buffer.total) {
            const fullJson = buffer.parts.join('');
            this._chunkBuffer.delete(key);

            try {
                const msg = JSON.parse(fullJson);
                console.log('[Sync] Собрано', msg.type, 'размер:', fullJson.length);
                this._processMessage(msg);
            } catch (e) {
                console.error('[Sync] Ошибка парсинга собранного сообщения:', e);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: НАЧАЛЬНОЕ СОСТОЯНИЕ
    // ═══════════════════════════════════════════════════════════════════════

    hostSendInitialState() {
        if (!this.net.isHost) return;

        console.log('[Sync] Рассылка начального состояния...');

        const state = {
            type: 'initial_state',
            world: this.world.serialize(),
            waterCells: Array.from(this.world.waterCells),
            entities: this.entities.serialize(),
            gameState: this.gs.serialize(),
            timestamp: Date.now()
        };

        this._sendToAll(state);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // КЛИЕНТ: ПРИМЕНЕНИЕ НАЧАЛЬНОГО СОСТОЯНИЯ
    // ═══════════════════════════════════════════════════════════════════════

    applyInitialState(msg) {
        console.log('[Sync] Применение начального состояния от хоста...');

        try {
            if (msg.world) {
                const w = msg.world;

                this.world.cells.clear();
                this.world.waterCells.clear();
                this.world.buildings.clear();
                this.world.cellStats.clear();
                this.world.countryCache.clear();

                if (w.cells) {
                    const entries = typeof w.cells === 'string' ? w.cells.split('|') : [];
                    for (const entry of entries) {
                        const [pos, owner] = entry.split(':');
                        const [x, y] = pos.split(',').map(Number);
                        this.world.setCell(x, y, owner);
                    }
                }

                if (w.buildings) {
                    const entries = typeof w.buildings === 'string' ? w.buildings.split('|') : [];
                    for (const entry of entries) {
                        const [pos, blds] = entry.split(':');
                        const [x, y] = pos.split(',').map(Number);
                        for (const b of blds.split(',')) {
                            this.world.addBuilding(x, y, b);
                        }
                    }
                }

                if (w.cellStats) {
                    const entries = typeof w.cellStats === 'string' ? w.cellStats.split('|') : [];
                    for (const entry of entries) {
                        const colonIdx = entry.indexOf(':');
                        if (colonIdx === -1) continue;
                        const pos = entry.substring(0, colonIdx);
                        const json = entry.substring(colonIdx + 1);
                        try { this.world.cellStats.set(pos, JSON.parse(json)); } catch(e) {}
                    }
                }

                this.world.bounds = w.bounds || { minX: -50, maxX: 50, minY: -50, maxY: 50 };
                this.world.capitals = w.capitals || {};

                console.log('[Sync] Мир применён. Клеток:', this.world.cells.size);
            }

            if (msg.waterCells) {
                this.world.waterCells.clear();
                for (const pos of msg.waterCells) {
                    this.world.waterCells.add(pos);
                }
                console.log('[Sync] Воды применено:', this.world.waterCells.size);
            }

            if (msg.entities) {
                this.entities.deserialize(msg.entities);
                console.log('[Sync] Юнитов применено:', this.entities.activeIds.length);
            }

            if (msg.gameState) {
                const myCountryId = this.gs.myCountryId;
                const myPlayerName = window._myPlayerName;
                this.gs.deserialize(msg.gameState);
                this.gs.myCountryId = myCountryId;
                window._myPlayerName = myPlayerName;
                console.log('[Sync] GameState применён. День:', this.gs.days);
            }

            // Сброс кэшей
            if (window.renderer) {
                window.renderer._polygonCache = null;
                window.renderer._polygonCacheVersion = 0;
                window.renderer.cameraInitialized = false;
                if (window.renderer._colorCache) {
                    window.renderer._colorCache.clear();
                }
            }
            if (window.needsRender !== undefined) {
                window.needsRender = true;
            }

            console.log('[Sync] Начальное состояние применено');
            addNotification('✅ Состояние мира загружено', 'info');

            if (this.onInitialStateApplied) this.onInitialStateApplied();

        } catch (err) {
            console.error('[Sync] Ошибка применения начального состояния:', err);
            addNotification('❌ Ошибка: ' + err.message, 'war');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: DAY_TICK (каждый день, маленькое)
    // ═══════════════════════════════════════════════════════════════════════

    hostBroadcastDay() {
        if (!this.net.isHost || !this.enabled) return;

        const msg = {
            type: 'day_tick',
            day: this.gs.days,
            date: this.gs.gameDate.toISOString(),
            gameSpeed: this.gs.gameSpeed
        };

        this._sendToAll(msg);
    }

    applyDayTick(msg) {
        this.gs.days = msg.day;
        this.gs.gameDate = new Date(msg.date);
        if (msg.gameSpeed !== undefined) {
            this.gs.gameSpeed = msg.gameSpeed;
        }

        if (this.entities) this.entities.tickTraining();

        if (window.needsRender !== undefined) {
            window.needsRender = true;
        }

        if (this.onDayTick) this.onDayTick(msg);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: STATE_DELTA (раз в N дней, большое)
    // ═══════════════════════════════════════════════════════════════════════

    hostBroadcastStateDelta() {
        if (!this.net.isHost || !this.enabled) return;

        if (this.gs.days - this.lastBroadcastDay < this.STATE_BROADCAST_INTERVAL) {
            return;
        }
        this.lastBroadcastDay = this.gs.days;

        const delta = {
            type: 'state_delta',
            day: this.gs.days,
            gameState: {
                equipment: this.gs.equipment,
                manpower: this.gs.manpower,
                maxManpower: this.gs.maxManpower,
                factories: this.gs.factories,
                wars: this.gs.wars,
                alliances: this.gs.alliances.map(a => [...a]),
                vassals: this.gs.vassals,
                relations: this.gs.relations,
                activeResearch: this.gs.activeResearch,
                activeFocus: this.gs.activeFocus,
                completedFocuses: [...this.gs.completedFocuses],
                ideologyChange: this.gs.ideologyChange,
                justifications: this.gs.justifications
            },
            world: this.world.serialize(),
            entities: this.entities.serialize()
        };

        this._sendToAll(delta);
    }

    applyStateDelta(msg) {
        if (!msg) return;

        // GameState
        if (msg.gameState) {
            const d = msg.gameState;
            if (d.equipment !== undefined) this.gs.equipment = d.equipment;
            if (d.manpower !== undefined) this.gs.manpower = d.manpower;
            if (d.maxManpower !== undefined) this.gs.maxManpower = d.maxManpower;
            if (d.factories !== undefined) this.gs.factories = d.factories;
            if (d.wars) this.gs.wars = d.wars;
            if (d.alliances) this.gs.alliances = d.alliances.map(a => new Set(a));
            if (d.vassals) this.gs.vassals = d.vassals;
            if (d.relations) this.gs.relations = d.relations;
            if (d.activeResearch !== undefined) this.gs.activeResearch = d.activeResearch;
            if (d.activeFocus !== undefined) this.gs.activeFocus = d.activeFocus;
            if (d.completedFocuses) this.gs.completedFocuses = new Set(d.completedFocuses);
            if (d.ideologyChange !== undefined) this.gs.ideologyChange = d.ideologyChange;
            if (d.justifications !== undefined) this.gs.justifications = d.justifications;
        }

        // Клетки
        if (msg.world && msg.world.cells) {
            this.world.cells.clear();
            this.world.countryCache.clear();

            const entries = typeof msg.world.cells === 'string' ? msg.world.cells.split('|') : [];
            for (const entry of entries) {
                const [pos, owner] = entry.split(':');
                const [x, y] = pos.split(',').map(Number);
                this.world.setCell(x, y, owner);
            }

            if (msg.world.bounds) this.world.bounds = msg.world.bounds;
            if (msg.world.capitals) this.world.capitals = msg.world.capitals;
        }

        // Здания
        if (msg.world && msg.world.buildings) {
            this.world.buildings.clear();
            const entries = typeof msg.world.buildings === 'string' ? msg.world.buildings.split('|') : [];
            for (const entry of entries) {
                const [pos, blds] = entry.split(':');
                const [x, y] = pos.split(',').map(Number);
                for (const b of blds.split(',')) {
                    this.world.addBuilding(x, y, b);
                }
            }
        }

        // Юниты
        if (msg.entities) {
            this.entities.deserialize(msg.entities);
        }

        // Сброс кэша рендера
        if (window.renderer) {
            window.renderer._polygonCache = null;
            window.renderer._polygonCacheVersion = 0;
        }

        if (window.needsRender !== undefined) {
            window.needsRender = true;
        }

        if (this.onStateDelta) this.onStateDelta(msg);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ
    // ═══════════════════════════════════════════════════════════════════════

    handleMessage(fromPeerId, data) {
        // Если пришла строка — парсим JSON
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn('[Sync] JSON parse error:', e);
                return false;
            }
        }

        if (!data || !data.type) return false;

        // Чанки обрабатываем отдельно
        if (data.type === '_chunk') {
            this._handleChunk(data);
            return true;
        }

        // Лог для отладки
        if (data.type !== 'day_tick') {
            console.log('[Sync] Получено:', data.type);
        }

        this._processMessage(data);
        return true;
    }

    _processMessage(data) {
        switch (data.type) {
            case 'initial_state':
                if (!this.net.isHost) {
                    this.applyInitialState(data);
                }
                break;

            case 'day_tick':
                if (!this.net.isHost) {
                    this.applyDayTick(data);
                }
                break;

            case 'state_delta':
                if (!this.net.isHost) {
                    this.applyStateDelta(data);
                }
                break;
        }
    }
}
