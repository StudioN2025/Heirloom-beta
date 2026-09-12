// main.js — ТОЧКА ВХОДА (с сетевой игрой)

import { World } from './core/World.js';
import { EntityManager } from './core/EntityManager.js';
import { RendererWebGL } from './core/RendererWebGL.js';
import { GameState } from './core/GameState.js';
import { DataLoader } from './core/DataLoader.js';
import { AIController } from './ai/AIController.js';
import { UIManager } from './ui/UIManager.js';
import { WindowsManager } from './ui/Windows.js';
import { TopBar } from './ui/TopBar.js';
import { Notifications } from './ui/Notifications.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { ProductionSystem } from './systems/ProductionSystem.js';
import { MovementSystem } from './systems/MovementSystem.js';
import { ArmyManager } from './systems/ArmyManager.js';
import { SupplySystem } from './systems/SupplySystem.js';
import { DiplomacySystem } from './systems/DiplomacySystem.js';
import { TechSystem, TECH_TREE, TECH_BRANCHES } from './systems/TechSystem.js';
import { FocusSystem, FOCUS_TREE } from './systems/FocusSystem.js';
import { loadFocusTree } from './data/FocusTree.js';
import { QueueSystem, TRAIN_DEFS, BUILD_DEFS } from './systems/QueueSystem.js';
import { addNotification, getCountryInfo } from './utils/helpers.js';
import { COUNTRIES } from './data/Countries.js';
import { t, setLanguage, getCurrentLanguage } from './i18n.js';
import { NetworkManager } from './network/NetworkManager.js';
import { NetworkMenu } from './ui/NetworkMenu.js';

// Глобальные экземпляры
let world = null;
let entities = null;
let renderer = null;
let gameState = null;
let aiController = null;
let uiManager = null;
let windowsManager = null;
let topBar = null;
let notifications = null;
let economy = null;
let combat = null;
let movement = null;
let armyManager = null;
let production = null;
let supply = null;
let diplomacy = null;
let tech = null;
let focus = null;
let queue = null;
let network = null;
let networkMenu = null;

let animationFrameId = null;
let lastTimestamp = 0;
let needsRender = true;

// Флаг: играем ли мы по сети
let isNetworkGame = false;

async function init() {
    const savedLang = getCurrentLanguage();
    setLanguage(savedLang);
    const langBtn = document.getElementById('btn-lang');
    if (langBtn) langBtn.textContent = savedLang === 'ru' ? '🇷🇺' : '🇬🇧';

    console.log('🚀 Heirloom v4.1');

    world = new World();
    entities = new EntityManager(50000);
    renderer = new RendererWebGL('map-canvas');
    gameState = new GameState();

    economy = new EconomySystem(world, entities, gameState);
    combat = new CombatSystem(world, entities, gameState);
    production = new ProductionSystem(world, entities, gameState, combat);
    movement = new MovementSystem(world, entities, gameState);
    armyManager = new ArmyManager(entities, gameState, world);
    window._armyManager = armyManager;
    supply = new SupplySystem(world, entities, gameState);
    diplomacy = new DiplomacySystem(gameState, world, entities);
    tech = new TechSystem(gameState);
    combat.tech = tech;
    window._TECH_TREE = TECH_TREE;
    window._TECH_BRANCHES = TECH_BRANCHES;
    window._FOCUS_TREE = FOCUS_TREE;
    window._COUNTRIES_MAP = COUNTRIES;
    focus = new FocusSystem(gameState, world, entities);

    notifications = new Notifications();
    topBar = new TopBar(gameState);
    windowsManager = new WindowsManager(world, entities, gameState, tech, focus);
    uiManager = new UIManager(world, entities, gameState, windowsManager, topBar);

    // ── СЕТЕВАЯ ИГРА ──
    network = new NetworkManager(world, entities, gameState);
    networkMenu = new NetworkMenu(network);
    window._networkManager = network;
    window._networkMenu = networkMenu;

    setupEvents();

    var savedScale = localStorage.getItem('heirloom_ui_scale');
    if (savedScale) {
        document.body.style.fontSize = (parseFloat(savedScale) * 14) + 'px';
        document.querySelectorAll('button').forEach(function(b) { b.style.fontSize = (parseFloat(savedScale) * 11) + 'px'; });
    }
}

async function loadGameData() {
    showLoadingScreen();
    updateLoadingBar(10, t('loading.map'));

    const loader = new DataLoader();
    await loader.loadMap('maps/europe.json', world);

    updateLoadingBar(50, t('loading.terrain'));
    world.generateTerrain();

    updateLoadingBar(60, t('loading.focuses'));
    const loadedFocuses = await loadFocusTree();
    window._FOCUS_TREE = loadedFocuses;

    updateLoadingBar(75, t('loading.resources'));
    await preloadResources();

    updateLoadingBar(85, t('loading.ai'));
    aiController = new AIController(world, entities, gameState);
    aiController.production = production;
    await aiController.init();

    updateLoadingBar(100, t('loading.done'));
    setTimeout(() => hideLoadingScreen(), 300);
    showCountrySelection();
}

async function preloadResources() {
    const images = [
        { src: 'assets/army/germany_soldier.png', name: 'germany_soldier' },
        { src: 'assets/army/france_soldier.png', name: 'france_soldier' },
        { src: 'assets/army/soviet_soldier.png', name: 'soviet_soldier' },
    ];
    const failed = [];
    const timeout = new Promise(resolve => setTimeout(resolve, 10000));
    const loads = Promise.all(images.map(({ src, name }) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => { failed.push(name); resolve(); };
        img.src = src;
    })));
    await Promise.race([loads, timeout]);

    if (failed.length > 0) {
        addNotification(t('notifications.noLoadResources') + failed.join(', ') + t('notifications.badInternet'), 'war');
    }
}

function setupEvents() {
    const btnPlay = document.getElementById('btn-play');
    const btnNetwork = document.getElementById('btn-network');
    const btnCancel = document.getElementById('btn-cancel');
    const closeWindowBtn = document.getElementById('close-window');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    if (btnPlay) btnPlay.onclick = () => loadGameData();

    // ── СЕТЕВАЯ ИГРА ──
    if (btnNetwork) btnNetwork.onclick = () => {
        networkMenu.open();
    };

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) btnSettings.onclick = () => {
        document.getElementById('settings-overlay').classList.remove('hidden');
        updateSettingsUI();
    };

    if (btnCancel) btnCancel.onclick = () => hideCountrySelection();
    if (closeWindowBtn) closeWindowBtn.onclick = () => {
        if (window._capitulationPending) return;
        uiManager.closeWindow();
    };
    if (closeSidebarBtn) closeSidebarBtn.onclick = () => uiManager.closeSidebar();

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.onclick = () => {
            const speed = parseInt(btn.dataset.speed);
            if (isNaN(speed)) return;
            gameState.setGameSpeed(speed);
            updateSpeedButtons(speed);
        };
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
        const el = document.documentElement;
        if (!document.fullscreenElement) {
            if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(() => {});
            else if (el.msRequestFullscreen) el.msRequestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
        }
    });

    document.getElementById('btn-lang')?.addEventListener('click', () => {
        const current = getCurrentLanguage();
        const newLang = current === 'ru' ? 'en' : 'ru';
        setLanguage(newLang);
        const btn = document.getElementById('btn-lang');
        if (btn) btn.textContent = newLang === 'ru' ? '🇷🇺' : '🇬🇧';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            if (btn.dataset.tab === 'save') {
                uiManager.openWindow('save');
            } else {
                uiManager.openWindow(btn.dataset.tab);
            }
        };
    });

    const canvas = document.getElementById('map-canvas');
    if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('contextmenu', handleCanvasRightClick);
        canvas.addEventListener('wheel', handleCanvasWheel);

        let shiftDragging = false;
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && e.shiftKey) {
                shiftDragging = true;
                if (window._recruitMode || window._pendingBuild) return;
                const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
                const unitId = entities.getUnitAt(worldPos.x, worldPos.y);
                if (unitId !== null && entities.owner[unitId] === gameState.myCountryId) {
                    const sel = gameState._selectedUnits;
                    const idx = sel.indexOf(unitId);
                    if (idx >= 0) sel.splice(idx, 1);
                    else sel.push(unitId);
                }
            }
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!shiftDragging) return;
            if (window._recruitMode || window._pendingBuild) {
                const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
                const cellOwner = world.getCell(worldPos.x, worldPos.y);
                if (cellOwner === gameState.myCountryId) {
                    if (window._recruitMode) {
                        production.enqueueTraining(worldPos.x, worldPos.y, window._recruitMode);
                    } else if (window._pendingBuild) {
                        production.enqueueBuilding(worldPos.x, worldPos.y, window._pendingBuild);
                    }
                }
                return;
            }
            const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
            const unitId = entities.getUnitAt(worldPos.x, worldPos.y);
            if (unitId !== null && entities.owner[unitId] === gameState.myCountryId) {
                const sel = gameState._selectedUnits;
                if (sel.indexOf(unitId) === -1) sel.push(unitId);
            }
        });
        canvas.addEventListener('mouseup', () => {
            shiftDragging = false;
            if (gameState._selectedUnits.length > 0) {
                document.getElementById('order-hint').innerHTML = t('army.selectedUnits') + gameState._selectedUnits.length + t('army.createArmyHint');
                document.getElementById('order-hint').classList.remove('hidden');
            }
        });

        let touchStartX = 0, touchStartY = 0;
        let touchStartTime = 0;
        let isTouchDragging = false;
        let lastPinchDist = 0;
        let touchMoved = false;
        let fullscreenRequested = false;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

        function requestFullscreen() {
            if (fullscreenRequested) return;
            fullscreenRequested = true;
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(() => {});
            else if (el.msRequestFullscreen) el.msRequestFullscreen().catch(() => {});
        }

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (isMobile) requestFullscreen();
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isTouchDragging = true;
                touchMoved = false;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastPinchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && isTouchDragging) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) touchMoved = true;
                renderer.camera.x -= dx / renderer.camera.zoom;
                renderer.camera.y -= dy / renderer.camera.zoom;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                needsRender = true;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (lastPinchDist > 0) {
                    const scale = dist / lastPinchDist;
                    const newZoom = renderer.camera.zoom * scale;
                    renderer.camera.zoom = Math.min(Math.max(newZoom, 0.15), 3);
                    needsRender = true;
                }
                lastPinchDist = dist;
                needsRender = true;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0) {
                if (!touchMoved && Date.now() - touchStartTime < 300) {
                    const fakeEvent = { clientX: touchStartX, clientY: touchStartY, shiftKey: false, button: 0 };
                    handleCanvasClick(fakeEvent);
                }
                if (!touchMoved && Date.now() - touchStartTime >= 500) {
                    const fakeEvent = { clientX: touchStartX, clientY: touchStartY, preventDefault: () => {} };
                    handleCanvasRightClick(fakeEvent);
                }
                isTouchDragging = false;
                lastPinchDist = 0;
            }
        }, { passive: false });
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ── ГЛОБАЛЬНЫЕ ФУНКЦИИ ──

    window.recruitUnit = (type) => {
        uiManager.closeWindow();
        window._recruitMode = type;
        const hint = document.getElementById('recruit-hint');
        if (hint) {
            const costs = { infantry: t('army.costInfantry'), tank: t('army.costTank') };
            hint.innerHTML = t('army.selectProvinceHint') + ' (' + (costs[type] || type) + ')' + t('army.shiftMultiSelect');
            hint.classList.remove('hidden');
        }
        addNotification(t('notifications.recruitUnit') + type, 'info');
        setTimeout(() => {
            if (hint) hint.classList.add('hidden');
            window._recruitMode = null;
        }, 20000);
    };

    window.selectBuildType = (type) => {
        uiManager.closeWindow();
        window._pendingBuild = type;
        const hint = document.getElementById('build-hint');
        if (hint) {
            const costs = { factory: t('build.costFactory'), port: t('build.costPort') };
            hint.innerHTML = t('build.selectCell') + ' (' + (costs[type] || type) + ')' + t('army.shiftMultiSelect');
            hint.classList.remove('hidden');
        }
        addNotification(t('build.selectProvince'), 'info');
        setTimeout(() => {
            if (hint) hint.classList.add('hidden');
            window._pendingBuild = null;
        }, 20000);
    };

    window.selectUnitForMove = (unitId) => {
        gameState.selectedUnitId = unitId;
        uiManager.closeWindow();
        const hint = document.getElementById('order-hint');
        if (hint) {
            hint.innerHTML = t('army.unitSelected');
            hint.classList.remove('hidden');
        }
        addNotification(t('army.armyMoveHint'), 'info');
        setTimeout(() => { if (hint) hint.classList.add('hidden'); }, 15000);
    };

    window.startResearch = (techId) => {
        tech.startResearch(gameState.myCountryId, techId);
        uiManager.openWindow('research');
    };

    window.startFocus = (focusId) => {
        focus.startFocus(focusId);
        uiManager.openWindow('focus');
    };

    window.declareWarOn = (id) => {
        diplomacy.declareWar(id);
        // Синхронизация: сообщаем всем игрокам
        if (isNetworkGame && network && network.isConnected()) {
            network.broadcastAction({ kind: 'declareWar', target: id });
        }
        uiManager.openWindow('diplomacy');
    };

    window.justifyWar = (id) => {
        diplomacy.startJustification(id);
        uiManager.openWindow('diplomacy');
    };

    window.proposeAlly = (id) => {
        diplomacy.proposeAlliance(id);
        uiManager.closeSidebar();
    };

    window.callToWar = (id) => {
        diplomacy.callToWar(id);
    };

    window.kickAlly = (id) => {
        diplomacy.kickFromAlliance(id);
        uiManager.openWindow('diplomacy');
    };

    window.callToArms = (allyId) => {
        var myId = gameState.myCountryId;
        var myWars = [];
        for (var w = 0; w < gameState.wars.length; w++) {
            var war = gameState.wars[w];
            if (war.a === myId) myWars.push({ enemy: war.b, label: war.b });
            if (war.b === myId) myWars.push({ enemy: war.a, label: war.a });
        }
        if (myWars.length === 0) {
            addNotification(t('diplomacy.noWarsToJoin'), 'info');
            return;
        }
        var toInvite = myWars.filter(function(w) { return !gameState.isAtWar(allyId, w.enemy); });
        if (toInvite.length === 0) {
            addNotification(t('diplomacy.alreadyInAllWars'), 'info');
            return;
        }
        if (toInvite.length === 1) {
            gameState.addWar(allyId, toInvite[0].enemy, world);
            var eInfo = getCountryInfo(toInvite[0].enemy);
            addNotification(allyId.toUpperCase() + ' ' + t('diplomacy.allyJoinedYourWar') + ' ' + eInfo.name.toUpperCase(), 'war');
            uiManager.openWindow('diplomacy');
            return;
        }
        var content = document.getElementById('window-content');
        var aInfo = getCountryInfo(allyId);
        var html = '<div style="padding:16px;">';
        html += '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:24px;margin-bottom:8px;">📢</div>';
        html += '<div style="font-size:14px;font-weight:bold;color:#eab308;">' + aInfo.name.toUpperCase() + '</div>';
        html += '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">' + t('diplomacy.allyJoinWhichWar') + '</div></div>';
        for (var i = 0; i < toInvite.length; i++) {
            var eInfo = getCountryInfo(toInvite[i].enemy);
            html += '<button onclick="window._callToArmsConfirm(\'' + allyId + '\',\'' + toInvite[i].enemy + '\')" style="width:100%;padding:10px;background:#991b1b;color:white;border:2px solid #ef4444;border-radius:6px;margin-bottom:6px;cursor:pointer;text-align:left;font-weight:bold;">⚔️ ' + t('diplomacy.declareWarOn') + eInfo.name.toUpperCase() + '</button>';
        }
        html += '<button onclick="document.getElementById(\'info-window\').classList.add(\'hidden\')" style="width:100%;padding:8px;background:#374151;color:white;border:1px solid #4b5563;border-radius:6px;margin-top:8px;cursor:pointer;">' + t('diplomacy.decline') + '</button>';
        html += '</div>';
        content.innerHTML = html;
        document.getElementById('window-title').innerText = '📢 ' + t('diplomacy.callToArms');
        document.getElementById('info-window').classList.remove('hidden');
    };

    window._callToArmsConfirm = (allyId, enemyId) => {
        gameState.addWar(allyId, enemyId, world);
        var eInfo = getCountryInfo(enemyId);
        addNotification(allyId.toUpperCase() + ' ' + t('diplomacy.allyJoinedYourWar') + ' ' + eInfo.name.toUpperCase(), 'war');
        document.getElementById('info-window').classList.add('hidden');
        uiManager.openWindow('diplomacy');
    };

    window.releaseVassal = (vassalId) => {
        gameState.removeVassal(gameState.myCountryId, vassalId);
        addNotification('👑 ' + vassalId.toUpperCase() + t('notifications.vassalFreed'), 'info');
        uiManager.openWindow('diplomacy');
    };

    window.declineInvite = (from, enemy) => {
        if (!gameState._declinedInvites) gameState._declinedInvites = {};
        gameState._declinedInvites[enemy] = gameState.days + 30;
        document.getElementById('info-window').classList.add('hidden');
        gameState.isGameActive = true;
        addNotification(t('diplomacy.declinedInvite'), 'info');
    };

    window._acceptAlliance = (fromId) => {
        gameState.addAlliance(gameState.myCountryId, fromId);
        gameState.isGameActive = true;
        document.getElementById('info-window').classList.add('hidden');
        addNotification('🤝 ' + t('diplomacy.allianceAccepted') + ' ' + getCountryInfo(fromId).name.toUpperCase(), 'info');
        uiManager.openWindow('diplomacy');
    };

    window._declineAlliance = (fromId) => {
        if (!gameState._declinedAlliance) gameState._declinedAlliance = {};
        gameState._declinedAlliance[fromId] = gameState.days + 30;
        gameState.isGameActive = true;
        document.getElementById('info-window').classList.add('hidden');
        addNotification(t('diplomacy.allianceDeclined'), 'info');
    };

    window._acceptInvite = (enemyId) => {
        gameState.addWar(gameState.myCountryId, enemyId, world);
        gameState.isGameActive = true;
        gameState._declinedInvites = {};
        document.getElementById('info-window').classList.add('hidden');
        addNotification('⚔️ ' + t('diplomacy.joinedWar'), 'war');
        uiManager.openWindow('diplomacy');
    };

    window.startIdeologyChange = (targetIdeology) => {
        var currentIdeology = (window._COUNTRIES_MAP && window._COUNTRIES_MAP[gameState.myCountryId]) ? window._COUNTRIES_MAP[gameState.myCountryId].ideology : 'Нейтралитет';
        var days = 200;
        if (currentIdeology === 'Нейтралитет' || targetIdeology === 'Нейтралитет') days = 150;
        if (currentIdeology === targetIdeology) return;
        gameState.ideologyChange = { target: targetIdeology, daysLeft: days, totalDays: days };
        addNotification(t('notifications.ideologyChangeStarted') + targetIdeology + ' (' + days + t('diplomacy.daysRemaining'), 'info');
        uiManager.openWindow('diplomacy');
    };

    window.cancelIdeologyChange = () => {
        gameState.ideologyChange = null;
        addNotification(t('notifications.ideologyChangeCancelled'), 'info');
        uiManager.openWindow('diplomacy');
    };

    window.applyIdeologyChange = (newIdeology) => {
        var myId = gameState.myCountryId;
        if (window._COUNTRIES_MAP && window._COUNTRIES_MAP[myId]) {
            window._COUNTRIES_MAP[myId].ideology = newIdeology;
            var c = window._COUNTRIES_MAP[myId];
            if (c.ideologies && c.ideologies[newIdeology]) {
                var data = c.ideologies[newIdeology];
                if (data.name) c.name = data.name;
                if (data.leader) c.leader = data.leader;
                if (data.color) c.color = data.color;
            }
            if (renderer && data && data.flag) {
                var newFlag = new Image();
                newFlag.onload = function() { renderer.flags[data.flag] = newFlag; };
                newFlag.src = 'assets/flags/' + data.flag + '.png?t=' + Date.now();
            }
        }
        gameState.ideologyChange = null;
        if (renderer) renderer._polygonCache = null;
        addNotification(t('notifications.ideologyChanged') + newIdeology + '!', 'war');
        if (topBar) topBar.update();
        uiManager.openWindow('diplomacy');
    };

    window.capitulationChoice = (choice) => {
        var data = window._capitulationData;
        if (!data) return;
        var enemyId = data.enemyId;
        var winnerId = data.winnerId;
        var cells = data.cells;
        var countryName = (COUNTRIES[enemyId] ? COUNTRIES[enemyId].name : enemyId).toUpperCase();

        if (choice === 'annex') {
            gameState.handleCapitulation(enemyId, winnerId, world, entities, 'annex');
            addNotification('🏴 ' + countryName + t('capitulation.annexed'), 'war');
        } else if (choice === 'vassal') {
            gameState.handleCapitulation(enemyId, winnerId, world, entities, 'vassal');
            addNotification('👑 ' + countryName + t('capitulation.becomeVassal'), 'war');
        } else if (choice === 'release') {
            gameState.wars = gameState.wars.filter(function(w) {
                return !((w.a === enemyId && w.b === winnerId) || (w.b === enemyId && w.a === winnerId));
            });
            addNotification('🕊️ ' + countryName + t('capitulation.released'), 'info');
        }

        if (aiController && aiController.mem) {
            for (const [, m] of aiController.mem) {
                if (m.warTarget === enemyId) m.warTarget = null;
            }
        }

        window._capitulationData = null;
        window._capitulationPending = false;
        document.getElementById('info-window').classList.add('hidden');
        gameState.isGameActive = true;
    };

    window.quickSave = () => {
        saveGame();
        addNotification(t('save.savedFile'), 'info');
    };

    window.quickLoad = () => {
        loadGame();
    };

    window.saveToSlot = window.quickSave;
    window.loadFromSlot = window.quickLoad;

    window.toggleAutosave = () => {
        gameState.autosave = gameState.autosave === false ? true : false;
        addNotification(t('save.autoSaveToggle') + (gameState.autosave !== false ? t('save.autoSaveEnabled') : t('save.autoSaveDisabled')), 'info');
        uiManager.openWindow('save');
    };

    window.createArmy = () => {
        if (!armyManager) return;
        const selected = gameState._selectedUnits || [];
        if (selected.length < 2) {
            addNotification(t('army.selectAtLeastTwo'), 'war');
            return;
        }
        armyManager.createArmy(selected);
        gameState._selectedUnits = [];
        gameState.selectedUnitId = null;
        updateArmyPanel();
    };

    window.disbandArmy = (armyId) => {
        if (armyManager) armyManager.disbandArmy(armyId);
    };

    window.setArmyFrontLine = (armyId) => {
        if (!armyManager) return;
        addNotification(t('army.selectEnemyCell'), 'info');
        window._frontLineArmyId = armyId;
        setTimeout(function() { window._frontLineArmyId = null; }, 15000);
    };

    window.selectArmy = (armyId) => {
        if (!armyManager) return;
        if (gameState._selectedArmyId === armyId) {
            gameState._selectedArmyId = null;
        } else {
            gameState._selectedArmyId = armyId;
        }
        gameState.selectedUnitId = null;
        updateArmyPanel();
    };

    window._selectedUnits = [];
    gameState._selectedUnits = [];
    gameState._selectedArmyId = null;

    // ═══════════════ СЕТЕВЫЕ КОЛБЭКИ ═══════════════

    window._onNetworkGameStart = () => {
        isNetworkGame = true;
        document.getElementById('main-menu').classList.add('hidden');

        // Если данные карты ещё не загружены — загружаем
        if (world.getAllCountries().length === 0) {
            loadGameData();
        } else {
            showCountrySelection();
        }
    };

    // Хост: когда клиент подключился
    network.onPlayerJoined = (peerId, countryId) => {
        addNotification('👥 Игрок подключился: ' + peerId.slice(0, 8), 'info');
        // Сообщаем всем остальным
        if (network.isHost) {
            network.notifyPlayerJoined(peerId, countryId);
        }
    };

    // Игрок отключился
    network.onPlayerLeft = (peerId) => {
        addNotification('👋 Игрок отключился: ' + peerId.slice(0, 8), 'info');
        if (network.isHost) {
            network.notifyPlayerLeft(peerId);
        }
    };

    // Получено состояние от хоста
    network.onGameStateReceived = (data) => {
        console.log('[Net] Получено состояние:', data);
        if (data.type === 'welcome') {
            addNotification('🌐 Подключено к комнате хоста (' + (data.hostCountry || '?') + ')', 'info');
        }
    };

    // Получено действие от другого игрока
    network.onPlayerAction = (peerId, action) => {
        if (!action || !action.kind) return;
        console.log('[Net] Действие от', peerId, ':', action);

        switch (action.kind) {
            case 'declareWar':
                // Применяем войну локально (если ещё не в войне)
                if (action.from && action.target) {
                    if (!gameState.isAtWar(action.from, action.target)) {
                        gameState.addWar(action.from, action.target, world);
                        addNotification('⚔️ ' + action.from.toUpperCase() + ' объявил войну ' + action.target.toUpperCase() + '!', 'war');
                    }
                }
                break;

            case 'moveUnit':
                // Перемещение юнита другим игроком
                // В полной версии — применяем позицию
                break;

            default:
                console.warn('[Net] Неизвестное действие:', action.kind);
        }
    };

    network.onConnected = () => {
        addNotification('✅ Сетевое соединение установлено', 'info');
    };

    network.onError = (err) => {
        addNotification('❌ Сетевая ошибка: ' + (err.message || err.type || 'unknown'), 'war');
    };
}

// ── ТУТОР ──

var TUTORIAL_STEPS = [];
function initTutorialSteps() {
    TUTORIAL_STEPS = [
        { icon: t('tutorial.steps.0.icon'), title: t('tutorial.steps.0.title'), text: t('tutorial.steps.0.text') },
        { icon: t('tutorial.steps.1.icon'), title: t('tutorial.steps.1.title'), text: t('tutorial.steps.1.text') },
        { icon: t('tutorial.steps.2.icon'), title: t('tutorial.steps.2.title'), text: t('tutorial.steps.2.text') },
        { icon: t('tutorial.steps.3.icon'), title: t('tutorial.steps.3.title'), text: t('tutorial.steps.3.text') },
        { icon: t('tutorial.steps.4.icon'), title: t('tutorial.steps.4.title'), text: t('tutorial.steps.4.text') },
        { icon: t('tutorial.steps.5.icon'), title: t('tutorial.steps.5.title'), text: t('tutorial.steps.5.text') },
        { icon: t('tutorial.steps.6.icon'), title: t('tutorial.steps.6.title'), text: t('tutorial.steps.6.text') },
        { icon: t('tutorial.steps.7.icon'), title: t('tutorial.steps.7.title'), text: t('tutorial.steps.7.text') },
    ];
}

var tutorialStep = 0;

function startTutorial() {
    tutorialStep = 0;
    initTutorialSteps();
    var overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    showTutorialStep();
    document.getElementById('tutorial-next').onclick = nextTutorialStep;
    document.getElementById('tutorial-skip').onclick = closeTutorial;
}

function showTutorialStep() {
    var step = TUTORIAL_STEPS[tutorialStep];
    if (!step) { closeTutorial(); return; }
    document.getElementById('tutorial-icon').textContent = step.icon;
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').innerHTML = step.text;
    document.getElementById('tutorial-step').textContent = t('tutorial.step') + (tutorialStep + 1) + t('tutorial.of') + TUTORIAL_STEPS.length;
    var btn = document.getElementById('tutorial-next');
    btn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? t('tutorial.startGame') : t('tutorial.next');
}

function nextTutorialStep() {
    tutorialStep++;
    if (tutorialStep >= TUTORIAL_STEPS.length) closeTutorial();
    else showTutorialStep();
}

function closeTutorial() {
    var overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.add('hidden');
    localStorage.setItem('heirloom_tutorial_done', '1');
}

function showArmyCommandPanel(army, screenX, screenY) {
    var panel = document.getElementById('army-command-panel');
    if (!panel) return;

    var frontLineText = army.frontLine ? t('army.frontlineUnbind') + army.frontLine.enemyId.toUpperCase() : t('army.frontline');
    var frontLineAction = army.frontLine ? 'window.removeArmyFrontLine(' + army.id + ')' : 'window.setArmyFrontLine(' + army.id + ')';

    var html = '';
    html += '<div style="font-size:12px;font-weight:bold;color:' + army.color + ';margin-bottom:8px;">🎖️ ' + army.name + '</div>';
    html += '<div style="font-size:10px;color:#9ca3af;margin-bottom:8px;">Юнитов: ' + army.unitIds.size + '</div>';
    html += '<button onclick="' + frontLineAction + ';window.hideArmyCommandPanel()" style="width:100%;padding:8px;background:#854d0e;color:white;border:none;border-radius:4px;margin-bottom:4px;cursor:pointer;font-size:11px;text-align:left;">🎯 ' + frontLineText + '</button>';
    html += '<button onclick="window.giveArmyMoveOrder(' + army.id + ');window.hideArmyCommandPanel()" style="width:100%;padding:8px;background:#1d4ed8;color:white;border:none;border-radius:4px;margin-bottom:4px;cursor:pointer;font-size:11px;text-align:left;">' + t('army.moveArmy') + '</button>';
    html += '<button onclick="window.disbandArmy(' + army.id + ');window.hideArmyCommandPanel()" style="width:100%;padding:8px;background:#991b1b;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;text-align:left;">🗑️ ' + t('army.disbandArmy') + '</button>';

    panel.innerHTML = html;
    panel.style.left = Math.min(screenX + 10, window.innerWidth - 200) + 'px';
    panel.style.top = Math.max(screenY - 120, 10) + 'px';
    panel.classList.remove('hidden');
}

window.hideArmyCommandPanel = function() {
    var panel = document.getElementById('army-command-panel');
    if (panel) panel.classList.add('hidden');
};

window.removeArmyFrontLine = function(armyId) {
    if (!armyManager) return;
    var army = armyManager.armies.find(function(a) { return a.id === armyId; });
    if (army) {
        army.frontLine = null;
        addNotification('🎖️ ' + army.name + t('army.armyUnbound'), 'info');
    }
};

window.giveArmyMoveOrder = function(armyId) {
    gameState._selectedArmyId = armyId;
    addNotification(t('army.selectForMove'), 'info');
};

function handleCanvasClick(e) {
    if (!gameState.isGameActive) return;

    const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
    const cellOwner = world.getCell(worldPos.x, worldPos.y);

    const clickUnit = entities.getUnitAt(worldPos.x, worldPos.y);
    if (clickUnit !== null && entities.owner[clickUnit] === gameState.myCountryId) {
        const army = armyManager ? armyManager.getArmyForUnit(clickUnit) : null;
        if (army) {
            if (e.shiftKey) {
                gameState._selectedArmyId = army.id;
                gameState.selectedUnitId = null;
                document.getElementById('order-hint').innerHTML = t('army.armySelected');
                document.getElementById('order-hint').classList.remove('hidden');
                updateArmyPanel();
            } else {
                showArmyCommandPanel(army, e.clientX, e.clientY);
            }
            return;
        }
    }

    if (clickUnit !== null && entities.owner[clickUnit] === gameState.myCountryId) {
        gameState.selectedUnitId = clickUnit;
        const hint = document.getElementById('order-hint');
        if (hint) {
            hint.innerHTML = t('army.unitSelected');
            hint.classList.remove('hidden');
        }
        return;
    }

    window.hideArmyCommandPanel();

    if (window._recruitMode) {
        if (cellOwner === gameState.myCountryId) {
            production.enqueueTraining(worldPos.x, worldPos.y, window._recruitMode);
        }
        if (!e.shiftKey) {
            window._recruitMode = null;
            document.getElementById('recruit-hint')?.classList.add('hidden');
        }
        return;
    }

    if (window._frontLineArmyId && cellOwner && cellOwner !== gameState.myCountryId && !gameState.areAllies(gameState.myCountryId, cellOwner)) {
        armyManager.setFrontLine(window._frontLineArmyId, cellOwner, movement);
        window._frontLineArmyId = null;
        return;
    }

    if (window._pendingBuild) {
        if (cellOwner === gameState.myCountryId) {
            production.enqueueBuilding(worldPos.x, worldPos.y, window._pendingBuild);
        }
        if (!e.shiftKey) {
            window._pendingBuild = null;
            document.getElementById('build-hint')?.classList.add('hidden');
        }
        return;
    }

    if (gameState._selectedArmyId && armyManager) {
        const army = armyManager.armies.find(a => a.id === gameState._selectedArmyId);
        if (army) {
            armyManager.giveArmyOrder(army.id, worldPos.x, worldPos.y, movement);
        }
        gameState._selectedArmyId = null;
        document.getElementById('order-hint')?.classList.add('hidden');
        updateArmyPanel();
        return;
    }

    if (gameState.selectedUnitId !== null) {
        const unitId = gameState.selectedUnitId;

        const isWater = world.isWater(worldPos.x, worldPos.y);
        if (isWater) {
            movement.giveOrder(unitId, worldPos.x, worldPos.y);
        } else if (cellOwner !== 0 && gameState.isAtWar(gameState.myCountryId, cellOwner)) {
            movement.giveOrder(unitId, worldPos.x, worldPos.y);
        } else if (cellOwner === gameState.myCountryId
            || (gameState.areAllies && gameState.areAllies(gameState.myCountryId, cellOwner))) {
            movement.giveOrder(unitId, worldPos.x, worldPos.y);
        } else {
            addNotification(t('notifications.cannotMove'), 'war');
        }

        // Синхронизация перемещения
        if (isNetworkGame && network && network.isConnected()) {
            network.broadcastAction({
                kind: 'moveUnit',
                unitId: unitId,
                x: worldPos.x,
                y: worldPos.y
            });
        }

        gameState.selectedUnitId = null;
        gameState._selectedUnits = [];
        gameState._selectedArmyId = null;
        document.getElementById('order-hint')?.classList.add('hidden');
        return;
    }

    if (cellOwner !== 0) {
        uiManager.showCountryInfo(cellOwner, { x: worldPos.x, y: worldPos.y });
    }
}

function handleCanvasRightClick(e) {
    e.preventDefault();
    if (!gameState.isGameActive) return;

    if (window._recruitMode || window._pendingBuild) {
        window._recruitMode = null;
        window._pendingBuild = null;
        document.getElementById('recruit-hint')?.classList.add('hidden');
        document.getElementById('build-hint')?.classList.add('hidden');
        return;
    }

    const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
    const unitId = entities.getUnitAt(worldPos.x, worldPos.y);

    if (unitId === null || entities.owner[unitId] !== gameState.myCountryId) {
        gameState.selectedUnitId = null;
        gameState._selectedUnits = [];
        gameState._selectedArmyId = null;
        document.getElementById('order-hint')?.classList.add('hidden');
        return;
    }

    const sel = gameState._selectedUnits;
    const idx = sel.indexOf(unitId);
    if (idx >= 0) sel.splice(idx, 1);
    else sel.push(unitId);

    if (sel.length === 1) gameState.selectedUnitId = sel[0];
    else gameState.selectedUnitId = null;

    if (sel.length > 0) {
        addNotification(t('army.unitsSelected') + sel.length + t('army.openArmyTab'), 'info');
    }
}

function handleCanvasWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) renderer.zoom(e.deltaY * 3, e.clientX, e.clientY);
    else renderer.zoom(e.deltaY, e.clientX, e.clientY);
}

function handleKeyDown(e) {
    if (!gameState.isGameActive) return;

    if (e.code === 'Space') {
        e.preventDefault();
        const newSpeed = gameState.gameSpeed === 0 ? 1 : 0;
        gameState.setGameSpeed(newSpeed);
        updateSpeedButtons(newSpeed);
    }

    const speed = 20 / renderer.camera.zoom;
    let moved = false;

    if (e.code === 'KeyW' || e.code === 'ArrowUp') { renderer.camera.y -= speed; moved = true; }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') { renderer.camera.y += speed; moved = true; }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') { renderer.camera.x -= speed; moved = true; }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') { renderer.camera.x += speed; moved = true; }
    if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'Plus') {
        renderer.zoom(-100, renderer.canvas.width / 2, renderer.canvas.height / 2);
        moved = true;
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        renderer.zoom(100, renderer.canvas.width / 2, renderer.canvas.height / 2);
        moved = true;
    }

    if (moved) e.preventDefault();
}

function handleKeyUp(e) {}

function updateSettingsUI() {
    var lang = localStorage.getItem('heirloom_lang') || 'ru';
    var autosave = localStorage.getItem('heirloom_autosave') !== 'false';
    var sound = localStorage.getItem('heirloom_sound') !== 'false';

    var ruBtn = document.getElementById('set-lang-ru');
    var enBtn = document.getElementById('set-lang-en');
    if (ruBtn) { ruBtn.style.background = lang === 'ru' ? '#3b82f6' : '#374151'; ruBtn.style.border = lang === 'ru' ? 'none' : '1px solid #4b5563'; }
    if (enBtn) { enBtn.style.background = lang === 'en' ? '#3b82f6' : '#374151'; enBtn.style.border = lang === 'en' ? 'none' : '1px solid #4b5563'; }

    var asOn = document.getElementById('set-autosave-on');
    var asOff = document.getElementById('set-autosave-off');
    if (asOn) { asOn.style.background = autosave ? '#15803d' : '#374151'; asOn.style.border = autosave ? 'none' : '1px solid #4b5563'; }
    if (asOff) { asOff.style.background = !autosave ? '#991b1b' : '#374151'; asOff.style.border = !autosave ? 'none' : '1px solid #4b5563'; }

    var sndOn = document.getElementById('set-sound-on');
    var sndOff = document.getElementById('set-sound-off');
    if (sndOn) { sndOn.style.background = sound ? '#15803d' : '#374151'; sndOn.style.border = sound ? 'none' : '1px solid #4b5563'; }
    if (sndOff) { sndOff.style.background = !sound ? '#991b1b' : '#374151'; sndOff.style.border = !sound ? 'none' : '1px solid #4b5563'; }
}

window.setGameLang = function(lang) {
    localStorage.setItem('heirloom_lang', lang);
    if (window.setLanguage) window.setLanguage(lang);
    updateSettingsUI();
    var langBtn = document.getElementById('btn-lang');
    if (langBtn) langBtn.textContent = lang === 'ru' ? '🇷🇺' : '🇬🇧';
};

window.setGameAutosave = function(enabled) {
    localStorage.setItem('heirloom_autosave', enabled ? 'true' : 'false');
    if (gameState) gameState.autosave = enabled;
    updateSettingsUI();
};

window.setGameSound = function(enabled) {
    localStorage.setItem('heirloom_sound', enabled ? 'true' : 'false');
    updateSettingsUI();
};

window.setGameUIScale = function(scale) {
    localStorage.setItem('heirloom_ui_scale', scale);
    document.body.style.fontSize = (scale * 14) + 'px';
    document.querySelectorAll('button').forEach(function(b) { b.style.fontSize = (scale * 11) + 'px'; });
};

function startGameLoop() {
    if (animationFrameId) return;

    let lastTick = performance.now();
    let accumulator = 0;
    const TICK_DURATION = 1000 / 60;
    let dayAccumulator = 0;
    const BASE_DAY_MS = 3000;
    const SPEED_MULTIPLIERS = { 1: 1.0, 2: 2.5, 3: 6.0, 4: 15.0, 5: 40.0 };
    let lastRenderTime = 0;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    const MIN_RENDER_INTERVAL = isMobile ? 1000 / 15 : 1000 / 30;

    window.addEventListener('keydown', () => { needsRender = true; });
    window.addEventListener('mousemove', () => { needsRender = true; });
    window.addEventListener('mousedown', () => { needsRender = true; });
    window.addEventListener('wheel', () => { needsRender = true; });

    function loop(now) {
        let delta = Math.min(100, now - lastTick);
        lastTick = now;
        accumulator += delta;
        dayAccumulator += delta;

        while (accumulator >= TICK_DURATION) {
            if (gameState.isGameActive) updateGame();
            accumulator -= TICK_DURATION;
        }

        if (dayAccumulator >= BASE_DAY_MS / (SPEED_MULTIPLIERS[gameState.gameSpeed] || 1) && gameState.gameSpeed > 0 && gameState.isGameActive) {
            dayAccumulator = 0;
            gameState.advanceDay();

            if (entities) entities.tickTraining();

            if (economy) economy.update();
            if (production) production.update();
            if (supply) supply.update();
            if (combat) combat.update();
            if (movement) movement.update();
            if (armyManager) armyManager.update();
            if (armyManager) armyManager.updateFrontLines(movement);
            if (aiController) aiController.update();
            if (tech) tech.update();
            if (focus) focus.update();

            if (gameState.ideologyChange) {
                gameState.ideologyChange.daysLeft--;
                if (gameState.ideologyChange.daysLeft <= 0) {
                    window.applyIdeologyChange(gameState.ideologyChange.target);
                }
            }

            if (gameState.justifications) {
                gameState.justifications.daysLeft--;
                if (gameState.justifications.daysLeft <= 0) {
                    var jTarget = gameState.justifications.target;
                    addNotification(t('notifications.justificationComplete') + jTarget.toUpperCase() + t('notifications.justificationFinished'), 'info');
                    gameState.justifications.daysLeft = 0;
                }
            }

            if (gameState.wars.length > 0) {
                gameState.updateWarSnapshots(world);
                var warsToRemove = [];
                for (var wi = 0; wi < gameState.wars.length; wi++) {
                    var war = gameState.wars[wi];
                    var checkCapitulate = function(enemyId, winnerId) {
                        if (!enemyId || world.getCountryCells(enemyId).size === 0) return;
                        var countryInfo = COUNTRIES[enemyId];
                        if (!countryInfo) return;
                        var threshold = gameState.getCapitulationThreshold(countryInfo.ideology);
                        var progress = gameState.getWarProgress(enemyId, world);
                        if (progress >= threshold && !window._capitulationPending) {
                            var cells = Array.from(world.getCountryCells(enemyId));
                            if (winnerId === gameState.myCountryId) {
                                window._capitulationPending = true;
                                gameState.isGameActive = false;
                                windowsManager.renderCapitulationWindow(
                                    document.getElementById('window-content'),
                                    { enemyId: enemyId, winnerId: winnerId, cells: cells }
                                );
                                document.getElementById('info-window').classList.remove('hidden');
                                document.getElementById('window-title').innerText = t('capitulation.title');
                            } else {
                                addNotification('🏳️ ' + enemyId.toUpperCase() + t('capitulation.capitulated'), 'war');
                                gameState.handleCapitulation(enemyId, winnerId, world, entities, 'vassal');
                                if (aiController && aiController.mem) {
                                    for (const [, m] of aiController.mem) {
                                        if (m.warTarget === enemyId) m.warTarget = null;
                                    }
                                }
                            }
                            warsToRemove.push(wi);
                        }
                    };
                    if (gameState.myCountryId) {
                        if (war.a === gameState.myCountryId) checkCapitulate(war.b, war.a);
                        if (war.b === gameState.myCountryId) checkCapitulate(war.a, war.b);
                    }
                }
                for (var ri = warsToRemove.length - 1; ri >= 0; ri--) {
                    gameState.wars.splice(warsToRemove[ri], 1);
                }
            }

            if (gameState._declinedInvites && gameState.wars) {
                for (var enemy in gameState._declinedInvites) {
                    if (gameState._declinedInvites[enemy] && gameState.days >= gameState._declinedInvites[enemy]) {
                        var stillAtWar = false;
                        for (var wi = 0; wi < gameState.wars.length; wi++) {
                            var w = gameState.wars[wi];
                            if ((w.a === enemy || w.b === enemy) && !gameState.isAtWar(gameState.myCountryId, enemy)) {
                                stillAtWar = true;
                                break;
                            }
                        }
                        if (stillAtWar && !gameState.isAtWar(gameState.myCountryId, enemy)) {
                            var inviter = null;
                            for (var wi = 0; wi < gameState.wars.length; wi++) {
                                var w = gameState.wars[wi];
                                if (w.a === enemy || w.b === enemy) {
                                    var candidate = w.a === enemy ? w.b : w.a;
                                    if (gameState.areAllies(gameState.myCountryId, candidate)) {
                                        inviter = candidate;
                                        break;
                                    }
                                }
                            }
                            if (inviter) {
                                gameState.warInvitations.push({ from: inviter, enemy: enemy, time: Date.now() });
                                delete gameState._declinedInvites[enemy];
                            }
                        } else if (!stillAtWar) {
                            delete gameState._declinedInvites[enemy];
                        }
                    }
                }
            }

            if (gameState.warInvitations && gameState.warInvitations.length > 0 && !window._capitulationPending) {
                var inv = gameState.warInvitations.shift();
                if (inv && !gameState.isAtWar(gameState.myCountryId, inv.enemy)) {
                    var fromName = (COUNTRIES[inv.from] ? getCountryInfo(inv.from).name : inv.from).toUpperCase();
                    var enemyName = (COUNTRIES[inv.enemy] ? getCountryInfo(inv.enemy).name : inv.enemy).toUpperCase();
                    gameState.isGameActive = false;
                    var content = document.getElementById('window-content');
                    var html = '<div style="padding:16px;">';
                    html += '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:24px;margin-bottom:8px;">📢</div>';
                    html += '<div style="font-size:14px;font-weight:bold;color:#eab308;">' + fromName + ' ' + t('diplomacy.allyDeclaresWar') + '</div>';
                    html += '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">' + t('diplomacy.joinAgainst') + ' ' + enemyName + '?</div></div>';
                    html += '<button onclick="window._acceptInvite(\'' + inv.enemy + '\')" style="width:100%;padding:12px;background:#991b1b;color:white;border:2px solid #ef4444;border-radius:8px;margin-bottom:8px;cursor:pointer;font-weight:bold;font-size:13px;">⚔️ ' + t('diplomacy.joinWar') + '</button>';
                    html += '<button onclick="window.declineInvite(\'' + inv.from + '\',\'' + inv.enemy + '\')" style="width:100%;padding:10px;background:#374151;color:white;border:1px solid #4b5563;border-radius:8px;cursor:pointer;">❌ ' + t('diplomacy.decline') + '</button>';
                    html += '</div>';
                    content.innerHTML = html;
                    document.getElementById('window-title').innerText = '📢 ' + t('diplomacy.warInvitation');
                    document.getElementById('info-window').classList.remove('hidden');
                }
            }

            if (gameState.allianceInvitations && gameState.allianceInvitations.length > 0 && !window._capitulationPending) {
                var aInv = gameState.allianceInvitations.shift();
                if (aInv && !gameState.areAllies(gameState.myCountryId, aInv.from)) {
                    var fromInfo = getCountryInfo(aInv.from);
                    gameState.isGameActive = false;
                    var aContent = document.getElementById('window-content');
                    var aHtml = '<div style="padding:16px;">';
                    aHtml += '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:24px;margin-bottom:8px;">🤝</div>';
                    aHtml += '<div style="font-size:14px;font-weight:bold;color:#22c55e;">' + fromInfo.name.toUpperCase() + '</div>';
                    aHtml += '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">' + t('diplomacy.proposeAllyToYou') + '</div></div>';
                    aHtml += '<button onclick="window._acceptAlliance(\'' + aInv.from + '\')" style="width:100%;padding:12px;background:#15803d;color:white;border:2px solid #22c55e;border-radius:8px;margin-bottom:8px;cursor:pointer;font-weight:bold;font-size:13px;">🤝 ' + t('diplomacy.acceptAlliance') + '</button>';
                    aHtml += '<button onclick="window._declineAlliance(\'' + aInv.from + '\')" style="width:100%;padding:10px;background:#374151;color:white;border:1px solid #4b5563;border-radius:8px;cursor:pointer;">❌ ' + t('diplomacy.decline') + '</button>';
                    aHtml += '</div>';
                    aContent.innerHTML = aHtml;
                    document.getElementById('window-title').innerText = '🤝 ' + t('diplomacy.allianceProposal');
                    document.getElementById('info-window').classList.remove('hidden');
                }
            }

            if (topBar) topBar.update();
            needsRender = true;

            if (gameState.days % 30 === 0 && gameState.days > 0 && gameState.autosave !== false && !isNetworkGame) {
                const saveData = {
                    version: '5.0',
                    timestamp: Date.now(),
                    world: world.serialize(),
                    entities: entities.serialize(),
                    gameState: gameState.serialize()
                };
                const blob = new Blob([JSON.stringify(saveData)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `autosave_${gameState.days}.hrl`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }

        if (needsRender && gameState.isGameActive && renderer) {
            if (now - lastRenderTime >= MIN_RENDER_INTERVAL) {
                renderer.render(world, entities, gameState, production);
                lastRenderTime = now;
                needsRender = false;
            }
        }

        animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);
}

function updateGame() {}

function updateSpeedButtons(speed) {
    document.querySelectorAll('.speed-btn').forEach(btn => {
        const btnSpeed = parseInt(btn.dataset.speed);
        if (btnSpeed === speed) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function updateArmyPanel() {
    if (!armyManager || !gameState.myCountryId) return;
    const armies = armyManager.getArmiesForCountry(gameState.myCountryId);
    const cards = document.getElementById('army-cards');
    const countEl = document.getElementById('army-count');
    if (!cards) return;

    countEl.textContent = armies.length + t('army.armyCount');

    let html = '';
    for (const army of armies) {
        const isSelected = gameState._selectedArmyId === army.id;
        const unitCount = [...army.unitIds].filter(id => entities.active[id]).length;
        html += `
            <div class="army-card ${isSelected ? 'selected' : ''}" onclick="window.selectArmy(${army.id})" style="border-color:${army.color}">
                <div class="army-card-color" style="background:${army.color}"></div>
                <div class="army-card-info">
                    <div class="army-card-name">${army.name}</div>
                    <div class="army-card-count">${unitCount} ${t('army.unitCount')}</div>
                </div>
                <button class="army-card-disband" onclick="event.stopPropagation(); window.disbandArmy(${army.id})" title="${t('army.disbandArmy')}">✕</button>
            </div>
        `;
    }
    cards.innerHTML = html;
}

document.getElementById('btn-create-army')?.addEventListener('click', () => {
    window.createArmy();
});

setInterval(updateArmyPanel, 2000);

function showCountrySelection() {
    const countries = world.getAllCountries();
    const list = document.getElementById('country-list');
    if (!list) return;

    list.innerHTML = '';

    const countriesWithSize = countries.map(c => ({
        id: c,
        size: world.getCountryCells(c).size
    })).sort((a, b) => b.size - a.size);

    const major = countriesWithSize.filter(c => c.size >= 30);
    const minor = countriesWithSize.filter(c => c.size < 30);

    if (major.length) {
        const majorTitle = document.createElement('div');
        majorTitle.className = 'text-xs text-yellow-600 uppercase py-2 border-b mb-2';
        majorTitle.innerText = t('countrySelect.greatPowers');
        list.appendChild(majorTitle);

        major.forEach(c => {
            const cInfo = getCountryInfo(c.id);
            const flagKey = cInfo.flag || c.id;
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-3 border rounded mb-2 hover:bg-white/20 transition';
            btn.innerHTML = `
                <div class="flex items-center gap-2">
                    <img src="assets/flags/${flagKey}.png" style="width:32px;height:22px;border-radius:3px;" onerror="this.style.display='none'">
                    <div>
                        <div class="font-bold text-lg">${cInfo.name || c.id.toUpperCase()}</div>
                        <div class="text-xs opacity-70">${c.size} провинций</div>
                    </div>
                </div>
            `;
            btn.onclick = () => startGame(c.id);
            list.appendChild(btn);
        });
    }

    if (minor.length) {
        const minorTitle = document.createElement('div');
        minorTitle.className = 'text-xs text-gray-500 uppercase py-2 border-b mb-2 mt-4';
        minorTitle.innerText = t('countrySelect.regionalPowers');
        list.appendChild(minorTitle);

        minor.forEach(c => {
            const cInfo = getCountryInfo(c.id);
            const flagKey = cInfo.flag || c.id;
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-2 border rounded mb-1 hover:bg-white/10 transition text-sm';
            btn.innerHTML = `
                <div class="flex items-center gap-2">
                    <img src="assets/flags/${flagKey}.png" style="width:24px;height:16px;border-radius:2px;" onerror="this.style.display='none'">
                    <div>
                        <div class="font-bold">${cInfo.name || c.id.toUpperCase()}</div>
                        <div class="text-xs opacity-50">${c.size} провинций</div>
                    </div>
                </div>
            `;
            btn.onclick = () => startGame(c.id);
            list.appendChild(btn);
        });
    }

    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('country-select').classList.remove('hidden');
}

function hideCountrySelection() {
    document.getElementById('country-select').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function startGame(countryId) {
    gameState.myCountryId = countryId;
    gameState.isGameActive = true;
    gameState.setGameSpeed(1);
    gameState.equipment = 5000;
    gameState.days = 0;
    gameState.gameDate = new Date(1936, 0, 1);

    const cells = Array.from(world.getCountryCells(countryId));
    console.log(`📋 Клетки страны ${countryId}: ${cells.length}`);

    gameState.manpower = cells.length * 1000;
    gameState.maxManpower = cells.length * 1000;

    if (cells.length > 0) {
        const sortedCells = cells.sort();
        const capital = sortedCells[0].split(',').map(Number);
        console.log(`🏰 Первая клетка: (${capital[0]}, ${capital[1]})`);

        for (let i = 0; i < 3; i++) {
            const x = capital[0] + (i % 2);
            const y = capital[1] + Math.floor(i / 2);

            if (world.getCell(x, y) === countryId) {
                const unitId = entities.createEntity(countryId, 0, x, y, 0);
                if (combat) combat.initUnit(unitId);
                console.log(`✅ Создан юнит ${unitId} в (${x},${y})`);
            }
        }
    }

    document.getElementById('country-select').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    document.getElementById('game-tabs').classList.remove('hidden');

    updateSpeedButtons(1);
    if (topBar) topBar.update();

    addNotification(t('notifications.playingAs') + countryId.toUpperCase(), 'info');
    addNotification(t('notifications.attackHint'), 'info');
    addNotification(t('notifications.controlsHint'), 'info');

    if (isNetworkGame) {
        addNotification('🌐 СЕТЕВАЯ ИГРА — хост: ' + (network.isHost ? 'ВЫ' : network.roomId?.slice(0, 8)), 'info');
    }

    if (renderer) renderer.cameraInitialized = false;

    gameState.initRelations(world);
    startGameLoop();

    if (!localStorage.getItem('heirloom_tutorial_done') && !isNetworkGame) {
        startTutorial();
    }
}

function saveGame() {
    if (isNetworkGame) {
        addNotification('⚠️ Сохранение в сетевой игре отключено', 'war');
        return;
    }
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const fileName = `${gameState.myCountryId.toUpperCase()}_${day}.${month}.${year}_${time}.hrl`;

    const saveData = {
        version: '5.0',
        timestamp: Date.now(),
        world: world.serialize(),
        entities: entities.serialize(),
        gameState: gameState.serialize()
    };

    const blob = new Blob([JSON.stringify(saveData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function loadGame() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.hrl,.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);

                if (!data.world || !data.entities || !data.gameState) {
                    addNotification(t('save.invalidFile'), 'war');
                    return;
                }

                world = World.deserialize(data.world);
                world.generateTerrain();
                entities = new EntityManager(50000);
                entities.deserialize(data.entities);
                gameState.deserialize(data.gameState);

                economy = new EconomySystem(world, entities, gameState);
                combat = new CombatSystem(world, entities, gameState);
                production = new ProductionSystem(world, entities, gameState, combat);
                movement = new MovementSystem(world, entities, gameState);
                armyManager = new ArmyManager(entities, gameState, world);
                window._armyManager = armyManager;
                supply = new SupplySystem(world, entities, gameState);
                diplomacy = new DiplomacySystem(gameState, world, entities);
                tech = new TechSystem(gameState);
                combat.tech = tech;
                focus = new FocusSystem(gameState, world, entities);

                windowsManager = new WindowsManager(world, entities, gameState, tech, focus);
                uiManager = new UIManager(world, entities, gameState, windowsManager, topBar);

                // Пересоздаём сетевой менеджер с новыми ссылками
                network = new NetworkManager(world, entities, gameState);
                networkMenu = new NetworkMenu(network);
                window._networkManager = network;
                window._networkMenu = networkMenu;

                gameState.isGameActive = true;
                gameState.setGameSpeed(1);

                document.getElementById('country-select').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                document.getElementById('game-tabs').classList.remove('hidden');

                if (renderer) renderer.cameraInitialized = false;
                if (!animationFrameId) startGameLoop();
                updateSpeedButtons(1);

                addNotification(t('notifications.gameLoaded'), 'info');
            } catch(err) {
                console.error('[LoadError]', err.message, err.stack);
                var errWin = document.getElementById('info-window');
                var errContent = document.getElementById('window-content');
                var errTitle = document.getElementById('window-title');
                if (errWin && errContent && errTitle) {
                    errTitle.innerText = t('save.loadError');
                    errContent.innerHTML = '<div style="padding:16px;color:#ef4444;font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-all;">' + err.message + '\n\n' + (err.stack || '') + '</div>';
                    errWin.classList.remove('hidden');
                }
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function showLoadingScreen() {
    const div = document.createElement('div');
    div.id = 'loading-screen';
    div.innerHTML = `
        <div style="position:fixed;inset:0;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font-family:'Special Elite',monospace">
            <div style="font-size:48px;margin-bottom:20px;">⚙️</div>
            <div style="font-size:24px;margin-bottom:10px;color:#eab308;letter-spacing:.2em">HEIRLOOM</div>
            <div style="font-size:14px;margin-bottom:30px;color:#888;letter-spacing:.15em">STRATEGY</div>
            <div style="width:300px;height:8px;background:#1f2937;border-radius:4px;overflow:hidden;border:1px solid #374151">
                <div id="loading-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#eab308,#fbbf24);transition:width 0.4s ease"></div>
            </div>
            <div id="loading-text" style="margin-top:16px;font-size:12px;color:#9ca3af;letter-spacing:.1em">${t('ui.loading')}</div>
        </div>
    `;
    document.body.appendChild(div);
}

function updateLoadingBar(percent, text) {
    const bar = document.getElementById('loading-bar');
    const label = document.getElementById('loading-text');
    if (bar) bar.style.width = `${percent}%`;
    if (label) label.textContent = text;
}

function hideLoadingScreen() {
    const el = document.getElementById('loading-screen');
    if (el) {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.5s';
        setTimeout(() => el.remove(), 500);
    }
}

init().catch(console.error);
