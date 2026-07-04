// Countries.js — Данные всех стран

export const COUNTRIES = {
    germany: { name: "Германия", color: "#3a3a3a", leader: "Адольф Гитлер", ideology: "Фашизм" },
    ussr: { name: "СССР", color: "#990000", leader: "Иосиф Сталин", ideology: "Коммунизм" },
    poland: { name: "Польша", color: "#ffc0cb", leader: "Игнаций Мосцицкий", ideology: "Нейтралитет" },
    france: { name: "Франция", color: "#3b82f6", leader: "Альбер Лебрен", ideology: "Демократия" },
    uk: { name: "Великобритания", color: "#ef4444", leader: "Невилл Чемберлен", ideology: "Демократия" },
    italy: { name: "Италия", color: "#166534", leader: "Бенито Муссолини", ideology: "Фашизм" },
    spain: { name: "Испания", color: "#fbbf24", leader: "Франсиско Франко", ideology: "Фашизм" },
    portugal: { name: "Португалия", color: "#105d10", leader: "Антониу Салазар", ideology: "Нейтралитет" },
    netherlands: { name: "Нидерланды", color: "#f97316", leader: "Вильгельмина", ideology: "Демократия" },
    belgium: { name: "Бельгия", color: "#eab308", leader: "Леопольд III", ideology: "Демократия" },
    luxembourg: { name: "Люксембург", color: "#67e8f9", leader: "Шарлотта", ideology: "Демократия" },
    switzerland: { name: "Швейцария", color: "#dc2626", leader: "Джузеппе Мотта", ideology: "Демократия" },
    romania: { name: "Румыния", color: "#eab308", leader: "Кароль II", ideology: "Нейтралитет" },
    hungary: { name: "Венгрия", color: "#166534", leader: "Миклош Хорти", ideology: "Нейтралитет" },
    bulgaria: { name: "Болгария", color: "#105d10", leader: "Борис III", ideology: "Нейтралитет" },
    finland: { name: "Финляндия", color: "#ffffff", leader: "Кюёсти Каллио", ideology: "Нейтралитет" },
    czechoslovakia: { name: "Чехословакия", color: "#3b82f6", leader: "Эдвард Бенеш", ideology: "Демократия" },
    austria: { name: "Австрия", color: "#ef4444", leader: "Курт Шушниг", ideology: "Нейтралитет" },
    denmark: { name: "Дания", color: "#ef4444", leader: "Кристиан X", ideology: "Демократия" },
    greece: { name: "Греция", color: "#60a5fa", leader: "Иоаннис Метаксас", ideology: "Нейтралитет" },
    yugoslavia: { name: "Югославия", color: "#1e3a8a", leader: "Пётр II", ideology: "Нейтралитет" },
    lithuania: { name: "Литва", color: "#065f46", leader: "Антанас Сметона", ideology: "Нейтралитет" },
    latvia: { name: "Латвия", color: "#8b0000", leader: "Карлис Улманис", ideology: "Нейтралитет" },
    estonia: { name: "Эстония", color: "#4682b4", leader: "Константин Пятс", ideology: "Нейтралитет" },
    slovakia: { name: "Словакия", color: "#60a5fa", leader: "Йозеф Тисо", ideology: "Фашизм" },
    turkey: { name: "Турция", color: "#c8102e", leader: "Мустафа Кемаль Ататюрк", ideology: "Нейтралитет" }
};

export function getCountryInfo(id) {
    return COUNTRIES[id] || { name: id.toUpperCase(), color: "#666666", leader: "Неизвестно", ideology: "Нейтралитет" };
}
