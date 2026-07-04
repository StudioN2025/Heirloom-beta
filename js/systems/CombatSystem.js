// CombatSystem.js — HOI4-механика боя
//
// Ключевые концепции:
//   - СРАЖЕНИЕ (Battle): группа юнитов с обеих сторон атакует/обороняет одну клетку
//   - ФРОНТ: ширина = сколько юнитов участвует с каждой стороны (макс. FRONT_WIDTH)
//   - ОРГАНИЗАЦИЯ: падает при получении урона, при 0 — отступление (как в HOI)
//   - ПРОРЫВ: если org обороняющегося << org атакующего — bonus прорыва
//   - ЗАХВАТ: победитель занимает клетку проигравшего

import { addNotification } from '../utils/helpers.js';

const FRONT_WIDTH = 4; // макс. юнитов с каждой стороны в одном сражении

const UNIT_STATS = {
    0: { // пехота
        softAttack: 30, hardAttack: 5,
        defense: 25, breakthrough: 8,
        hardness: 0,
        maxOrg: 100, orgRecovery: 4,
        maxHp: 100,
    },
    1: { // танки
        softAttack: 80, hardAttack: 60,
        defense: 15, breakthrough: 40,
        hardness: 70,
        maxOrg: 60, orgRecovery: 2,
        maxHp: 50,
    },
};

export class CombatSystem {
    constructor(world, entities, gameState) {
        this.world    = world;
        this.entities = entities;
        this.gs       = gameState;

        // cellKey → Battle  (сражение за конкретную клетку)
        this.battles = new Map();
        // org[unitId]
        this.org = new Float32Array(entities.maxEntities || 50000);
    }

    initUnit(uid) {
        const s = UNIT_STATS[this.entities.type[uid]] || UNIT_STATS[0];
        this.org[uid] = s.maxOrg;
    }

    update() {
        this._formBattles();
        this._resolveBattles();
        this._recoverOrg();
    }

    getOrg(uid) { return Math.round(this.org[uid] || 0); }

    startCombat() { /* бои формируются автоматически */ }

    // ── 1. Формируем сражения ─────────────────────────────────────────────────
    // Логика: если юнит стоит на вражеской клетке (или рядом с ней и в состоянии войны),
    //         создаём Battle за эту клетку.

    _formBattles() {
        const e = this.entities;

        for (let i = 1; i < e.nextId; i++) {
            if (!e.active[i]) continue;
            const ownerI = e.owner[i];

            // Смотрим на соседей
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = e.x[i] + dx, ny = e.y[i] + dy;
                const j = e.getUnitAt(nx, ny);
                if (!j || !e.active[j] || i > j) continue; // i > j чтобы не обрабатывать пару дважды
                const ownerJ = e.owner[j];
                if (ownerI === ownerJ) continue;
                if (!this.gs.isAtWar(ownerI, ownerJ)) continue;

                // Простая логика: меньший ID атакует, больший защищается
                // (или просто первый в паре атакует второго)
                const attacker = i, defender = j;
                const battleCell = `${nx},${ny}`;

                if (this.battles.has(battleCell)) {
                    // Добавляем юнитов в существующее сражение
                    const b = this.battles.get(battleCell);
                    if (e.owner[attacker] === b.attackerCountry && !b.attackers.includes(attacker)
                        && b.attackers.length < FRONT_WIDTH) {
                        b.attackers.push(attacker);
                        e.inCombat[attacker] = 1;
                    }
                    if (e.owner[defender] === b.defenderCountry && !b.defenders.includes(defender)
                        && b.defenders.length < FRONT_WIDTH) {
                        b.defenders.push(defender);
                        e.inCombat[defender] = 1;
                    }
                } else {
                    // Инициализируем org если нулевая
                    if (this.org[attacker] === 0) this.initUnit(attacker);
                    if (this.org[defender] === 0) this.initUnit(defender);

                    e.inCombat[attacker] = 1;
                    e.inCombat[defender] = 1;

                    const b = {
                        attackerCountry: e.owner[attacker],
                        defenderCountry: e.owner[defender],
                        attackers: [attacker],
                        defenders: [defender],
                        cell: battleCell,
                        day: 0,
                        notified: false,
                    };
                    this.battles.set(battleCell, b);

                    const my = this.gs.myCountryId;
                    if (e.owner[attacker] === my || e.owner[defender] === my) {
                        addNotification(`⚔️ Бой: ${b.attackerCountry} атакует ${b.defenderCountry}!`, 'war');
                    }
                }
            }
        }
    }

    // ── 2. Разрешаем сражения ─────────────────────────────────────────────────

    _resolveBattles() {
        const e = this.entities;
        const toDelete = [];

        for (const [cellKey, b] of this.battles) {
            // Чистим мёртвых
            b.attackers = b.attackers.filter(id => e.active[id]);
            b.defenders = b.defenders.filter(id => e.active[id]);

            if (!b.attackers.length || !b.defenders.length) {
                this._endBattle(b);
                toDelete.push(cellKey);
                continue;
            }

            b.day++;
            // Бой идёт каждые 2 дня
            if (b.day % 2 !== 0) continue;

            // Суммарные атаки сторон
            const aAttack = this._totalAttack(b.attackers, b.defenders);
            const dAttack = this._totalAttack(b.defenders, b.attackers);

            // Суммарная org сторон
            const aOrgAvg = this._avgOrg(b.attackers);
            const dOrgAvg = this._avgOrg(b.defenders);

            // Бонус прорыва: если у атакующего высокая org а у защитника низкая
            const breakthroughBonus = aOrgAvg > dOrgAvg * 1.5 ? 1.3 : 1.0;

            // Множитель численного превосходства (максимум x1.5)
            const numAdvA = Math.min(1.5, 1 + (b.attackers.length - b.defenders.length) * 0.15);
            const numAdvD = Math.min(1.5, 1 + (b.defenders.length - b.attackers.length) * 0.15);

            const rng = () => 0.75 + Math.random() * 0.5;

            // Наносим org урон каждому юниту с вражеской стороны
            const aOrgDmg = (aAttack / b.defenders.length) * breakthroughBonus * numAdvA;
            const dOrgDmg = (dAttack / b.attackers.length) * numAdvD;

            for (const uid of b.defenders) {
                this.org[uid] = Math.max(0, this.org[uid] - aOrgDmg * rng());
                const died = e.damage(uid, Math.ceil(aOrgDmg * 0.1 * rng()));
                if (died && e.owner[uid] === this.gs.myCountryId) {
                    addNotification(`💀 Юнит уничтожен!`, 'war');
                }
            }
            for (const uid of b.attackers) {
                this.org[uid] = Math.max(0, this.org[uid] - dOrgDmg * rng());
                const died = e.damage(uid, Math.ceil(dOrgDmg * 0.08 * rng()));
                if (died && e.owner[uid] === this.gs.myCountryId) {
                    addNotification(`💀 Юнит уничтожен!`, 'war');
                }
            }

            // Перечищаем мёртвых после урона
            b.attackers = b.attackers.filter(id => e.active[id]);
            b.defenders = b.defenders.filter(id => e.active[id]);

            if (!b.attackers.length || !b.defenders.length) {
                this._endBattle(b);
                toDelete.push(cellKey);
                continue;
            }

            // Проверяем org
            const newAOrgAvg = this._avgOrg(b.attackers);
            const newDOrgAvg = this._avgOrg(b.defenders);

            if (newDOrgAvg <= 0 && newAOrgAvg > 0) {
                // Защитники разбиты — атакующие занимают клетку
                this._defenderRouted(b, cellKey);
                toDelete.push(cellKey);
            } else if (newAOrgAvg <= 0 && newDOrgAvg > 0) {
                // Атакующие разбиты — отступают
                this._attackerRouted(b);
                toDelete.push(cellKey);
            } else if (newAOrgAvg <= 0 && newDOrgAvg <= 0) {
                // Оба разбиты — все отступают
                for (const uid of [...b.attackers, ...b.defenders]) this._retreatUnit(uid);
                this._endBattle(b);
                toDelete.push(cellKey);
            }
        }

        for (const k of toDelete) this.battles.delete(k);
    }

    // ── 3. Восстановление org ─────────────────────────────────────────────────

    _recoverOrg() {
        const e = this.entities;
        for (let i = 1; i < e.nextId; i++) {
            if (!e.active[i] || e.inCombat[i]) continue;
            const s = UNIT_STATS[e.type[i]] || UNIT_STATS[0];
            if (this.org[i] < s.maxOrg) {
                this.org[i] = Math.min(s.maxOrg, (this.org[i] || s.maxOrg) + s.orgRecovery);
            } else if (this.org[i] === 0) {
                this.org[i] = s.maxOrg; // инициализация нового юнита
            }
        }
    }

    // ── Вспомогательные ──────────────────────────────────────────────────────

    _totalAttack(attackers, defenders) {
        const e = this.entities;
        let total = 0;
        for (const uid of attackers) {
            if (!e.active[uid]) continue;
            const aStats = UNIT_STATS[e.type[uid]] || UNIT_STATS[0];
            // Смотрим на hardness защитников
            const avgHardness = defenders.reduce((s, d) => {
                const ds = UNIT_STATS[e.type[d]] || UNIT_STATS[0];
                return s + ds.hardness;
            }, 0) / (defenders.length || 1);
            const eff = aStats.hardAttack * (avgHardness / 100) + aStats.softAttack * (1 - avgHardness / 100);
            // Множитель от текущей org
            const orgMult = Math.max(0.3, (this.org[uid] || 1) / (UNIT_STATS[e.type[uid]].maxOrg));
            total += eff * orgMult;
        }
        return total;
    }

    _avgOrg(units) {
        if (!units.length) return 0;
        return units.reduce((s, uid) => s + (this.org[uid] || 0), 0) / units.length;
    }

    _defenderRouted(b, cellKey) {
        const e = this.entities;
        const [cx, cy] = cellKey.split(',').map(Number);

        // Отступаем защитников
        for (const uid of b.defenders) this._retreatUnit(uid);

        // Захватываем клетку
        this.world.setCell(cx, cy, b.attackerCountry);

        // Двигаем первого (лучший org) атакующего на захваченную клетку
        const leader = b.attackers.reduce((best, uid) =>
            (this.org[uid] || 0) > (this.org[best] || 0) ? uid : best, b.attackers[0]);
        if (e.active[leader] && !e.getUnitAt(cx, cy)) {
            e.moveTo(leader, cx, cy);
        }

        this._endBattle(b);

        const my = this.gs.myCountryId;
        if (b.attackerCountry === my || b.defenderCountry === my) {
            addNotification(`🏳️ ${b.defenderCountry} отступает! ${b.attackerCountry} занимает клетку.`, 'war');
        }

        // Проверка капитуляции
        this._checkCapitulation(b.defenderCountry, b.attackerCountry);
    }

    _attackerRouted(b) {
        for (const uid of b.attackers) this._retreatUnit(uid);
        this._endBattle(b);

        const my = this.gs.myCountryId;
        if (b.attackerCountry === my || b.defenderCountry === my) {
            addNotification(`🏳️ ${b.attackerCountry} отступает!`, 'war');
        }
    }

    _retreatUnit(uid) {
        const e = this.entities;
        if (!e.active[uid]) return;
        e.inCombat[uid] = 0;
        const s = UNIT_STATS[e.type[uid]] || UNIT_STATS[0];
        this.org[uid] = s.maxOrg * 0.15; // после отступления org 15%

        const ownerId = e.owner[uid];
        const ux = e.x[uid], uy = e.y[uid];

        // BFS — ближайшая своя свободная клетка
        const queue = [[ux, uy, 0]];
        const visited = new Set([`${ux},${uy}`]);
        let retreated = false;

        while (queue.length) {
            const [x, y, d] = queue.shift();
            if (d > 0 && this.world.getCell(x, y) === ownerId && !e.getUnitAt(x, y)) {
                e.moveTo(uid, x, y);
                retreated = true;
                break;
            }
            if (d >= 4) continue;
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const k = `${x+dx},${y+dy}`;
                if (!visited.has(k)) {
                    visited.add(k);
                    queue.push([x+dx, y+dy, d+1]);
                }
            }
        }

        if (!retreated) {
            // Окружён — гибнет
            e.removeEntity(uid);
            addNotification(`💀 Юнит ${ownerId} окружён и уничтожен!`, 'war');
        }
    }

    _endBattle(b) {
        const e = this.entities;
        for (const uid of [...b.attackers, ...b.defenders]) {
            if (e.active[uid]) e.inCombat[uid] = 0;
        }
    }

    _checkCapitulation(loserCountry, winnerCountry) {
        const cells = this.world.getCountryCells(loserCountry);
        if (cells.size > 5) return;

        for (const c of [...cells]) {
            const [x, y] = c.split(',').map(Number);
            this.world.setCell(x, y, winnerCountry);
        }
        for (const uid of this.entities.getEntitiesByOwner(loserCountry)) {
            this.entities.removeEntity(uid);
        }
        this.gs.wars = this.gs.wars.filter(w => w.a !== loserCountry && w.b !== loserCountry);
        this.gs.alliances = (this.gs.alliances || [])
            .map(a => { const s = new Set(a); s.delete(loserCountry); return s; })
            .filter(a => a.size > 1);

        addNotification(`💀 ${loserCountry} капитулировал перед ${winnerCountry}!`, 'war');

        if (loserCountry === this.gs.myCountryId) {
            addNotification('💀 Ваша страна капитулировала! Игра окончена.', 'war');
            this.gs.setGameSpeed(0);
            this.gs.isGameActive = false;
        }
    }
}
