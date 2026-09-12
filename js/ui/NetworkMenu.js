// NetworkMenu.js — UI сетевой игры: создание/подключение к комнате

import { addNotification } from '../utils/helpers.js';

export class NetworkMenu {
    constructor(networkManager) {
        this.net = networkManager;
    }

    open() {
        const modal = document.getElementById('network-modal');
        const content = document.getElementById('network-content');
        if (!modal || !content) return;

        content.innerHTML = this._renderMainMenu();
        modal.classList.remove('hidden');

        document.getElementById('net-btn-host')?.addEventListener('click', () => this.showHostScreen());
        document.getElementById('net-btn-join')?.addEventListener('click', () => this.showJoinScreen());
        document.getElementById('net-btn-instructions')?.addEventListener('click', () => this.showInstructions());
        document.getElementById('net-btn-close')?.addEventListener('click', () => this.close());

        // Сохраняем имя из поля
        const nameInput = document.getElementById('net-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                window._myPlayerName = nameInput.value.trim() || this._generateName();
            });
        }
    }

    close() {
        const modal = document.getElementById('network-modal');
        if (modal) modal.classList.add('hidden');
    }

    _generateName() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return 'player' + num;
    }

    // ── Главное меню ──────────────────────────────────────────────────────

    _renderMainMenu() {
        const myName = window._myPlayerName || this._generateName();
        return `
            <div style="padding:20px;max-width:500px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="font-size:48px;margin-bottom:8px;">🌐</div>
                    <h2 style="color:#eab308;font-size:22px;margin-bottom:4px;">СЕТЕВАЯ ИГРА</h2>
                    <p style="font-size:11px;color:#9ca3af;">Игра по локальной сети или через Radmin VPN</p>
                </div>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Ваше имя:</div>
                    <input id="net-name-input" type="text" value="${myName}" maxlength="20"
                        style="width:100%;padding:8px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#eab308;font-family:monospace;font-size:13px;outline:none;">
                </div>

                <button id="net-btn-host" style="width:100%;padding:14px;background:#15803d;color:white;border:2px solid #22c55e;border-radius:8px;margin-bottom:8px;cursor:pointer;font-weight:bold;font-size:14px;text-align:left;">
                    🎮 СОЗДАТЬ КОМНАТУ
                    <div style="font-size:10px;color:#86efac;font-weight:normal;margin-top:2px;">Вы — хост. Запустите PeerServer по инструкции</div>
                </button>

                <button id="net-btn-join" style="width:100%;padding:14px;background:#1d4ed8;color:white;border:2px solid #3b82f6;border-radius:8px;margin-bottom:8px;cursor:pointer;font-weight:bold;font-size:14px;text-align:left;">
                    🔗 ПОДКЛЮЧИТЬСЯ
                    <div style="font-size:10px;color:#93c5fd;font-weight:normal;margin-top:2px;">Введите Room ID хоста</div>
                </button>

                <button id="net-btn-instructions" style="width:100%;padding:10px;background:#374151;color:#d1d5db;border:1px solid #4b5563;border-radius:8px;margin-bottom:8px;cursor:pointer;font-size:12px;text-align:left;">
                    📖 ИНСТРУКЦИЯ ПО ЗАПУСКУ PEEPSERVER
                </button>

                <button id="net-btn-close" style="width:100%;padding:10px;background:#374151;color:white;border:1px solid #4b5563;border-radius:8px;cursor:pointer;font-size:12px;">
                    ← НАЗАД
                </button>
            </div>
        `;
    }

    // ── Создание комнаты ──────────────────────────────────────────────────

    showHostScreen() {
        const content = document.getElementById('network-content');
        if (!content) return;

        content.innerHTML = `
            <div style="padding:20px;max-width:500px;">
                <h2 style="color:#22c55e;font-size:18px;margin-bottom:16px;">🎮 СОЗДАТЬ КОМНАТУ</h2>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Параметры PeerServer (у вас уже запущен):</div>
                    <div style="font-size:10px;color:#d1d5db;font-family:monospace;background:#0a0a0a;padding:8px;border-radius:4px;line-height:1.6;">
                        Host: <input id="net-host" value="26.80.246.235" style="background:transparent;border:none;color:#22c55e;width:140px;font-family:monospace;"><br>
                        Port: <input id="net-port" value="9000" style="background:transparent;border:none;color:#22c55e;width:60px;font-family:monospace;"><br>
                        Path: <input id="net-path" value="/heirloom" style="background:transparent;border:none;color:#22c55e;width:120px;font-family:monospace;"><br>
                        Key:&nbsp; <input id="net-key" value="Heirloom120926" style="background:transparent;border:none;color:#22c55e;width:160px;font-family:monospace;">
                    </div>
                    <div style="font-size:9px;color:#6b7280;margin-top:6px;">
                        ⚠️ Если играете в локальной сети — замените Host на 192.168.0.133
                    </div>
                </div>

                <button id="net-create-confirm" style="width:100%;padding:12px;background:#15803d;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;margin-bottom:8px;">
                    ✅ СОЗДАТЬ КОМНАТУ
                </button>

                <div id="net-host-status" style="font-size:11px;color:#9ca3af;text-align:center;margin-bottom:8px;"></div>

                <button onclick="window._networkMenu.open()" style="width:100%;padding:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;cursor:pointer;font-size:11px;">
                    ← НАЗАД
                </button>
            </div>
        `;

        document.getElementById('net-create-confirm').onclick = () => this._doCreateRoom();
    }

    async _doCreateRoom() {
        const host = document.getElementById('net-host').value.trim();
        const port = parseInt(document.getElementById('net-port').value.trim());
        const path = document.getElementById('net-path').value.trim();
        const key = document.getElementById('net-key').value.trim();

        const nameInput = document.getElementById('net-name-input');
        const myName = (nameInput && nameInput.value.trim()) || window._myPlayerName || this._generateName();

        const status = document.getElementById('net-host-status');
        status.textContent = '⏳ Создание комнаты...';

        try {
            const roomId = await this.net.createRoom(host, port, path, key);

            if (window._networkLobby) {
                window._networkLobby.hostInit(myName, null);
            }

            status.innerHTML = '<span style="color:#22c55e;">✅ Комната создана!</span>';

            setTimeout(() => {
                this.close();
                if (window._lobbyUI) {
                    window._lobbyUI.setMyName(myName);
                    window._lobbyUI.open();
                }
            }, 500);
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444;">❌ ' + err.message + '</span>';
        }
    }

    // ── Подключение к комнате ─────────────────────────────────────────────

    showJoinScreen() {
        const content = document.getElementById('network-content');
        if (!content) return;

        content.innerHTML = `
            <div style="padding:20px;max-width:500px;">
                <h2 style="color:#3b82f6;font-size:18px;margin-bottom:16px;">🔗 ПОДКЛЮЧИТЬСЯ К КОМНАТЕ</h2>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Room ID хоста:</div>
                    <input id="net-join-room" placeholder="Вставьте ID" style="width:100%;padding:10px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#eab308;font-family:monospace;font-size:13px;">
                </div>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Параметры PeerServer (как у хоста):</div>
                    <div style="font-size:10px;color:#d1d5db;font-family:monospace;background:#0a0a0a;padding:8px;border-radius:4px;line-height:1.6;">
                        Host: <input id="net-join-host" value="26.80.246.235" style="background:transparent;border:none;color:#3b82f6;width:140px;font-family:monospace;"><br>
                        Port: <input id="net-join-port" value="9000" style="background:transparent;border:none;color:#3b82f6;width:60px;font-family:monospace;"><br>
                        Path: <input id="net-join-path" value="/heirloom" style="background:transparent;border:none;color:#3b82f6;width:120px;font-family:monospace;"><br>
                        Key:&nbsp; <input id="net-join-key" value="Heirloom120926" style="background:transparent;border:none;color:#3b82f6;width:160px;font-family:monospace;">
                    </div>
                </div>

                <button id="net-join-confirm" style="width:100%;padding:12px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;margin-bottom:8px;">
                    🔗 ПОДКЛЮЧИТЬСЯ
                </button>

                <div id="net-join-status" style="font-size:11px;color:#9ca3af;text-align:center;margin-bottom:8px;"></div>

                <button onclick="window._networkMenu.open()" style="width:100%;padding:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;cursor:pointer;font-size:11px;">
                    ← НАЗАД
                </button>
            </div>
        `;

        document.getElementById('net-join-confirm').onclick = () => this._doJoinRoom();
    }

    async _doJoinRoom() {
        const roomId = document.getElementById('net-join-room').value.trim();
        const host = document.getElementById('net-join-host').value.trim();
        const port = parseInt(document.getElementById('net-join-port').value.trim());
        const path = document.getElementById('net-join-path').value.trim();
        const key = document.getElementById('net-join-key').value.trim();

        const nameInput = document.getElementById('net-name-input');
        const myName = (nameInput && nameInput.value.trim()) || window._myPlayerName || this._generateName();

        if (!roomId) {
            document.getElementById('net-join-status').innerHTML = '<span style="color:#ef4444;">Введите Room ID</span>';
            return;
        }

        const status = document.getElementById('net-join-status');
        status.textContent = '⏳ Подключение...';

        try {
            await this.net.joinRoom(host, port, path, key, roomId);

            if (window._networkLobby) {
                window._networkLobby.clientInit(myName);
            }

            status.innerHTML = '<span style="color:#22c55e;">✅ Подключено!</span>';

            setTimeout(() => {
                this.close();
                if (window._lobbyUI) {
                    window._lobbyUI.setMyName(myName);
                    window._lobbyUI.open();
                }
            }, 800);
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444;">❌ ' + err.message + '</span>';
        }
    }

    // ── Инструкция ────────────────────────────────────────────────────────

    showInstructions() {
        const content = document.getElementById('network-content');
        if (!content) return;

        content.innerHTML = `
            <div style="padding:20px;max-width:600px;max-height:75vh;overflow-y:auto;">
                <h2 style="color:#eab308;font-size:18px;margin-bottom:16px;">📖 КАК ИГРАТЬ ПО СЕТИ</h2>

                <div style="font-size:12px;color:#d1d5db;line-height:1.7;">
                    <div style="background:#1f2937;border-left:3px solid #22c55e;padding:12px;margin-bottom:16px;border-radius:4px;">
                        <b style="color:#22c55e;">🎮 ХОСТ</b> — тот, кто создаёт комнату.<br>
                        <b style="color:#3b82f6;">🔗 КЛИЕНТ</b> — тот, кто подключается.
                    </div>

                    <h3 style="color:#eab308;font-size:14px;margin:16px 0 8px;">━━ Для ХОСТА ━━</h3>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div style="color:#22c55e;font-weight:bold;margin-bottom:6px;">Шаг 1. Запустить сервер</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            Двойной клик по <b style="color:#eab308;">start-heirloom-server.bat</b>.
                            Выберите <b>[2]</b> — полная установка. Затем <b>[1]</b> — запуск.
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div style="color:#22c55e;font-weight:bold;margin-bottom:6px;">Шаг 2. Принять сертификат</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            Откройте в браузере:<br>
                            <code style="background:#1f2937;padding:2px 6px;border-radius:3px;color:#eab308;">https://26.80.246.235:9000/heirloom/</code><br>
                            Браузер скажет «небезопасно» → нажмите <b>«Дополнительные»</b> → <b>«Перейти (небезопасно)»</b>.<br>
                            <span style="color:#6b7280;">Это нормально — сертификат самоподписанный.</span>
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:16px;">
                        <div style="color:#22c55e;font-weight:bold;margin-bottom:6px;">Шаг 3. Создать комнату</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            В игре: <b>СЕТЕВАЯ ИГРА</b> → ввести имя → <b>СОЗДАТЬ КОМНАТУ</b>.<br>
                            Скопируйте <b>Room ID</b> из лобби и отправьте друзьям.
                        </div>
                    </div>

                    <h3 style="color:#eab308;font-size:14px;margin:16px 0 8px;">━━ Для КЛИЕНТА ━━</h3>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div style="color:#3b82f6;font-weight:bold;margin-bottom:6px;">Шаг 1. Radmin VPN</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            Установите <b>Radmin VPN</b> (radmin-vpn.com).<br>
                            Подключитесь к сети хоста (имя и пароль спросите у него).
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div style="color:#3b82f6;font-weight:bold;margin-bottom:6px;">Шаг 2. Принять сертификат</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            Откройте в браузере тот же адрес, что и хост:<br>
                            <code style="background:#1f2937;padding:2px 6px;border-radius:3px;color:#3b82f6;">https://26.80.246.235:9000/heirloom/</code><br>
                            Примите сертификат так же, как хост.
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:16px;">
                        <div style="color:#3b82f6;font-weight:bold;margin-bottom:6px;">Шаг 3. Подключиться</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            В игре: <b>СЕТЕВАЯ ИГРА</b> → ввести имя → <b>ПОДКЛЮЧИТЬСЯ</b>.<br>
                            Вставьте <b>Room ID</b>, который прислал хост.
                        </div>
                    </div>

                    <div style="background:#422006;border-left:3px solid #eab308;padding:12px;border-radius:4px;">
                        <b style="color:#eab308;">💡 Совет</b><br>
                        <span style="font-size:11px;color:#d1d5db;">
                            Если снова видите «небезопасно» — просто примите сертификат заново.
                            Браузер забывает решение после перезапуска.
                        </span>
                    </div>
                </div>

                <button onclick="window._networkMenu.open()" style="width:100%;padding:10px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;cursor:pointer;font-size:12px;margin-top:16px;">
                    ← НАЗАД
                </button>
            </div>
        `;
    }
}
