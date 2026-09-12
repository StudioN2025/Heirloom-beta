// helpers.js — Вспомогательные функции

import { COUNTRIES, getIdeologyData } from '../data/Countries.js';
import { getCurrentLanguage, t } from '../i18n.js';

// Маппинг идеологий для отображения
const IDEOLOGY_DISPLAY = {
    'ru': { 'Фашизм': 'Фашизм', 'Демократия': 'Демократия', 'Коммунизм': 'Коммунизм', 'Нейтралитет': 'Нейтралитет' },
    'en': { 'Фашизм': 'Fascism', 'Демократия': 'Democracy', 'Коммунизм': 'Communism', 'Нейтралитет': 'Neutrality' }
};

export function translateIdeology(ideology) {
    var lang = getCurrentLanguage();
    var map = IDEOLOGY_DISPLAY[lang] || IDEOLOGY_DISPLAY['ru'];
    return map[ideology] || ideology;
}

export function getCountryInfo(id) {
    const c = COUNTRIES[id];
    if (!c) return { name: id.toUpperCase(), color: generateColor(id), leader: "Неизвестно", ideology: "Нейтралитет" };
    var lang = getCurrentLanguage();
    const ideData = getIdeologyData(id, c.ideology);
    return {
        name: lang === 'en' ? (ideData.nameEn || c.nameEn || c.name) : (ideData.name || c.name),
        color: ideData.color || c.color,
        leader: lang === 'en' ? (ideData.leaderEn || c.leader || "Неизвестно") : (ideData.leader || c.leader || "Неизвестно"),
        ideology: translateIdeology(c.ideology),
        flag: ideData.flag || id,
    };
}

export function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        value = Math.floor(value * 0.7 + 50);
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

export function addNotification(text, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;

    // Не дублируем одинаковые сообщения подряд
    const last = container.lastElementChild;
    if (last && last.dataset.text === text) {
        // Мигаем существующим
        last.style.transform = 'scale(1.03)';
        setTimeout(() => { last.style.transform = ''; }, 150);
        return;
    }

    const notif = document.createElement('div');
    notif.className = type === 'war' ? 'notif-war' : 'notif-info';
    notif.dataset.text = text;
    const icon = type === 'war' ? '⚔️' : '📢';
    notif.innerHTML = `<span class="notif-icon">${icon}</span><span class="notif-text">${text}</span>`;

    // Новые добавляем в конец (они внизу при column-reverse)
    container.appendChild(notif);

    // Лимит — не больше 6 уведомлений одновременно
    while (container.children.length > 6) {
        container.firstElementChild.remove();
    }

    // Автоудаление
    const lifetime = type === 'war' ? 7000 : 4500;
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(-110%)';
        notif.style.transition = 'opacity 0.4s, transform 0.4s';
        setTimeout(() => notif.remove(), 400);
    }, lifetime);
}

export function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}
