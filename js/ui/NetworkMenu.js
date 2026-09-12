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
                    <div style="font-size:10px;color:#86efac;font-weight:normal;margin-top:2px;">Вы — хост. Запустите PeerServer</div>
                </button>

                <button id="net-btn-join" style="width:100%;padding:14px;background:#1d4ed8;color:white;border:2px solid #3b82f6;border-radius:8px;margin-bottom:8px;cursor:pointer;font-weight:bold;font-size:14px;text-align:left;">
                    🔗 ПОДКЛЮЧИТЬСЯ
                    <div style="font-size:10px;color:#93c5fd;font-weight:normal;margin-top:2px;">Введите Room ID и IP от хоста</div>
                </button>

                <button id="net-btn-instructions" style="width:100%;padding:10px;background:#374151;color:#d1d5db;border:1px solid #4b5563;border-radius:8px;margin-bottom:8px;cursor:pointer;font-size:12px;text-align:left;">
                    📖 ИНСТРУКЦИЯ ПО ЗАПУСКУ СЕРВЕРА
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

        // Берём последние использованные настройки из localStorage
        const lastHost = localStorage.getItem('heirloom_last_host') || '26.80.246.235';
        const lastPort = localStorage.getItem('heirloom_last_port') || '9000';
        const lastPath = localStorage.getItem('heirloom_last_path') || '/heirloom';
        const lastKey = localStorage.getItem('heirloom_last_key') || 'Heirloom120926';

        content.innerHTML = `
            <div style="padding:20px;max-width:500px;">
                <h2 style="color:#22c55e;font-size:18px;margin-bottom:16px;">🎮 СОЗДАТЬ КОМНАТУ</h2>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">IP сервера (из server-ip.txt или из .bat):</div>
                    <input id="net-host" value="${lastHost}" placeholder="26.80.246.235"
                        style="width:100%;padding:10px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#22c55e;font-family:monospace;font-size:14px;outline:none;">
                    <div style="font-size:9px;color:#6b7280;margin-top:6px;">
                        Откройте <b>server-ip.txt</b> в папке сервера — там актуальный IP.
                        Или посмотрите его в окне .bat (пункт [5]).
                    </div>
                </div>

                <details style="margin-bottom:12px;">
                    <summary style="font-size:11px;color:#9ca3af;cursor:pointer;padding:6px;">⚙️ Дополнительные настройки</summary>
                    <div style="background:#1f2937;border-radius:8px;padding:12px;margin-top:8px;">
                        <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Порт:</div>
                        <input id="net-port" value="${lastPort}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#22c55e;font-family:monospace;font-size:12px;outline:none;">
                        <div style="font-size:11px;color:#9ca3af;margin:8px 0 6px;">Path:</div>
                        <input id="net-path" value="${lastPath}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#22c55e;font-family:monospace;font-size:12px;outline:none;">
                        <div style="font-size:11px;color:#9ca3af;margin:8px 0 6px;">Key:</div>
                        <input id="net-key" value="${lastKey}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#22c55e;font-family:monospace;font-size:12px;outline:none;">
                    </div>
                </details>

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
        if (this._creating) return;
        this._creating = true;

        const host = document.getElementById('net-host').value.trim();
        const port = parseInt(document.getElementById('net-port').value.trim());
        const path = document.getElementById('net-path').value.trim();
        const key = document.getElementById('net-key').value.trim();

        const nameInput = document.getElementById('net-name-input');
        const myName = (nameInput && nameInput.value.trim()) || window._myPlayerName || this._generateName();

        // Сохраняем настройки для следующего раза
        localStorage.setItem('heirloom_last_host', host);
        localStorage.setItem('heirloom_last_port', port);
        localStorage.setItem('heirloom_last_path', path);
        localStorage.setItem('heirloom_last_key', key);

        // Глобальные переменные — нужны для LobbyUI
        window._serverHost = host;
        window._serverPort = port;
        window._serverPath = path;
        window._serverKey = key;

        const status = document.getElementById('net-host-status');
        status.textContent = '⏳ Создание комнаты...';

        const btn = document.getElementById('net-create-confirm');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

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
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        } finally {
            this._creating = false;
        }
    }

    // ── Подключение к комнате ─────────────────────────────────────────────

    showJoinScreen() {
        const content = document.getElementById('network-content');
        if (!content) return;

        const lastHost = localStorage.getItem('heirloom_last_host') || '26.80.246.235';
        const lastPort = localStorage.getItem('heirloom_last_port') || '9000';
        const lastPath = localStorage.getItem('heirloom_last_path') || '/heirloom';
        const lastKey = localStorage.getItem('heirloom_last_key') || 'Heirloom120926';

        content.innerHTML = `
            <div style="padding:20px;max-width:500px;">
                <h2 style="color:#3b82f6;font-size:18px;margin-bottom:16px;">🔗 ПОДКЛЮЧИТЬСЯ</h2>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Room ID (от хоста):</div>
                    <input id="net-join-room" placeholder="Вставьте ID" 
                        style="width:100%;padding:10px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#eab308;font-family:monospace;font-size:13px;outline:none;">
                </div>

                <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">IP сервера (от хоста):</div>
                    <input id="net-join-host" value="${lastHost}" placeholder="26.80.246.235"
                        style="width:100%;padding:10px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#3b82f6;font-family:monospace;font-size:14px;outline:none;">
                    <div style="font-size:9px;color:#6b7280;margin-top:6px;">
                        Хост видит его в лобби рядом с Room ID и присылает вам.
                    </div>
                </div>

                <details style="margin-bottom:12px;">
                    <summary style="font-size:11px;color:#9ca3af;cursor:pointer;padding:6px;">⚙️ Дополнительные настройки</summary>
                    <div style="background:#1f2937;border-radius:8px;padding:12px;margin-top:8px;">
                        <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Порт:</div>
                        <input id="net-join-port" value="${lastPort}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#3b82f6;font-family:monospace;font-size:12px;outline:none;">
                        <div style="font-size:11px;color:#9ca3af;margin:8px 0 6px;">Path:</div>
                        <input id="net-join-path" value="${lastPath}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#3b82f6;font-family:monospace;font-size:12px;outline:none;">
                        <div style="font-size:11px;color:#9ca3af;margin:8px 0 6px;">Key:</div>
                        <input id="net-join-key" value="${lastKey}"
                            style="width:100%;padding:6px;background:#0a0a0a;border:1px solid #4b5563;border-radius:4px;color:#3b82f6;font-family:monospace;font-size:12px;outline:none;">
                    </div>
                </details>

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
        if (this._joining) return;
        this._joining = true;

        const roomId = document.getElementById('net-join-room').value.trim();
        const host = document.getElementById('net-join-host').value.trim();
        const port = parseInt(document.getElementById('net-join-port').value.trim());
        const path = document.getElementById('net-join-path').value.trim();
        const key = document.getElementById('net-join-key').value.trim();

        const nameInput = document.getElementById('net-name-input');
        const myName = (nameInput && nameInput.value.trim()) || window._myPlayerName || this._generateName();

        if (!roomId) {
            document.getElementById('net-join-status').innerHTML = '<span style="color:#ef4444;">Введите Room ID</span>';
            this._joining = false;
            return;
        }
        if (!host) {
            document.getElementById('net-join-status').innerHTML = '<span style="color:#ef4444;">Введите IP сервера</span>';
            this._joining = false;
            return;
        }

        // Сохраняем настройки
        localStorage.setItem('heirloom_last_host', host);
        localStorage.setItem('heirloom_last_port', port);
        localStorage.setItem('heirloom_last_path', path);
        localStorage.setItem('heirloom_last_key', key);

        window._serverHost = host;
        window._serverPort = port;
        window._serverPath = path;
        window._serverKey = key;

        const status = document.getElementById('net-join-status');
        status.textContent = '⏳ Подключение...';

        const btn = document.getElementById('net-join-confirm');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

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
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        } finally {
            this._joining = false;
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
                            Двойной клик по <b style="color:#eab308;">start-heirloom-server.bat</b>.<br>
                            Выберите <b>[2]</b> — полная установка. Затем <b>[1]</b> — запуск.<br>
                            Сервер сам определит ваш IP и покажет его.
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div style="color:#22c55e;font-weight:bold;margin-bottom:6px;">Шаг 2. Принять сертификат</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            Откройте в браузере адрес, который показал .bat:<br>
                            <code style="background:#1f2937;padding:2px 6px;border-radius:3px;color:#eab308;">https://26.80.246.235:9000/heirloom/</code><br>
                            Браузер скажет «небезопасно» → <b>«Дополнительные»</b> → <b>«Перейти (небезопасно)»</b>.
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:16px;">
                        <div style="color:#22c55e;font-weight:bold;margin-bottom:6px;">Шаг 3. Создать комнату</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            В игре: <b>СЕТЕВАЯ ИГРА</b> → ввести имя → <b>СОЗДАТЬ КОМНАТУ</b>.<br>
                            Введите IP (из .bat или server-ip.txt) → <b>Создать</b>.<br>
                            В лобби скопируйте <b>Room ID</b> и <b>IP сервера</b> → отправьте друзьям.
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
                            Откройте в браузере адрес хоста:<br>
                            <code style="background:#1f2937;padding:2px 6px;border-radius:3px;color:#3b82f6;">https://26.80.246.235:9000/heirloom/</code><br>
                            Примите сертификат так же, как хост.
                        </div>
                    </div>

                    <div style="background:#0a0a0a;padding:12px;border-radius:6px;margin-bottom:16px;">
                        <div style="color:#3b82f6;font-weight:bold;margin-bottom:6px;">Шаг 3. Подключиться</div>
                        <div style="font-size:11px;color:#9ca3af;">
                            В игре: <b>СЕТЕВАЯ ИГРА</b> → ввести имя → <b>ПОДКЛЮЧИТЬСЯ</b>.<br>
                            Вставьте <b>Room ID</b> и <b>IP сервера</b>, которые прислал хост.
                        </div>
                    </div>

                    <div style="background:#422006;border-left:3px solid #eab308;padding:12px;border-radius:4px;">
                        <b style="color:#eab308;">💡 Совет</b><br>
                        <span style="font-size:11px;color:#d1d5db;">
                            IP сервера хранится в файле <b>server-ip.txt</b> в папке с сервером.
                            Если IP изменился — сервер сам его обновит при следующем запуске.
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
