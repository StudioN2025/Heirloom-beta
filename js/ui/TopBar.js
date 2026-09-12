// TopBar.js — Обновление верхней панели

import { t } from '../i18n.js';
import { getCountryInfo } from '../utils/helpers.js';

export class TopBar {
    constructor(gameState) {
        this.gameState = gameState;
    }

    update() {
        const myId = this.gameState.myCountryId;
        if (!myId) return;

        const countryNameElem = document.getElementById('country-name');
        const manpowerElem = document.getElementById('val-manpower');
        const factoriesElem = document.getElementById('val-factories');
        const equipmentElem = document.getElementById('val-equipment');
        const dateElem = document.getElementById('game-date');

        if (countryNameElem) {
            const info = getCountryInfo(myId);
            const flagKey = info.flag || myId;
            countryNameElem.innerHTML = '<span class="flex items-center gap-2"><img src="assets/flags/' + flagKey + '.png" style="width:28px;height:18px;border-radius:2px;" onerror="this.style.display=\'none\'">' + (info.name || myId.toUpperCase()) + '</span>';
        }
        if (manpowerElem) {
            const cur = Math.floor(this.gameState.manpower);
            const max = this.gameState.maxManpower || cur;
            manpowerElem.innerText = `${cur.toLocaleString()} / ${max.toLocaleString()}`;
        }
        if (factoriesElem) factoriesElem.innerText = this.gameState.factories;
        if (equipmentElem) equipmentElem.innerText = Math.floor(this.gameState.equipment).toLocaleString();
        if (dateElem) dateElem.innerText = this.gameState.getDateString();

        // Индикаторы — берём из актуальных полей GameState
        const researchInd = document.getElementById('research-indicator');
        const focusInd = document.getElementById('focus-indicator');

        if (researchInd) researchInd.classList.toggle('hidden', !this.gameState.activeResearch);
        if (focusInd) focusInd.classList.toggle('hidden', !this.gameState.activeFocus);
    }
}
