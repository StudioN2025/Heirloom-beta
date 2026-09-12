// EconomySystem.js — Ресурсы: производство, расходы, людские

export class EconomySystem {
    constructor(world, entities, gameState) {
        this.world      = world;
        this.entities   = entities;
        this.gameState  = gameState;
        this.MANPOWER_PER_CELL = 1000;
        this.MANPOWER_REGEN = 10; // восстановление в день
    }

    update() {
        const myId = this.gameState.myCountryId;
        if (!myId) return;

        const cells = this.world.getCountryCells(myId);

        // Заводы
        let totalFactories = 0;
        for (const cell of cells) {
            const [x, y] = cell.split(',').map(Number);
            if (this.world.hasBuilding(x, y, 'factory')) totalFactories++;
        }
        this.gameState.factories = totalFactories;

        // Производство снаряжения
        const techBonus = 1 + (this.gameState.tech?.industry || 1 - 1) * 0.05;
        const production = totalFactories * 1.5 * techBonus;

        // Обслуживание готовых юнитов
        let maintenance = 0;
        for (const uid of this.entities.getEntitiesByOwner(myId)) {
            if (this.entities.training && this.entities.training[uid] === 0) {
                maintenance += this.entities.type[uid] === 0 ? 0.2 : 1.5;
            }
        }

        this.gameState.equipment = Math.max(0, this.gameState.equipment + production - maintenance);

        // Людские ресурсы: базовое восстановление 10/день + бонус от клеток
        const cellManpower = cells.size * this.MANPOWER_PER_CELL;
        this.gameState.maxManpower = cellManpower;
        this.gameState.manpower = Math.min(
            cellManpower,
            this.gameState.manpower + this.MANPOWER_REGEN
        );
    }
}
