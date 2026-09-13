// NetworkSync.js — Синхронизация с ACK-based передачей чанками
// Разбиваем большие сообщения на куски по 20 КБ, ждём ACK на каждый.
// Форсируем рендер через window.forceRender() и обновляем UI через window._topBar.

import { addNotification } from '../utils/helpers.js';

export class NetworkSync {
    constructor(networkManager, world, entities, gameState) {
        this.net = networkManager;
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        this.enabled = false;

        // ─── ACK ───
        this._outQueue = [];
        this._pendingAck = null;
        this._ackTimeout = null;
        this._ackWaitMs = 10000;
        this._maxRetries = 3;

        // ─── Отправка чанками ───
        this._CHUNK_SIZE = 20000;  // 20 КБ
        this._currentMessage = null;
        this._currentChunks = [];
        this._currentChunkIndex = 0;
        this._currentMsgId = 0;
        this._currentTotalChunks = 0;
        this._messageId = 0;

        // ─── Приём чанков ───
        this._incomingChunks = new Map();  // msgId → { parts, total, received, msgType }

        this._lastSentState = null;

        // ─── Колбэки ───
        this.onInitialStateApplied = null;
        this.onDayTick = null;
        this.onStateDelta = null;
    }

    enable() {
        this.enabled = true;
        console.log('[Sync] Активирован (chunked + ACK). Хост:', this.net.isHost);
    }

    disable() {
        this.enabled = false;
        this._clearAckTimeout();
        this._outQueue = [];
        this._pendingAck = null;
        this._currentMessage = null;
        this._currentChunks = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОТПРАВКА (хост)
    // ═══════════════════════════════════════════════════════════════════════

    _enqueue(msg) {
        if (!this.net.isHost) return;
        this._outQueue.push(msg);
        this._trySendNext();
    }

    _trySendNext() {
        if (this._pendingAck) return;
        if (this._outQueue.length === 0) return;

        const msg = this._outQueue.shift();
        this._currentMessage = msg;
        this._pendingAck = msg;   // помечаем как ожидающее ACK
        this._ackRetries = 0;

        this._startSendingMessage(msg);
    }

    _startSendingMessage(msg) {
        let json;
        try {
            json = JSON.stringify(msg);
        } catch (e) {
            console.error('[Sync] JSON error:', e);
            this._finishCurrentMessage();
            return;
        }

        const len = json.length;

        if (len <= this._CHUNK_SIZE) {
            // Маленькое — отправляем сразу как один чанк
            console.log('[Sync] Отправка', msg.type, 'размер:', len);
            this._sendChunk({
                type: '_chunk',
                msgId: this._messageId++,
                index: 0,
                total: 1,
                msgType: msg.type,
                data: json
            });
            // Ждём ACK
            this._waitForAck();
        } else {
            // Большое — разбиваем
            const totalChunks = Math.ceil(len / this._CHUNK_SIZE);
            const msgId = this._messageId++;

            console.log('[Sync] Отправка', msg.type, 'размер:', len, 'чанков:', totalChunks);

            this._currentChunks = [];
            for (let i = 0; i < totalChunks; i++) {
                const start = i * this._CHUNK_SIZE;
                const end = Math.min(start + this._CHUNK_SIZE, len);
                this._currentChunks.push(json.slice(start, end));
            }
            this._currentChunkIndex = 0;
            this._currentMsgId = msgId;
            this._currentTotalChunks = totalChunks;

            // Отправляем первый чанк, потом следующий
            this._sendNextChunk();
        }
    }

    _sendNextChunk() {
        if (this._currentChunkIndex >= this._currentTotalChunks) {
            // Все чанки отправлены — ждём финальный ACK
            this._waitForAck();
            return;
        }

        const chunkMsg = {
            type: '_chunk',
            msgId: this._currentMsgId,
            index: this._currentChunkIndex,
            total: this._currentTotalChunks,
            msgType: this._currentMessage.type,
            data: this._currentChunks[this._currentChunkIndex]
        };

        this._sendChunk(chunkMsg);
        this._currentChunkIndex++;

        // Отправляем следующий чанк через паузу
        setTimeout(() => this._sendNextChunk(), 30);
    }

    _sendChunk(chunk) {
        let json;
        try {
            json = JSON.stringify(chunk);
        } catch (e) {
            console.error('[Sync] chunk JSON error:', e);
            return;
        }

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

    _waitForAck() {
        this._clearAckTimeout();
        this._ackTimeout = setTimeout(() => {
            if (this._ackRetries < this._maxRetries) {
                this._ackRetries++;
                console.warn('[Sync] ACK не получен, повтор', this._ackRetries);

                // Повторяем отправку
                if (this._currentChunks && this._currentChunks.length > 0) {
                    this._currentChunkIndex = 0;
                    this._sendNextChunk();
                } else if (this._currentMessage) {
                    this._startSendingMessage(this._currentMessage);
                }
            } else {
                console.error('[Sync] ACK не получен после', this._maxRetries, 'попыток');
                this._finishCurrentMessage();
            }
        }, this._ackWaitMs);
    }

    _onAck() {
        this._clearAckTimeout();
        this._finishCurrentMessage();
    }

    _finishCurrentMessage() {
        this._clearAckTimeout();
        this._pendingAck = null;
        this._currentMessage = null;
        this._currentChunks = [];
        this._currentChunkIndex = 0;
        this._ackRetries = 0;

        // Отправляем следующее из очереди
        setTimeout(() => this._trySendNext(), 50);
    }

    _clearAckTimeout() {
        if (this._ackTimeout) {
            clearTimeout(this._ackTimeout);
            this._ackTimeout = null;
        }
    }

    _sendAck(msgType, msgId) {
        const ack = JSON.stringify({ type: 'ack', for: msgType, msgId: msgId });

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                try {
                    conn.send(ack);
                } catch (e) {}
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: ОТПРАВКА СОСТОЯНИЯ
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

        this._lastSentState = {
            day: this.gs.days,
            cells: new Map(this.world.cells),
            entities: this._snapshotEntities()
        };

        this._enqueue(state);
    }

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

    hostSendDelta() {
        if (!this.net.isHost || !this.enabled) return;

        if (!this._lastSentState) {
            this._lastSentState = { day: 0, cells: new Map(), entities: new Map() };
        }

        // ─── Изменившиеся клетки ───
        const changedCells = [];
        for (const [pos, owner] of this.world.cells) {
            if (this._lastSentState.cells.get(pos) !== owner) {
                const [x, y] = pos.split(',').map(Number);
                changedCells.push([x, y, owner]);
            }
        }

        // ─── Юниты ───
        const currentEntities = this._snapshotEntities();
        const changedEntities = [];
        const removedEntities = [];

        for (const [id, e] of currentEntities) {
            const old = this._lastSentState.entities.get(id);
            if (!old || old.x !== e.x || old.y !== e.y || old.hp !== e.hp ||
                old.inCombat !== e.inCombat || old.isShip !== e.isShip || old.training !== e.training) {
                changedEntities.push(e);
            }
        }

        for (const [id] of this._lastSentState.entities) {
            if (!currentEntities.has(id)) removedEntities.push(id);
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
            return;
        }

        console.log('[Sync] Дельта: клеток', changedCells.length, 'юнитов', changedEntities.length, 'удалено', removedEntities.length);

        const delta = {
            type: 'state_delta',
            day: this.gs.days,
            cells: changedCells,
            entities: changedEntities,
            removed: removedEntities,
            gameState: gsDelta
        };

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
    // ОБРАБОТКА ВХОДЯЩИХ
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
                if (!this.net.isHost) {
                    this._handleChunk(parsed);
                }
                return true;

            case 'day_tick':
                if (!this.net.isHost) {
                    this.applyDayTick(parsed);
                    this._sendAck('day_tick', 0);
                }
                return true;

            case 'state_delta':
                if (!this.net.isHost) {
                    this.applyStateDelta(parsed);
                    this._sendAck('state_delta', 0);
                }
                return true;

            case 'ack':
                if (this.net.isHost) {
                    this._onAck();
                }
                return true;

            default:
                return false;
        }
    }

    _handleChunk(chunk) {
        const msgId = chunk.msgId;

        if (!this._incomingChunks.has(msgId)) {
            this._incomingChunks.set(msgId, {
                parts: new Array(chunk.total),
                total: chunk.total,
                received: 0,
                msgType: chunk.msgType
            });
        }

        const buffer = this._incomingChunks.get(msgId);
        if (buffer.parts[chunk.index] === undefined) {
            buffer.parts[chunk.index] = chunk.data;
            buffer.received++;
        }

        if (buffer.received === buffer.total) {
            const fullJson = buffer.parts.join('');
            this._incomingChunks.delete(msgId);

            try {
                const msg = JSON.parse(fullJson);
                console.log('[Sync] Собрано', msg.type, 'размер:', fullJson.length);

                // Отправляем ACK на полное сообщение
                this._sendAck(msg.type, msgId);

                // Применяем
                if (msg.type === 'initial_state') {
                    console.log('[Sync] Получено: initial_state');
                    this.applyInitialState(msg);
                } else if (msg.type === 'state_delta') {
                    console.log('[Sync] Получено: state_delta');
                    this.applyStateDelta(msg);
                } else if (msg.type === 'day_tick') {
                    this.applyDayTick(msg);
                }
            } catch (e) {
                console.error('[Sync] Ошибка парсинга собранного:', e);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ПРИМЕНЕНИЕ (клиент)
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
                        for (const b of blds.split(',')) this.world.addBuilding(x, y, b);
                    }
                }
                if (w.cellStats) {
                    const entries = typeof w.cellStats === 'string' ? w.cellStats.split('|') : [];
                    for (const entry of entries) {
                        const ci = entry.indexOf(':');
                        if (ci === -1) continue;
                        try { this.world.cellStats.set(entry.substring(0, ci), JSON.parse(entry.substring(ci + 1))); } catch(e) {}
                    }
                }
                this.world.bounds = w.bounds || { minX: -50, maxX: 50, minY: -50, maxY: 50 };
                this.world.capitals = w.capitals || {};
                console.log('[Sync] Мир применён. Клеток:', this.world.cells.size);
            }

            if (msg.waterCells) {
                this.world.waterCells.clear();
                for (const pos of msg.waterCells) this.world.waterCells.add(pos);
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

            // ─── ФОРСИРУЕМ РЕНДЕР И UI ───
            if (window.renderer) {
                window.renderer._polygonCache = null;
                window.renderer._polygonCacheVersion = 0;
                window.renderer.cameraInitialized = false;
                if (window.renderer._colorCache) window.renderer._colorCache.clear();
            }
            if (window.forceRender) window.forceRender();
            if (window._topBar) window._topBar.update();

            console.log('[Sync] Начальное состояние применено');
            addNotification('✅ Состояние мира загружено', 'info');

            if (this.onInitialStateApplied) this.onInitialStateApplied();
        } catch (err) {
            console.error('[Sync] Ошибка применения начального состояния:', err);
        }
    }

    applyDayTick(msg) {
        this.gs.days = msg.day;
        this.gs.gameDate = new Date(msg.date);
        if (msg.gameSpeed !== undefined) this.gs.gameSpeed = msg.gameSpeed;

        if (this.entities) this.entities.tickTraining();

        // ─── ФОРСИРУЕМ РЕНДЕР И UI ───
        if (window.forceRender) window.forceRender();
        if (window._topBar) window._topBar.update();

        if (this.onDayTick) this.onDayTick(msg);
    }

    applyStateDelta(msg) {
        if (!msg) return;

        // ─── GameState ───
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

        // ─── Клетки ───
        if (msg.cells && Array.isArray(msg.cells)) {
            for (const c of msg.cells) {
                this.world.setCell(c[0], c[1], c[2]);
            }
            console.log('[Sync] Клеток обновлено:', msg.cells.length);
        }

        // ─── Юниты ───
        if (msg.entities && Array.isArray(msg.entities)) {
            for (const e of msg.entities) {
                const id = e.id;
                if (!this.entities.active[id]) {
                    // Новый юнит
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
        }

        // ─── Удалённые юниты ───
        if (msg.removed && Array.isArray(msg.removed)) {
            for (const id of msg.removed) {
                this.entities.removeEntity(id);
            }
        }

        // ─── ФОРСИРУЕМ РЕНДЕР И UI ───
        if (window.renderer) {
            window.renderer._polygonCache = null;
            window.renderer._polygonCacheVersion = 0;
        }
        if (window.forceRender) window.forceRender();
        if (window._topBar) window._topBar.update();

        if (this.onStateDelta) this.onStateDelta(msg);
    }
}
