// NetworkLobby.js — Состояние лобби: игроки, чат, выбор стран

export class NetworkLobby {
    constructor(networkManager, gameState, world) {
        this.net = networkManager;
        this.gs = gameState;
        this.world = world;

        this.players = [];
        this.chatMessages = [];
        this.availableCountries = [];
        this.myName = null;

        this.onPlayersChanged = null;
        this.onChatMessage = null;
        this.onGameStart = null;
        this.onError = null;
    }

    // ── Инициализация (ХОСТ) ──────────────────────────────────────────────

    hostInit(myName, myCountryId) {
        this.myName = myName;

        this.players = [{
            peerId: this.net.myPeerId,
            name: myName,
            countryId: myCountryId,
            isHost: true,
            isReady: true
        }];

        // Привязываем обработчики к сети
        this.net.onPlayerJoined = (peerId, countryId) => {
            console.log('[Lobby] Хост: игрок подключился', peerId);
            this._addPlayer(peerId, countryId);
        };

        this.net.onPlayerLeft = (peerId) => {
            console.log('[Lobby] Хост: игрок отключился', peerId);
            this._removePlayer(peerId);
        };

        this._addSystemMessage(`Лобби создано. Room ID: ${this.net.roomId}`);
        this._refreshCountries();
        if (this.onPlayersChanged) this.onPlayersChanged();
    }

    // ── Инициализация (КЛИЕНТ) ────────────────────────────────────────────

    clientInit(myName) {
        this.myName = myName;

        this.net.onPlayerJoined = (peerId, countryId) => {
            console.log('[Lobby] Клиент: игрок подключился', peerId);
            this._addPlayer(peerId, countryId);
        };

        this.net.onPlayerLeft = (peerId) => {
            console.log('[Lobby] Клиент: игрок отключился', peerId);
            this._removePlayer(peerId);
        };

        // Отправляем хосту своё имя
        this.net.broadcastAction({
            kind: 'lobby_join',
            name: myName
        });

        this._addSystemMessage('Подключение к лобби...');

        // Если через 3 секунды список пуст — запрашиваем явно
        setTimeout(() => {
            if (this.players.length === 0) {
                console.log('[Lobby] Список пуст, запрашиваю...');
                this.net.broadcastAction({
                    kind: 'lobby_request_players'
                });
            }
        }, 3000);
    }

    // ── Управление игроками ───────────────────────────────────────────────

    _addPlayer(peerId, countryId) {
        if (this.players.find(p => p.peerId === peerId)) return;

        this.players.push({
            peerId,
            name: 'player_' + peerId.slice(0, 4),
            countryId: countryId || null,
            isHost: false,
            isReady: false
        });

        this._addSystemMessage('Игрок подключился: ' + peerId.slice(0, 6));
        this._refreshCountries();

        if (this.onPlayersChanged) this.onPlayersChanged();

        // Хост рассылает обновление
        if (this.net.isHost) {
            this.net.broadcastAction({
                kind: 'lobby_players',
                players: this.players
            });
        }
    }

    _removePlayer(peerId) {
        const idx = this.players.findIndex(p => p.peerId === peerId);
        if (idx === -1) return;

        const removed = this.players[idx];
        this.players.splice(idx, 1);

        this._addSystemMessage('Игрок отключился: ' + removed.name);
        this._refreshCountries();

        if (this.onPlayersChanged) this.onPlayersChanged();

        if (this.net.isHost) {
            this.net.broadcastAction({
                kind: 'lobby_players',
                players: this.players
            });
        }
    }

    setPlayerName(peerId, name) {
        const p = this.players.find(pl => pl.peerId === peerId);
        if (!p) return;
        p.name = name;
        if (this.onPlayersChanged) this.onPlayersChanged();
    }

    selectCountry(peerId, countryId) {
        const taken = this.players.find(p => p.countryId === countryId && p.peerId !== peerId);
        if (taken) {
            if (this.onError) this.onError('Эта страна уже занята');
            return false;
        }

        const p = this.players.find(pl => pl.peerId === peerId);
        if (!p) {
            console.warn('[Lobby] selectCountry: игрок не найден', peerId);
            return false;
        }

        p.countryId = countryId;
        p.isReady = true;

        this._addSystemMessage(`${p.name} выбрал ${countryId}`);

        if (this.onPlayersChanged) this.onPlayersChanged();

        if (this.net.isHost) {
            this.net.broadcastAction({
                kind: 'lobby_players',
                players: this.players
            });
        } else {
            this.net.broadcastAction({
                kind: 'lobby_select_country',
                peerId: peerId,
                countryId: countryId
            });
        }

        return true;
    }

    isAllReady() {
        return this.players.length > 0 && this.players.every(p => p.countryId !== null);
    }

    // ── Чат ───────────────────────────────────────────────────────────────

    sendChat(text, senderName) {
        if (!text || !text.trim()) return;

        const msg = {
            from: senderName,
            text: text.trim(),
            time: Date.now(),
            isSystem: false
        };

        this.chatMessages.push(msg);
        if (this.onChatMessage) this.onChatMessage(msg);

        this.net.broadcastAction({
            kind: 'lobby_chat',
            name: senderName,
            text: text.trim()
        });
    }

    _addSystemMessage(text) {
        const msg = {
            from: 'SYSTEM',
            text: text,
            time: Date.now(),
            isSystem: true
        };
        this.chatMessages.push(msg);
        if (this.onChatMessage) this.onChatMessage(msg);
    }

    receiveChat(name, text) {
        const msg = {
            from: name,
            text: text,
            time: Date.now(),
            isSystem: false
        };
        this.chatMessages.push(msg);
        if (this.onChatMessage) this.onChatMessage(msg);
    }

    // ── Страны ────────────────────────────────────────────────────────────

    _refreshCountries() {
        const allCountries = this.world.getAllCountries();
        const taken = new Set(this.players.map(p => p.countryId).filter(Boolean));

        this.availableCountries = allCountries.filter(c => !taken.has(c)).sort((a, b) => {
            const sa = this.world.getCountryCells(a).size;
            const sb = this.world.getCountryCells(b).size;
            return sb - sa;
        });
    }

    // ── Старт игры (хост) ─────────────────────────────────────────────────

    startGame() {
        if (!this.net.isHost) return false;
        if (!this.isAllReady()) return false;

        this.net.broadcastAction({
            kind: 'lobby_start',
            players: this.players
        });

        if (this.onGameStart) this.onGameStart(this.players);
        return true;
    }

    receiveStart(players) {
        this.players = players;
        if (this.onGameStart) this.onGameStart(players);
    }

    // ── Обработка входящих сообщений ──────────────────────────────────────

    handleAction(fromPeerId, action) {
        if (!action || !action.kind) return;

        switch (action.kind) {
            case 'lobby_join':
                if (this.net.isHost) {
                    let p = this.players.find(pl => pl.peerId === fromPeerId);
                    if (!p) {
                        p = {
                            peerId: fromPeerId,
                            name: action.name || 'player',
                            countryId: null,
                            isHost: false,
                            isReady: false
                        };
                        this.players.push(p);
                        this._addSystemMessage(`${p.name} подключился`);
                    } else {
                        p.name = action.name || p.name;
                    }

                    this._refreshCountries();
                    if (this.onPlayersChanged) this.onPlayersChanged();

                    // Рассылаем всем обновлённый список
                    this.net.broadcastAction({
                        kind: 'lobby_players',
                        players: this.players
                    });

                    // Отправляем лично клиенту
                    this.net.sendTo(fromPeerId, {
                        type: 'action',
                        action: {
                            kind: 'lobby_players',
                            players: this.players
                        }
                    });
                }
                break;

            case 'lobby_request_players':
                if (this.net.isHost) {
                    console.log('[Lobby] Хост: клиент запросил список', fromPeerId);
                    this.net.sendTo(fromPeerId, {
                        type: 'action',
                        action: {
                            kind: 'lobby_players',
                            players: this.players
                        }
                    });
                }
                break;

            case 'lobby_players':
                if (!this.net.isHost) {
                    console.log('[Lobby] Клиент: получил список игроков', action.players.length);
                    this.players = action.players;
                    this._refreshCountries();
                    if (this.onPlayersChanged) this.onPlayersChanged();
                }
                break;

            case 'lobby_select_country':
                if (this.net.isHost) {
                    this.selectCountry(fromPeerId, action.countryId);
                }
                break;

            case 'lobby_chat':
                this.receiveChat(action.name, action.text);
                break;

            case 'lobby_start':
                if (!this.net.isHost) {
                    this.receiveStart(action.players);
                }
                break;
        }
    }
}
