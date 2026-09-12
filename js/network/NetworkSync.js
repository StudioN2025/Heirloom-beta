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
        this.STATE_BROADCAST_INTERVAL = 30; // раз в 30 игровых дней
        this.lastBroadcastDay = -1;

        // Настройки
        this.enabled = false;

        // Колбэки для main.js
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

    /**
     * Вызывается, когда хост нажал «НАЧАТЬ ИГРУ».
     * Отправляет всем клиентам полное состояние: карта, юниты, gameState.
     */
    hostSendInitialState() {
        if (!this.net.isHost) return;

        console.log('[Sync] Рассылка начального состояния...');

        const state = {
            type: 'initial_state',
            world: this.world.serialize(),
            entities: this.entities.serialize(),
            gameState: this.gs.serialize(),
            timestamp: Date.now()
        };

        // Отправляем всем
        let count = 0;
        for (const [peerId, conn] of this.net.connections) {
            if (conn.open) {
                conn.send(state);
                count++;
            }
        }

        console.log('[Sync] Начальное состояние отправлено', count, 'клиентам');
    }

    /**
     * Клиент применяет начальное состояние от хоста.
     */
    applyInitialState(msg) {
        console.log('[Sync] Применение начального состояния от хоста...');

        try {
            // Применяем мир
            if (msg.world) {
                const newWorld = this.world.constructor.deserialize
                    ? this.world.constructor.deserialize(msg.world)
                    : null;

                if (newWorld) {
                    // Копируем поля из newWorld в текущий world
                    this.world.cells = newWorld.cells;
                    this.world.waterCells = newWorld.waterCells;
                    this.world.buildings = newWorld.buildings;
                    this.world.cellStats = newWorld.cellStats;
                    this.world.countryCache = newWorld.countryCache;
                    this.world.bounds = newWorld.bounds;
                    this.world.capitals = newWorld.capitals;
                }
            }

            // Применяем юнитов
            if (msg.entities) {
                this.entities.deserialize(msg.entities);
            }

            // Применяем gameState
            if (msg.gameState) {
                // Сохраняем myCountryId — он у клиента свой
                const myCountryId = this.gs.myCountryId;
                const myPlayerName = window._myPlayerName;

                this.gs.deserialize(msg.gameState);

                // Восстанавливаем своё
                this.gs.myCountryId = myCountryId;
                window._myPlayerName = myPlayerName;
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

    /**
     * Вызывается каждый игровой день у хоста.
     * Рассылает текущий день всем клиентам.
     */
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

    /**
     * Клиент применяет day_tick.
     */
    applyDayTick(msg) {
        this.gs.days = msg.day;
        this.gs.gameDate = new Date(msg.date);
        // Скорость игры — только хоста, клиент синхронизирует
        if (msg.gameSpeed !== undefined) {
            this.gs.gameSpeed = msg.gameSpeed;
        }

        if (this.onDayTick) this.onDayTick(msg);
    }

    // ─── ХОСТ: рассылка дельты состояния ──────────────────────────────────

    /**
     * Раз в N дней хост рассылает ключевые поля gameState.
     * Это «лёгкая» синхронизация — только ресурсы, войны, альянсы.
     */
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
            }
        };

        for (const [, conn] of this.net.connections) {
            if (conn.open) {
                conn.send(delta);
            }
        }
    }

    /**
     * Клиент применяет дельту gameState.
     */
    applyStateDelta(msg) {
        if (!msg.gameState) return;

        const d = msg.gameState;

        // Ресурсы (только если это не моя страна)
        // Хост — источник правды, клиент НЕ перезаписывает свои ресурсы
        // Но пока клиент не может играть — перезаписываем всё
        if (d.equipment !== undefined) this.gs.equipment = d.equipment;
        if (d.manpower !== undefined) this.gs.manpower = d.manpower;
        if (d.maxManpower !== undefined) this.gs.maxManpower = d.maxManpower;
        if (d.factories !== undefined) this.gs.factories = d.factories;

        // Войны и альянсы
        if (d.wars) this.gs.wars = d.wars;
        if (d.alliances) this.gs.alliances = d.alliances.map(a => new Set(a));
        if (d.vassals) this.gs.vassals = d.vassals;
        if (d.relations) this.gs.relations = d.relations;

        // Технологии и фокусы
        if (d.activeResearch !== undefined) this.gs.activeResearch = d.activeResearch;
        if (d.activeFocus !== undefined) this.gs.activeFocus = d.activeFocus;
        if (d.completedFocuses) this.gs.completedFocuses = new Set(d.completedFocuses);
        if (d.ideologyChange !== undefined) this.gs.ideologyChange = d.ideologyChange;
        if (d.justifications !== undefined) this.gs.justifications = d.justifications;

        if (this.onStateDelta) this.onStateDelta(msg);
    }

    // ─── Обработка входящих сообщений ─────────────────────────────────────

    /**
     * Вызывается из NetworkManager при получении данных.
     * Возвращает true, если сообщение обработано.
     */
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
