// NetworkManager.js — Сетевая игра через PeerJS (P2P)
// Хост создаёт комнату, клиенты подключаются по Room ID.
// Автоопределение HTTP/HTTPS: если игра по HTTPS — PeerServer тоже должен быть HTTPS.

import { addNotification } from '../utils/helpers.js';

export class NetworkManager {
    constructor(world, entities, gameState) {
        this.world = world;
        this.entities = entities;
        this.gs = gameState;

        this.peer = null;
        this.isHost = false;
        this.roomId = null;
        this.myPeerId = null;

        // host: Map<peerId, DataConnection>
        // client: [{ conn }]
        this.connections = new Map();

        this.hostPlayerCountry = null; // страна хоста
        this.clientCountries = new Map(); // peerId → countryId

        // Колбэки для main.js
        this.onPlayerJoined = null;   // (peerId, countryId) => {}
        this.onPlayerLeft = null;     // (peerId) => {}
        this.onGameStateReceived = null; // (state) => {}
        this.onPlayerAction = null;   // (peerId, action) => {}
        this.onConnected = null;      // () => {}
        this.onError = null;          // (err) => {}
    }

    /**
     * Определяет, использовать ли secure-подключение.
     * Если игра открыта по HTTPS, PeerServer тоже должен быть HTTPS,
     * иначе браузер заблокирует запрос (Mixed Content).
     */
    _isSecure() {
        return window.location.protocol === 'https:';
    }

    // ── ХОСТ: создать комнату ─────────────────────────────────────────────

    /**
     * @param {string} serverHost — IP PeerServer (например '26.80.246.235')
     * @param {number} serverPort — порт (9000)
     * @param {string} serverPath — '/heirloom'
     * @param {string} serverKey  — 'Heirloom120926'
     */
    createRoom(serverHost, serverPort, serverPath, serverKey) {
        if (this.peer) this.disconnect();

        this.isHost = true;

        const isHttps = this._isSecure();
        console.log('[Net] Создание комнаты. Secure:', isHttps);

        return new Promise((resolve, reject) => {
            try {
                this.peer = new Peer({
                    host: serverHost,
                    port: serverPort,
                    path: serverPath,
                    key: serverKey,
                    secure: isHttps,
                    debug: 1
                });
            } catch (err) {
                reject(new Error('PeerJS не загружен. Проверьте подключение к интернету.'));
                return;
            }

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                this.roomId = id;
                console.log('[Net] Комната создана, ID:', id);
                addNotification('🌐 Комната создана. ID: ' + id, 'info');
                if (this.onConnected) this.onConnected();
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this._handleIncomingConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('[Net] Ошибка peer:', err);
                if (err.type === 'unavailable-id') {
                    reject(new Error('Этот ID уже занят. Попробуйте снова.'));
                } else if (err.type === 'network' || err.type === 'server-error') {
                    reject(new Error('Не удалось подключиться к PeerServer. Проверьте, что он запущен по HTTPS и IP верный.'));
                } else if (err.type === 'ssl-unavailable') {
                    reject(new Error('PeerServer не поддерживает HTTPS. Запустите сервер с флагами --ssl --sslkey --sslcert.'));
                } else {
                    if (this.onError) this.onError(err);
                    reject(err);
                }
            });
        });
    }

    _handleIncomingConnection(conn) {
        conn.on('open', () => {
            console.log('[Net] Подключился игрок:', conn.peer);
            this.connections.set(conn.peer, conn);

            // Отправляем клиенту приветствие с текущим состоянием
            conn.send({
                type: 'welcome',
                roomId: this.roomId,
                hostCountry: this.gs.myCountryId,
                gameDate: this.gs.gameDate.toISOString(),
                days: this.gs.days
            });

            if (this.onPlayerJoined) this.onPlayerJoined(conn.peer, null);
        });

        conn.on('data', (data) => {
            this._handleData(conn.peer, data);
        });

        conn.on('close', () => {
            console.log('[Net] Игрок отключился:', conn.peer);
            this.connections.delete(conn.peer);
            this.clientCountries.delete(conn.peer);
            if (this.onPlayerLeft) this.onPlayerLeft(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('[Net] Ошибка соединения:', err);
        });
    }

    // ── КЛИЕНТ: подключиться к комнате ────────────────────────────────────

    joinRoom(serverHost, serverPort, serverPath, serverKey, roomId) {
        if (this.peer) this.disconnect();

        this.isHost = false;
        this.roomId = roomId;

        const isHttps = this._isSecure();
        console.log('[Net] Подключение к комнате. Secure:', isHttps);

        return new Promise((resolve, reject) => {
            try {
                this.peer = new Peer({
                    host: serverHost,
                    port: serverPort,
                    path: serverPath,
                    key: serverKey,
                    secure: isHttps,
                    debug: 1
                });
            } catch (err) {
                reject(new Error('PeerJS не загружен.'));
                return;
            }

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                console.log('[Net] Мой ID:', id, '. Подключаюсь к', roomId);

                const conn = this.peer.connect(roomId, { reliable: true });
                this.connections.set(roomId, conn);

                conn.on('open', () => {
                    console.log('[Net] Подключено к хосту');
                    if (this.onConnected) this.onConnected();
                    resolve(conn);
                });

                conn.on('data', (data) => {
                    this._handleData(roomId, data);
                });

                conn.on('close', () => {
                    console.log('[Net] Соединение с хостом закрыто');
                    this.connections.delete(roomId);
                    if (this.onPlayerLeft) this.onPlayerLeft(roomId);
                });

                conn.on('error', (err) => {
                    console.error('[Net] Ошибка:', err);
                    if (this.onError) this.onError(err);
                    reject(err);
                });

                // Таймаут на подключение
                setTimeout(() => {
                    if (!conn.open) {
                        reject(new Error('Не удалось подключиться. Проверьте Room ID и что хост онлайн.'));
                    }
                }, 10000);
            });

            this.peer.on('error', (err) => {
                console.error('[Net] Ошибка peer:', err);
                if (err.type === 'peer-unavailable') {
                    reject(new Error('Комната не найдена. Проверьте Room ID.'));
                } else if (err.type === 'network' || err.type === 'server-error') {
                    reject(new Error('Не удалось подключиться к PeerServer. Проверьте, что он запущен по HTTPS.'));
                } else if (err.type === 'ssl-unavailable') {
                    reject(new Error('PeerServer не поддерживает HTTPS. Запустите сервер с флагами --ssl.'));
                } else {
                    if (this.onError) this.onError(err);
                    reject(err);
                }
            });
        });
    }

    // ── ОБМЕН ДАННЫМИ ─────────────────────────────────────────────────────

    _handleData(fromPeerId, data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'welcome':
                this.hostPlayerCountry = data.hostCountry;
                if (this.onGameStateReceived) this.onGameStateReceived(data);
                break;

            case 'player_joined':
                if (this.onPlayerJoined) this.onPlayerJoined(data.peerId, data.country);
                break;

            case 'player_left':
                if (this.onPlayerLeft) this.onPlayerLeft(data.peerId);
                break;

            case 'action':
                if (this.onPlayerAction) this.onPlayerAction(fromPeerId, data.action);
                break;

            case 'state_sync':
                if (this.onGameStateReceived) this.onGameStateReceived(data.state);
                break;

            case 'chat':
                addNotification('💬 ' + (data.from || '???') + ': ' + data.text, 'info');
                break;

            default:
                console.warn('[Net] Неизвестный тип данных:', data.type);
        }
    }

    /**
     * Отправить действие всем (кроме себя).
     */
    broadcastAction(action) {
        const msg = {
            type: 'action',
            action: action,
            from: this.myPeerId
        };
        for (const [peerId, conn] of this.connections) {
            if (conn.open) {
                conn.send(msg);
            }
        }
    }

    /**
     * Хост рассылает состояние всем клиентам.
     */
    broadcastState(state) {
        if (!this.isHost) return;
        const msg = { type: 'state_sync', state: state };
        for (const [peerId, conn] of this.connections) {
            if (conn.open) {
                conn.send(msg);
            }
        }
    }

    /**
     * Хост сообщает всем о новом игроке.
     */
    notifyPlayerJoined(peerId, country) {
        const msg = { type: 'player_joined', peerId, country };
        for (const [id, conn] of this.connections) {
            if (conn.open && id !== peerId) conn.send(msg);
        }
    }

    notifyPlayerLeft(peerId) {
        const msg = { type: 'player_left', peerId };
        for (const [id, conn] of this.connections) {
            if (conn.open && id !== peerId) conn.send(msg);
        }
    }

    sendChat(text) {
        const msg = { type: 'chat', text: text, from: this.myPeerId };
        for (const [, conn] of this.connections) {
            if (conn.open) conn.send(msg);
        }
    }

    // ── СЛУЖЕБНОЕ ─────────────────────────────────────────────────────────

    getPlayerCount() {
        return this.connections.size + (this.isHost ? 1 : 0);
    }

    isConnected() {
        return this.peer !== null && !this.peer.destroyed;
    }

    disconnect() {
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (e) {}
            this.peer = null;
        }
        this.connections.clear();
        this.clientCountries.clear();
        this.isHost = false;
        this.roomId = null;
        this.myPeerId = null;
    }

    serializeState() {
        return {
            myCountryId: this.gs.myCountryId,
            days: this.gs.days,
            gameDate: this.gs.gameDate.toISOString(),
            equipment: this.gs.equipment,
            manpower: this.gs.manpower,
            wars: [...this.gs.wars],
            alliances: this.gs.alliances.map(a => [...a]),
            worldCells: Array.from(this.world.cells.entries()),
            entities: this.entities.serialize()
        };
    }

    applyState(state) {
        if (!state) return;
        console.log('[Net] Получено состояние:', state);
    }
}
