// Notifications.js — Система уведомлений

export class Notifications {
    constructor() {
        this.container = document.getElementById('notifications');
        this.queue = [];
    }
    
    add(text, type = 'info') {
        if (!this.container) return;
        
        const notif = document.createElement('div');
        notif.className = type === 'war' ? 'notif-war' : 'notif-info';
        notif.innerHTML = `<strong>${type === 'war' ? '⚔️ ВНИМАНИЕ' : '📢 СООБЩЕНИЕ'}</strong><br><span style="font-size:11px">${text}</span>`;
        
        this.container.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s';
            setTimeout(() => notif.remove(), 300);
        }, 5000);
    }
}
