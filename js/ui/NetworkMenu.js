// NetworkMenu.js — UI сетевой игры: создание/подключение к комнате

import { addNotification } from '../utils/helpers.js';

export class NetworkMenu {
    constructor(networkManager) {
        this.net = networkManager;
    }

    // Открыть главное меню сетевой игры
    open() {
        const modal = document.getElementById('network-modal');
        const content = document.getElementById('network-content');
        if (!modal || !content) return;

        content.innerHTML = this._renderMainMenu();
        modal.classList.remove('hidden');

        // Обработчики
        document.getElementById('net-btn-host')?.addEventListener('click', () => this.showHostScreen());
        document.getElementById('net-btn-join')?.addEventListener('click', () => this.showJoinScreen());
        document.getElementById('net-btn-instructions')?.addEventListener('click', () => this.showInstructions());
        document.getElementById('net-btn-close')?.addEventListener('click', () => this.close());
    }

    close() {
        const modal = document.getElementById('network-modal');
        if (modal) modal.classList.add('hidden');
    }

    // ── Главное меню ──────────────────────────────────────────────────────

    _renderMainMenu() {
        return `
            <div style="padding:20px;max-width:500px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="font-size:48px;margin-bottom:8px;">🌐</div>
                    <h2 style="color:#eab308;font-size:22px;margin-bottom:4px;">СЕТЕВАЯ ИГРА</h2>
                    <p style="font-size:11px;color:#9ca3af;">Игра по локальной сети или через Radmin VPN</p>
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

        const status = document.getElementById('net-host-status');
        status.textContent = '⏳ Создание комнаты...';

        try {
            const roomId = await this.net.createRoom(host, port, path, key);
            status.innerHTML = '<span style="color:#22c55e;">✅ Комната создана!</span>';
            this._showRoomInfo(roomId);
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444;">❌ ' + err.message + '</span>';
        }
    }

    _showRoomInfo(roomId) {
        const content = document.getElementById('network-content');
        content.innerHTML = `
            <div style="padding:20px;max-width:500px;">
                <h2 style="color:#22c55e;font-size:18px;margin-bottom:16px;">✅ КОМНАТА СОЗДАНА</h2>

                <div style="background:#1f2937;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Ваш Room ID (передайте друзьям):</div>
                    <div style="font-size:20px;font-family:monospace;color:#eab308;font-weight:bold;word-break:break-all;background:#0a0a0a;padding:10px;border-radius:6px;" id="net-room-id">
                        ${roomId}
                    </div>
                    <button onclick="navigator.clipboard.writeText('${roomId}');this.textContent='✅ Скопировано!';setTimeout(()=>this.textContent='📋 КОПИРОВАТЬ',1500)" style="margin-top:8px;padding:6px 14px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;cursor:pointer;font-size:10px;">
                        📋 КОПИРОВАТЬ
                    </button>
                </div>

                <div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">👥 Подключено игроков: <span id="net-player-count" style="color:#22c55e;font-weight:bold;">1</span></div>

                <button id="net-start-game" style="width:100%;padding:12px;background:#eab308;color:#0a0a0a;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px;">
                    ▶ НАЧАТЬ ИГРУ
                </button>

                <button onclick="window._networkManager.disconnect();window._networkMenu.open()" style="width:100%;padding:8px;background:#991b1b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-top:8px;">
                    ✕ ЗАКРЫТЬ КОМНАТУ
                </button>
            </div>
        `;

        document.getElementById('net-start-game').onclick = () => {
            this.close();
            if (window._onNetworkGameStart) window._onNetworkGameStart();
        };

        // Обновление счётчика игроков
        this._playerCountInterval = setInterval(() => {
            const el = document.getElementById('net-player-count');
            if (el) el.textContent = this.net.getPlayerCount();
            else clearInterval(this._playerCountInterval);
        }, 1000);
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

        if (!roomId) {
            document.getElementById('net-join-status').innerHTML = '<span style="color:#ef4444;">Введите Room ID</span>';
            return;
        }

        const status = document.getElementById('net-join-status');
        status.textContent = '⏳ Подключение...';

        try {
            await this.net.joinRoom(host, port, path, key, roomId);
            status.innerHTML = '<span style="color:#22c55e;">✅ Подключено!</span>';
            setTimeout(() => {
                this.close();
                if (window._onNetworkGameStart) window._onNetworkGameStart();
            }, 800);
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444;">❌ ' + err.message + '</span>';
        }
    }

    // ── Инструкция по PeerServer ──────────────────────────────────────────

    showInstructions() {
        const content = document.getElementById('network-content');
        if (!content) return;

        content.innerHTML = `
            <div style="padding:20px;max-width:600px;max-height:70vh;overflow-y:auto;">
                <h2 style="color:#eab308;font-size:18px;margin-bottom:16px;">📖 ИНСТРУКЦИЯ: ЗАПУСК PEEPSERVER</h2>

                <div style="font-size:12px;color:#d1d5db;line-height:1.7;">

                    <div style="background:#1f2937;border-left:3px solid #eab308;padding:10px;margin-bottom:12px;border-radius:4px;">
                        <b style="color:#eab308;">Кто это делает?</b><br>
                        Только <b>ХОСТ</b> — тот, кто создаёт комнату. Остальные просто подключаются.
                    </div>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 1. Установите Node.js</h3>
                    <ol style="padding-left:20px;margin-bottom:12px;">
                        <li>Скачайте с <a href="https://nodejs.org/" target="_blank" style="color:#60a5fa;">nodejs.org</a> версию <b>LTS</b>.</li>
                        <li>Установите (Next → Next → Finish).</li>
                        <li>Проверьте: откройте <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">cmd</code> и введите <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">node -v</code></li>
                    </ol>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 2. Установите PeerServer</h3>
                    <div style="background:#0a0a0a;padding:10px;border-radius:4px;font-family:monospace;font-size:11px;color:#22c55e;margin-bottom:12px;">
                        npm install peer -g
                    </div>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 3. Установите Radmin VPN (для игры через интернет)</h3>
                    <ol style="padding-left:20px;margin-bottom:12px;">
                        <li>Скачайте с <a href="https://www.radmin-vpn.com/" target="_blank" style="color:#60a5fa;">radmin-vpn.com</a>.</li>
                        <li>Установите, создайте сеть (имя + пароль).</li>
                        <li>Друзья подключаются к вашей сети.</li>
                        <li>Узнайте свой IP: в Radmin VPN он вида <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">26.x.x.x</code></li>
                    </ol>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 4. Запустите PeerServer</h3>
                    <div style="background:#0a0a0a;padding:10px;border-radius:4px;font-family:monospace;font-size:11px;color:#22c55e;margin-bottom:8px;">
                        peerjs --port 9000 --key Heirloom120926 --path /heirloom
                    </div>
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:12px;">
                        Окно <b>не закрывайте</b> — это ваш сервер. Пока оно открыто — комната работает.
                    </div>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 5. Откройте порт (Windows Firewall)</h3>
                    <ol style="padding-left:20px;margin-bottom:12px;">
                        <li><code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">Win + R</code> → <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">wf.msc</code></li>
                        <li>«Правила для входящих подключений» → «Создать правило»</li>
                        <li>Тип: <b>«Для порта»</b> → TCP → <b>9000</b></li>
                        <li>Действие: <b>«Разрешить подключение»</b></li>
                        <li>Профиль: все три</li>
                        <li>Имя: <b>PeerServer Heirloom</b></li>
                    </ol>

                    <h3 style="color:#22c55e;font-size:13px;margin:16px 0 8px;">Шаг 6. Проверьте</h3>
                    <div style="font-size:11px;color:#9ca3af;margin-bottom:12px;">
                        Откройте в браузере: <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">http://26.80.246.235:9000/heirloom/</code><br>
                        Если видите ответ — сервер работает.
                    </div>

                    <div style="background:#422006;border-left:3px solid #eab308;padding:10px;margin-top:16px;border-radius:4px;">
                        <b style="color:#eab308;">💡 Совет:</b> Создайте <code style="background:#0a0a0a;padding:2px 6px;border-radius:3px;color:#22c55e;">start-server.bat</code> на рабочем столе:
                        <div style="background:#0a0a0a;padding:8px;border-radius:4px;font-family:monospace;font-size:10px;color:#22c55e;margin-top:6px;">
                            @echo off<br>
                            title Heirloom PeerServer<br>
                            peerjs --port 9000 --key Heirloom120926 --path /heirloom<br>
                            pause
                        </div>
                    </div>
                </div>

                <button onclick="window._networkMenu.open()" style="width:100%;padding:10px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;cursor:pointer;font-size:12px;margin-top:16px;">
                    ← НАЗАД
                </button>
            </div>
        `;
    }
}
