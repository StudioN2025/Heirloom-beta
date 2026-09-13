// NetworkSync.js — Синхронизация игрового состояния между хостом и клиентами
// Host-authoritative: хост — источник правды, клиенты применяют его состояние.

import { addNotification } from '../utils/helpers.js';

export class NetworkSync {
    constructor(networkManager, world, entities, gameState) {
        this.net = networkManager;
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        // Хост: рассылка состояния раз в N дней
        this.STATE_BROADCAST_INTERVAL = 3; // раз в 3 игровых дня
        this.lastBroadcastDay = -1;

        // Настройки
        this.enabled = false;

        // Колбэки
        this.onInitialStateApplied = null;
        this.onDayTick = null;
        this.onStateDelta = null;
    }

    // ─── Активация ────────────────────────────────────────────────────────

    enable() {
        this.enabled = true;
        console.log('[Sync] Активирован. Хост:', this.net.isHost);
    }

    disable() {
        this.enabled = false;
    }

    // ─── ХОСТ: рассылка начального состояния ──────────────────────────────

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

        let count = 0;
        for (const [peerId, conn] of this.net.connections) {
            if (conn.open) {
                conn.send(state);
                count++;
            }
        }

        console.log('[Sync] Начальное состояние отправлено', count, 'клиентам');
    }

    // ─── КЛИЕНТ: применение начального состояния ──────────────────────────

    applyInitialState(msg) {
        console.log('[Sync] Применение начального состояния от хоста...');

        try {
            // ═══════════════════════════════════════════════════════════════
            // 1. МИР — полная пересборка
            // ═══════════════════════════════════════════════════════════════
            if (msg.world) {
                const w = msg.world;

                // Очищаем
                this.world.cells.clear();
                this.world.waterCells.clear();
                this.world.buildings.clear();
                this.world.cellStats.clear();
                this.world.countryCache.clear();

                // Клетки
                if (w.cells) {
                    const entries = typeof w.cells === 'string' ? w.cells.split('|') : [];
                    for (const entry of entries) {
                        const [pos, owner] = entry.split(':');
                        const [x, y] = pos.split(',').map(Number);
                        this.world.setCell(x, y, owner);
                    }
                }

                // Здания
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

                // cellStats
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

                // Bounds и capitals
                this.world.bounds = w.bounds || { minX: -50, maxX: 50, minY: -50, maxY: 50 };
                this.world.capitals = w.capitals || {};

                console.log('[Sync] Мир применён. Клеток:', this.world.cells.size, 'стран:', this.world.countryCache.size);
            }

            // Вода — отдельно
            if (msg.waterCells) {
                this.world.waterCells.clear();
                for (const pos of msg.waterCells) {
                    this.world.waterCells.add(pos);
                }
                console.log('[Sync] Воды применено:', this.world.waterCells.size);
            }

            // ═══════════════════════════════════════════════════════════════
            // 2. ЮНИТЫ — полная пересборка
            // ═══════════════════════════════════════════════════════════════
            if (msg.entities) {
                this.entities.deserialize(msg.entities);
                console.log('[Sync] Юнитов применено:', this.entities.activeIds.length);
            }

            // ═══════════════════════════════════════════════════════════════
            // 3. GameState
            // ═══════════════════════════════════════════════════════════════
            if (msg.gameState) {
                const myCountryId = this.gs.myCountryId;
                const myPlayerName = window._myPlayerName;

                this.gs.deserialize(msg.gameState);

                this.gs.myCountryId = myCountryId;
                window._myPlayerName = myPlayerName;

                console.log('[Sync] GameState применён. День:', this.gs.days);
            }

            // ═══════════════════════════════════════════════════════════════
            // 4. СБРОС КЭШЕЙ
            // ═══════════════════════════════════════════════════════════════
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
            addNotification('❌ Ошибка загрузки состояния: ' + err.message, 'war');
        }
    }

    // ─── ХОСТ: рассылка тика дня ──────────────────────────────────────────

    hostBroadcastDay() {
        if (!this.net.isHost || !this.enabled) return;

        const msg = {
            type: 'day_tick',
            day: this.gs.days,
            date: this.gs.gameDate.toISOString(),
            gameSpeed: this.gs.gameSpeed
        };

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                conn.send(msg);
            }
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

    // ─── ХОСТ: рассылка дельты состояния ──────────────────────────────────

    hostBroadcastStateDelta() {
        if (!this.net.isHost || !this.enabled) return;

        // Троттлинг
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
            // ─── КЛЕТКИ И ЮНИТЫ ───
            world: this.world.serialize(),
            entities: this.entities.serialize()
        };

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                conn.send(delta);
            }
        }
    }

    // ─── КЛИЕНТ: применение дельты ────────────────────────────────────────

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

        // ─── КЛЕТКИ ───
        if (msg.world && msg.world.cells) {
            this.world.cells.clear();
            this.world.countryCache.clear();

            const entries = typeof msg.world.cells === 'string' ? msg.world.cells.split('|') : [];
            for (const entry of entries) {
                const [pos, owner] = entry.split(':');
                const [x, y] = pos.split(',').map(Number);
                this.world.setCell(x, y, owner);
            }

            // Обновляем bounds и capitals
            if (msg.world.bounds) this.world.bounds = msg.world.bounds;
            if (msg.world.capitals) this.world.capitals = msg.world.capitals;
        }

        // ─── ЗДАНИЯ ───
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

        // ─── ЮНИТЫ ───
        if (msg.entities) {
            this.entities.deserialize(msg.entities);
        }

        // ─── СБРОС КЭША РЕНДЕРА ───
        if (window.renderer) {
            window.renderer._polygonCache = null;
            window.renderer._polygonCacheVersion = 0;
        }

        if (window.needsRender !== undefined) {
            window.needsRender = true;
        }

        if (this.onStateDelta) this.onStateDelta(msg);
    }

    // ─── Обработка входящих сообщений ─────────────────────────────────────

    handleMessage(fromPeerId, data) {
        if (!data || !data.type) return false;

        switch (data.type) {
            case 'initial_state':
                if (!this.net.isHost) {
                    this.applyInitialState(data);
                    return true;
                }
                break;

            case 'day_tick':
                if (!this.net.isHost) {
                    this.applyDayTick(data);
                    return true;
                }
                break;

            case 'state_delta':
                if (!this.net.isHost) {
                    this.applyStateDelta(data);
                    return true;
                }
                break;
        }

        return false;
    }
}
