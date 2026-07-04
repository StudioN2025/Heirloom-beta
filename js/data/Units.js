// Units.js — Характеристики юнитов и дерево технологий

export const UNIT_STATS = {
    infantry: { 
        name: "Пехота", icon: "💂", 
        costEquipment: 100, costManpower: 1000,
        attack: 10, defense: 25, hp: 100, armor: 0,
        maintenance: 0.2
    },
    tank: { 
        name: "Танки", icon: "🚜", 
        costEquipment: 800, costManpower: 500,
        attack: 45, defense: 15, hp: 50, armor: 30,
        maintenance: 1.5
    }
};

export const BUILDING_STATS = {
    factory: { name: "Военный завод", icon: "🏭", costEquipment: 500, buildTime: 135 },
    port: { name: "Морской порт", icon: "⚓", costEquipment: 300, buildTime: 90 }
};

export const TECH_TREE = {
    industry: { 
        name: "Промышленность", 
        maxLevel: 5, 
        bonus: 0.05,
        description: "+5% производство за уровень",
        icon: "🏭"
    },
    infantry: { 
        name: "Пехота", 
        maxLevel: 5, 
        bonus: 0.05,
        description: "+5% атака/защита пехоты за уровень",
        icon: "💂"
    },
    tank: { 
        name: "Танки", 
        maxLevel: 5, 
        bonus: 0.05,
        description: "+5% атака/защита танков за уровень",
        icon: "🚜"
    }
};

// НАЦИОНАЛЬНЫЕ ФОКУСЫ (полное дерево)
export const NATIONAL_FOCUSES = {
    germany: [
        { id: 'ger_rearm', name: 'Перевооружение', desc: '+1000 снаряжения', icon: '🔫', prereqs: [] },
        { id: 'ger_danzig', name: 'Данциг или война', desc: 'Война с Польшей', icon: '⚔️', prereqs: ['ger_rearm'] },
        { id: 'ger_axis', name: 'Создать Ось', desc: 'Альянс с Италией, Венгрией, Румынией', icon: '🤝', prereqs: ['ger_rearm'] },
        { id: 'ger_west', name: 'Западный поход', desc: 'Война с Францией, Бельгией, Нидерландами', icon: '🗺️', prereqs: ['ger_rearm'] },
        { id: 'ger_break_pact', name: 'Разорвать пакт', desc: 'Война с СССР, +4 танковые дивизии', icon: '💥', prereqs: ['ger_danzig', 'ger_axis'] }
    ],
    ussr: [
        { id: 'ussr_five_year', name: 'Пятилетний план', desc: '+5 заводов', icon: '🏭', prereqs: [] },
        { id: 'ussr_industry', name: 'Индустриализация', desc: '+10 заводов, +3000 снаряжения', icon: '⚙️', prereqs: [] },
        { id: 'ussr_fin_war', name: 'Зимняя война', desc: 'Война с Финляндией', icon: '❄️', prereqs: ['ussr_five_year'] },
        { id: 'ussr_baltic', name: 'Прибалтийский вопрос', desc: 'Аннексия Прибалтики', icon: '🤝', prereqs: ['ussr_five_year', 'ussr_industry'] },
        { id: 'ussr_defense', name: 'Великая Отечественная', desc: '+6 пехотных дивизий, +2000 снаряжения', icon: '🛡️', prereqs: ['ussr_fin_war', 'ussr_baltic'] }
    ],
    france: [
        { id: 'fra_maginot', name: 'Линия Мажино', desc: '+3 завода', icon: '🏰', prereqs: [] },
        { id: 'fra_colonies', name: 'Колониальная мобилизация', desc: '+5 пехотных дивизий', icon: '🌍', prereqs: [] },
        { id: 'fra_allies', name: 'Антанта', desc: 'Альянс с Великобританией и Польшей', icon: '🤝', prereqs: ['fra_maginot', 'fra_colonies'] },
        { id: 'fra_revanche', name: 'Реванш', desc: 'Война с Германией', icon: '⚔️', prereqs: ['fra_maginot', 'fra_colonies'] }
    ],
    uk: [
        { id: 'uk_navy', name: 'Владычица морей', desc: '+3 порта, +1000 снаряжения', icon: '⚓', prereqs: [] },
        { id: 'uk_empire', name: 'Имперская конференция', desc: '+5 заводов, +2000 снаряжения', icon: '👑', prereqs: [] },
        { id: 'uk_guarantee', name: 'Гарантии Польше', desc: 'Альянс с Польшей', icon: '📜', prereqs: ['uk_navy', 'uk_empire'] },
        { id: 'uk_raf', name: 'Королевские ВВС', desc: '+4 пехотные дивизии', icon: '✈️', prereqs: ['uk_navy', 'uk_empire'] }
    ],
    italy: [
        { id: 'ita_navy', name: 'Развитие флота', desc: '+2 порта', icon: '⚓', prereqs: [] },
        { id: 'ita_empire', name: 'Итальянская империя', desc: '+1000 снаряжения, +2 танковые дивизии', icon: '👑', prereqs: [] },
        { id: 'ita_revive', name: 'Возродить Рим', desc: 'Война с Югославией и Грецией', icon: '🏛️', prereqs: ['ita_navy', 'ita_empire'] },
        { id: 'ita_allies', name: 'Средиземноморский союз', desc: 'Альянс с Испанией и Португалией', icon: '🤝', prereqs: ['ita_navy', 'ita_empire'] }
    ],
    poland: [
        { id: 'pol_army', name: 'Модернизация армии', desc: '+3 пехотные дивизии', icon: '💂', prereqs: [] },
        { id: 'pol_industry', name: 'Центральный промышленный округ', desc: '+3 завода', icon: '🏭', prereqs: [] },
        { id: 'pol_allies', name: 'Союзники', desc: 'Альянс с Францией и Англией', icon: '🤝', prereqs: ['pol_army', 'pol_industry'] },
        { id: 'pol_defense', name: 'План обороны', desc: '+2 танковые дивизии', icon: '🛡️', prereqs: ['pol_army', 'pol_industry'] }
    ]
};
