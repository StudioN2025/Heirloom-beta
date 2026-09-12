// GameState.js — Центральное состояние игры

export class GameState {
    constructor() {
        this.myCountryId = null;
        this.isGameActive = false;
        this.gameSpeed = 1;
        this.gameDate = new Date(1936, 0, 1);
        this.days = 0;

        this.equipment = 5000;
        this.manpower = 500000;
        this.maxManpower = 500000;
        this.factories = 0;

        this.tech = { industry: 1, infantry: 1, tank: 1 };

        this.countryTech = new Map();
        this.countryResearch = new Map();

        // Для TopBar — текущее исследование игрока
        this.activeResearch = null;

        this.wars = [];
        this.alliances = [];
        this.vassals = {};
        this.warStartCells = {};
        this.warOriginalCells = {};
        this.warInvitations = [];
        this.allianceInvitations = [];
        this.ideologyChange = null;
        this.justifications = null;
        this.relations = {};
        this.relationsInit = false;

        this.activeFocus = null;
        this.completedFocuses = new Set();

        this.selectedUnitId = null;
        this.activeBattles = [];

        this.trainingQueue = [];
        this.constructionQueue = [];

        // Отклонённые приглашения: { countryId: day }
        this._declinedInvites = {};
        this._declinedAlliance = {};
        this._capitulationPending = false;
    }

    advanceDay() {
        this.gameDate.setDate(this.gameDate.getDate() + 1);
        this.days++;
    }

    getDateString() {
        const months = ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];
        return `${this.gameDate.getDate()} ${months[this.gameDate.getMonth()]} ${this.gameDate.getFullYear()}`;
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }

    isAtWar(c1, c2) {
        return this.wars.some(w => (w.a === c1 && w.b === c2) || (w.b === c1 && w.a === c2));
    }

    areAllies(c1, c2) {
        if (c1 === c2) return true;
        return this.alliances.some(a => a.has(c1) && a.has(c2));
    }

    addWar(a, b, world) {
        if (this.isAtWar(a, b)) return;

        this.wars.push({ a, b });
        if (world) {
            if (!this.warStartCells[a]) this.warStartCells[a] = world.getCountryCells(a).size;
            if (!this.warStartCells[b]) this.warStartCells[b] = world.getCountryCells(b).size;
            if (!this.warOriginalCells) this.warOriginalCells = {};
            if (!this.warOriginalCells[b]) this.warOriginalCells[b] = Array.from(world.getCountryCells(b));
        }

        this.changeRelation(b, -50);
        this.changeRelation(a, -50);
        var my = this.myCountryId;
        if (my && (a === my || b === my)) {
            var enemy = a === my ? b : a;
            for (var ri = 0; ri < this.alliances.length; ri++) {
                var al = this.alliances[ri];
                if (al.has(enemy)) { for (var m of al) if (m !== enemy) this.changeRelation(m, -10); }
            }
        }

        for (const lord of [a, b]) {
            const vassals = this.getVassals(lord);
            for (const v of vassals) {
                const enemy = lord === a ? b : a;
                if (enemy === lord) continue;
                if (!this.isAtWar(v, enemy)) {
                    this.wars.push({ a: v, b: enemy });
                    if (world) {
                        if (!this.warStartCells[v]) this.warStartCells[v] = world.getCountryCells(v).size;
                        if (!this.warStartCells[enemy]) this.warStartCells[enemy] = world.getCountryCells(enemy).size;
                    }
                }
            }
        }

        if (my && a !== my && b !== my) {
            for (const side of [a, b]) {
                const enemy = side === a ? b : a;
                if (this.areAllies(my, side) && !this.isAtWar(my, enemy)) {
                    var myVassals = this.getVassals(my);
                    if (myVassals.indexOf(enemy) === -1) {
                        var lastDeclined = this._declinedInvites[enemy];
                        if (!lastDeclined || this.days >= lastDeclined) {
                            this.warInvitations.push({ from: side, enemy: enemy, time: Date.now() });
                        }
                    }
                }
            }
        }
    }

    getWarProgress(enemyId, world) {
        var start = this.warStartCells[enemyId];
        if (!start || start === 0) return 0;
        var current = world ? world.getCountryCells(enemyId).size : start;
        var lost = start - current;
        return Math.max(0, Math.min(100, Math.floor((lost / start) * 100)));
    }

    updateWarSnapshots(world) {
        if (!world) return;
        for (var i = 0; i < this.wars.length; i++) {
            var w = this.wars[i];
            if (!this.warStartCells[w.a]) this.warStartCells[w.a] = world.getCountryCells(w.a).size;
            if (!this.warStartCells[w.b]) this.warStartCells[w.b] = world.getCountryCells(w.b).size;
        }
    }

    getCapitulationThreshold(ideology) {
        if (ideology === 'Фазизм' || ideology === 'Фашизм' || ideology === 'Коммунизм') return 95;
        if (ideology === 'Нейтралитет') return 80;
        return 70;
    }

    addAlliance(a, b) {
        if (!this.areAllies(a, b)) {
            this.alliances.push(new Set([a, b]));
            this.changeRelation(a, 30);
            this.changeRelation(b, 30);
            for (var i = 0; i < this.wars.length; i++) {
                var w = this.wars[i];
                if (w.a === a || w.b === a) {
                    var enemy = w.a === a ? w.b : w.a;
                    this.changeRelation(enemy, -10);
                }
            }
        }
    }

    addVassal(overlord, vassal) {
        if (!this.vassals[overlord]) this.vassals[overlord] = [];
        if (!this.vassals[overlord].includes(vassal)) {
            this.vassals[overlord].push(vassal);
            this.changeRelation(overlord, 25);
            this.changeRelation(vassal, -20);
        }
    }

    removeVassal(overlord, vassal) {
        if (this.vassals[overlord]) {
            this.vassals[overlord] = this.vassals[overlord].filter(function(v) { return v !== vassal; });
            if (this.vassals[overlord].length === 0) delete this.vassals[overlord];
        }
    }

    getVassals(countryId) {
        return this.vassals[countryId] || [];
    }

    getOverlord(countryId) {
        for (var overlord in this.vassals) {
            if (this.vassals[overlord].indexOf(countryId) !== -1) return overlord;
        }
        return null;
    }

    isVassal(countryId) {
        return this.getOverlord(countryId) !== null;
    }

    // ── ЕДИНАЯ КАПИТУЛЯЦИЯ ────────────────────────────────────────────────
    /**
     * Обрабатывает капитуляцию страны.
     * @param {string} loserId
     * @param {string} winnerId
     * @param {World} world
     * @param {EntityManager} entities
     * @param {string} mode — 'annex' | 'vassal' | 'release'
     */
    handleCapitulation(loserId, winnerId, world, entities, mode = 'vassal') {
        if (!world || !entities) return;
        if (world.getCountryCells(loserId).size === 0) return;

        if (mode === 'annex') {
            const origCells = this.warOriginalCells ? this.warOriginalCells[loserId] : null;
            const cellsToAnnex = origCells || Array.from(world.getCountryCells(loserId));
            for (const cell of cellsToAnnex) {
                const [x, y] = cell.split(',').map(Number);
                if (world.getCell(x, y) === loserId) {
                    world.setCell(x, y, winnerId);
                }
            }
            for (const uid of entities.getEntitiesByOwner(loserId)) entities.removeEntity(uid);
            delete world.capitals[loserId];
        } else if (mode === 'vassal') {
            const originalCells = this.warOriginalCells ? this.warOriginalCells[loserId] : null;
            if (originalCells) {
                for (const cell of originalCells) {
                    const [x, y] = cell.split(',').map(Number);
                    if (world.getCell(x, y) !== loserId) {
                        world.setCell(x, y, loserId);
                    }
                }
            }
            this.addVassal(winnerId, loserId);
            this.addAlliance(winnerId, loserId);
        }
        // mode === 'release' — ничего не делаем с территорией

        // Убираем войны
        this.wars = this.wars.filter(w => w.a !== loserId && w.b !== loserId);

        // Сбрасываем цели ИИ (если есть)
        // (вызывающий код сам сбросит mem)

        // Если капитулировал игрок
        if (loserId === this.myCountryId) {
            this.setGameSpeed(0);
            this.isGameActive = false;
        }

        this._capitulationPending = false;
    }

    // ── ОТНОШЕНИЯ ──
    initRelations(world) {
        if (this.relationsInit) return;
        this.relationsInit = true;
        var my = this.myCountryId;
        if (!my) return;
        var COUNTRIES_DATA = window._COUNTRIES_MAP || {};
        var myIdeology = COUNTRIES_DATA[my] ? COUNTRIES_DATA[my].ideology : 'Нейтралитет';
        var allCountries = world.getAllCountries();
        for (var i = 0; i < allCountries.length; i++) {
            var c = allCountries[i];
            if (c === my) continue;
            if (this.relations[c] !== undefined) continue;
            var base = 0;
            var cIdeology = COUNTRIES_DATA[c] ? COUNTRIES_DATA[c].ideology : 'Нейтралитет';
            if (myIdeology === cIdeology) base += 25;
            else if ((myIdeology === 'Фашизм' && cIdeology === 'Нейтралитет') || (myIdeology === 'Нейтралитет' && cIdeology === 'Фашизм')) base += 10;
            else if ((myIdeology === 'Демократия' && cIdeology === 'Коммунизм') || (myIdeology === 'Коммунизм' && cIdeology === 'Демократия')) base -= 20;
            else base -= 10;
            var borderLen = world.getBorderWith(my, c).length;
            if (borderLen > 10) base -= 5;
            this.relations[c] = Math.max(-100, Math.min(100, base));
        }
    }

    getRelation(countryId) {
        return this.relations[countryId] || 0;
    }

    changeRelation(countryId, amount) {
        if (this.relations[countryId] === undefined) this.relations[countryId] = 0;
        this.relations[countryId] = Math.max(-100, Math.min(100, this.relations[countryId] + amount));
    }

    serialize() {
        return {
            myCountryId: this.myCountryId,
            isGameActive: this.isGameActive,
            gameSpeed: this.gameSpeed,
            gameDate: this.gameDate.toISOString(),
            days: this.days,
            equipment: this.equipment,
            manpower: this.manpower,
            maxManpower: this.maxManpower,
            factories: this.factories,
            tech: { ...this.tech },
            countryTech: Array.from(this.countryTech.entries()),
            countryResearch: Array.from(this.countryResearch.entries()),
            activeResearch: this.activeResearch,
            wars: [...this.wars],
            alliances: this.alliances.map(a => [...a]),
            vassals: { ...this.vassals },
            warStartCells: { ...this.warStartCells },
            warOriginalCells: this.warOriginalCells || {},
            warInvitations: this.warInvitations || [],
            allianceInvitations: this.allianceInvitations || [],
            relations: this.relations || {},
            relationsInit: this.relationsInit || false,
            activeFocus: this.activeFocus ? { ...this.activeFocus } : null,
            completedFocuses: [...this.completedFocuses],
            selectedUnitId: this.selectedUnitId,
            activeBattles: this.activeBattles.map(b => ({ ...b })),
            trainingQueue: this.trainingQueue.map(q => ({ ...q })),
            constructionQueue: this.constructionQueue.map(q => ({ ...q })),
            autosave: this.autosave,
            ideologyChange: this.ideologyChange,
            justifications: this.justifications,
            _declinedInvites: this._declinedInvites || {},
            _declinedAlliance: this._declinedAlliance || {},
        };
    }

    deserialize(data) {
        this.myCountryId = data.myCountryId;
        this.isGameActive = data.isGameActive;
        this.gameSpeed = data.gameSpeed;
        this.gameDate = new Date(data.gameDate);
        this.days = data.days;
        this.equipment = data.equipment;
        this.manpower = data.manpower;
        this.maxManpower = data.maxManpower || data.manpower;
        this.factories = data.factories;
        this.tech = data.tech || { industry: 1, infantry: 1, tank: 1 };
        this.countryTech = new Map(data.countryTech || []);
        this.countryResearch = new Map(data.countryResearch || []);
        this.activeResearch = data.activeResearch || null;
        this.wars = data.wars || [];
        this.alliances = (data.alliances || []).map(a => new Set(a));
        this.vassals = data.vassals || {};
        this.warStartCells = data.warStartCells || {};
        this.warOriginalCells = data.warOriginalCells || {};
        this.warInvitations = data.warInvitations || [];
        this.allianceInvitations = data.allianceInvitations || [];
        this.relations = data.relations || {};
        this.relationsInit = data.relationsInit || false;
        this.activeFocus = data.activeFocus;
        this.completedFocuses = new Set(data.completedFocuses || []);
        this.selectedUnitId = data.selectedUnitId;
        this.activeBattles = data.activeBattles || [];
        this.trainingQueue = data.trainingQueue || [];
        this.constructionQueue = data.constructionQueue || [];
        this.autosave = data.autosave !== undefined ? data.autosave : true;
        this.ideologyChange = data.ideologyChange || null;
        this.justifications = data.justifications || null;
        this._declinedInvites = data._declinedInvites || {};
        this._declinedAlliance = data._declinedAlliance || {};
        this._capitulationPending = false;
    }
}
