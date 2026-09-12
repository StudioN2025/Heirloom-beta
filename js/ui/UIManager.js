// UIManager.js — Управление интерфейсом (исправлен)

import { t } from '../i18n.js';
import { getCountryInfo } from '../utils/helpers.js';

export class UIManager {
    constructor(world, entities, gameState, windowsManager, topBar) {
        this.world = world;
        this.entities = entities;
        this.gameState = gameState;
        this.windowsManager = windowsManager;
        this.topBar = topBar;
    }
    
    update() {
        if (this.topBar) this.topBar.update();
    }
    
    updateTopBar() {
        if (this.topBar) this.topBar.update();
    }
    
    updateDate() {
        const dateElem = document.getElementById('game-date');
        if (dateElem && this.gameState) {
            dateElem.innerText = this.gameState.getDateString();
        }
    }
    
    openWindow(tab) {
        const win = document.getElementById('info-window');
        const title = document.getElementById('window-title');
        const content = document.getElementById('window-content');
        
        if (!win || !title || !content) return;
        
        win.classList.remove('hidden');

        // Сброс стилей при переключении вкладок
        content.style.padding = '';
        content.style.overflow = '';
        
        const titles = {
            army: t('army.title'),
            research: t('research.title'),
            focus: t('focus.title'),
            diplomacy: t('diplomacy.title'),
            build: t('build.title'),
            commanders: t('army.createArmyTitle'),
            save: t('save.title')
        };

        title.innerText = titles[tab] || t('ui.window');
        
        // Вызываем соответствующий метод WindowsManager
        if (this.windowsManager) {
            switch(tab) {
                case 'army':
                    this.windowsManager.renderArmyWindow(content);
                    break;
                case 'research':
                    this.windowsManager.renderResearchWindow(content);
                    break;
                case 'focus':
                    this.windowsManager.renderFocusWindow(content);
                    break;
                case 'diplomacy':
                    this.windowsManager.renderDiplomacyWindow(content);
                    break;
                case 'build':
                    this.windowsManager.renderBuildWindow(content);
                    break;
                case 'commanders':
                    this.windowsManager.renderCommandersWindow(content);
                    break;
                case 'save':
                    this.windowsManager.renderSaveWindow(content);
                    break;
                default:
                    content.innerHTML = `<div class="text-center text-gray-400 py-8">${t('ui.inDevelopment')}</div>`;
            }
        } else {
            content.innerHTML = `<div class="text-center text-gray-400 py-8">${t('ui.windowNotInit')}</div>`;
        }
    }
    
    closeWindow() {
        const win = document.getElementById('info-window');
        if (win) win.classList.add('hidden');
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('info-sidebar');
        if (sidebar) sidebar.classList.add('hidden');
    }
    
    showCountryInfo(countryId, pos) {
        const sidebar = document.getElementById('info-sidebar');
        const title = document.getElementById('sidebar-title');
        
        if (!sidebar || !title) return;
        
        const countryInfo = getCountryInfo(countryId);

        // Показываем флаг если есть
        const flagKey = countryInfo.flag || countryId;
        const flagSrc = `assets/flags/${flagKey}.png`;
        title.innerHTML = `<div class="flex items-center gap-2"><img src="${flagSrc}" style="width:24px;height:16px;border-radius:2px;" onerror="this.style.display='none'">${countryInfo.name}</div>`;
        
        const leaderElem = document.getElementById('sidebar-leader');
        const ideologyElem = document.getElementById('sidebar-ideology');
        const popElem = document.getElementById('sidebar-pop');
        const factoriesElem = document.getElementById('sidebar-factories');
        const buildingsElem = document.getElementById('sidebar-buildings');
        const actionsDiv = document.getElementById('sidebar-actions');
        
        if (leaderElem) leaderElem.innerText = countryInfo.leader;
        if (ideologyElem) ideologyElem.innerText = countryInfo.ideology;

        const capitalElem = document.getElementById('sidebar-capital');
        if (capitalElem) {
            const cap = this.world.getCapital(countryId);
            capitalElem.innerText = cap ? cap.name : '—';
        }

        // Отношение к игроку
        const relRow = document.getElementById('sidebar-relation-row');
        const relElem = document.getElementById('sidebar-relation');
        if (relRow && relElem && countryId !== this.gameState.myCountryId) {
            this.gameState.initRelations(this.world);
            var rel = this.gameState.getRelation(countryId);
            var relColor = rel >= 50 ? '#22c55e' : rel >= 20 ? '#86efac' : rel >= -20 ? '#eab308' : rel >= -50 ? '#f97316' : '#ef4444';
            var relText = rel >= 50 ? 'Дружелюбно' : rel >= 20 ? 'Доброжелательно' : rel >= -20 ? 'Нейтрально' : rel >= -50 ? 'Враждебно' : 'Враг';
            relElem.innerHTML = '<span style="color:' + relColor + ';font-weight:bold;">' + rel + '</span> <span style="color:#9ca3af;">(' + relText + ')</span>';
            // Полоска
            var barPct = (rel + 100) / 2;
            relElem.innerHTML += '<div style="background:#374151;height:4px;border-radius:2px;margin-top:3px;"><div style="width:' + barPct + '%;height:100%;background:' + relColor + ';border-radius:2px;"></div></div>';
            relRow.style.display = '';
        } else if (relRow) {
            relRow.style.display = 'none';
        }

        // Показываем лорда если вассал
        const overlordRow = document.getElementById('sidebar-overlord-row');
        const overlordElem = document.getElementById('sidebar-overlord');
        const overlord = this.gameState.getOverlord(countryId);
        if (overlordRow && overlordElem) {
            if (overlord) {
                var overlordInfo = getCountryInfo(overlord);
                overlordElem.innerText = overlordInfo.name;
                overlordRow.style.display = '';
            } else {
                overlordRow.style.display = 'none';
            }
        }

        // Показываем вассалов если есть
        const vassals = this.gameState.getVassals(countryId);
        var vassalRow = document.getElementById('sidebar-vassals-row');
        if (vassals.length > 0) {
            var vassalNames = vassals.map(function(v) { var info = getCountryInfo(v); return info.name; }).join(', ');
            if (!vassalRow) {
                vassalRow = document.createElement('div');
                vassalRow.className = 'sidebar-row';
                vassalRow.id = 'sidebar-vassals-row';
                vassalRow.innerHTML = `<span class="sidebar-label">👑 ${t('diplomacy.vassals')}:</span><span id="sidebar-vassals" class="sidebar-value" style="color:#c084fc;">—</span>`;
                overlordRow.parentNode.insertBefore(vassalRow, overlordRow.nextSibling);
            }
            document.getElementById('sidebar-vassals').innerText = vassalNames;
            vassalRow.style.display = '';
        } else if (vassalRow) {
            vassalRow.style.display = 'none';
        }
        
        // Считаем статистику за ВСЮ страну
        const cells = this.world.getCountryCells(countryId);
        let totalPop = 0;
        let totalFactories = 0;
        let totalPorts = 0;
        
        for (const cellKey of cells) {
            const [cx, cy] = cellKey.split(',').map(Number);
            if (this.world.hasBuilding(cx, cy, 'factory')) totalFactories++;
            if (this.world.hasBuilding(cx, cy, 'port')) totalPorts++;
            const stats = this.world.cellStats.get(cellKey);
            if (stats && stats.population) totalPop += stats.population;
        }
        
        // Показываем реальные людские ресурсы страны
        const actualManpower = countryId === this.gameState.myCountryId
            ? Math.floor(this.gameState.manpower)
            : cells.size * 1000;
        
        if (popElem) popElem.innerText = `${actualManpower.toLocaleString()} ${t('ui.manpowerLabel')}`;
        if (factoriesElem) factoriesElem.innerText = `${totalFactories} 🏭`;
        if (buildingsElem) buildingsElem.innerText = totalPorts > 0 ? `${totalPorts} ⚓` : t('ui.noPorts');
        
        if (actionsDiv && countryId !== this.gameState.myCountryId) {
            actionsDiv.classList.remove('hidden');
            const atWar = this.gameState.isAtWar && this.gameState.isAtWar(this.gameState.myCountryId, countryId);
            const allied = this.gameState.areAllies && this.gameState.areAllies(this.gameState.myCountryId, countryId);

            // Определяем кнопку войны по идеологии
            var warButton = '';
            if (atWar) {
                warButton = `<div style="color:#f87171;text-align:center;padding:10px;background:#7f1d1d30;border-radius:6px;margin-bottom:8px;">⚔️ ${t('diplomacy.atWar')}</div>`;
            } else {
                var myIdeology = (window._COUNTRIES_MAP && window._COUNTRIES_MAP[this.gameState.myCountryId]) ? window._COUNTRIES_MAP[this.gameState.myCountryId].ideology : t('diplomacy.neutral');
                if (myIdeology === t('diplomacy.fascistCommunist') || myIdeology === t('diplomacy.communist')) {
                    warButton = `<button onclick="window.declareWarOn('${countryId}')" style="width:100%;background:#991b1b;color:white;padding:10px;border-radius:6px;margin-bottom:8px;font-weight:bold;cursor:pointer;">⚔️ ${t('diplomacy.declareWar')}</button>`;
                } else if (myIdeology === t('diplomacy.democratic')) {
                    var just = this.gameState.justifications;
                    if (just && just.target === countryId && just.daysLeft > 0) {
                        var pct = Math.floor(((just.totalDays - just.daysLeft) / just.totalDays) * 100);
                        warButton = '<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:8px;">';
                        warButton += `<div style="font-size:10px;color:#9ca3af;margin-bottom:4px;">${t('diplomacy.justificationProgress')}${just.daysLeft}${t('diplomacy.daysRemaining')}</div>`;
                        warButton += '<div style="background:#374151;height:6px;border-radius:3px;overflow:hidden;"><div style="width:' + pct + '%;height:100%;background:#3b82f6;border-radius:3px;"></div></div></div>';
                    } else if (just && just.target === countryId && just.daysLeft <= 0) {
                        warButton = `<button onclick="window.declareWarOn('${countryId}')" style="width:100%;background:#991b1b;color:white;padding:10px;border-radius:6px;margin-bottom:8px;font-weight:bold;cursor:pointer;">⚔️ ${t('diplomacy.declareWar')}</button>`;
                    } else {
                        warButton = `<button onclick="window.justifyWar('${countryId}')" style="width:100%;background:#854d0e;color:white;padding:10px;border-radius:6px;margin-bottom:8px;font-weight:bold;cursor:pointer;">📜 ${t('diplomacy.justifyWar')}</button>`;
                    }
                } else {
                    warButton = `<div style="color:#6b7280;text-align:center;padding:10px;background:#1f2937;border-radius:6px;margin-bottom:8px;font-size:11px;">🚫 ${t('diplomacy.neutral')}</div>`;
                }
            }

            actionsDiv.innerHTML = warButton +
                (!atWar && !allied ? `<button onclick="window.proposeAlly('${countryId}')" style="width:100%;background:#15803d;color:white;padding:10px;border-radius:6px;font-weight:bold;cursor:pointer;">${t('diplomacy.proposeAllyBtn')}</button>` : allied ? `<div style="color:#4ade80;text-align:center;padding:10px;background:#16653430;border-radius:6px;">${t('diplomacy.inAlliance')}</div>` : '');
        } else if (actionsDiv) {
            actionsDiv.classList.add('hidden');
        }
        
        sidebar.classList.remove('hidden');
    }
    
    showOrderHint() {
        const hint = document.getElementById('order-hint');
        if (hint) hint.classList.remove('hidden');
    }
    
    hideOrderHint() {
        const hint = document.getElementById('order-hint');
        if (hint) hint.classList.add('hidden');
    }
}
