// NetworkLobby.js — Состояние лобби: игроки, чат, выбор стран

export class NetworkLobby {
    constructor(networkManager, gameState, world) {
        this.net = networkManager;
        this.gs = gameState;
        this.world = world;

        // Список игроков в лобби
        // [{ peerId, name, countryId, isHost, isReady }]
        this.players = [];

        // Чат
        this.chatMessages = []; // [{ from, text, time, isSystem }]

        // Доступные страны (свободные)
        this.availableCountries = [];

        // Колбэки для UI
        this.onPlayersChanged = null;
        this.onChatMessage = null;
        this.onGameStart = null;
        this.onError = null;

        this._bindNetwork();
    }

    // ── Привязка к сети ───────────────────────────────────────────────────

    _bindNetwork() {
        this.net.onPlayerJoined = (peerId, countryId) => {
            this._addPlayer(peerId, countryId);
        };

        this.net.onPlayerLeft = (peerId) => {
            this._removePlayer(peerId);
        };
    }

    // ── Инициализация (хост) ──────────────────────────────────────────────

    /**
     * Хост создаёт лобби. Он автоматически становится первым игроком.
     */
    hostInit(myName, myCountryId) {
        this.players = [{
            peerId: this.net.myPeerId,
            name: myName,
            countryId: myCountryId,
            isHost: true,
            isReady: true
        }];

        this._addSystemMessage(`Лобби создано. Room ID: ${this.net.roomId}`);
        this._refreshCountries();
        if (this.onPlayersChanged) this.onPlayersChanged();
    }

    /**
     * Клиент подключается к лобби. Он отправляет хосту своё имя.
     */
    clientInit(myName) {
        // Отправляем хосту своё имя
        this.net.broadcastAction({
            kind: 'lobby_join',
            name: myName
        });

        this._addSystemMessage('Подключение к лобби...');
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

        // Если я хост — рассылаю всем актуальный список
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

        // Хост рассылает обновление
        if (this.net.isHost) {
            this.net.broadcastAction({
                kind: 'lobby_players',
                players: this.players
            });
        }
    }

    /**
     * Обновить имя игрока.
     */
    setPlayerName(peerId, name) {
        const p = this.players.find(pl => pl.peerId === peerId);
        if (!p) return;
        p.name = name;
        if (this.onPlayersChanged) this.onPlayersChanged();
    }

    /**
     * Игрок выбрал страну.
     */
    selectCountry(peerId, countryId) {
        // Проверяем, что страна свободна
        const taken = this.players.find(p => p.countryId === countryId && p.peerId !== peerId);
        if (taken) {
            if (this.onError) this.onError('Эта страна уже занята');
            return false;
        }

        const p = this.players.find(pl => pl.peerId === peerId);
        if (!p) return false;

        p.countryId = countryId;
        p.isReady = true;

        this._addSystemMessage(`${p.name} выбрал ${countryId}`);

        if (this.onPlayersChanged) this.onPlayersChanged();

        // Хост рассылает обновление
        if (this.net.isHost) {
            this.net.broadcastAction({
                kind: 'lobby_players',
                players: this.players
            });
        } else {
            // Клиент сообщает хосту
            this.net.broadcastAction({
                kind: 'lobby_select_country',
                peerId: peerId,
                countryId: countryId
            });
        }

        return true;
    }

    /**
     * Все ли игроки выбрали страны.
     */
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

        // Локально добавляем
        this.chatMessages.push(msg);
        if (this.onChatMessage) this.onChatMessage(msg);

        // Рассылаем всем
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

    /**
     * Получено сообщение из сети.
     */
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
            // Сортируем по размеру (крупные сверху)
            const sa = this.world.getCountryCells(a).size;
            const sb = this.world.getCountryCells(b).size;
            return sb - sa;
        });
    }

    // ── Старт игры (только хост) ──────────────────────────────────────────

    startGame() {
        if (!this.net.isHost) return false;
        if (!this.isAllReady()) return false;

        // Рассылаем всем финальный список игроков и команду старт
        this.net.broadcastAction({
            kind: 'lobby_start',
            players: this.players
        });

        // Хост тоже стартует
        if (this.onGameStart) this.onGameStart(this.players);
        return true;
    }

    /**
     * Получена команда старта (клиент).
     */
    receiveStart(players) {
        this.players = players;
        if (this.onGameStart) this.onGameStart(players);
    }

    // ── Обработка входящих сообщений лобби ────────────────────────────────

    /**
     * Вызывается из NetworkManager при получении action.
     */
    handleAction(fromPeerId, action) {
        if (!action || !action.kind) return;

        switch (action.kind) {
            case 'lobby_join':
                // Хост получил имя нового игрока
                if (this.net.isHost) {
                    const p = this.players.find(pl => pl.peerId === fromPeerId);
                    if (p) {
                        p.name = action.name;
                        if (this.onPlayersChanged) this.onPlayersChanged();
                        this._addSystemMessage(`${p.name} подключился`);
                        // Рассылаем всем
                        this.net.broadcastAction({
                            kind: 'lobby_players',
                            players: this.players
                        });
                    }
                }
                break;

            case 'lobby_players':
                // Клиент получил список игроков от хоста
                if (!this.net.isHost) {
                    this.players = action.players;
                    this._refreshCountries();
                    if (this.onPlayersChanged) this.onPlayersChanged();
                }
                break;

            case 'lobby_select_country':
                // Хост получил выбор страны от клиента
                if (this.net.isHost) {
                    this.selectCountry(fromPeerId, action.countryId);
                }
                break;

            case 'lobby_chat':
                // Получено сообщение чата
                this.receiveChat(action.name, action.text);
                break;

            case 'lobby_start':
                // Клиент получил команду старта
                if (!this.net.isHost) {
                    this.receiveStart(action.players);
                }
                break;
        }
    }
}
