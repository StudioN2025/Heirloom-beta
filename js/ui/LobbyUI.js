// LobbyUI.js — Интерфейс лобби: игроки, чат, выбор стран

export class LobbyUI {
    constructor(lobby, gameState, world, networkManager) {
        this.lobby = lobby;
        this.gs = gameState;
        this.world = world;
        this.net = networkManager;
        this.myName = null;
    }

    setMyName(name) {
        this.myName = name;
    }

    /**
     * Открыть лобби.
     */
    open() {
        const modal = document.getElementById('lobby-modal');
        const content = document.getElementById('lobby-content');
        if (!modal || !content) return;

        // Привязываем колбэки
        this.lobby.onPlayersChanged = () => this.renderPlayers();
        this.lobby.onChatMessage = (msg) => this.appendChat(msg);
        this.lobby.onError = (err) => this.showError(err);

        content.innerHTML = this._renderLayout();
        modal.classList.remove('hidden');

        // Первый рендер
        this.renderPlayers();
        this.renderChat();

        // Обработчики
        document.getElementById('lobby-chat-send')?.addEventListener('click', () => this._onSendChat());
        document.getElementById('lobby-chat-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._onSendChat();
        });

        document.getElementById('lobby-btn-start')?.addEventListener('click', () => {
            if (!this.net.isHost) return;
            this.lobby.startGame();
        });

        document.getElementById('lobby-btn-leave')?.addEventListener('click', () => {
            this.net.disconnect();
            this.close();
            if (window._networkMenu) window._networkMenu.open();
        });

        document.getElementById('lobby-btn-pick-country')?.addEventListener('click', () => {
            this.showCountryPicker();
        });
    }

    close() {
        const modal = document.getElementById('lobby-modal');
        if (modal) modal.classList.add('hidden');
    }

    // ── Разметка ──────────────────────────────────────────────────────────

    _renderLayout() {
        const isHost = this.net.isHost;
        const roomId = this.net.roomId || '—';

        return `
            <div style="display:flex;flex-direction:column;height:100%;background:#111827;">
                <!-- Заголовок -->
                <div style="padding:12px 16px;background:#0a0a0a;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:14px;font-weight:bold;color:#eab308;">🎮 ЛОББИ</div>
                        <div style="font-size:10px;color:#6b7280;margin-top:2px;">
                            Room ID: <span style="color:#22c55e;font-family:monospace;cursor:pointer;" onclick="navigator.clipboard.writeText('${roomId}');this.textContent='Скопировано!'">${roomId}</span>
                        </div>
                    </div>
                    <button id="lobby-btn-leave" style="padding:6px 12px;background:#991b1b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                        ← Выйти
                    </button>
                </div>

                <!-- Основная область -->
                <div style="display:flex;flex:1;overflow:hidden;">

                    <!-- Игроки -->
                    <div style="flex:1;padding:16px;overflow-y:auto;border-right:1px solid #374151;">
                        <div style="font-size:12px;font-weight:bold;color:#eab308;margin-bottom:12px;">
                            👥 ИГРОКИ (<span id="lobby-player-count">0</span>)
                        </div>
                        <div id="lobby-players-list"></div>

                        <div style="margin-top:16px;">
                            <button id="lobby-btn-pick-country" style="width:100%;padding:10px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px;">
                                🌍 ВЫБРАТЬ СТРАНУ
                            </button>
                        </div>

                        ${isHost ? `
                            <div style="margin-top:16px;">
                                <button id="lobby-btn-start" style="width:100%;padding:12px;background:#15803d;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
                                    ▶ НАЧАТЬ ИГРУ
                                </button>
                                <div id="lobby-start-hint" style="font-size:10px;color:#6b7280;text-align:center;margin-top:6px;">
                                    Ждём, пока все выберут страны...
                                </div>
                            </div>
                        ` : `
                            <div style="margin-top:16px;padding:10px;background:#1f2937;border-radius:6px;text-align:center;font-size:11px;color:#9ca3af;">
                                Ожидание хоста...
                            </div>
                        `}
                    </div>

                    <!-- Чат -->
                    <div style="width:280px;display:flex;flex-direction:column;background:#0a0a0a;">
                        <div style="padding:10px 12px;border-bottom:1px solid #374151;font-size:12px;font-weight:bold;color:#eab308;">
                            💬 ЧАТ
                        </div>
                        <div id="lobby-chat-messages" style="flex:1;overflow-y:auto;padding:10px;font-size:11px;line-height:1.5;"></div>
                        <div style="padding:8px;border-top:1px solid #374151;display:flex;gap:4px;">
                            <input id="lobby-chat-input" type="text" placeholder="Сообщение..." maxlength="200"
                                style="flex:1;padding:6px 8px;background:#1f2937;border:1px solid #374151;border-radius:4px;color:white;font-size:11px;outline:none;">
                            <button id="lobby-chat-send" style="padding:6px 10px;background:#1d4ed8;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ── Игроки ────────────────────────────────────────────────────────────

    renderPlayers() {
        const list = document.getElementById('lobby-players-list');
        const countEl = document.getElementById('lobby-player-count');
        if (!list) return;

        const players = this.lobby.players;
        if (countEl) countEl.textContent = players.length;

        list.innerHTML = players.map(p => {
            const isMe = p.peerId === this.net.myPeerId;
            const countryName = p.countryId ? this._countryName(p.countryId) : '<span style="color:#6b7280;">— не выбрана —</span>';
            const hostMark = p.isHost ? '👑' : '🎮';
            const meMark = isMe ? ' <span style="color:#22c55e;font-size:9px;">(вы)</span>' : '';
            const readyMark = p.countryId ? '<span style="color:#22c55e;">✓</span>' : '<span style="color:#eab308;">⏳</span>';

            return `
                <div style="background:#1f2937;border-radius:6px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;${isMe ? 'border-left:3px solid #22c55e;' : ''}">
                    <div style="flex:1;">
                        <div style="font-size:12px;font-weight:bold;color:white;">
                            ${hostMark} ${this._escapeHtml(p.name)}${meMark}
                        </div>
                        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">
                            ${countryName}
                        </div>
                    </div>
                    <div style="font-size:14px;">${readyMark}</div>
                </div>
            `;
        }).join('');

        // Обновляем кнопку старта
        const startBtn = document.getElementById('lobby-btn-start');
        const startHint = document.getElementById('lobby-start-hint');
        if (startBtn && startHint) {
            const allReady = this.lobby.isAllReady();
            startBtn.disabled = !allReady;
            startBtn.style.background = allReady ? '#15803d' : '#4b5563';
            startBtn.style.cursor = allReady ? 'pointer' : 'not-allowed';
            startHint.textContent = allReady
                ? '✅ Все готовы! Можно начинать.'
                : `Ждём выбора стран (${players.filter(p => p.countryId).length}/${players.length})`;
        }
    }

    _countryName(id) {
        const c = window._COUNTRIES_MAP && window._COUNTRIES_MAP[id];
        return c ? c.name : id;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Чат ───────────────────────────────────────────────────────────────

    renderChat() {
        const box = document.getElementById('lobby-chat-messages');
        if (!box) return;
        box.innerHTML = '';
        for (const msg of this.lobby.chatMessages) {
            this._appendChatElement(msg);
        }
        box.scrollTop = box.scrollHeight;
    }

    appendChat(msg) {
        this._appendChatElement(msg);
        const box = document.getElementById('lobby-chat-messages');
        if (box) box.scrollTop = box.scrollHeight;
    }

    _appendChatElement(msg) {
        const box = document.getElementById('lobby-chat-messages');
        if (!box) return;

        const el = document.createElement('div');
        el.style.marginBottom = '6px';
        el.style.wordBreak = 'break-word';

        if (msg.isSystem) {
            el.style.color = '#6b7280';
            el.style.fontStyle = 'italic';
            el.style.fontSize = '10px';
            el.textContent = '⚙ ' + msg.text;
        } else {
            const isMe = msg.from === this.myName;
            el.innerHTML = `<span style="color:${isMe ? '#22c55e' : '#60a5fa'};font-weight:bold;">${this._escapeHtml(msg.from)}:</span> <span style="color:#e5e7eb;">${this._escapeHtml(msg.text)}</span>`;
        }

        box.appendChild(el);
    }

    _onSendChat() {
        const input = document.getElementById('lobby-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        this.lobby.sendChat(text, this.myName);
        input.value = '';
    }

    // ── Выбор страны ──────────────────────────────────────────────────────

    showCountryPicker() {
        const modal = document.getElementById('country-picker-modal');
        const content = document.getElementById('country-picker-content');
        if (!modal || !content) return;

        const available = this.lobby.availableCountries;
        const myPlayer = this.lobby.players.find(p => p.peerId === this.net.myPeerId);
        const myCountry = myPlayer ? myPlayer.countryId : null;

        content.innerHTML = `
            <div style="padding:16px;">
                <div style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;">🌍 ВЫБЕРИТЕ СТРАНУ</div>
                <div style="max-height:60vh;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;" id="country-picker-list">
                    ${available.map(c => {
                        const info = window._COUNTRIES_MAP && window._COUNTRIES_MAP[c];
                        const name = info ? info.name : c;
                        const size = this.world.getCountryCells(c).size;
                        const isMine = c === myCountry;
                        return `
                            <button onclick="window._lobbyUI._pickCountry('${c}')" style="padding:8px;background:${isMine ? '#15803d' : '#1f2937'};color:white;border:1px solid ${isMine ? '#22c55e' : '#374151'};border-radius:4px;cursor:pointer;text-align:left;font-size:11px;">
                                <div style="font-weight:bold;">${this._escapeHtml(name)}</div>
                                <div style="font-size:9px;color:#9ca3af;margin-top:2px;">${size} провинций</div>
                            </button>
                        `;
                    }).join('')}
                </div>
                <button onclick="document.getElementById('country-picker-modal').classList.add('hidden')" style="width:100%;padding:8px;background:#374151;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-top:12px;">
                    Отмена
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    _pickCountry(countryId) {
        const myPeerId = this.net.myPeerId;

        // Проверяем, что страна свободна
        const taken = this.lobby.players.find(p => p.countryId === countryId && p.peerId !== myPeerId);
        if (taken) {
            this.showError('Эта страна уже занята');
            return;
        }

        // Если хост — просто выбираем
        if (this.net.isHost) {
            this.lobby.selectCountry(myPeerId, countryId);
        } else {
            // Клиент — отправляем хосту
            this.lobby.selectCountry(myPeerId, countryId);
        }

        document.getElementById('country-picker-modal').classList.add('hidden');
    }

    // ── Ошибки ────────────────────────────────────────────────────────────

    showError(text) {
        if (window.addNotification) {
            window.addNotification('⚠️ ' + text, 'war');
        } else {
            alert(text);
        }
    }
}
