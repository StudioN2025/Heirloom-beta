// AIController.js — v3.1 (люди, умный найм, тактика)

import { addNotification } from '../utils/helpers.js';
import { AStarFinder } from '../core/AStar.js';

// Стоимость юнитов в людских ресурсах
const UNIT_MANPOWER = { infantry: 1000, tank: 500 };

// production передаётся через setProduction() из main.js

// ── Профили стран ────────────────────────────────────────────────────────────

const PROFILES = {
    // === ЕВРОПА ===
    germany:        { power: 95, ideology: 'fascist',    aggression: 0.9, role: 'aggressor' },
    italy:          { power: 65, ideology: 'fascist',    aggression: 0.7, role: 'aggressor' },
    ussr:           { power: 90, ideology: 'communist',  aggression: 0.6, role: 'opportunist' },
    uk:             { power: 85, ideology: 'democratic', aggression: 0.2, role: 'defender' },
    france:         { power: 80, ideology: 'democratic', aggression: 0.2, role: 'defender' },
    poland:         { power: 50, ideology: 'democratic', aggression: 0.3, role: 'defender' },
    spain:          { power: 55, ideology: 'fascist',    aggression: 0.4, role: 'neutral' },
    romania:        { power: 35, ideology: 'fascist',    aggression: 0.3, role: 'opportunist' },
    hungary:        { power: 30, ideology: 'fascist',    aggression: 0.4, role: 'opportunist' },
    bulgaria:       { power: 22, ideology: 'fascist',    aggression: 0.3, role: 'opportunist' },
    yugoslavia:     { power: 40, ideology: 'democratic', aggression: 0.2, role: 'defender' },
    greece:         { power: 35, ideology: 'democratic', aggression: 0.1, role: 'defender' },
    albania:        { power: 12, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    czechoslovakia: { power: 40, ideology: 'democratic', aggression: 0.1, role: 'defender' },
    austria:        { power: 20, ideology: 'fascist',    aggression: 0.1, role: 'neutral' },
    slovakia:       { power: 15, ideology: 'fascist',    aggression: 0.2, role: 'opportunist' },
    netherlands:    { power: 30, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    belgium:        { power: 28, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    luxembourg:     { power:  5, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    switzerland:    { power: 18, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    denmark:        { power: 15, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    norway:         { power: 20, ideology: 'democratic', aggression: 0.0, role: 'defender' },
    sweden:         { power: 25, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    finland:        { power: 25, ideology: 'democratic', aggression: 0.1, role: 'defender' },
    portugal:       { power: 25, ideology: 'fascist',    aggression: 0.1, role: 'neutral' },
    ireland:        { power: 15, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    iceland:        { power:  5, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    lithuania:      { power: 12, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    latvia:         { power: 10, ideology: 'democratic', aggression: 0.0, role: 'neutral' },
    estonia:        { power: 10, ideology: 'democratic', aggression: 0.0, role: 'neutral' },

    // === БЛИЖНИЙ ВОСТОК ===
    turkey:         { power: 45, ideology: 'neutral',    aggression: 0.1, role: 'neutral' },
    iraq:           { power: 18, ideology: 'fascist',    aggression: 0.2, role: 'opportunist' },
    iran:           { power: 25, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    saudi_arabia:   { power: 15, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    syria:          { power: 10, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    jordan:         { power:  8, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    palestine:      { power:  8, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },

    // === СЕВЕРНАЯ АФРИКА ===
    egypt:          { power: 30, ideology: 'neutral',    aggression: 0.1, role: 'defender' },
    libya:          { power: 15, ideology: 'fascist',    aggression: 0.2, role: 'neutral' },
    tunisia:        { power: 10, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    algeria:        { power: 12, ideology: 'neutral',    aggression: 0.0, role: 'neutral' },
    morocco:        { power: 15, ideology: 'neutral',    aggression: 0.1, role: 'neutral' },
};

const INITIAL_ALLIANCES = [
    ['germany', 'italy'],
    ['uk', 'france'],
];

// день от 1936-01-01 → историческое событие
const HISTORICAL_WARS = [
    { day: 200,  a: 'germany',  b: 'austria',        chance: 0.8 },
    { day: 400,  a: 'germany',  b: 'czechoslovakia', chance: 0.85 },
    { day: 500,  a: 'italy',    b: 'albania',        chance: 0.7 },
    { day: 600,  a: 'ussr',     b: 'finland',        chance: 0.7 },
    { day: 700,  a: 'germany',  b: 'poland',         chance: 0.95 },
    { day: 740,  a: 'germany',  b: 'france',         chance: 0.9 },
    { day: 740,  a: 'germany',  b: 'belgium',        chance: 0.9 },
    { day: 740,  a: 'germany',  b: 'netherlands',    chance: 0.9 },
    { day: 740,  a: 'germany',  b: 'luxembourg',     chance: 0.9 },
    { day: 750,  a: 'germany',  b: 'denmark',        chance: 0.9 },
    { day: 780,  a: 'germany',  b: 'norway',         chance: 0.85 },
    { day: 800,  a: 'germany',  b: 'yugoslavia',     chance: 0.8 },
    { day: 850,  a: 'germany',  b: 'greece',         chance: 0.7 },
    { day: 900,  a: 'italy',    b: 'greece',         chance: 0.6 },
    { day: 950,  a: 'italy',    b: 'egypt',          chance: 0.5 },
    { day: 1000, a: 'germany',  b: 'ussr',           chance: 0.95 },
    { day: 1000, a: 'romania',  b: 'ussr',           chance: 0.6 },
    { day: 1000, a: 'hungary',  b: 'ussr',           chance: 0.5 },
    { day: 1050, a: 'bulgaria', b: 'yugoslavia',     chance: 0.5 },
    { day: 1100, a: 'germany',  b: 'ireland',        chance: 0.2 },
    { day: 1150, a: 'turkey',   b: 'greece',         chance: 0.3 },
    { day: 1200, a: 'iraq',     b: 'iran',           chance: 0.25 },
];

// ── Главный контроллер ───────────────────────────────────────────────────────

export class AIController {
    constructor(world, entities, gameState) {
        this.world    = world;
        this.entities = entities;
        this.gs       = gameState;
        this.production = null; // устанавливается из main.js

        this.astar = new AStarFinder(world);

        // countryId → { warTarget, lastRecruit, lastBuild, lastDiplo,
        //               unitOrders: Map<unitId, {path, goal}> }
        this.mem = new Map();

        this.firedWars       = new Set();
        this.alliancesInited = false;
        this.rrIndex         = 0;       // round-robin по странам
        this.PATH_CACHE_TTL  = 15;      // пересчитываем путь раз в N дней
    }

    async init() { console.log('🤖 AI v3.0'); }

    // вызывается раз в игровой день (из main.js дневного тика)
    update() {
        const day = this.gs.days;

        if (!this.alliancesInited && day >= 1) {
            this._initAlliances();
            this.alliancesInited = true;
        }

        this._checkHistoricalWars(day);

        // Обходим страны по 4 за день
        const countries = this.world.getAllCountries().filter(c => c !== this.gs.myCountryId);
        if (!countries.length) return;
        for (let i = 0; i < 4; i++) {
            const c = countries[this.rrIndex++ % countries.length];
            this._processCountry(c, day);
        }
    }

    // ── Альянсы ──────────────────────────────────────────────────────────────

    _initAlliances() {
        for (const pair of INITIAL_ALLIANCES) {
            const [a, b] = pair.filter(id => this.world.getCountryCells(id).size > 0);
            if (a && b && !this.gs.areAllies(a, b)) this.gs.addAlliance(a, b);
        }
    }

    // ── Исторические войны ────────────────────────────────────────────────────

    _checkHistoricalWars(day) {
        const my = this.gs.myCountryId;

        for (let i = 0; i < HISTORICAL_WARS.length; i++) {
            if (this.firedWars.has(i)) continue;
            const t = HISTORICAL_WARS[i];
            if (day < t.day) continue;
            if (day > t.day + 5) { this.firedWars.add(i); continue; }

            const { a, b } = t;
            if (a === b || this.gs.isAtWar(a, b)) { this.firedWars.add(i); continue; }
            if (!this.world.getCountryCells(a).size || !this.world.getCountryCells(b).size) {
                this.firedWars.add(i); continue;
            }

            // Игрок сам решает — не автосаттакуем его страну
            if (a === my || b === my) {
                // Только показываем уведомление что пора
                if (day >= t.day) {
                    const enemy = a === my ? b : a;
                    addNotification(`📅 Пора объявить войну ${enemy}! (историческая дата)`, 'info');
                    this.firedWars.add(i);
                } else {
                    // Собираем войска к границе (за 5 дней)
                    this._gatherToBorder(a, b);
                }
                continue;
            }

            // Собираем войска к границе перед войной (за 5 дней до)
            if (day >= t.day - 5 && day < t.day) {
                this._gatherToBorder(a, b);
                continue;
            }

            // ИИ объявляет войну
            this.gs.addWar(a, b, this.world);
            this._pullAllies(a, b);

            addNotification(`⚔️ ${a} → ${b}`, 'war');
            this.firedWars.add(i);
        }
    }

    _gatherToBorder(countryId, targetId) {
        const border = this.world.getBorderWith(countryId, targetId);
        if (!border.length) return;

        const units = this.entities.getEntitiesByOwner(countryId);
        const borderPts = border.map(b => { const [x,y] = b.split(',').map(Number); return {x,y}; });

        for (let i = 0; i < units.length; i++) {
            const uid = units[i];
            if (this.entities.inCombat[uid]) continue;
            const target = borderPts[i % borderPts.length];

            const ux = this.entities.x[uid], uy = this.entities.y[uid];
            if (ux === target.x && uy === target.y) continue;

            const dx = Math.sign(target.x - ux);
            const dy = Math.sign(target.y - uy);
            const nx = ux + dx;
            const ny = uy + dy;

            if (this.world.getCell(nx, ny) !== 0 && !this.entities.getUnitAt(nx, ny)) {
                const cellOwner = this.world.getCell(nx, ny);
                const unitOwner = this.entities.owner[uid];
                if (cellOwner === unitOwner || this.gs.areAllies && this.gs.areAllies(unitOwner, cellOwner) || this.gs.isAtWar && this.gs.isAtWar(unitOwner, cellOwner)) {
                    this.entities.moveTo(uid, nx, ny);
                }
            }
        }
    }

    _pullAllies(attacker, defender) {
        for (const ally of this._allies(attacker)) {
            if (ally === this.gs.myCountryId) continue; // Игрока не добавляем — через приглашение
            if (!this.gs.isAtWar(ally, defender)) this.gs.addWar(ally, defender, this.world);
        }
    }

    _allies(id) {
        const res = [];
        for (const a of this.gs.alliances) if (a.has(id)) for (const m of a) if (m !== id) res.push(m);
        return res;
    }

    // ── Страна ───────────────────────────────────────────────────────────────

    _processCountry(id, day) {
        this._currentAI = id;
        const cells = this.world.getCountryCells(id);
        if (!cells.size) return;

        const profile = PROFILES[id] || { power: 20, aggression: 0.2, role: 'neutral' };
        const units   = this.entities.getEntitiesByOwner(id);
        const enemies = this._enemies(id);

        if (!this.mem.has(id)) {
            this.mem.set(id, { warTarget: null, lastRecruit: 0, lastBuild: 0,
                               lastDiplo: 0, unitOrders: new Map() });
        }
        const mem = this.mem.get(id);

        this._recruit(id, cells, units, profile, enemies.length > 0);
        this._build(id, cells, profile);
        this._diplomacy(id, profile, mem, day);

        if (enemies.length > 0 && units.length > 0) {
            this._military(id, units, enemies, mem, profile, day);
            this._useNavy(id, units, enemies, mem, day);
        } else if (units.length > 0) {
            this._peacetime(id, cells, units, profile);
        }
    }

    // ── Найм ─────────────────────────────────────────────────────────────────

    _recruit(id, cells, units, profile, atWar) {
        const mem = this.mem.get(id);
        const now = Date.now();
        if (now - mem.lastRecruit < (atWar ? 1500 : 9000)) return;

        const target = Math.min(80, Math.max(8,
            Math.floor(cells.size / (profile.power >= 70 ? 3 : profile.power >= 40 ? 5 : 7))
            * (atWar ? 2.5 : 1)
        ));
        if (units.length >= target) return;

        if (!mem.manpower) mem.manpower = cells.size * 1000;
        mem.manpower = Math.min(cells.size * 1000, mem.manpower + 20);

        const toSpawn = Math.min(atWar ? 5 : 1, target - units.length);
        for (let i = 0; i < toSpawn; i++) this._spawnUnit(id, cells, profile, atWar, mem);
        mem.lastRecruit = now;
    }

    _spawnUnit(id, cells, profile, atWar, mem) {
        // Спаун у столицы
        const cap = this.world.getCapital(id);
        if (cap) {
            // Ищем свободную клетку рядом со столицей
            for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
                const tx = cap.x + dx, ty = cap.y + dy;
                const cellOwner = this.world.getCell(tx, ty);
                if (cellOwner === id && !this.entities.getUnitAt(tx, ty)) {
                    const useTank = profile.power >= 60 && atWar;
                    const unitType = useTank ? 'tank' : 'infantry';
                    const cost = UNIT_MANPOWER[unitType] || 1000;
                    if (mem && mem.manpower < cost) return;
                    if (mem) mem.manpower -= cost;
                    if (this.production) {
                        this.production.aiEnqueueUnit(id, tx, ty, unitType);
                    } else {
                        this.entities.createEntity(id, useTank ? 1 : 0, tx, ty);
                    }
                    return;
                }
            }
        }

        // Если столицы нет — спаун как раньше (у завода)
        let best = null, bestScore = -Infinity;
        let sumX = 0, sumY = 0, n = 0;
        for (const c of cells) {
            const [x, y] = c.split(',').map(Number);
            sumX += x; sumY += y; n++;
        }
        const cx = sumX / n, cy = sumY / n;

        for (const c of cells) {
            const [x, y] = c.split(',').map(Number);
            if (this.entities.getUnitAt(x, y)) continue;
            let score = -(Math.abs(x - cx) + Math.abs(y - cy));
            if (this.world.hasBuilding(x, y, 'factory')) score += 40;
            if (score > bestScore) { bestScore = score; best = [x, y]; }
        }
        if (!best) return;

        const useTank = profile.power >= 60 && atWar;
        const unitType = useTank ? 'tank' : 'infantry';
        const cost = UNIT_MANPOWER[unitType] || 1000;
        if (mem && mem.manpower < cost) return;
        if (mem) mem.manpower -= cost;

        if (this.production) {
            this.production.aiEnqueueUnit(id, best[0], best[1], unitType);
        } else {
            this.entities.createEntity(id, useTank ? 1 : 0, best[0], best[1]);
        }
    }

    // ── Строительство ─────────────────────────────────────────────────────────

    _build(id, cells, profile) {
        const mem = this.mem.get(id);
        if (Date.now() - mem.lastBuild < 15000) return;

        const targetFact = Math.min(
            profile.power >= 70 ? 15 : profile.power >= 40 ? 8 : 4,
            Math.floor(cells.size / 12)
        );
        let factCount = 0;
        let portCount = 0;
        const availableFact = [];
        const availablePort = [];

        for (const c of cells) {
            const [x, y] = c.split(',').map(Number);
            if (this.world.hasBuilding(x, y, 'factory')) factCount++;
            else availableFact.push([x, y]);

            if (this.world.hasBuilding(x, y, 'port')) portCount++;
            else if (this._isCoastal(x, y)) availablePort.push([x, y]);
        }

        // Строим заводы
        if (factCount < targetFact && availableFact.length) {
            const [x, y] = availableFact[Math.floor(Math.random() * availableFact.length)];
            this.world.addBuilding(x, y, 'factory');
        }

        // Строим порты (макс 3 на крупную страну)
        const targetPorts = Math.min(3, Math.floor(cells.size / 20));
        if (portCount < targetPorts && availablePort.length) {
            const [x, y] = availablePort[Math.floor(Math.random() * availablePort.length)];
            this.world.addBuilding(x, y, 'port');
        }

        mem.lastBuild = Date.now();
    }

    _isCoastal(x, y) {
        for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            if (this.world.getCell(x+dx, y+dy) === 0) return true;
        }
        return false;
    }

    // ── Дипломатия ────────────────────────────────────────────────────────────

    _diplomacy(id, profile, mem, day) {
        if (Date.now() - mem.lastDiplo < 25000) return;
        mem.lastDiplo = Date.now();

        if (profile.role === 'aggressor' || profile.role === 'opportunist') {
            this._considerWar(id, profile);
        }
        if (profile.role === 'defender' && this._enemies(id).length > 0) {
            this._seekAlly(id, profile);
        }
    }

    _considerWar(id, profile) {
        if (this._enemies(id).length >= 2) return;
        const myPow = this._power(id);
        for (const nb of this._neighborCountries(id)) {
            if (this.gs.isAtWar(id, nb) || this.gs.areAllies(id, nb)) continue;
            if (nb === this.gs.myCountryId) continue;
            const ratio = myPow / Math.max(this._power(nb), 1);
            if (ratio < 1.6) continue;
            const nbProfile = PROFILES[nb];
            const bonus = nbProfile && nbProfile.ideology !== profile.ideology ? 1.3 : 1.0;
            if (Math.random() < profile.aggression * 0.04 * bonus) {
                this.gs.addWar(id, nb, this.world);
                this._pullAllies(id, nb);
                addNotification(`⚔️ ${id} объявил войну ${nb}!`, 'war');
                break;
            }
        }
    }

    _seekAlly(id, profile) {
        for (const nb of this._neighborCountries(id)) {
            if (this.gs.areAllies(id, nb) || this.gs.isAtWar(id, nb)) continue;
            const nbp = PROFILES[nb];
            if (!nbp || (nbp.ideology !== profile.ideology && nbp.ideology !== 'neutral')) continue;
            if (Math.random() < 0.25) {
                // Если игрок — показываем приглашение
                if (nb === this.gs.myCountryId) {
                    if (!this.gs._allianceInvites) this.gs._allianceInvites = {};
                    if (!this.gs._allianceInvites[id]) this.gs._allianceInvites[id] = {};
                    var declined = this.gs._declinedAlliance || {};
                    if (!declined[id] || this.gs.days >= declined[id]) {
                        this.gs.allianceInvitations = this.gs.allianceInvitations || [];
                        this.gs.allianceInvitations.push({ from: id, time: Date.now() });
                    }
                } else {
                    this.gs.addAlliance(id, nb);
                    addNotification('🤝 ' + id + ' и ' + nb + ' заключили альянс!', 'info');
                }
                break;
            }
        }
    }

    // ── Военные действия ─────────────────────────────────────────────────────

    _military(id, units, enemies, mem, profile, day) {
        if (!mem.warTarget || !enemies.includes(mem.warTarget)
            || !this.world.getCountryCells(mem.warTarget).size
            || !this.world.getBorderWith(id, mem.warTarget).length) {
            mem.warTarget = this._pickTarget(id, enemies);
        }
        const target = mem.warTarget;
        if (!target) return;

        // Проверяем угрозу столице
        const cap = this.world.getCapital(id);
        if (cap) {
            const enemyBorder = this.world.getBorderWith(id, target);
            for (const c of enemyBorder) {
                const [bx, by] = c.split(',').map(Number);
                if (Math.abs(bx - cap.x) <= 5 && Math.abs(by - cap.y) <= 5) {
                    this._defendCapital(id, units, cap, day);
                    return;
                }
            }
        }

        const border = this.world.getBorderWith(id, target);
        if (!border.length) { mem.warTarget = null; return; }

        const borderPts = border.map(b => { const [x,y]=b.split(',').map(Number); return {x,y}; });

        // Все юниты — и к границе, и атакуем
        this._moveAttackers(id, units, target, borderPts, mem, day);
    }

    _defendCapital(id, units, cap, day) {
        for (let i = 0; i < units.length; i++) {
            const uid = units[i];
            if (this.entities.inCombat[uid]) continue;
            if (this.entities.isShip && this.entities.isShip[uid]) continue;
            const ux = this.entities.x[uid], uy = this.entities.y[uid];
            if (ux === cap.x && uy === cap.y) continue;

            // Ищем клетку рядом со столицей
            let placed = false;
            for (const [dx, dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1],[0,0]]) {
                const tx = cap.x + dx, ty = cap.y + dy;
                const owner = this.world.getCell(tx, ty);
                if ((owner === id) && !this.entities.getUnitAt(tx, ty)) {
                    const ddx = Math.sign(tx - ux);
                    const ddy = Math.sign(ty - uy);
                    const nx = ux + ddx, ny = uy + ddy;
                    const no = this.world.getCell(nx, ny);
                    if (no === id && !this.entities.getUnitAt(nx, ny)) {
                        this.entities.moveTo(uid, nx, ny);
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                const dx = Math.sign(cap.x - ux);
                const dy = Math.sign(cap.y - uy);
                const nx = ux + dx, ny = uy + dy;
                const no = this.world.getCell(nx, ny);
                if (no && (no === id || this.gs.isAtWar && this.gs.isAtWar(id, no)) && !this.entities.getUnitAt(nx, ny)) {
                    this.entities.moveTo(uid, nx, ny);
                }
            }
        }
    }

    // ── Движение атакующих (с A*) ────────────────────────────────────────────

    _moveAttackers(id, units, target, borderPts, mem, day) {
        for (let i = 0; i < units.length; i++) {
            const uid = units[i];
            if (this.entities.inCombat[uid]) continue;
            if (this.entities.isShip && this.entities.isShip[uid]) continue;

            const ux = this.entities.x[uid];
            const uy = this.entities.y[uid];
            const assignedBorder = borderPts[i % borderPts.length];

            // Атакуем если рядом с вражеской клеткой
            if (this._attackAdjacent(uid, target)) continue;

            // Ищем ближайшую клетку к цели по 4-связности
            const dx = Math.sign(assignedBorder.x - ux);
            const dy = Math.sign(assignedBorder.y - uy);
            const nx = ux + dx;
            const ny = uy + dy;
            const cellOwner = this.world.getCell(nx, ny);

            if (cellOwner !== 0) {
                const owner = this.entities.owner[uid];
                if (cellOwner === owner || this.gs.areAllies && this.gs.areAllies(owner, cellOwner) || this.gs.isAtWar && this.gs.isAtWar(owner, cellOwner)) {
                    const occ = this.entities.getUnitAt(nx, ny);
                    if (!occ || this.entities.owner[occ] === owner || (this.gs.areAllies && this.gs.areAllies(owner, this.entities.owner[occ]))) {
                        this.entities.moveTo(uid, nx, ny);
                    } else {
                        this.entities.moveTo(uid, nx, ny);
                    }
                }
            }
        }
    }

    // Атакуем соседнюю вражескую клетку
    _attackAdjacent(uid, targetCountry) {
        const ux = this.entities.x[uid], uy = this.entities.y[uid];
        const owner = this.entities.owner[uid];

        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = ux + dx, ny = uy + dy;
            if (this.world.getCell(nx, ny) !== targetCountry) continue;

            const enemyUnit = this.entities.getUnitAt(nx, ny);
            if (enemyUnit && this.entities.active[enemyUnit]) {
                // Враг на клетке — идём на него (CombatSystem начнёт бой)
                if (!this.entities.inCombat[uid] && !this.entities.inCombat[enemyUnit]) {
                    this.entities.moveTo(uid, nx, ny);
                }
                return true;
            } else {
                // Клетка пуста — захватываем
                this.world.setCell(nx, ny, owner);
                this.entities.moveTo(uid, nx, ny);
            }
            return true;
        }
        return false;
    }

    // ── Мирное время ─────────────────────────────────────────────────────────

    _peacetime(id, cells, units, profile) {
        // Все страны ставят войска к границам в мирное время
        const nbs = this._neighborCountries(id);
        if (!nbs.length) return;

        // Проверяем — столица под угрозой? (враг в 5 клетках)
        const cap = this.world.getCapital(id);
        let capThreat = false;
        if (cap) {
            for (const nb of nbs) {
                if (!this.gs.isAtWar(id, nb)) continue;
                const border = this.world.getBorderWith(id, nb);
                for (const c of border) {
                    const [bx, by] = c.split(',').map(Number);
                    if (Math.abs(bx - cap.x) <= 5 && Math.abs(by - cap.y) <= 5) {
                        capThreat = true;
                        break;
                    }
                }
                if (capThreat) break;
            }
        }

        const borderPts = [];

        // Если столица под угрозой —一半 войск идут к столице
        if (capThreat && cap) {
            const capBorder = [];
            for (const [dx, dy] of [[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],
                                    [-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],
                                    [-2,0],[-1,0],[1,0],[2,0],
                                    [-2,1],[-1,1],[0,1],[1,1],[2,1],
                                    [-2,2],[-1,2],[0,2],[1,2],[2,2]]) {
                const tx = cap.x + dx, ty = cap.y + dy;
                const owner = this.world.getCell(tx, ty);
                if (owner === id && !this.entities.getUnitAt(tx, ty)) {
                    capBorder.push({ x: tx, y: ty });
                }
            }
            // Первая половина юнитов — к столице
            const half = Math.ceil(units.length / 2);
            for (let i = 0; i < half && i < capBorder.length; i++) {
                borderPts.push(capBorder[i % capBorder.length]);
            }
            // Вторая половина — к обычным границам
            for (const nb of nbs) {
                const b = this.world.getBorderWith(id, nb);
                for (const c of b.slice(0, 8)) {
                    const [x,y] = c.split(',').map(Number);
                    borderPts.push({x,y});
                }
            }
        } else {
            for (const nb of nbs) {
                const b = this.world.getBorderWith(id, nb);
                for (const c of b.slice(0, 15)) {
                    const [x,y] = c.split(',').map(Number);
                    borderPts.push({x,y});
                }
            }
        }

        if (!borderPts.length) return;

        for (let i = 0; i < units.length; i++) {
            const uid = units[i];
            if (this.entities.inCombat[uid]) continue;
            if (this.entities.isShip && this.entities.isShip[uid]) continue;
            const target = borderPts[i % borderPts.length];
            if (!target) continue;

            const ux = this.entities.x[uid], uy = this.entities.y[uid];
            if (ux === target.x && uy === target.y) continue;

            const dx = Math.sign(target.x - ux);
            const dy = Math.sign(target.y - uy);
            const nx = ux + dx;
            const ny = uy + (dx ? 0 : dy);
            const cellOwner = this.world.getCell(nx, ny);

            if (cellOwner && !this.entities.getUnitAt(nx, ny)) {
                const unitOwner = this.entities.owner[uid];
                if (cellOwner === unitOwner || this.gs.areAllies && this.gs.areAllies(unitOwner, cellOwner) || this.gs.isAtWar && this.gs.isAtWar(unitOwner, cellOwner)) {
                    this.entities.moveTo(uid, nx, ny);
                }
            }
        }
    }

    // ── Флот — используем корабли для атаки с моря ──────────────────────────

    _useNavy(id, units, enemies, mem, day) {
        // Находим порты страны
        const ports = [];
        for (const c of this.world.getCountryCells(id)) {
            const [x, y] = c.split(',').map(Number);
            if (this.world.hasBuilding(x, y, 'port')) ports.push({x, y});
        }
        if (!ports.length) return;

        // Находим юнитов на портах
        const ships = units.filter(uid => {
            if (this.entities.inCombat[uid]) return false;
            const ux = this.entities.x[uid], uy = this.entities.y[uid];
            return this.world.hasBuilding(ux, uy, 'port');
        });

        if (!ships.length) return;

        // Находим вражеское побережье
        for (const enemy of enemies) {
            for (const c of this.world.getCountryCells(enemy)) {
                const [ex, ey] = c.split(',').map(Number);
                if (!this._isCoastal(ex, ey)) continue;

                // Есть ли свободный корабль?
                const ship = ships.shift();
                if (!ship) return;

                // Отправляем корабль в воду рядом с вражеским побережьем
                const waterNearby = this._findWaterNear(ex, ey);
                if (waterNearby) {
                    this.entities.moveTo(ship, waterNearby.x, waterNearby.y);
                    this.entities.isShip[ship] = 1;
                }
                break;
            }
        }
    }

    _findWaterNear(x, y) {
        for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            const nx = x + dx, ny = y + dy;
            if (this.world.isWater(nx, ny)) return {x: nx, y: ny};
        }
        return null;
    }

    // ── A* (обёртка) ────────────────────────────────────────────────────────

    _findPath(sx, sy, ex, ey, ownerId) {
        // Патчим A* — разрешаем идти по своей И вражеской земле
        const origGetCell = this.world.getCell.bind(this.world);
        // Временно делаем A* без ограничения на владельца
        const path = this._astarFree(sx, sy, ex, ey, 150);
        return path;
    }

    // A* с проверкой владельца — не ходим по чужой территории (кроме врага)
    _astarFree(sx, sy, ex, ey, maxSteps) {
        const h = (x, y) => Math.abs(x-ex)+Math.abs(y-ey);
        const open = [{ x:sx, y:sy, f:h(sx,sy), g:0 }];
        const cameFrom = new Map();
        const gScore = new Map();
        gScore.set(`${sx},${sy}`, 0);

        const ownerId = this._currentAI || this.gs.myCountryId;

        let steps = 0;
        while (open.length && steps++ < maxSteps) {
            let minI = 0;
            for (let i = 1; i < open.length; i++) if (open[i].f < open[minI].f) minI = i;
            const cur = open.splice(minI, 1)[0];
            const curKey = `${cur.x},${cur.y}`;

            if (cur.x === ex && cur.y === ey) {
                const path = [];
                let node = curKey;
                while (cameFrom.has(node)) { path.unshift(node); node = cameFrom.get(node); }
                return path;
            }

            for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = cur.x+dx, ny = cur.y+dy;
                const nKey = `${nx},${ny}`;
                const cell = this.world.getCell(nx, ny);
                if (cell === 0) continue;

                // Проверяем владельца
                if (cell !== ownerId) {
                    const isAllied = this.gs.areAllies && this.gs.areAllies(ownerId, cell);
                    const isEnemy = this.gs.isAtWar && this.gs.isAtWar(ownerId, cell);
                    if (!isAllied && !isEnemy) continue; // чужая территория — обходим
                }

                const ng = cur.g + 1;
                if (!gScore.has(nKey) || ng < gScore.get(nKey)) {
                    gScore.set(nKey, ng);
                    cameFrom.set(nKey, curKey);
                    open.push({ x:nx, y:ny, f: ng + h(nx,ny), g: ng });
                }
            }
        }
        return null;
    }

    // ── Капитуляция ───────────────────────────────────────────────────────────

    _checkCapitulation(countryId, winner) {
        const cells = this.world.getCountryCells(countryId);
        if (cells.size > 3) return;

        // Передаём все оставшиеся клетки победителю
        for (const c of [...cells]) {
            const [x,y] = c.split(',').map(Number);
            this.world.setCell(x, y, winner);
        }
        // Удаляем юниты
        for (const uid of this.entities.getEntitiesByOwner(countryId)) {
            this.entities.removeEntity(uid);
        }
        // Убираем из войн и альянсов
        this.gs.wars = this.gs.wars.filter(w => w.a !== countryId && w.b !== countryId);
        this.gs.alliances = this.gs.alliances
            .map(a => { const s=new Set(a); s.delete(countryId); return s; })
            .filter(a => a.size > 1);

        // Сбрасываем цели ИИ которые были на эту страну
        for (const [, m] of this.mem) { if (m.warTarget === countryId) m.warTarget = null; }

        addNotification(`💀 ${countryId} капитулировал перед ${winner}!`, 'war');

        if (countryId === this.gs.myCountryId) {
            addNotification('💀 ВАША СТРАНА КАПИТУЛИРОВАЛА! Игра окончена.', 'war');
            this.gs.setGameSpeed(0);
            this.gs.isGameActive = false;
        }
    }

    // ── Вспомогательные ──────────────────────────────────────────────────────

    _enemies(id) {
        if (!this.gs.wars) return [];
        return this.gs.wars.flatMap(w => {
            if (w.a === id && this.world.getCountryCells(w.b).size) return [w.b];
            if (w.b === id && this.world.getCountryCells(w.a).size) return [w.a];
            return [];
        });
    }

    _neighborCountries(id) {
        const res = new Set();
        for (const c of this.world.getCountryCells(id)) {
            const [x,y] = c.split(',').map(Number);
            for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nb = this.world.getCell(x+dx, y+dy);
                if (nb && nb !== id) res.add(nb);
            }
        }
        return [...res];
    }

    _power(id) {
        const p  = PROFILES[id];
        const base = p ? p.power : 20;
        return base * 0.4
             + this.world.getCountryCells(id).size * 0.4
             + this.entities.getEntitiesByOwner(id).length * 0.2;
    }

    _pickTarget(id, enemies) {
        let best = null, bestScore = Infinity;
        for (const e of enemies) {
            if (!this.world.getBorderWith(id, e).length) continue;
            const score = this._power(e);
            if (score < bestScore) { bestScore = score; best = e; }
        }
        return best;
    }
}
