// Windows.js — Все игровые окна

import { UNIT_STATS, BUILDING_STATS } from '../data/Units.js';
import { getCountryInfo } from '../utils/helpers.js';

export class WindowsManager {
    constructor(world, entities, gameState) {
        this.world = world;
        this.entities = entities;
        this.gameState = gameState;
    }
    
    renderArmyWindow(content) {
        const myId = this.gameState.myCountryId;
        if (!myId) {
            content.innerHTML = '<div class="text-center text-gray-400 py-8">Выберите страну</div>';
            return;
        }
        
        const units = this.entities.getEntitiesByOwner(myId);
        const resources = this.gameState;
        
        let html = `
            <div class="space-y-4">
                <div class="resources-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
                    <div class="resource-card" style="background:#374151;padding:12px;border-radius:8px;text-align:center;">
                        <div class="resource-icon" style="font-size:24px;">🔫</div>
                        <div class="resource-value" style="font-size:18px;font-weight:bold;color:#eab308;">${Math.floor(resources.equipment).toLocaleString()}</div>
                        <div class="resource-label" style="font-size:9px;color:#9ca3af;">СНАРЯЖЕНИЕ</div>
                    </div>
                    <div class="resource-card" style="background:#374151;padding:12px;border-radius:8px;text-align:center;">
                        <div class="resource-icon" style="font-size:24px;">👥</div>
                        <div class="resource-value" style="font-size:18px;font-weight:bold;color:#eab308;">${Math.floor(resources.manpower).toLocaleString()}</div>
                        <div class="resource-label" style="font-size:9px;color:#9ca3af;">ЛЮДСКИЕ РЕЗЕРВЫ</div>
                    </div>
                    <div class="resource-card" style="background:#374151;padding:12px;border-radius:8px;text-align:center;">
                        <div class="resource-icon" style="font-size:24px;">🏭</div>
                        <div class="resource-value" style="font-size:18px;font-weight:bold;color:#eab308;">${resources.factories || 0}</div>
                        <div class="resource-label" style="font-size:9px;color:#9ca3af;">ЗАВОДЫ</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title" style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #374151;">🆕 НАБОР ВОЙСК</div>
                    <div class="space-y-2">
                        ${Object.entries(UNIT_STATS).map(([key, u]) => {
                            const canAfford = resources.equipment >= u.costEquipment;
                            return `
                                <div class="recruit-card" style="background:#374151;padding:12px;border-radius:8px;border-left:4px solid #eab308;display:flex;justify-content:space-between;align-items:center;gap:12px;${!canAfford ? 'opacity-50' : ''}">
                                    <div class="recruit-info" style="flex:1;">
                                        <div class="recruit-header" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                            <span class="recruit-icon" style="font-size:24px;">${u.icon}</span>
                                            <span class="recruit-name" style="font-weight:bold;">${u.name}</span>
                                        </div>
                                        <div class="recruit-stats" style="display:flex;gap:12px;font-size:11px;color:#d1d5db;flex-wrap:wrap;">
                                            <span>⚔️ ${u.attack}</span>
                                            <span>🛡️ ${u.defense}</span>
                                            <span>❤️ ${u.hp}</span>
                                            ${u.armor > 0 ? `<span>🛡️+ ${u.armor}</span>` : ''}
                                        </div>
                                        <div class="recruit-cost" style="display:flex;gap:12px;font-size:10px;color:#9ca3af;margin-top:4px;">
                                            <span>💰 ${u.costEquipment} 🔫</span>
                                            <span>👥 ${u.costManpower} чел</span>
                                        </div>
                                    </div>
                                    <button onclick="window.recruitUnit('${key}')" 
                                        class="btn-recruit" style="padding:8px 16px;border-radius:6px;font-size:11px;font-weight:bold;background:${canAfford ? '#15803d' : '#4b5563'};color:white;cursor:${canAfford ? 'pointer' : 'not-allowed'};"
                                        ${!canAfford ? 'disabled' : ''}>
                                        НАБРАТЬ
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title" style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #374151;">⚔️ МОИ ВОЙСКА (${units.length})</div>
                    <div class="space-y-2" style="max-height:300px;overflow-y:auto;">
                        ${units.length === 0 ? 
                            '<div class="text-center text-gray-500 py-8 italic">Нет войск. Наберите новые дивизии!</div>' : 
                            units.map(uId => {
                                const type = this.entities.type[uId];
                                const stats = UNIT_STATS[type === 0 ? 'infantry' : 'tank'];
                                const hpPercent = (this.entities.hp[uId] / this.entities.maxHp[uId]) * 100;
                                const status = this.entities.training[uId] > 0 ? `Тренировка: ${this.entities.training[uId]} дн.` : 
                                              this.entities.inCombat[uId] ? '⚔️ В бою' : 'Готов';
                                const statusColor = this.entities.training[uId] > 0 ? '#eab308' : 
                                                   this.entities.inCombat[uId] ? '#ef4444' : '#22c55e';
                                
                                return `
                                    <div class="unit-card-item" style="background:#374151;padding:12px;border-radius:8px;border-left:4px solid #3b82f6;">
                                        <div class="unit-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                            <div class="unit-card-info" style="display:flex;align-items:center;gap:8px;">
                                                <span class="unit-icon" style="font-size:24px;">${stats.icon}</span>
                                                <div>
                                                    <div class="unit-name" style="font-weight:bold;font-size:14px;">${stats.name}</div>
                                                    <div class="unit-status" style="font-size:10px;color:${statusColor};">${status}</div>
                                                </div>
                                            </div>
                                            <button onclick="window.selectUnitForMove('${uId}')" 
                                                class="btn-select" style="padding:6px 12px;border-radius:4px;font-size:10px;font-weight:bold;background:#2563eb;color:white;cursor:pointer;${this.entities.inCombat[uId] ? 'opacity-50' : ''}" ${this.entities.inCombat[uId] ? 'disabled' : ''}>
                                                ${this.entities.inCombat[uId] ? '🔒' : 'ВЫБРАТЬ'}
                                            </button>
                                        </div>
                                        <div class="unit-hp-bar" style="display:flex;align-items:center;gap:8px;">
                                            <div class="hp-bar-bg" style="flex:1;height:6px;background:#4b5563;border-radius:3px;overflow:hidden;">
                                                <div class="hp-bar-fill" style="width: ${hpPercent}%;height:100%;background:#22c55e;"></div>
                                            </div>
                                            <span class="hp-text" style="font-size:10px;color:#9ca3af;min-width:60px;">${Math.floor(this.entities.hp[uId])}/${this.entities.maxHp[uId]}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderResearchWindow(content) {
        const tech = this.gameState.tech;
        
        let html = `
            <div class="space-y-4">
                <div class="section-title" style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #374151;">🔬 ДЕРЕВО ТЕХНОЛОГИЙ</div>
                <div class="space-y-3">
                    <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-blue-400">🏭 Промышленность</span>
                            <span class="text-sm">Уровень ${tech.industry}/5</span>
                        </div>
                        <div class="progress-bar" style="width:100%;height:6px;background:#4b5563;border-radius:3px;overflow:hidden;">
                            <div class="progress-fill-blue" style="width: ${tech.industry * 20}%;height:100%;background:#3b82f6;"></div>
                        </div>
                        <div class="text-xs text-gray-400 mt-2">+5% производство за уровень</div>
                        ${tech.industry < 5 ? `<button onclick="window.startResearch('industry', ${tech.industry + 1})" class="mt-3 bg-blue-700 hover:bg-blue-600 px-3 py-1 text-xs rounded" style="background:#1d4ed8;padding:4px 12px;border-radius:4px;cursor:pointer;">ИССЛЕДОВАТЬ УР.${tech.industry + 1}</button>` : '<div class="text-green-400 text-xs mt-3">✅ Максимальный уровень</div>'}
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-green-400">💂 Пехота</span>
                            <span class="text-sm">Уровень ${tech.infantry}/5</span>
                        </div>
                        <div class="progress-bar" style="width:100%;height:6px;background:#4b5563;border-radius:3px;overflow:hidden;">
                            <div class="progress-fill-blue" style="width: ${tech.infantry * 20}%;height:100%;background:#3b82f6;"></div>
                        </div>
                        <div class="text-xs text-gray-400 mt-2">+5% атака/защита пехоты за уровень</div>
                        ${tech.infantry < 5 ? `<button onclick="window.startResearch('infantry', ${tech.infantry + 1})" class="mt-3 bg-blue-700 hover:bg-blue-600 px-3 py-1 text-xs rounded" style="background:#1d4ed8;padding:4px 12px;border-radius:4px;cursor:pointer;">ИССЛЕДОВАТЬ УР.${tech.infantry + 1}</button>` : '<div class="text-green-400 text-xs mt-3">✅ Максимальный уровень</div>'}
                    </div>
                    
                    <div class="bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-yellow-400">🚜 Танки</span>
                            <span class="text-sm">Уровень ${tech.tank}/5</span>
                        </div>
                        <div class="progress-bar" style="width:100%;height:6px;background:#4b5563;border-radius:3px;overflow:hidden;">
                            <div class="progress-fill-blue" style="width: ${tech.tank * 20}%;height:100%;background:#3b82f6;"></div>
                        </div>
                        <div class="text-xs text-gray-400 mt-2">+5% атака/защита танков за уровень</div>
                        ${tech.tank < 5 ? `<button onclick="window.startResearch('tank', ${tech.tank + 1})" class="mt-3 bg-blue-700 hover:bg-blue-600 px-3 py-1 text-xs rounded" style="background:#1d4ed8;padding:4px 12px;border-radius:4px;cursor:pointer;">ИССЛЕДОВАТЬ УР.${tech.tank + 1}</button>` : '<div class="text-green-400 text-xs mt-3">✅ Максимальный уровень</div>'}
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderFocusWindow(content) {
        const focuses = {
            germany: [
                { id: 'ger_rearm', name: 'Перевооружение', desc: '+1000 снаряжения', icon: '🔫' },
                { id: 'ger_danzig', name: 'Данциг или война', desc: 'Война с Польшей', icon: '⚔️' },
                { id: 'ger_axis', name: 'Создать Ось', desc: 'Альянс с Италией', icon: '🤝' },
                { id: 'ger_west', name: 'Западный поход', desc: 'Война с Францией', icon: '🗺️' }
            ],
            ussr: [
                { id: 'ussr_five_year', name: 'Пятилетний план', desc: '+5 заводов', icon: '🏭' },
                { id: 'ussr_fin_war', name: 'Зимняя война', desc: 'Война с Финляндией', icon: '❄️' },
                { id: 'ussr_defense', name: 'Великая Отечественная', desc: '+6 дивизий', icon: '🛡️' }
            ],
            france: [
                { id: 'fra_maginot', name: 'Линия Мажино', desc: '+3 завода', icon: '🏰' },
                { id: 'fra_allies', name: 'Антанта', desc: 'Альянс с Англией', icon: '🤝' }
            ]
        };
        
        const myId = this.gameState.myCountryId;
        const countryFocuses = focuses[myId] || [];
        const completed = this.gameState.completedFocuses || new Set();
        const activeFocus = this.gameState.activeFocus;
        
        let html = `
            <div class="space-y-3">
                <div class="section-title" style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #374151;">⭐ НАЦИОНАЛЬНЫЕ ФОКУСЫ</div>
                <div class="focus-tree">
                    ${countryFocuses.map(focus => {
                        const isCompleted = completed.has(focus.id);
                        const isActive = activeFocus && activeFocus.id === focus.id;
                        const isAvailable = !isCompleted && !isActive;
                        const borderColor = isCompleted ? '#22c55e' : isActive ? '#fbbf24' : '#3b82f6';
                        
                        return `
                            <div class="focus-card" style="background:#1f2937;padding:12px;border-radius:8px;margin-bottom:8px;border-left:4px solid ${borderColor};cursor:${isAvailable ? 'pointer' : 'default'};"
                                 onclick="${isAvailable ? `window.startFocus('${focus.id}')` : ''}">
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <div style="font-size:24px;">${focus.icon}</div>
                                    <div style="flex:1;">
                                        <div style="font-weight:bold;">${focus.name}</div>
                                        <div style="font-size:11px;color:#9ca3af;">${focus.desc}</div>
                                    </div>
                                    ${isActive ? `<div style="font-size:12px;color:#fbbf24;">⚡</div>` : ''}
                                    ${isCompleted ? `<div style="font-size:16px;color:#22c55e;">✓</div>` : ''}
                                </div>
                                ${isActive ? `<div class="progress-bar mt-2" style="width:100%;height:4px;background:#374151;border-radius:2px;overflow:hidden;"><div class="progress-fill" style="width: ${((70 - activeFocus.daysLeft) / 70) * 100}%;height:100%;background:#fbbf24;"></div></div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                ${activeFocus ? `
                    <div class="bg-yellow-900/30 border border-yellow-500 p-3 rounded mt-3">
                        <div class="flex items-center gap-2">
                            <span class="text-yellow-500 font-bold">⚡ ${activeFocus.name}</span>
                            <span class="text-xs text-gray-400">(${activeFocus.daysLeft} дн.)</span>
                        </div>
                        <div class="progress-bar mt-2" style="width:100%;height:4px;background:#374151;border-radius:2px;overflow:hidden;">
                            <div class="progress-fill" style="width: ${((70 - activeFocus.daysLeft) / 70) * 100}%;height:100%;background:#fbbf24;"></div>
                        </div>
                    </div>
                ` : ''}
                ${countryFocuses.length === 0 ? '<div class="text-center text-gray-400 py-8">Нет доступных фокусов для этой страны</div>' : ''}
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderDiplomacyWindow(content) {
        const myId = this.gameState.myCountryId;
        if (!myId) {
            content.innerHTML = '<div class="text-center text-gray-400 py-8">Выберите страну</div>';
            return;
        }
        
        const allies = [];
        const enemies = [];
        
        if (this.gameState.wars) {
            for (const war of this.gameState.wars) {
                if (war.a === myId) enemies.push(war.b);
                if (war.b === myId) enemies.push(war.a);
            }
        }
        
        if (this.gameState.alliances) {
            for (const alliance of this.gameState.alliances) {
                if (alliance.has(myId)) {
                    for (const id of alliance) {
                        if (id !== myId) allies.push(id);
                    }
                }
            }
        }
        
        let html = `
            <div class="space-y-4">
                <div class="diplo-section" style="background:#1f2937;padding:16px;border-radius:8px;">
                    <div class="diplo-title diplo-allies" style="color:#4ade80;margin-bottom:12px;font-size:14px;font-weight:bold;">🤝 СОЮЗНИКИ (${allies.length})</div>
                    ${allies.length === 0 ? 
                        '<div class="text-center text-gray-500 py-4">Нет союзников. ПКМ по стране на карте чтобы предложить альянс.</div>' : 
                        allies.map(a => `
                            <div style="background:#374151;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div style="font-weight:bold;">${a.toUpperCase()}</div>
                                </div>
                                <div style="display:flex;gap:8px;">
                                    <button onclick="window.callToWar('${a}')" style="background:#991b1b;color:white;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;">ПРИЗВАТЬ</button>
                                    <button onclick="window.kickAlly('${a}')" style="background:#4b5563;color:white;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;">ИСКЛЮЧИТЬ</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                
                <div class="diplo-section" style="background:#1f2937;padding:16px;border-radius:8px;">
                    <div class="diplo-title diplo-enemies" style="color:#f87171;margin-bottom:12px;font-size:14px;font-weight:bold;">⚔️ ВРАГИ (${enemies.length})</div>
                    ${enemies.length === 0 ? 
                        '<div class="text-center text-gray-500 py-4">Мирное время</div>' : 
                        enemies.map(e => `
                            <div style="background:#374151;padding:12px;border-radius:8px;margin-bottom:8px;border-left:4px solid #ef4444;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div style="font-weight:bold;">${e.toUpperCase()}</div>
                                </div>
                                <div class="diplo-status-war" style="color:#f87171;font-size:12px;">⚔️ ВОЙНА</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderBuildWindow(content) {
        const resources = this.gameState;
        
        let html = `
            <div class="space-y-4">
                <div class="resource-bar" style="background:#374151;padding:12px;border-radius:8px;display:flex;justify-content:space-between;">
                    <span>🔫 Доступно снаряжения:</span>
                    <span class="text-yellow-400 font-bold">${Math.floor(resources.equipment).toLocaleString()}</span>
                </div>
                
                <div class="section-title" style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;">📦 ДОСТУПНЫЕ ПОСТРОЙКИ</div>
                <div class="space-y-2">
                    <div class="build-card" style="background:#374151;padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:28px;">🏭</span>
                            <div>
                                <div style="font-weight:bold;">Военный завод</div>
                                <div style="font-size:11px;color:#9ca3af;">💰 500 🔫 | 135 дней</div>
                            </div>
                        </div>
                        <button onclick="window.selectBuildType('factory')" 
                            class="btn-build" style="padding:8px 16px;border-radius:6px;font-size:11px;font-weight:bold;background:${resources.equipment >= 500 ? '#15803d' : '#4b5563'};color:white;cursor:${resources.equipment >= 500 ? 'pointer' : 'not-allowed'};"
                            ${resources.equipment < 500 ? 'disabled' : ''}>
                            ПОСТРОИТЬ
                        </button>
                    </div>
                    <div class="build-card" style="background:#374151;padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:28px;">⚓</span>
                            <div>
                                <div style="font-weight:bold;">Морской порт</div>
                                <div style="font-size:11px;color:#9ca3af;">💰 300 🔫 | 90 дней</div>
                            </div>
                        </div>
                        <button onclick="window.selectBuildType('port')" 
                            class="btn-build" style="padding:8px 16px;border-radius:6px;font-size:11px;font-weight:bold;background:${resources.equipment >= 300 ? '#15803d' : '#4b5563'};color:white;cursor:${resources.equipment >= 300 ? 'pointer' : 'not-allowed'};"
                            ${resources.equipment < 300 ? 'disabled' : ''}>
                            ПОСТРОИТЬ
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderCommandersWindow(content) {
        let html = `
            <div class="space-y-4">
                <button onclick="window.createArmy()" style="background:#15803d;color:white;padding:12px;border-radius:8px;font-weight:bold;width:100%;cursor:pointer;">
                    🆕 СОЗДАТЬ АРМИЮ
                </button>
                <div class="text-center text-gray-500 py-8">
                    Система армий в разработке...
                    <div class="text-xs mt-2">Выберите юнитов в окне АРМИЯ, затем создайте армию</div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    renderSaveWindow(content) {
        let html = `
            <div class="space-y-4">
                <div style="display:flex;gap:8px;">
                    <button onclick="window.quickSave()" style="background:#15803d;color:white;padding:12px;border-radius:8px;font-weight:bold;flex:1;cursor:pointer;">💾 СОХРАНИТЬ</button>
                    <button onclick="window.quickLoad()" style="background:#2563eb;color:white;padding:12px;border-radius:8px;font-weight:bold;flex:1;cursor:pointer;">📂 ЗАГРУЗИТЬ</button>
                </div>
                <div class="text-center text-gray-500 text-sm">
                    Автосохранение каждые 30 дней
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    }
}
