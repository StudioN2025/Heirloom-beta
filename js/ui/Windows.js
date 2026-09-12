// Windows.js — Все игровые окна

import { UNIT_STATS, BUILDING_STATS } from '../data/Units.js';
import { getCountryInfo } from '../utils/helpers.js';
import { t } from '../i18n.js';

export class WindowsManager {
    constructor(world, entities, gameState, techSystem, focusSystem) {
        this.world = world;
        this.entities = entities;
        this.gameState = gameState;
        this.tech = techSystem;
        this.focusSys = focusSystem;
    }
    
    renderArmyWindow(content) {
        const myId = this.gameState.myCountryId;
        if (!myId) { content.innerHTML = '<div style="padding:20px;text-align:center;color:#6b7280;">' + t('ui.capital') + '</div>'; return; }
        const units = this.entities.getEntitiesByOwner(myId);
        const res = this.gameState;
        
        let html = '<div style="padding:12px;">';
        html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">';
        html += '<div style="background:#374151;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:24px;">🔫</div><div style="font-size:18px;font-weight:bold;color:#eab308;">' + Math.floor(res.equipment).toLocaleString() + '</div><div style="font-size:9px;color:#9ca3af;">' + t('army.equipment') + '</div></div>';
        html += '<div style="background:#374151;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:24px;">👥</div><div style="font-size:18px;font-weight:bold;color:#eab308;">' + Math.floor(res.manpower).toLocaleString() + '</div><div style="font-size:9px;color:#9ca3af;">' + t('army.manpower') + '</div></div>';
        html += '<div style="background:#374151;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:24px;">🏭</div><div style="font-size:18px;font-weight:bold;color:#eab308;">' + (res.factories || 0) + '</div><div style="font-size:9px;color:#9ca3af;">' + t('army.factories') + '</div></div>';
        html += '</div>';
        
        html += '<div style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #374151;">⚔️ ' + t('army.myTroops') + ' (' + units.length + ')</div>';

        html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
        html += '<button onclick="window.recruitUnit && window.recruitUnit(\'infantry\')" style="flex:1;padding:10px;background:#15803d;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:12px;">➕ ' + t('army.recruitInfantry') + '</button>';
        html += '<button onclick="window.recruitUnit && window.recruitUnit(\'tank\')" style="flex:1;padding:10px;background:#1d4ed8;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:12px;">➕ ' + t('army.recruitTank') + '</button>';
        html += '<button onclick="window.createArmy && window.createArmy()" style="flex:1;padding:10px;background:#854d0e;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:12px;">🎖️ ' + t('army.create') + '</button>';
        html += '</div>';
        
        if (units.length === 0) {
            html += '<div style="color:#6b7280;text-align:center;padding:20px;">' + t('army.noUnits') + '</div>';
        } else {
            for (const uId of units) {
                const type = this.entities.type[uId];
                const stats = UNIT_STATS[type === 0 ? 'infantry' : 'tank'];
                const hp = Math.floor((this.entities.hp[uId] / this.entities.maxHp[uId]) * 100);
                const status = this.entities.inCombat[uId] ? '⚔️ ' + t('army.statusCombat') : '✅ ' + t('army.statusReady');
                html += '<div style="background:#1f2937;padding:10px;border-radius:6px;margin-bottom:6px;border-left:4px solid ' + (this.entities.inCombat[uId] ? '#ef4444' : '#22c55e') + ';">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                html += '<span style="font-weight:bold;">' + stats.icon + ' ' + stats.name + '</span>';
                html += '<span style="font-size:10px;color:' + (this.entities.inCombat[uId] ? '#ef4444' : '#22c55e') + ';">' + status + '</span>';
                html += '</div>';
                html += '<div style="background:#374151;height:4px;border-radius:2px;margin-top:4px;"><div style="width:' + hp + '%;height:100%;background:' + (hp > 50 ? '#22c55e' : hp > 25 ? '#eab308' : '#ef4444') + ';"></div></div>';
                html += '</div>';
            }
        }
        
        content.innerHTML = html;
    }
    
    renderFocusWindow(content) {
        content.style.padding = '0';
        content.style.overflow = 'hidden';
        var focusTree = window._FOCUS_TREE || {};
        var myId = this.gameState.myCountryId;
        var completed = this.gameState.completedFocuses || new Set();
        var activeFocus = this.gameState.activeFocus;
        var allFocuses = Object.values(focusTree).filter(function(f) { return f.country === myId; });

        console.log('[Focus] myId=' + myId + ' total=' + Object.keys(focusTree).length + ' matched=' + allFocuses.length);

        if (!allFocuses.length) {
            content.innerHTML = '<div style="padding:20px;text-align:center;color:#6b7280;">' + t('focus.noFocus') + '</div>';
            return;
        }

        var NW = 140, NH = 70;

        var pos = {};
        for (var i = 0; i < allFocuses.length; i++) {
            var f = allFocuses[i];
            var fx = f.x !== undefined ? f.x : 0;
            var fy = f.y !== undefined ? f.y : 0;
            pos[f.id] = { x: fx, y: fy };
        }

        var totalW = 0, totalH = 0;
        for (var k in pos) {
            if (pos[k].x + NW + 20 > totalW) totalW = pos[k].x + NW + 20;
            if (pos[k].y + NH + 20 > totalH) totalH = pos[k].y + NH + 20;
        }
        if (totalW < 400) totalW = 400;
        if (totalH < 300) totalH = 300;

        var svg = '<svg style="position:absolute;top:0;left:0;width:' + totalW + 'px;height:' + totalH + 'px;pointer-events:none;z-index:1;">';
        for (var i = 0; i < allFocuses.length; i++) {
            var f = allFocuses[i];
            if (!pos[f.id]) continue;
            var prereqs = f.prereqs || [];
            for (var j = 0; j < prereqs.length; j++) {
                var preId = prereqs[j];
                if (!pos[preId]) continue;
                var a = pos[preId], b = pos[f.id];
                var ok = completed.has(preId);
                var clr = ok ? '#22c55e' : '#4b5563';
                var ax = a.x + NW / 2, ay = a.y + NH;
                var bx2 = b.x + NW / 2, by2 = b.y;
                svg += '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx2 + '" y2="' + by2 + '" stroke="' + clr + '" stroke-width="2" ' + (ok ? '' : 'stroke-dasharray="5,3"') + '/>';
                var dx = bx2 - ax, dy = by2 - ay;
                var len = Math.sqrt(dx * dx + dy * dy) || 1;
                var ux = dx / len, uy = dy / len;
                svg += '<polygon points="' + (bx2 - ux*5 - uy*3) + ',' + (by2 - uy*5 + ux*3) + ' ' + (bx2 - ux*5 + uy*3) + ',' + (by2 - uy*5 - ux*3) + ' ' + bx2 + ',' + by2 + '" fill="' + clr + '"/>';
            }
        }
        svg += '</svg>';

        var nodes = '';
        for (var i = 0; i < allFocuses.length; i++) {
            var f = allFocuses[i];
            var p = pos[f.id];
            if (!p) continue;
            var done = completed.has(f.id);
            var isActive = activeFocus && activeFocus.id === f.id;
            var avail = !done && !isActive && this.focusSys && this.focusSys.checkPrerequisites(f.id);
            var bg, border, txt;
            if (done) { bg = '#052e16'; border = '#22c55e'; txt = '#86efac'; }
            else if (isActive) { bg = '#0c1e3a'; border = '#3b82f6'; txt = '#93c5fd'; }
            else if (avail) { bg = '#422006'; border = '#eab308'; txt = '#fde047'; }
            else { bg = '#1f2937'; border = '#4b5563'; txt = '#9ca3af'; }
            var click = avail ? ' onclick="window.startFocus(\'' + f.id + '\')"' : '';
            nodes += '<div' + click + ' style="position:absolute;left:' + p.x + 'px;top:' + p.y + 'px;width:' + NW + 'px;height:' + NH + 'px;background:' + bg + ';border:2px solid ' + border + ';border-radius:6px;padding:6px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;' + (avail ? 'cursor:pointer;' : '') + '">';
            nodes += '<div style="font-size:20px;">' + (f.icon || '⭐') + '</div>';
            nodes += '<div style="font-size:10px;font-weight:bold;color:' + txt + ';margin-top:2px;line-height:1.1;">' + f.name + '</div>';
            if (f.desc) nodes += '<div style="font-size:8px;color:#888;margin-top:1px;line-height:1.1;max-width:' + (NW - 12) + 'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + f.desc + '</div>';
            if (done) nodes += '<div style="font-size:8px;color:#22c55e;margin-top:1px;">✓</div>';
            else if (isActive) nodes += '<div style="font-size:8px;color:#3b82f6;margin-top:1px;">⏳ ' + activeFocus.daysLeft + t('diplomacy.daysRemaining') + '</div>';
            else if (avail) nodes += '<div style="font-size:8px;color:#eab308;margin-top:1px;">' + t('focus.start') + '</div>';
            else nodes += '<div style="font-size:8px;color:#4b5563;margin-top:1px;">' + t('focus.locked') + '</div>';
            nodes += '</div>';
        }

        var html = '<div id="focus-scroll" style="width:100%;height:100%;overflow:auto;background:#0a0a0a;">';
        html += '<div style="position:relative;width:' + totalW + 'px;height:' + totalH + 'px;min-width:100%;min-height:100%;">';
        html += svg + nodes;
        html += '</div></div>';

        content.innerHTML = html;
    }

    renderResearchWindow(content) {
        content.style.padding = '';
        content.style.overflow = '';
        var myId = this.gameState.myCountryId;
        if (!myId) { content.innerHTML = '<div style="padding:20px;text-align:center;color:#6b7280;">' + t('ui.capital') + '</div>'; return; }

        var techTree = window._TECH_TREE || {};
        var techBranches = window._TECH_BRANCHES || {};
        var unlocked = this.tech ? this.tech.getUnlocked(myId) : new Set();
        var research = this.tech ? this.tech.getPlayerResearch() : null;

        var html = '<div style="padding:12px;">';

        if (research && research.techId) {
            var rt = techTree[research.techId];
            if (rt) {
                var pct = Math.floor((research.daysLeft / rt.cost) * 100);
                html += '<div style="background:#0c1e3a;border:1px solid #3b82f6;border-radius:8px;padding:12px;margin-bottom:16px;">';
                html += '<div style="font-size:12px;font-weight:bold;color:#93c5fd;">🔬 ' + t('focus.researching') + ': ' + rt.icon + ' ' + rt.name + '</div>';
                html += '<div style="background:#1f2937;height:8px;border-radius:4px;margin-top:8px;"><div style="width:' + pct + '%;height:100%;background:#3b82f6;border-radius:4px;"></div></div>';
                html += '<div style="font-size:10px;color:#6b7280;margin-top:4px;">' + t('diplomacy.daysRemaining') + ' ' + research.daysLeft + t('diplomacy.daysRemaining') + '</div>';
                html += '</div>';
            }
        }

        for (var bKey in techBranches) {
            var branch = techBranches[bKey];
            html += '<div style="margin-bottom:16px;">';
            html += '<div style="font-size:13px;font-weight:bold;color:' + branch.color + ';margin-bottom:8px;">' + branch.icon + ' ' + branch.name + '</div>';

            for (var tKey in techTree) {
                var tech = techTree[tKey];
                if (tech.branch !== bKey) continue;
                var isUnlocked = unlocked.has(tech.id);
                var isResearching = research && research.techId === tech.id;
                var prereqDone = tech.level <= 1 || unlocked.has(tech.branch + '_' + (tech.level - 1));
                var canResearch = !isUnlocked && !isResearching && prereqDone && !research;

                var bg, border, txt;
                if (isUnlocked) { bg = '#052e16'; border = '#22c55e'; txt = '#86efac'; }
                else if (isResearching) { bg = '#0c1e3a'; border = '#3b82f6'; txt = '#93c5fd'; }
                else if (canResearch) { bg = '#422006'; border = '#eab308'; txt = '#fde047'; }
                else { bg = '#1f2937'; border = '#4b5563'; txt = '#6b7280'; }

                var click = canResearch ? ' onclick="window.startResearch && window.startResearch(\'' + tech.id + '\')"' : '';
                html += '<div' + click + ' style="background:' + bg + ';border:1px solid ' + border + ';border-radius:6px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;' + (canResearch ? 'cursor:pointer;' : '') + '">';
                html += '<div style="font-size:24px;">' + tech.icon + '</div>';
                html += '<div style="flex:1;">';
                html += '<div style="font-size:11px;font-weight:bold;color:' + txt + ';">' + tech.name + '</div>';
                html += '<div style="font-size:9px;color:#6b7280;">' + tech.desc + '</div>';
                html += '</div>';
                html += '<div style="text-align:right;">';
                if (isUnlocked) html += '<div style="font-size:10px;color:#22c55e;">✓</div>';
                else if (isResearching) html += '<div style="font-size:10px;color:#3b82f6;">⏳</div>';
                else html += '<div style="font-size:10px;color:#6b7280;">' + tech.cost + t('diplomacy.daysRemaining') + '</div>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        content.innerHTML = html;
    }
    
    renderDiplomacyWindow(content) {
        var myId = this.gameState.myCountryId;
        if (!myId) { content.innerHTML = '<div style="padding:20px;text-align:center;color:#6b7280;">' + t('ui.capital') + '</div>'; return; }
        var allies = [], enemies = [];
        if (this.gameState.wars) { for (var w = 0; w < this.gameState.wars.length; w++) { var war = this.gameState.wars[w]; if (war.a === myId) enemies.push(war.b); if (war.b === myId) enemies.push(war.a); } }
        if (this.gameState.alliances) { for (var ai = 0; ai < this.gameState.alliances.length; ai++) { var a = this.gameState.alliances[ai]; if (a.has(myId)) { for (var id of a) { if (id !== myId) allies.push(id); } } } }
        var vassals = this.gameState.getVassals(myId);
        var overlord = this.gameState.getOverlord(myId);

        var html = '<div style="padding:12px;">';

        if (overlord) {
            html += '<div style="background:#1a0a2e;border:1px solid #a855f7;border-radius:6px;padding:8px;margin-bottom:12px;text-align:center;">';
            html += '<span style="font-size:11px;color:#a855f7;font-weight:bold;">👑 ' + t('ui.overlord') + ' ' + overlord.toUpperCase() + '</span>';
            html += '</div>';
        }

        if (vassals.length > 0) {
            html += '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:bold;color:#a855f7;margin-bottom:6px;">👑 ' + t('diplomacy.vassals') + ' (' + vassals.length + ')</div>';
            for (var vi = 0; vi < vassals.length; vi++) {
                html += '<div style="background:#1a0a2e;border:1px solid #a855f7;border-radius:4px;padding:6px 8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">';
                html += '<span style="font-weight:bold;font-size:11px;color:#c084fc;">👑 ' + vassals[vi].toUpperCase() + '</span>';
                html += '<button onclick="window.releaseVassal && window.releaseVassal(\'' + vassals[vi] + '\')" style="background:#7f1d1d;color:white;padding:3px 6px;border-radius:3px;font-size:9px;cursor:pointer;">' + t('diplomacy.releaseVassal') + '</button>';
                html += '</div>';
            }
            html += '</div>';
        }

        var myIdeology = (window._COUNTRIES_MAP && window._COUNTRIES_MAP[myId]) ? window._COUNTRIES_MAP[myId].ideology : 'Нейтралитет';
        var change = this.gameState.ideologyChange;
        html += '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:bold;color:#f97316;margin-bottom:6px;">⚡ ' + t('diplomacy.ideology') + '</div>';
        html += '<div style="background:#1f2937;border:1px solid #374151;border-radius:6px;padding:8px;">';
        html += '<div style="font-size:11px;color:#eab308;font-weight:bold;">' + t('ideologies.' + {Фашизм:'fascism',Демократия:'democracy',Коммунизм:'communism',Нейтралитет:'neutral'}[myIdeology]) + '</div>';
        if (change) {
            var pct = Math.floor(((change.totalDays - change.daysLeft) / change.totalDays) * 100);
            var IDENTITY_COLORS = { 'Демократия': '#3b82f6', 'Фашизм': '#ef4444', 'Коммунизм': '#990000', 'Нейтралитет': '#6b7280' };
            var tColor = IDENTITY_COLORS[change.target] || '#6b7280';
            var targetDisplay = t('ideologies.' + {Фашизм:'fascism',Демократия:'democracy',Коммунизм:'communism',Нейтралитет:'neutral'}[change.target]) || change.target;
            html += '<div style="margin-top:6px;font-size:10px;color:#9ca3af;">' + t('diplomacy.changeIdeology') + ' ' + targetDisplay + ' (' + change.daysLeft + t('diplomacy.daysRemaining') + ')</div>';
            html += '<div style="background:#374151;height:8px;border-radius:4px;margin-top:4px;overflow:hidden;">';
            html += '<div style="width:' + pct + '%;height:100%;background:' + tColor + ';border-radius:4px;"></div></div>';
            html += '<button onclick="window.cancelIdeologyChange()" style="margin-top:6px;width:100%;padding:4px;background:#991b1b;color:white;border:none;border-radius:4px;font-size:10px;cursor:pointer;">' + t('diplomacy.cancel') + '</button>';
        } else {
            html += '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">';
            var ideos = ['Демократия', 'Фашизм', 'Коммунизм'];
            var ideoKeys = ['democracy', 'fascism', 'communism'];
            for (var ii = 0; ii < ideos.length; ii++) {
                var ideo = ideos[ii];
                if (ideo === myIdeology) continue;
                var days = ideo === 'Нейтралитет' ? 150 : (myIdeology === 'Нейтралитет' ? 150 : 200);
                html += '<button onclick="window.startIdeologyChange(\'' + ideo + '\')" style="flex:1;padding:5px;background:#374151;color:white;border:1px solid #4b5563;border-radius:4px;font-size:9px;cursor:pointer;">' + t('ideologies.' + ideoKeys[ii]) + ' (' + days + t('diplomacy.daysRemaining') + ')</button>';
            }
            html += '</div>';
        }
        html += '</div></div>';

        html += '<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:bold;color:#22c55e;margin-bottom:6px;">🤝 ' + t('diplomacy.allies') + ' (' + allies.length + ')</div>';
        if (allies.length === 0) html += '<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">' + t('ui.noAllies') + '</div>';
        else { for (var i = 0; i < allies.length; i++) {
            var allyId = allies[i];
            html += '<div style="background:#0a2e1a;border:1px solid #22c55e;border-radius:4px;padding:6px 8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">';
            html += '<span style="font-weight:bold;font-size:11px;">🤝 ' + allyId.toUpperCase() + '</span>';
            html += '<div style="display:flex;gap:3px;">';
            html += '<button onclick="window.callToArms(\'' + allyId + '\')" style="background:#854d0e;color:white;padding:3px 6px;border-radius:3px;font-size:9px;cursor:pointer;">⚔️ ' + t('diplomacy.callToArms') + '</button>';
            html += '<button onclick="window.kickAlly(\'' + allyId + '\')" style="background:#991b1b;color:white;padding:3px 6px;border-radius:3px;font-size:9px;cursor:pointer;">✕</button>';
            html += '</div></div>'; } }
        html += '</div>';

        html += '<div><div style="font-size:12px;font-weight:bold;color:#ef4444;margin-bottom:6px;">⚔️ ' + t('diplomacy.enemies') + ' (' + enemies.length + ')</div>';
        if (enemies.length === 0) html += '<div style="color:#6b7280;font-size:11px;text-align:center;padding:8px;">' + t('diplomacy.peace') + '</div>';
        else {
            for (var i = 0; i < enemies.length; i++) {
                var eid = enemies[i];
                var progress = this.gameState.getWarProgress(eid, this.world);
                var ideology = 'Демократия';
                if (window._COUNTRIES_MAP && window._COUNTRIES_MAP[eid]) {
                    ideology = window._COUNTRIES_MAP[eid].ideology || 'Демократия';
                }
                var threshold = this.gameState.getCapitulationThreshold(ideology);
                var color = progress >= threshold ? '#ef4444' : (progress >= threshold * 0.7 ? '#eab308' : '#3b82f6');

                html += '<div style="background:#1a0a0a;border:1px solid #ef4444;border-radius:6px;padding:8px;margin-bottom:6px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
                html += '<span style="font-weight:bold;font-size:11px;color:#ef4444;">⚔️ ' + eid.toUpperCase() + '</span>';
                html += '<span style="font-size:9px;color:#6b7280;">' + t('diplomacy.capitulationProgress') + ': ' + threshold + '%</span>';
                html += '</div>';
                html += '<div style="background:#374151;height:10px;border-radius:5px;overflow:hidden;">';
                html += '<div style="width:' + Math.min(progress, 100) + '%;height:100%;background:' + color + ';border-radius:5px;transition:width 0.3s;"></div>';
                html += '</div>';
                html += '<div style="font-size:9px;color:#6b7280;margin-top:3px;">' + t('diplomacy.capitulationProgress') + ': ' + progress + '% / ' + threshold + '%</div>';
                html += '</div>';
            }
        }
        html += '</div></div>';
        content.innerHTML = html;
    }
    
    renderBuildWindow(content) {
        const res = this.gameState;
        var html = '<div style="padding:12px;">';
        html += '<div style="background:#374151;padding:12px;border-radius:8px;display:flex;justify-content:space-between;margin-bottom:12px;"><span>🔫 ' + t('army.equipment') + ':</span><span style="color:#fbbf24;font-weight:bold;">' + Math.floor(res.equipment).toLocaleString() + '</span></div>';
        html += '<div style="font-size:14px;font-weight:bold;color:#eab308;margin-bottom:12px;">📦 ' + t('build.title') + '</div>';
        html += '<div style="background:#1f2937;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-weight:bold;">🏭 ' + t('build.factory') + '</div><div style="font-size:11px;color:#9ca3af;">500 🔫 | 135 ' + t('diplomacy.daysRemaining') + '</div></div><button onclick="window.selectBuildType(\'factory\')" style="padding:8px 16px;border-radius:6px;font-size:11px;font-weight:bold;background:' + (res.equipment >= 500 ? '#15803d' : '#4b5563') + ';color:white;cursor:' + (res.equipment >= 500 ? 'pointer' : 'not-allowed') + ';">' + t('build.factory') + '</button></div>';
        html += '<div style="background:#1f2937;padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-weight:bold;">⚓ ' + t('build.port') + '</div><div style="font-size:11px;color:#9ca3af;">300 🔫 | 90 ' + t('diplomacy.daysRemaining') + '</div></div><button onclick="window.selectBuildType(\'port\')" style="padding:8px 16px;border-radius:6px;font-size:11px;font-weight:bold;background:' + (res.equipment >= 300 ? '#15803d' : '#4b5563') + ';color:white;cursor:' + (res.equipment >= 300 ? 'pointer' : 'not-allowed') + ';">' + t('build.port') + '</button></div>';
        html += '</div>';
        content.innerHTML = html;
    }
    
    renderCommandersWindow(content) {
        const myId = this.gameState.myCountryId;
        const armies = window._armyManager ? window._armyManager.getArmiesForCountry(myId) : [];
        var html = '<div style="padding:12px;">';
        html += '<button onclick="window.createArmy()" style="background:#15803d;color:white;padding:12px;border-radius:8px;font-weight:bold;width:100%;cursor:pointer;margin-bottom:12px;">➕ ' + t('army.create') + '</button>';
        if (armies.length === 0) {
            html += '<div style="color:#6b7280;text-align:center;padding:20px;">' + t('army.noUnits') + '</div>';
        } else {
            for (var i = 0; i < armies.length; i++) {
                var army = armies[i];
                var frontStatus = army.frontLine ? '🎯 ' + army.frontLine.enemyId.toUpperCase() : '';
                html += '<div style="background:#1f2937;border-left:4px solid ' + army.color + ';padding:10px;border-radius:6px;margin-bottom:6px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                html += '<span style="font-weight:bold;color:' + army.color + ';">' + army.name + ' (' + army.unitIds.size + ')' + (frontStatus ? ' <span style="color:#eab308;font-size:10px;">' + frontStatus + '</span>' : '') + '</span>';
                html += '<div style="display:flex;gap:4px;">';
                html += '<button onclick="window.setArmyFrontLine(' + army.id + ')" style="background:#854d0e;color:white;padding:4px 8px;border-radius:4px;font-size:10px;cursor:pointer;">🎯</button>';
                html += '<button onclick="window.disbandArmy(' + army.id + ');uiManager.openWindow(\'commanders\')" style="background:#991b1b;color:white;padding:4px 8px;border-radius:4px;font-size:10px;cursor:pointer;">✕</button>';
                html += '</div></div>';
                html += '</div>';
            }
        }
        html += '</div>';
        content.innerHTML = html;
    }
    
    renderSaveWindow(content) {
        var autosaveOn = this.gameState.autosave !== false;
        var html = '<div style="padding:12px;">';
        html += '<button onclick="window.quickSave()" style="background:#15803d;color:white;padding:12px;border-radius:8px;font-weight:bold;width:100%;cursor:pointer;margin-bottom:8px;">💾 ' + t('save.save') + '</button>';
        html += '<button onclick="window.quickLoad()" style="background:#2563eb;color:white;padding:12px;border-radius:8px;font-weight:bold;width:100%;cursor:pointer;margin-bottom:12px;">📂 ' + t('save.load') + '</button>';
        html += '<div style="background:#1f2937;border-radius:6px;padding:10px;display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-size:11px;color:#9ca3af;">' + t('save.autosave') + '</span>';
        html += '<button onclick="window.toggleAutosave()" style="padding:6px 12px;border-radius:4px;font-size:11px;font-weight:bold;cursor:pointer;border:none;background:' + (autosaveOn ? '#15803d' : '#991b1b') + ';color:white;">' + (autosaveOn ? t('save.on') : t('save.off')) + '</button>';
        html += '</div></div>';
        content.innerHTML = html;
    }

    renderCapitulationWindow(content, data) {
        var enemyId = data.enemyId;
        var winnerId = data.winnerId;
        var cells = data.cells;
        var enemyName = window._COUNTRIES_MAP && window._COUNTRIES_MAP[enemyId] ? window._COUNTRIES_MAP[enemyId].name : enemyId.toUpperCase();
        var winnerName = window._COUNTRIES_MAP && window._COUNTRIES_MAP[winnerId] ? window._COUNTRIES_MAP[winnerId].name : winnerId.toUpperCase();

        var html = '<div style="padding:16px;">';
        html += '<div style="text-align:center;margin-bottom:16px;">';
        html += '<div style="font-size:24px;margin-bottom:8px;">🏳️</div>';
        html += '<div style="font-size:16px;font-weight:bold;color:#eab308;">' + enemyName + ' ' + t('capitulation.title') + '</div>';
        html += '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">' + t('capitulation.territoryCount') + ': ' + cells.length + '</div>';
        html += '</div>';

        html += '<div style="font-size:12px;font-weight:bold;color:#eab308;margin-bottom:8px;">' + t('capitulation.chooseFate') + '</div>';

        html += '<button onclick="window.capitulationChoice(\'annex\')" style="width:100%;padding:12px;background:#991b1b;color:white;border:2px solid #ef4444;border-radius:8px;margin-bottom:8px;cursor:pointer;text-align:left;">';
        html += '<div style="font-size:13px;font-weight:bold;">🏴 ' + t('capitulation.annex') + '</div>';
        html += '<div style="font-size:10px;color:#fca5a5;">' + winnerName + '</div>';
        html += '</button>';

        html += '<button onclick="window.capitulationChoice(\'vassal\')" style="width:100%;padding:12px;background:#1e1b4b;color:white;border:2px solid #a855f7;border-radius:8px;margin-bottom:8px;cursor:pointer;text-align:left;">';
        html += '<div style="font-size:13px;font-weight:bold;">👑 ' + t('capitulation.vassalize') + '</div>';
        html += '<div style="font-size:10px;color:#c084fc;">' + enemyName + '</div>';
        html += '</button>';

        html += '<button onclick="window.capitulationChoice(\'release\')" style="width:100%;padding:12px;background:#052e16;color:white;border:2px solid #22c55e;border-radius:8px;cursor:pointer;text-align:left;">';
        html += '<div style="font-size:13px;font-weight:bold;">🕊️ ' + t('capitulation.release') + '</div>';
        html += '<div style="font-size:10px;color:#86efac;">' + enemyName + '</div>';
        html += '</button>';

        html += '</div>';

        content.innerHTML = html;

        window._capitulationData = data;
    }
}
