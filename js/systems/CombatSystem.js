// CombatSystem.js — Юниты сражаются до конца, организация падает в бою

import { addNotification } from '../utils/helpers.js';

const FRONT_WIDTH = 4;

const UNIT_STATS = {
    0: {
        softAttack: 30, hardAttack: 5,
        defense: 25, breakthrough: 8,
        hardness: 0,
        maxOrg: 100, orgRecovery: 3,
        maxHp: 100, hpPerDay: 1,
    },
    1: {
        softAttack: 80, hardAttack: 60,
        defense: 15, breakthrough: 40,
        hardness: 70,
        maxOrg: 80, orgRecovery: 2,
        maxHp: 100, hpPerDay: 1,
    },
};

export class CombatSystem {
    constructor(world, entities, gameState) {
        this.world = world;
        this.entities = entities;
        this.gs = gameState;
        this.tech = null;
        this.battles = new Map();
        this.org = new Float32Array(entities.maxEntities || 50000);
        this._initialized = new Uint8Array(entities.maxEntities || 50000);
    }

    initUnit(uid) {
        const s = UNIT_STATS[this.entities.type[uid]] || UNIT_STATS[0];
        this.org[uid] = s.maxOrg;
        this._initialized[uid] = 1;
    }

    getOrg(uid) { return Math.round(this.org[uid] || 0); }

    update() {
        this._formBattles();
        this._resolveBattles();
        this._recoverOrg();
    }

    _formBattles() {
        const e = this.entities;

        for (let i = 1; i < e.nextId; i++) {
            if (!e.active[i]) continue;
            const ownerI = e.owner[i];
            const iIsShip = e.isShip ? e.isShip[i] : 0;

            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[0,0]]) {
                const nx = e.x[i] + dx, ny = e.y[i] + dy;
                const j = e.getUnitAt(nx, ny);
                if (!j || !e.active[j] || i === j) continue;
                if (ownerI === e.owner[j]) continue;
                if (!this.gs.isAtWar(ownerI, e.owner[j])) continue;

                const jIsShip = e.isShip ? e.isShip[j] : 0;

                if (!iIsShip && jIsShip) continue;

                const attacker = i;
                const defender = j;

                const battleCell = `${e.x[defender]},${e.y[defender]}`;

                if (this.battles.has(battleCell)) {
                    const b = this.battles.get(battleCell);
                    if (e.owner[attacker] === b.attackerCountry && !b.attackers.includes(attacker) && b.attackers.length < FRONT_WIDTH) {
                        b.attackers.push(attacker);
                        e.inCombat[attacker] = 1;
                    }
                    if (e.owner[defender] === b.defenderCountry && !b.defenders.includes(defender) && b.defenders.length < FRONT_WIDTH) {
                        b.defenders.push(defender);
                        e.inCombat[defender] = 1;
                    }
                } else {
                    // Гарантируем инициализацию org
                    if (!this._initialized[attacker]) this.initUnit(attacker);
                    if (!this._initialized[defender]) this.initUnit(defender);

                    e.inCombat[attacker] = 1;
                    e.inCombat[defender] = 1;

                    this.battles.set(battleCell, {
                        attackerCountry: e.owner[attacker],
                        defenderCountry: e.owner[defender],
                        attackers: [attacker],
                        defenders: [defender],
                        cell: battleCell,
                        day: 0,
                    });

                    const my = this.gs.myCountryId;
                    if (e.owner[attacker] === my || e.owner[defender] === my) {
                        const t = e.isShip && e.isShip[attacker] ? '🚢' : '⚔️';
                        addNotification(`${t} Бой: ${e.owner[attacker]} атакует ${e.owner[defender]}!`, 'war');
                    }

                    if (this.world.capitals) {
                        for (const [cid, cap] of Object.entries(this.world.capitals)) {
                            if (cap.x === e.x[defender] && cap.y === e.y[defender]) {
                                addNotification(`🔥 Бой за столицу ${cap.name}!`, 'war');
                                break;
                            }
                        }
                    }
                }
            }
        }
        this._sendReinforcements();
    }

    _sendReinforcements() {
        const e = this.entities;
        for (const [, b] of this.battles) {
            if (b.attackers.length >= FRONT_WIDTH && b.defenders.length >= FRONT_WIDTH) continue;
            const [cx, cy] = b.cell.split(',').map(Number);
            const nearby = e.getEntitiesInRadius(cx, cy, 2);
            for (const uid of nearby) {
                if (!e.active[uid] || e.inCombat[uid]) continue;
                if (b.attackers.length < FRONT_WIDTH && e.owner[uid] === b.attackerCountry && !b.attackers.includes(uid)) {
                    if (!this._initialized[uid]) this.initUnit(uid);
                    b.attackers.push(uid);
                    e.inCombat[uid] = 1;
                } else if (b.defenders.length < FRONT_WIDTH && e.owner[uid] === b.defenderCountry && !b.defenders.includes(uid)) {
                    if (!this._initialized[uid]) this.initUnit(uid);
                    b.defenders.push(uid);
                    e.inCombat[uid] = 1;
                }
            }
        }
    }

    _resolveBattles() {
        const e = this.entities;
        const toDelete = [];

        for (const [cellKey, b] of this.battles) {
            b.attackers = b.attackers.filter(id => e.active[id]);
            b.defenders = b.defenders.filter(id => e.active[id]);
            if (!b.attackers.length || !b.defenders.length) { this._endBattle(b); toDelete.push(cellKey); continue; }

            b.day++;
            const [bx, by] = cellKey.split(',').map(Number);
            const terrainBonus = this.world.getTerrainBonus ? this.world.getTerrainBonus(bx, by) : 1.0;

            const aOrgAvg = this._avgOrg(b.attackers);
            const dOrgAvg = this._avgOrg(b.defenders);

            const breakthroughBonus = aOrgAvg > dOrgAvg * 1.3 ? 1.25 : 1.0;

            const numAdvA = Math.min(1.5, 1 + (b.attackers.length - b.defenders.length) * 0.15);
            const numAdvD = Math.min(1.5, 1 + (b.defenders.length - b.attackers.length) * 0.15);

            const rng = () => 0.8 + Math.random() * 0.4;
            const aPenalty = this._getCapitulationPenalty(b.attackerCountry);
            const dPenalty = this._getCapitulationPenalty(b.defenderCountry);

            let capitalBonus = 1.0;
            if (this.world.capitals) {
                const [bx2, by2] = b.cell.split(',').map(Number);
                for (const [cid, cap] of Object.entries(this.world.capitals)) {
                    if (cap.x === bx2 && cap.y === by2 && cid === b.defenderCountry) {
                        capitalBonus = 1.4;
                        break;
                    }
                    if (cap.x === bx2 && cap.y === by2 && cid === b.attackerCountry) {
                        capitalBonus = 0.85;
                        break;
                    }
                }
            }

            const aRawAttack = this._totalAttack(b.attackers, b.defenders, b.cell);
            const avgDefDefense = this._avgStat(b.defenders, 'defense');
            let defTechMult = 1.0;
            if (this.tech) defTechMult += this.tech.getEffect(b.defenderCountry, 'infantryDefense');

            for (const uid of b.defenders) {
                const reduction = avgDefDefense * terrainBonus * 0.12 * defTechMult * capitalBonus;
                const baseDmg = (aRawAttack / b.defenders.length) * breakthroughBonus * numAdvA * aPenalty;
                const netDmg = Math.max(1, baseDmg - reduction) * rng();
                this.org[uid] = Math.max(0, this.org[uid] - netDmg);
                const hpDmg = Math.max(1, Math.ceil(netDmg * 0.15 * rng()));
                e.damage(uid, hpDmg);
            }

            const dRawAttack = this._totalAttack(b.defenders, b.attackers, b.cell) * capitalBonus;
            const avgAtkBreakthrough = this._avgStat(b.attackers, 'breakthrough');
            let atkTechMult = 1.0;
            if (this.tech) atkTechMult += this.tech.getEffect(b.attackerCountry, 'infantryAttack');

            for (const uid of b.attackers) {
                const reduction = avgAtkBreakthrough * 0.1 * atkTechMult;
                const baseDmg = (dRawAttack / b.attackers.length) * numAdvD * dPenalty;
                const netDmg = Math.max(1, baseDmg - reduction) * rng();
                this.org[uid] = Math.max(0, this.org[uid] - netDmg);
                const hpDmg = Math.max(1, Math.ceil(netDmg * 0.12 * rng()));
                e.damage(uid, hpDmg);
            }

            b.attackers = b.attackers.filter(id => e.active[id]);
            b.defenders = b.defenders.filter(id => e.active[id]);

            if (!b.attackers.length || !b.defenders.length) {
                this._endBattle(b);
                toDelete.push(cellKey);
                continue;
            }

            const newAOrg = this._avgOrg(b.attackers);
            const newDOrg = this._avgOrg(b.defenders);

            if (newDOrg <= 0 && newAOrg > 0) {
                this._defenderRouted(b, cellKey);
                toDelete.push(cellKey);
            } else if (newAOrg <= 0 && newDOrg > 0) {
                this._attackerRouted(b);
                toDelete.push(cellKey);
            } else if (newAOrg <= 0 && newDOrg <= 0) {
                for (const uid of [...b.attackers, ...b.defenders]) {
                    if (e.active[uid]) e.removeEntity(uid);
                }
                this._endBattle(b);
                toDelete.push(cellKey);
            }
        }
        for (const k of toDelete) this.battles.delete(k);
    }

    _recoverOrg() {
        const e = this.entities;
        for (let i = 1; i < e.nextId; i++) {
            if (!e.active[i] || e.inCombat[i]) continue;
            const s = UNIT_STATS[e.type[i]] || UNIT_STATS[0];
            if (!this._initialized[i]) this.initUnit(i);
            if (this.org[i] < s.maxOrg) {
                this.org[i] = Math.min(s.maxOrg, (this.org[i] || s.maxOrg) + s.orgRecovery);
            }
            if (e.hp[i] < s.maxHp) {
                e.hp[i] = Math.min(s.maxHp, e.hp[i] + (s.hpPerDay || 1));
            }
        }
    }

    _totalAttack(attackers, defenders, battleCell) {
        const e = this.entities;
        const avgHardness = defenders.reduce((s, d) => {
            const ds = UNIT_STATS[e.type[d]] || UNIT_STATS[0];
            return s + ds.hardness;
        }, 0) / (defenders.length || 1);

        let total = 0;
        for (const uid of attackers) {
            if (!e.active[uid]) continue;
            const aStats = UNIT_STATS[e.type[uid]] || UNIT_STATS[0];
            let techMult = 1.0;
            if (this.tech) {
                if (e.type[uid] === 0) techMult += this.tech.getEffect(e.owner[uid], 'infantryAttack');
                else techMult += this.tech.getEffect(e.owner[uid], 'tankAttack');
            }
            const hardnessRatio = avgHardness / 100;
            const effective = (aStats.softAttack * (1 - hardnessRatio * 0.85) + aStats.hardAttack * hardnessRatio) * techMult;
            const orgMult = Math.max(0.3, (this.org[uid] || 1) / aStats.maxOrg);
            total += effective * orgMult;
        }
        return total;
    }

    _avgOrg(units) {
        if (!units.length) return 0;
        return units.reduce((s, uid) => s + (this.org[uid] || 0), 0) / units.length;
    }

    _avgStat(units, stat) {
        if (!units.length) return 0;
        const e = this.entities;
        return units.reduce((s, uid) => s + ((UNIT_STATS[e.type[uid]] || {})[stat] || 0), 0) / units.length;
    }

    _getCapitulationPenalty(countryId) {
        if (!countryId) return 1.0;
        const size = this.world.getCountryCells(countryId).size;
        if (size <= 10) return 0.3;
        if (size <= 20) return 0.6;
        if (size <= 35) return 0.8;
        return 1.0;
    }

    _defenderRouted(b, cellKey) {
        const e = this.entities;
        const [cx, cy] = cellKey.split(',').map(Number);
        for (const uid of b.defenders) { if (e.active[uid]) e.removeEntity(uid); }
        this.world.setCell(cx, cy, b.attackerCountry);
        const leader = b.attackers.reduce((best, uid) =>
            (this.org[uid] || 0) > (this.org[best] || 0) ? uid : best, b.attackers[0]);
        if (e.active[leader] && !e.getUnitAt(cx, cy)) e.moveTo(leader, cx, cy);
        this._endBattle(b);
        if (b.attackerCountry === this.gs.myCountryId || b.defenderCountry === this.gs.myCountryId)
            addNotification(`💀 ${b.defenderCountry} уничтожен! ${b.attackerCountry} захватывает.`, 'war');
    }

    _attackerRouted(b) {
        const e = this.entities;
        for (const uid of b.attackers) { if (e.active[uid]) e.removeEntity(uid); }
        this._endBattle(b);
        if (b.attackerCountry === this.gs.myCountryId || b.defenderCountry === this.gs.myCountryId)
            addNotification(`💀 Атака ${b.attackerCountry} провалилась!`, 'war');
    }

    _endBattle(b) {
        const e = this.entities;
        for (const uid of [...b.attackers, ...b.defenders]) {
            if (e.active[uid]) e.inCombat[uid] = 0;
        }
    }
}
