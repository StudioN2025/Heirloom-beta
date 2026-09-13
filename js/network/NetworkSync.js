// NetworkSync.js — Синхронизация с сжатием gzip
// Передаём через pako.gzip — 500 КБ → 50 КБ, без чанков.

import { addNotification } from '../utils/helpers.js';

// Подключаем pako через CDN (в index.html)
// <script src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"></script>

export class NetworkSync {
    constructor(networkManager, world, entities, gameState) {
        this.net = networkManager;
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        this.enabled = false;

        // Очередь + ACK
        this._outQueue = [];
        this._pendingAck = null;
        this._ackTimeout = null;
        this._ackWaitMs = 5000;   // 5 секунд (gzip быстрее, чем чанки)
        this._maxRetries = 3;

        this._lastSentState = null;

        // Колбэки
        this.onInitialStateApplied = null;
        this.onDayTick = null;
        this.onStateDelta = null;
    }

    enable() {
        this.enabled = true;
        console.log('[Sync] Активирован (gzip + ACK). Хост:', this.net.isHost);
    }

    disable() {
        this.enabled = false;
        this._clearAckTimeout();
        this._outQueue = [];
        this._pendingAck = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // СЖАТИЕ
    // ═══════════════════════════════════════════════════════════════════════

    _compress(json) {
        try {
            const binary = new TextEncoder().encode(json);
            const compressed = pako.gzip(binary, { level: 6 });
            return compressed;
        } catch (e) {
            console.error('[Sync] Ошибка сжатия:', e);
            return null;
        }
    }

    _decompress(uint8) {
        try {
            const decompressed = pako.ungzip(uint8, { to: 'string' });
            return decompressed;
        } catch (e) {
            console.error('[Sync] Ошибка распаковки:', e);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ОЧЕРЕДЬ С ACK
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
        this._pendingAck = msg;
        this._ackRetries = 0;

        this._sendWithAck(msg);
    }

    _sendWithAck(msg) {
        let json;
        try {
            json = JSON.stringify(msg);
        } catch (e) {
            console.error('[Sync] JSON error:', e);
            this._onAck();
            return;
        }

        const jsonSize = json.length;
        const compressed = this._compress(json);

        if (!compressed) {
            this._onAck();
            return;
        }

        console.log('[Sync] Отправка', msg.type, 'JSON:', jsonSize, 'сжато:', compressed.length);

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                try {
                    // Отправляем как Uint8Array — PeerJS умеет бинарные данные
                    conn.send(compressed);
                } catch (e) {
                    console.error('[Sync] Send error:', e);
                }
            }
        }

        // Ждём ACK
        this._ackTimeout = setTimeout(() => {
            if (this._ackRetries < this._maxRetries) {
                this._ackRetries++;
                console.warn('[Sync] ACK не получен, повтор', this._ackRetries);
                this._sendWithAck(msg);
            } else {
                console.error('[Sync] ACK не получен после', this._maxRetries, 'попыток');
                this._onAck();
            }
        }, this._ackWaitMs);
    }

    _onAck() {
        this._clearAckTimeout();
        this._pendingAck = null;
        this._ackRetries = 0;
        setTimeout(() => this._trySendNext(), 50);
    }

    _clearAckTimeout() {
        if (this._ackTimeout) {
            clearTimeout(this._ackTimeout);
            this._ackTimeout = null;
        }
    }

    _sendAck(msgType, day) {
        const ack = JSON.stringify({ type: 'ack', for: msgType, day: day });
        const compressed = this._compress(ack);

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                try {
                    conn.send(compressed);
                } catch (e) {}
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ХОСТ: ОТПРАВКА
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

        // Изменившиеся клетки
        const changedCells = [];
        for (const [pos, owner] of this.world.cells) {
            if (this._lastSentState.cells.get(pos) !== owner) {
                const [x, y] = pos.split(',').map(Number);
                changedCells.push([x, y, owner]);
            }
        }

        // Юниты
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

        // GameState
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
        // Бинарные данные от pako.gzip
        let json = null;

        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            const uint8 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
            json = this._decompress(uint8);
            if (!json) return false;
        } else if (typeof data === 'string') {
            json = data;
        } else {
            return false;
        }

        let parsed;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            return false;
        }

        if (!parsed || !parsed.type) return false;

        switch (parsed.type) {
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
                    this._onAck();
                }
                return true;

            default:
                return false;
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

            if (window.renderer) {
                window.renderer._polygonCache = null;
                window.renderer.cameraInitialized = false;
            }
            if (window.needsRender !== undefined) window.needsRender = true;

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
        if (msg.gameSpeed !== undefined) this.gs.gameSpeed = msg.gameSpeed;
        if (this.entities) this.entities.tickTraining();
        if (window.needsRender !== undefined) window.needsRender = true;
        if (this.onDayTick) this.onDayTick(msg);
    }

    applyStateDelta(msg) {
        if (!msg) return;

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

        if (msg.cells && Array.isArray(msg.cells)) {
            for (const c of msg.cells) {
                this.world.setCell(c[0], c[1], c[2]);
            }
        }

        if (msg.entities && Array.isArray(msg.entities)) {
            for (const e of msg.entities) {
                const id = e.id;
                if (!this.entities.active[id]) {
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

        if (msg.removed && Array.isArray(msg.removed)) {
            for (const id of msg.removed) this.entities.removeEntity(id);
        }

        if (window.renderer) window.renderer._polygonCache = null;
        if (window.needsRender !== undefined) window.needsRender = true;

        if (this.onStateDelta) this.onStateDelta(msg);
    }
}
