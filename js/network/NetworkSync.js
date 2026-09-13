// NetworkSync.js — ACK-based синхронизация
// Хост отправляет только ИЗМЕНЕНИЯ, ждёт ACK от клиента, потом шлёт следующее.

import { addNotification } from '../utils/helpers.js';

export class NetworkSync {
    constructor(networkManager, world, entities, gameState) {
        this.net = networkManager;
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        this.enabled = false;

        // ─── Хост: очередь сообщений на отправку ───
        this._outQueue = [];           // очередь сообщений
        this._pendingAck = null;       // сообщение, ждущее ACK
        this._ackTimeout = null;       // таймер повтора
        this._ackWaitMs = 3000;        // ждать ACK 3 секунды
        this._maxRetries = 3;          // до 3 повторов

        // ─── Отслеживание изменений (хост) ───
        this._lastSentState = null;    // последнее отправленное состояние

        // ─── Отслеживание чанков ───
        this._chunkBuffer = new Map();

        // ─── Колбэки ───
        this.onInitialStateApplied = null;
        this.onDayTick = null;
        this.onStateDelta = null;
    }

    enable() {
        this.enabled = true;
        console.log('[Sync] Активирован (ACK-based). Хост:', this.net.isHost);
    }

    disable() {
        this.enabled = false;
        this._clearAckTimeout();
        this._outQueue = [];
        this._pendingAck = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: ОТПРАВКА ОЧЕРЕДИ С ACK
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Добавить сообщение в очередь на отправку.
     * Если очередь пуста и нет ожидающего ACK — отправить сразу.
     */
    _enqueue(msg) {
        if (!this.net.isHost) return;

        this._outQueue.push(msg);
        this._trySendNext();
    }

    _trySendNext() {
        // Уже ждём ACK — не отправляем
        if (this._pendingAck) return;

        // Очередь пуста
        if (this._outQueue.length === 0) return;

        const msg = this._outQueue.shift();
        this._pendingAck = msg;
        this._ackRetries = 0;

        this._sendWithAck(msg);
    }

    _sendWithAck(msg) {
        // Сериализуем в JSON
        let json;
        try {
            json = JSON.stringify(msg);
        } catch (e) {
            console.error('[Sync] JSON error:', e);
            this._onAck(); // пропускаем
            return;
        }

        const len = json.length;
        const CHUNK_SIZE = 4000;

        if (len <= CHUNK_SIZE) {
            // Маленькое — отправляем сразу
            console.log('[Sync] Отправка', msg.type, 'размер:', len);
            this._sendRaw(json);
        } else {
            // Большое — разбиваем на чанки
            const chunkId = 'chunk_' + Date.now();
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

        // Ждём ACK с таймаутом
        this._ackTimeout = setTimeout(() => {
            if (this._ackRetries < this._maxRetries) {
                this._ackRetries++;
                console.warn('[Sync] ACK не получен, повтор', this._ackRetries);
                this._sendWithAck(msg); // повторяем
            } else {
                console.error('[Sync] ACK не получен после', this._maxRetries, 'попыток');
                this._onAck(); // пропускаем и идём дальше
            }
        }, this._ackWaitMs);
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

    /**
     * Получен ACK от клиента.
     */
    _onAck() {
        this._clearAckTimeout();
        this._pendingAck = null;
        this._ackRetries = 0;

        // Отправляем следующее
        setTimeout(() => this._trySendNext(), 50);
    }

    _clearAckTimeout() {
        if (this._ackTimeout) {
            clearTimeout(this._ackTimeout);
            this._ackTimeout = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // КЛИЕНТ: ПОДТВЕРЖДЕНИЕ
    // ═══════════════════════════════════════════════════════════════════════

    _sendAck(msgType, day) {
        const ack = JSON.stringify({
            type: 'ack',
            for: msgType,
            day: day
        });

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                try {
                    conn.send(ack);
                } catch (e) {}
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОТПРАВКА СОБЫТИЙ (хост)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Отправить начальное состояние (при старте).
     */
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

        // Инициализируем «последнее состояние» для отслеживания дельт
        this._lastSentState = {
            day: this.gs.days,
            cells: new Map(this.world.cells),
            entities: this._snapshotEntities()
        };

        this._enqueue(state);
    }

    /**
     * Отправить day_tick (раз в день).
     */
    hostSendDayTick() {
        if (!this.net.isHost || !this.enabled) return;

        const msg = {
            type: 'day_tick',
            day: this.gs.days,
            date: this.gs.gameDate.toISOString(),
            gameSpeed: this.gs.gameSpeed
        };

        this._enqueue(msg);
    }

    /**
     * Отправить дельту — только ИЗМЕНЕНИЯ.
     */
    hostSendDelta() {
        if (!this.net.isHost || !this.enabled) return;

        if (!this._lastSentState) {
            // Первый раз — считаем всё изменённым
            this._lastSentState = {
                day: 0,
                cells: new Map(),
                entities: new Map()
            };
        }

        // ─── Изменившиеся клетки ───
        const changedCells = [];
        for (const [pos, owner] of this.world.cells) {
            const oldOwner = this._lastSentState.cells.get(pos);
            if (oldOwner !== owner) {
                const [x, y] = pos.split(',').map(Number);
                changedCells.push({ x, y, owner });
            }
        }

        // ─── Удалённые клетки? (обычно нет) ───
        // Пропускаем — клетки не удаляются.

        // ─── Изменившиеся юниты ───
        const currentEntities = this._snapshotEntities();
        const changedEntities = [];
        const removedEntities = [];

        for (const [id, e] of currentEntities) {
            const old = this._lastSentState.entities.get(id);
            if (!old || old.x !== e.x || old.y !== e.y || old.hp !== e.hp ||
                old.inCombat !== e.inCombat || old.isShip !== e.isShip ||
                old.training !== e.training) {
                changedEntities.push(e);
            }
        }

        for (const [id] of this._lastSentState.entities) {
            if (!currentEntities.has(id)) {
                removedEntities.push(id);
            }
        }

        // ─── GameState ───
        const gsDelta = {
            day: this.gs.days,
            equipment: Math.round(this.gs.equipment),
            manpower: Math.round(this.gs.manpower),
            maxManpower: Math.round(this.gs.maxManpower),
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
        };

        // Если ничего не изменилось — не отправляем
        if (changedCells.length === 0 && changedEntities.length === 0 && removedEntities.length === 0) {
            // Но day_tick всё равно отправляем отдельно
            return;
        }

        const delta = {
            type: 'state_delta',
            day: this.gs.days,
            cells: changedCells,
            entities: changedEntities,
            removed: removedEntities,
            gameState: gsDelta
        };

        console.log('[Sync] Дельта: клеток', changedCells.length,
            'юнитов', changedEntities.length, 'удалено', removedEntities.length);

        // Обновляем «последнее состояние»
        this._lastSentState = {
            day: this.gs.days,
            cells: new Map(this.world.cells),
            entities: currentEntities
        };

        this._enqueue(delta);
    }

    _snapshotEntities() {
        const map = new Map();
        for (const id of this.entities.activeIds) {
            map.set(id, {
                id: id,
                owner: this.entities.owner[id],
                type: this.entities.type[id],
                x: this.entities.x[id],
                y: this.entities.y[id],
                hp: this.entities.hp[id],
                maxHp: this.entities.maxHp[id],
                inCombat: this.entities.inCombat[id],
                isShip: this.entities.isShip[id],
                training: this.entities.training[id]
            });
        }
        return map;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ
    // ═══════════════════════════════════════════════════════════════════════

    handleMessage(fromPeerId, data) {
        // Sync-сообщения — только строки
        if (typeof data !== 'string') return false;

        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            return false;
        }

        if (!parsed || !parsed.type) return false;

        switch (parsed.type) {
            case '_chunk':
                this._handleChunk(parsed);
                return true;

            case 'initial_state':
                if (!this.net.isHost) {
                    console.log('[Sync] Получено: initial_state');
                    this.applyInitialState(parsed);
                    this._sendAck('initial_state', parsed.gameState ? parsed.gameState.days : 0);
                }
                return true;

            case 'day_tick':
                if (!this.net.isHost) {
                    this.applyDayTick(parsed);
                    this._sendAck('day_tick', parsed.day);
                }
                return true;

            case 'state_delta':
                if (!this.net.isHost) {
                    this.applyStateDelta(parsed);
                    this._sendAck('state_delta', parsed.day);
                }
                return true;

            case 'ack':
                if (this.net.isHost) {
                    // Хост получил ACK от клиента
                    this._onAck();
                }
                return true;

            default:
                return false;
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

    _processMessage(msg) {
        switch (msg.type) {
            case 'initial_state':
                if (!this.net.isHost) {
                    this.applyInitialState(msg);
                    this._sendAck('initial_state', msg.gameState ? msg.gameState.days : 0);
                }
                break;
            case 'day_tick':
                if (!this.net.isHost) {
                    this.applyDayTick(msg);
                    this._sendAck('day_tick', msg.day);
                }
                break;
            case 'state_delta':
                if (!this.net.isHost) {
                    this.applyStateDelta(msg);
                    this._sendAck('state_delta', msg.day);
                }
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ПРИМЕНЕНИЕ СОСТОЯНИЯ (клиент)
    // ═══════════════════════════════════════════════════════════════════════

    applyInitialState(msg) {
        console.log('[Sync] Применение начального состояния...');

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
            }

            if (msg.entities) {
                this.entities.deserialize(msg.entities);
                console.log('[Sync] Юнитов:', this.entities.activeIds.length);
            }

            if (msg.gameState) {
                const myCountryId = this.gs.myCountryId;
                const myPlayerName = window._myPlayerName;
                this.gs.deserialize(msg.gameState);
                this.gs.myCountryId = myCountryId;
                window._myPlayerName = myPlayerName;
                console.log('[Sync] GameState применён. День:', this.gs.days);
            }

            if (window.renderer) {
                window.renderer._polygonCache = null;
                window.renderer.cameraInitialized = false;
            }
            if (window.needsRender !== undefined) {
                window.needsRender = true;
            }

            console.log('[Sync] Начальное состояние применено');
            addNotification('✅ Состояние мира загружено', 'info');

            if (this.onInitialStateApplied) this.onInitialStateApplied();

        } catch (err) {
            console.error('[Sync] Ошибка:', err);
        }
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

        // Изменившиеся клетки
        if (msg.cells && Array.isArray(msg.cells)) {
            for (const c of msg.cells) {
                this.world.setCell(c.x, c.y, c.owner);
            }
            console.log('[Sync] Клеток обновлено:', msg.cells.length);
        }

        // Изменившиеся юниты
        if (msg.entities && Array.isArray(msg.entities)) {
            for (const e of msg.entities) {
                const id = e.id;
                if (!this.entities.active[id]) {
                    // Новый юнит — создаём
                    this.entities.active[id] = 1;
                    this.entities.owner[id] = e.owner;
                    this.entities.type[id] = e.type;
                    this.entities.maxHp[id] = e.maxHp;
                    this.entities.nextId = Math.max(this.entities.nextId, id + 1);

                    const pkey = e.x + ',' + e.y;
                    if (!this.entities.positionIndex.has(pkey)) this.entities.positionIndex.set(pkey, new Set());
                    this.entities.positionIndex.get(pkey).add(id);

                    if (!this.entities.ownerIndex.has(e.owner)) this.entities.ownerIndex.set(e.owner, new Set());
                    this.entities.ownerIndex.get(e.owner).add(id);

                    this.entities._markActiveDirty();
                } else {
                    // Существующий — обновляем позицию
                    if (this.entities.x[id] !== e.x || this.entities.y[id] !== e.y) {
                        this.entities.moveTo(id, e.x, e.y);
                    }
                }

                this.entities.x[id] = e.x;
                this.entities.y[id] = e.y;
                this.entities.hp[id] = e.hp;
                this.entities.inCombat[id] = e.inCombat;
                this.entities.isShip[id] = e.isShip;
                this.entities.training[id] = e.training;
            }
            console.log('[Sync] Юнитов обновлено:', msg.entities.length);
        }

        // Удалённые юниты
        if (msg.removed && Array.isArray(msg.removed)) {
            for (const id of msg.removed) {
                this.entities.removeEntity(id);
            }
            console.log('[Sync] Юнитов удалено:', msg.removed.length);
        }

        // Сброс кэша рендера
        if (window.renderer) {
            window.renderer._polygonCache = null;
        }

        if (window.needsRender !== undefined) {
            window.needsRender = true;
        }

        if (this.onStateDelta) this.onStateDelta(msg);
    }
}
