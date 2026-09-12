// Countries.js — Данные всех 45 стран с идеологиями

export const COUNTRIES = {
    // === ЕВРОПА ===
    germany: {
        name: "Third Reich",
        nameEn: "Third Reich",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":     { name: "Third Reich",           nameEn: "Third Reich",           leader: "Адольф Гитлер",           leaderEn: "Adolf Hitler",            color: "#3a3a3a", flag: "germany_fascist" },
            "Демократия":  { name: "Germany",              nameEn: "Germany",              leader: "Конрад Аденауэр",         leaderEn: "Konrad Adenauer",          color: "#dd0000", flag: "germany_democratic" },
            "Коммунизм":   { name: "DKP",                  nameEn: "DKP",                  leader: "Эрнст Тельман",           leaderEn: "Ernst Thälmann",           color: "#cc0000", flag: "germany_communist" },
            "Нейтралитет": { name: "Germany Empire",       nameEn: "Germany Empire",       leader: "Пауль фон Гинденбург",   leaderEn: "Paul von Hindenburg",      color: "#808080", flag: "germany_neutral" },
        }
    },
    ussr: {
        name: "СССР",
        nameEn: "Soviet Union",
        ideology: "Коммунизм",
        ideologies: {
            "Коммунизм":  { name: "СССР",                   nameEn: "Soviet Union",          leader: "Иосиф Сталин",            leaderEn: "Joseph Stalin",           color: "#990000", flag: "ussr_communist" },
            "Демократия": { name: "СССР",                   nameEn: "Soviet Union",          leader: "Георгий Пятаков",         leaderEn: "Georgy Pyatakov",         color: "#3b82f6", flag: "ussr_communist" },
            "Фашизм":     { name: "СССР",                   nameEn: "Soviet Union",          leader: "Власов",                  leaderEn: "Vlasov",                  color: "#8b0000", flag: "ussr_communist" },
            "Нейтралитет": { name: "СССР",                   nameEn: "Soviet Union",          leader: "Александр Колчак",        leaderEn: "Alexander Kolchak",        color: "#6b7280", flag: "ussr_communist" },
        }
    },
    poland: {
        name: "Польша",
        nameEn: "Poland",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Польша",                nameEn: "Poland",                leader: "Игнаций Мосцицкий",       leaderEn: "Ignacy Mościcki",         color: "#ffc0cb", flag: "poland_neutral" },
            "Демократия":  { name: "Польша",                nameEn: "Poland",                leader: "Игнаций Мосцицкий",       leaderEn: "Ignacy Mościcki",         color: "#ffc0cb", flag: "poland_neutral" },
            "Фашизм":      { name: "Польша",                nameEn: "Poland",                leader: "Едрук Пилсудский",        leaderEn: "Józef Piłsudski",         color: "#dc2626", flag: "poland_neutral" },
            "Коммунизм":   { name: "Польша",                nameEn: "Poland",                leader: "Болеслав Берут",          leaderEn: "Bolesław Bierut",         color: "#990000", flag: "poland_neutral" },
        }
    },
    france: {
        name: "France",
        nameEn: "France",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "France",               nameEn: "France",               leader: "Альбер Лебрен",           leaderEn: "Albert Lebrun",           color: "#3b82f6", flag: "france_democratic" },
            "Фашизм":      { name: "Vichy France",         nameEn: "Vichy France",         leader: "Пьер Лаваль",             leaderEn: "Pierre Laval",           color: "#1e3a5f", flag: "france_fascist" },
            "Коммунизм":   { name: "Socialist France",     nameEn: "Socialist France",     leader: "Морис Торез",             leaderEn: "Maurice Thorez",         color: "#cc0000", flag: "france_communist" },
            "Нейтралитет": { name: "France",               nameEn: "France",               leader: "Альбер Лебрен",           leaderEn: "Albert Lebrun",           color: "#6b7280", flag: "france_democratic" },
        }
    },
    uk: {
        name: "Великобритания",
        nameEn: "United Kingdom",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Великобритания",       nameEn: "United Kingdom",       leader: "Невилл Чемберлен",        leaderEn: "Neville Chamberlain",     color: "#ef4444", flag: "uk_democratic" },
            "Фашизм":      { name: "Великобритания",       nameEn: "United Kingdom",       leader: "Оswald Mosley",           leaderEn: "Oswald Mosley",           color: "#1a1a2e", flag: "uk_democratic" },
            "Коммунизм":   { name: "Великобритания",       nameEn: "United Kingdom",       leader: "Гарри Поллит",            leaderEn: "Harry Pollitt",           color: "#990000", flag: "uk_democratic" },
            "Нейтралитет": { name: "Великобритания",       nameEn: "United Kingdom",       leader: "Невилл Чемберлен",        leaderEn: "Neville Chamberlain",     color: "#6b7280", flag: "uk_democratic" },
        }
    },
    italy: {
        name: "Италия",
        nameEn: "Italy",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":      { name: "Италия",               nameEn: "Italy",                leader: "Бенито Муссолини",        leaderEn: "Benito Mussolini",        color: "#166534", flag: "italy_fascist" },
            "Демократия":  { name: "Италия",               nameEn: "Italy",                leader: "Альчиде Де Гаспери",      leaderEn: "Alcide De Gasperi",       color: "#3b82f6", flag: "italy_fascist" },
            "Коммунизм":   { name: "Италия",               nameEn: "Italy",                leader: "Пальмиро Тольятти",       leaderEn: "Palmiro Togliatti",       color: "#cc0000", flag: "italy_fascist" },
            "Нейтралитет": { name: "Италия",               nameEn: "Italy",                leader: "Виктор Эммануил III",     leaderEn: "Victor Emmanuel III",     color: "#6b7280", flag: "italy_fascist" },
        }
    },
    spain: {
        name: "Испания",
        nameEn: "Spain",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":      { name: "Испания",              nameEn: "Spain",                leader: "Франсиско Франко",        leaderEn: "Francisco Franco",        color: "#fbbf24", flag: "spain_fascist" },
            "Демократия":  { name: "Испания",              nameEn: "Spain",                leader: "Мануэль Асанья",          leaderEn: "Manuel Azaña",            color: "#3b82f6", flag: "spain_fascist" },
            "Коммунизм":   { name: "Испания",              nameEn: "Spain",                leader: "Долорес Ибаррури",        leaderEn: "Dolores Ibárruri",        color: "#990000", flag: "spain_fascist" },
            "Нейтралитет": { name: "Испания",              nameEn: "Spain",                leader: "Франсиско Франко",        leaderEn: "Francisco Franco",        color: "#6b7280", flag: "spain_fascist" },
        }
    },
    portugal: {
        name: "Португалия",
        nameEn: "Portugal",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Португалия",           nameEn: "Portugal",             leader: "Антониу Салазар",         leaderEn: "António Salazar",         color: "#105d10", flag: "portugal_neutral" },
            "Фашизм":      { name: "Португалия",           nameEn: "Portugal",             leader: "Антониу Салазар",         leaderEn: "António Salazar",         color: "#dc2626", flag: "portugal_neutral" },
            "Демократия":  { name: "Португалия",           nameEn: "Portugal",             leader: "Мариу Суареш",            leaderEn: "Mário Soares",            color: "#3b82f6", flag: "portugal_neutral" },
            "Коммунизм":   { name: "Португалия",           nameEn: "Portugal",             leader: "Алвару Куньял",           leaderEn: "Álvaro Cunhal",           color: "#990000", flag: "portugal_neutral" },
        }
    },
    netherlands: {
        name: "Нидерланды",
        nameEn: "Netherlands",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Нидерланды",           nameEn: "Netherlands",          leader: "Вильгельмина",            leaderEn: "Wilhelmina",              color: "#f97316", flag: "netherlands_democratic" },
            "Фашизм":      { name: "Нидерланды",           nameEn: "Netherlands",          leader: "Антон Муссеерт",          leaderEn: "Anton Mussert",           color: "#dc2626", flag: "netherlands_democratic" },
            "Коммунизм":   { name: "Нидерланды",           nameEn: "Netherlands",          leader: "Давид Вискерс",           leaderEn: "David Wijnkoop",          color: "#990000", flag: "netherlands_democratic" },
            "Нейтралитет": { name: "Нидерланды",           nameEn: "Netherlands",          leader: "Вильгельмина",            leaderEn: "Wilhelmina",              color: "#6b7280", flag: "netherlands_democratic" },
        }
    },
    belgium: {
        name: "Бельгия",
        nameEn: "Belgium",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Бельгия",              nameEn: "Belgium",              leader: "Леопольд III",            leaderEn: "Leopold III",             color: "#eab308", flag: "belgium_democratic" },
            "Фашизм":      { name: "Бельгия",              nameEn: "Belgium",              leader: "Леон Дегрель",            leaderEn: "Léon Degrelle",           color: "#dc2626", flag: "belgium_democratic" },
            "Коммунизм":   { name: "Бельгия",              nameEn: "Belgium",              leader: "Жак Сорель",              leaderEn: "Jacques Sorel",           color: "#990000", flag: "belgium_democratic" },
            "Нейтралитет": { name: "Бельгия",              nameEn: "Belgium",              leader: "Леопольд III",            leaderEn: "Leopold III",             color: "#6b7280", flag: "belgium_democratic" },
        }
    },
    luxembourg: {
        name: "Люксембург",
        nameEn: "Luxembourg",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Люксембург",           nameEn: "Luxembourg",           leader: "Шарлотта",                leaderEn: "Charlotte",               color: "#06b6d4", flag: "luxembourg_democratic" },
            "Фашизм":      { name: "Люксембург",           nameEn: "Luxembourg",           leader: "Леон Дегрель",            leaderEn: "Léon Degrelle",           color: "#dc2626", flag: "luxembourg_democratic" },
            "Коммунизм":   { name: "Люксембург",           nameEn: "Luxembourg",           leader: "Доминик Орбах",           leaderEn: "Dominique Urbach",        color: "#990000", flag: "luxembourg_democratic" },
            "Нейтралитет": { name: "Люксембург",           nameEn: "Luxembourg",           leader: "Шарлотта",                leaderEn: "Charlotte",               color: "#6b7280", flag: "luxembourg_democratic" },
        }
    },
    switzerland: {
        name: "Швейцария",
        nameEn: "Switzerland",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Швейцария",            nameEn: "Switzerland",          leader: "Джузеппе Мотта",          leaderEn: "Giuseppe Motta",          color: "#dc2626", flag: "switzerland_democratic" },
            "Фашизм":      { name: "Швейцария",            nameEn: "Switzerland",          leader: "Генрих Гиммлер",          leaderEn: "Heinrich Himmler",        color: "#1a1a2e", flag: "switzerland_democratic" },
            "Коммунизм":   { name: "Швейцария",            nameEn: "Switzerland",          leader: "Эрнст Нунциан",           leaderEn: "Ernst Nobs",              color: "#990000", flag: "switzerland_democratic" },
            "Нейтралитет": { name: "Швейцария",            nameEn: "Switzerland",          leader: "Джузеппе Мотта",          leaderEn: "Giuseppe Motta",          color: "#6b7280", flag: "switzerland_democratic" },
        }
    },
    romania: {
        name: "Румыния",
        nameEn: "Romania",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Румыния",              nameEn: "Romania",              leader: "Кароль II",               leaderEn: "Carol II",                color: "#f59e0b", flag: "romania_neutral" },
            "Фашизм":      { name: "Румыния",              nameEn: "Romania",              leader: "Ион Антонеску",           leaderEn: "Ion Antonescu",           color: "#dc2626", flag: "romania_neutral" },
            "Демократия":  { name: "Румыния",              nameEn: "Romania",              leader: "Петру Гроза",             leaderEn: "Petru Groza",             color: "#3b82f6", flag: "romania_neutral" },
            "Коммунизм":   { name: "Румыния",              nameEn: "Romania",              leader: "Георге Георгиу-Деж",      leaderEn: "Gheorghe Gheorghiu-Dej",  color: "#990000", flag: "romania_neutral" },
        }
    },
    hungary: {
        name: "Венгрия",
        nameEn: "Hungary",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Венгрия",              nameEn: "Hungary",              leader: "Миклош Хорти",            leaderEn: "Miklós Horthy",           color: "#16a34a", flag: "hungary_neutral" },
            "Фашизм":      { name: "Венгрия",              nameEn: "Hungary",              leader: "Ференц Салаши",           leaderEn: "Ferenc Szálasi",          color: "#dc2626", flag: "hungary_neutral" },
            "Демократия":  { name: "Венгрия",              nameEn: "Hungary",              leader: "Миклош Хорти",            leaderEn: "Miklós Horthy",           color: "#3b82f6", flag: "hungary_neutral" },
            "Коммунизм":   { name: "Венгрия",              nameEn: "Hungary",              leader: "Матьяш Ракоши",           leaderEn: "Mátyás Rákosi",          color: "#990000", flag: "hungary_neutral" },
        }
    },
    bulgaria: {
        name: "Болгария",
        nameEn: "Bulgaria",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Болгария",             nameEn: "Bulgaria",             leader: "Борис III",               leaderEn: "Boris III",               color: "#059669", flag: "bulgaria_neutral" },
            "Фашизм":      { name: "Болгария",             nameEn: "Bulgaria",             leader: "Борис III",               leaderEn: "Boris III",               color: "#dc2626", flag: "bulgaria_neutral" },
            "Демократия":  { name: "Болгария",             nameEn: "Bulgaria",             leader: "Кимон Георгиев",          leaderEn: "Kimon Georgiev",          color: "#3b82f6", flag: "bulgaria_neutral" },
            "Коммунизм":   { name: "Болгария",             nameEn: "Bulgaria",             leader: "Георгий Димитров",        leaderEn: "Georgi Dimitrov",         color: "#990000", flag: "bulgaria_neutral" },
        }
    },
    finland: {
        name: "Финляндия",
        nameEn: "Finland",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Финляндия",            nameEn: "Finland",              leader: "Кюёсти Каллио",           leaderEn: "Kyösti Kallio",           color: "#e0e7ff", flag: "finland_neutral" },
            "Демократия":  { name: "Финляндия",            nameEn: "Finland",              leader: "Ристо Рюти",              leaderEn: "Risto Ryti",              color: "#3b82f6", flag: "finland_neutral" },
            "Фашизм":      { name: "Финляндия",            nameEn: "Finland",              leader: "Ристо Рюти",              leaderEn: "Risto Ryti",              color: "#dc2626", flag: "finland_neutral" },
            "Коммунизм":   { name: "Финляндия",            nameEn: "Finland",              leader: "Отто Куусинен",           leaderEn: "Otto Wille Kuusinen",     color: "#990000", flag: "finland_neutral" },
        }
    },
    norway: {
        name: "Норвегия",
        nameEn: "Norway",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Норвегия",             nameEn: "Norway",               leader: "Хаакон VII",              leaderEn: "Haakon VII",              color: "#dc2626", flag: "norway_democratic" },
            "Фашизм":      { name: "Норвегия",             nameEn: "Norway",               leader: "Видкун Квислинг",         leaderEn: "Vidkun Quisling",         color: "#1a1a2e", flag: "norway_democratic" },
            "Коммунизм":   { name: "Норвегия",             nameEn: "Norway",               leader: "Педер Фури",              leaderEn: "Peder Furubotn",          color: "#990000", flag: "norway_democratic" },
            "Нейтралитет": { name: "Норвегия",             nameEn: "Norway",               leader: "Хаакон VII",              leaderEn: "Haakon VII",              color: "#6b7280", flag: "norway_democratic" },
        }
    },
    sweden: {
        name: "Швеция",
        nameEn: "Sweden",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Швеция",               nameEn: "Sweden",               leader: "Густав V",                leaderEn: "Gustav V",                color: "#2563eb", flag: "sweden_democratic" },
            "Фашизм":      { name: "Швеция",               nameEn: "Sweden",               leader: "Пер Эдвин Скоглунд",      leaderEn: "Per Edvin Sköglund",      color: "#dc2626", flag: "sweden_democratic" },
            "Коммунизм":   { name: "Швеция",               nameEn: "Sweden",               leader: "Зет Хоглунд",             leaderEn: "Zeth Höglund",            color: "#990000", flag: "sweden_democratic" },
            "Нейтралитет": { name: "Швеция",               nameEn: "Sweden",               leader: "Густав V",                leaderEn: "Gustav V",                color: "#6b7280", flag: "sweden_democratic" },
        }
    },
    denmark: {
        name: "Дания",
        nameEn: "Denmark",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Дания",                nameEn: "Denmark",              leader: "Кристиан X",              leaderEn: "Christian X",             color: "#c026d3", flag: "denmark_democratic" },
            "Фашизм":      { name: "Дания",                nameEn: "Denmark",              leader: "Фриц Клаузен",            leaderEn: "Fritz Clausen",           color: "#dc2626", flag: "denmark_democratic" },
            "Коммунизм":   { name: "Дания",                nameEn: "Denmark",              leader: "Аксель Ларсен",           leaderEn: "Aksel Larsen",            color: "#990000", flag: "denmark_democratic" },
            "Нейтралитет": { name: "Дания",                nameEn: "Denmark",              leader: "Кристиан X",              leaderEn: "Christian X",             color: "#6b7280", flag: "denmark_democratic" },
        }
    },
    czechoslovakia: {
        name: "Чехословакия",
        nameEn: "Czechoslovakia",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Чехословакия",         nameEn: "Czechoslovakia",       leader: "Эдвард Бенеш",            leaderEn: "Edvard Beneš",            color: "#3b82f6", flag: "czechoslovakia_democratic" },
            "Фашизм":      { name: "Чехословакия",         nameEn: "Czechoslovakia",       leader: "Конрад Генляйн",          leaderEn: "Konrad Henlein",          color: "#dc2626", flag: "czechoslovakia_democratic" },
            "Коммунизм":   { name: "Чехословакия",         nameEn: "Czechoslovakia",       leader: "Клемент Готвальд",        leaderEn: "Klement Gottwald",        color: "#990000", flag: "czechoslovakia_democratic" },
            "Нейтралитет": { name: "Чехословакия",         nameEn: "Czechoslovakia",       leader: "Эдвард Бенеш",            leaderEn: "Edvard Beneš",            color: "#6b7280", flag: "czechoslovakia_democratic" },
        }
    },
    austria: {
        name: "Австрия",
        nameEn: "Austria",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Австрия",              nameEn: "Austria",              leader: "Курт Шушниг",             leaderEn: "Kurt Schuschnigg",        color: "#ef4444", flag: "austria_neutral" },
            "Фашизм":      { name: "Австрия",              nameEn: "Austria",              leader: "Артур Зейсс-Инкварт",     leaderEn: "Arthur Seyss-Inquart",    color: "#dc2626", flag: "austria_fascist" },
            "Демократия":  { name: "Австрия",              nameEn: "Austria",              leader: "Карл Реннер",             leaderEn: "Karl Renner",             color: "#3b82f6", flag: "austria_neutral" },
            "Коммунизм":   { name: "Австрия",              nameEn: "Austria",              leader: "Эрнст Фишер",             leaderEn: "Ernst Fischer",           color: "#990000", flag: "austria_communist" },
        }
    },
    yugoslavia: {
        name: "Югославия",
        nameEn: "Yugoslavia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Югославия",            nameEn: "Yugoslavia",           leader: "Пётр II",                 leaderEn: "Peter II",                color: "#1e40af", flag: "yugoslavia_neutral" },
            "Фашизм":      { name: "Югославия",            nameEn: "Yugoslavia",           leader: "Милан Недич",             leaderEn: "Milan Nedić",             color: "#dc2626", flag: "yugoslavia_neutral" },
            "Демократия":  { name: "Югославия",            nameEn: "Yugoslavia",           leader: "Иосип Броз Тито",         leaderEn: "Josip Broz Tito",         color: "#3b82f6", flag: "yugoslavia_neutral" },
            "Коммунизм":   { name: "Югославия",            nameEn: "Yugoslavia",           leader: "Иосип Броз Тито",         leaderEn: "Josip Broz Tito",         color: "#990000", flag: "yugoslavia_neutral" },
        }
    },
    greece: {
        name: "Греция",
        nameEn: "Greece",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Греция",               nameEn: "Greece",               leader: "Иоаннис Метаксас",        leaderEn: "Ioannis Metaxas",         color: "#60a5fa", flag: "greece_neutral" },
            "Демократия":  { name: "Греция",               nameEn: "Greece",               leader: "Иоаннис Метаксас",        leaderEn: "Ioannis Metaxas",         color: "#3b82f6", flag: "greece_neutral" },
            "Фашизм":      { name: "Греция",               nameEn: "Greece",               leader: "Иоаннис Метаксас",        leaderEn: "Ioannis Metaxas",         color: "#dc2626", flag: "greece_neutral" },
            "Коммунизм":   { name: "Греция",               nameEn: "Greece",               leader: "Маркос Авгиерис",         leaderEn: "Markos Vafiadis",         color: "#990000", flag: "greece_neutral" },
        }
    },
    albania: {
        name: "Албания",
        nameEn: "Albania",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Албания",              nameEn: "Albania",              leader: "Зогу I",                  leaderEn: "Zog I",                   color: "#dc2626", flag: "albania_neutral" },
            "Демократия":  { name: "Албания",              nameEn: "Albania",              leader: "Фан Ноли",                leaderEn: "Fan Noli",                color: "#3b82f6", flag: "albania_neutral" },
            "Фашизм":      { name: "Албания",              nameEn: "Albania",              leader: "Мехди Фрашери",           leaderEn: "Mehdi Frashëri",          color: "#1a1a2e", flag: "albania_neutral" },
            "Коммунизм":   { name: "Албания",              nameEn: "Albania",              leader: "Энвер Ходжа",             leaderEn: "Enver Hoxha",             color: "#990000", flag: "albania_neutral" },
        }
    },
    lithuania: {
        name: "Литва",
        nameEn: "Lithuania",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Литва",                nameEn: "Lithuania",            leader: "Антанас Сметона",         leaderEn: "Antanas Smetona",         color: "#065f46", flag: "lithuania_neutral" },
            "Демократия":  { name: "Литва",                nameEn: "Lithuania",            leader: "Антанас Сметона",         leaderEn: "Antanas Smetona",         color: "#3b82f6", flag: "lithuania_neutral" },
            "Фашизм":      { name: "Литва",                nameEn: "Lithuania",            leader: "Антанас Сметона",         leaderEn: "Antanas Smetona",         color: "#dc2626", flag: "lithuania_neutral" },
            "Коммунизм":   { name: "Литва",                nameEn: "Lithuania",            leader: "Антанас Сnieckис",        leaderEn: "Antanas Sniečkus",        color: "#990000", flag: "lithuania_neutral" },
        }
    },
    latvia: {
        name: "Латвия",
        nameEn: "Latvia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Латвия",               nameEn: "Latvia",               leader: "Карлис Улманис",          leaderEn: "Kārlis Ulmanis",          color: "#7f1d1d", flag: "latvia_neutral" },
            "Демократия":  { name: "Латвия",               nameEn: "Latvia",               leader: "Карлис Улманис",          leaderEn: "Kārlis Ulmanis",          color: "#3b82f6", flag: "latvia_neutral" },
            "Фашизм":      { name: "Латвия",               nameEn: "Latvia",               leader: "Карлис Улманис",          leaderEn: "Kārlis Ulmanis",          color: "#dc2626", flag: "latvia_neutral" },
            "Коммунизм":   { name: "Латвия",               nameEn: "Latvia",               leader: "Август Кирхенштейн",      leaderEn: "Augusts Kirhenšteins",    color: "#990000", flag: "latvia_neutral" },
        }
    },
    estonia: {
        name: "Эстония",
        nameEn: "Estonia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Эстония",              nameEn: "Estonia",              leader: "Константин Пятс",         leaderEn: "Konstantin Päts",         color: "#1d4ed8", flag: "estonia_neutral" },
            "Демократия":  { name: "Эстония",              nameEn: "Estonia",              leader: "Константин Пятс",         leaderEn: "Konstantin Päts",         color: "#3b82f6", flag: "estonia_neutral" },
            "Фашизм":      { name: "Эстония",              nameEn: "Estonia",              leader: "Константин Пятс",         leaderEn: "Konstantin Päts",         color: "#dc2626", flag: "estonia_neutral" },
            "Коммунизм":   { name: "Эстония",              nameEn: "Estonia",              leader: "Йоханнес Варес",          leaderEn: "Johannes Vares",          color: "#990000", flag: "estonia_neutral" },
        }
    },
    slovakia: {
        name: "Словакия",
        nameEn: "Slovakia",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":      { name: "Словакия",             nameEn: "Slovakia",             leader: "Йозеф Тисо",              leaderEn: "Jozef Tiso",              color: "#2563eb", flag: "slovakia_fascist" },
            "Демократия":  { name: "Словакия",             nameEn: "Slovakia",             leader: "Йозеф Тисо",              leaderEn: "Jozef Tiso",              color: "#3b82f6", flag: "slovakia_fascist" },
            "Коммунизм":   { name: "Словакия",             nameEn: "Slovakia",             leader: "Владимир Клементис",      leaderEn: "Vladimír Clementis",      color: "#990000", flag: "slovakia_fascist" },
            "Нейтралитет": { name: "Словакия",             nameEn: "Slovakia",             leader: "Йозеф Тисо",              leaderEn: "Jozef Tiso",              color: "#6b7280", flag: "slovakia_fascist" },
        }
    },
    ireland: {
        name: "Ирландия",
        nameEn: "Ireland",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Ирландия",             nameEn: "Ireland",              leader: "Дуглас Хейд",             leaderEn: "Douglas Hyde",            color: "#16a34a", flag: "ireland_democratic" },
            "Фашизм":      { name: "Ирландия",             nameEn: "Ireland",              leader: "О'Даффи",                 leaderEn: "O'Duffy",                 color: "#dc2626", flag: "ireland_democratic" },
            "Коммунизм":   { name: "Ирландия",             nameEn: "Ireland",              leader: "Джеймс Коннолли",         leaderEn: "James Connolly",          color: "#990000", flag: "ireland_democratic" },
            "Нейтралитет": { name: "Ирландия",             nameEn: "Ireland",              leader: "Дуглас Хейд",             leaderEn: "Douglas Hyde",            color: "#6b7280", flag: "ireland_democratic" },
        }
    },
    iceland: {
        name: "Исландия",
        nameEn: "Iceland",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Исландия",             nameEn: "Iceland",              leader: "Эрлюгингур Торссон",      leaderEn: "Erlingur Thorsson",       color: "#3b82f6", flag: "uk_democratic" },
            "Нейтралитет": { name: "Исландия",             nameEn: "Iceland",              leader: "Эрлюгингур Торссон",      leaderEn: "Erlingur Thorsson",       color: "#6b7280", flag: "uk_democratic" },
        }
    },

    // === БЛИЖНИЙ ВОСТОК ===
    turkey: {
        name: "Турция",
        nameEn: "Turkey",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Турция",               nameEn: "Turkey",               leader: "Мустафа Кемаль Ататюрк",  leaderEn: "Mustafa Kemal Atatürk",   color: "#dc2626", flag: "turkey_neutral" },
            "Демократия":  { name: "Турция",               nameEn: "Turkey",               leader: "Исмет Инёню",             leaderEn: "İsmet İnönü",             color: "#3b82f6", flag: "turkey_neutral" },
            "Фашизм":      { name: "Турция",               nameEn: "Turkey",               leader: "Махмуд Эскиджи",          leaderEn: "Mahmud Es'ad",            color: "#1a1a2e", flag: "turkey_neutral" },
            "Коммунизм":   { name: "Турция",               nameEn: "Turkey",               leader: "Шевкет Сюрсель",          leaderEn: "Şevket Süreyya",          color: "#990000", flag: "turkey_neutral" },
        }
    },
    iraq: {
        name: "Ирак",
        nameEn: "Iraq",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Ирак",                 nameEn: "Iraq",                 leader: "Галиб Аль-Гаюни",         leaderEn: "Ali Jawdat",              color: "#166534", flag: "iraq_neutral" },
            "Фашизм":      { name: "Ирак",                 nameEn: "Iraq",                 leader: "Рашид Али",               leaderEn: "Rashid Ali",              color: "#dc2626", flag: "iraq_neutral" },
            "Демократия":  { name: "Ирак",                 nameEn: "Iraq",                 leader: "Нури аль-Саид",           leaderEn: "Nuri al-Said",            color: "#3b82f6", flag: "iraq_neutral" },
            "Коммунизм":   { name: "Ирак",                 nameEn: "Iraq",                 leader: "Карим Касем",             leaderEn: "Abd al-Karim Qasim",     color: "#990000", flag: "iraq_neutral" },
        }
    },
    iran: {
        name: "Иран",
        nameEn: "Iran",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Иран",                 nameEn: "Iran",                 leader: "Реза Пехлеви",            leaderEn: "Reza Shah Pahlavi",       color: "#059669", flag: "iran_neutral" },
            "Демократия":  { name: "Иран",                 nameEn: "Iran",                 leader: "Мохаммед Мосаддык",       leaderEn: "Mohammad Mosaddegh",      color: "#3b82f6", flag: "iran_neutral" },
            "Фашизм":      { name: "Иран",                 nameEn: "Iran",                 leader: "Реза Пехлеви",            leaderEn: "Reza Shah Pahlavi",       color: "#dc2626", flag: "iran_neutral" },
            "Коммунизм":   { name: "Иран",                 nameEn: "Iran",                 leader: "Нуреддин Киянури",        leaderEn: "Nureddin Kianuri",        color: "#990000", flag: "iran_neutral" },
        }
    },
    saudi_arabia: {
        name: "Саудовская Аравия",
        nameEn: "Saudi Arabia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Саудовская Аравия",    nameEn: "Saudi Arabia",         leader: "Абдул-Азиз Аль-Сауд",     leaderEn: "Abdulaziz Al Saud",       color: "#15803d", flag: "saudi_arabia_neutral" },
            "Демократия":  { name: "Саудовская Аравия",    nameEn: "Saudi Arabia",         leader: "Абдул-Азиз Аль-Сауд",     leaderEn: "Abdulaziz Al Saud",       color: "#3b82f6", flag: "saudi_arabia_neutral" },
            "Фашизм":      { name: "Саудовская Аравия",    nameEn: "Saudi Arabia",         leader: "Абдул-Азиз Аль-Сауд",     leaderEn: "Abdulaziz Al Saud",       color: "#dc2626", flag: "saudi_arabia_neutral" },
            "Коммунизм":   { name: "Саудовская Аравия",    nameEn: "Saudi Arabia",         leader: "Абдул-Азиз Аль-Сауд",     leaderEn: "Abdulaziz Al Saud",       color: "#990000", flag: "saudi_arabia_neutral" },
        }
    },

    // === АЗИЯ ===
    japan: {
        name: "Япония",
        nameEn: "Japan",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":      { name: "Японская империя",     nameEn: "Empire of Japan",      leader: "Хирохито",                leaderEn: "Emperor Hirohito",       color: "#bc002d", flag: "japan_fascist" },
            "Демократия":  { name: "Япония",               nameEn: "Japan",                leader: "Хатояма Итиро",           leaderEn: "Ichirō Hatoyama",        color: "#3b82f6", flag: "japan_democratic" },
            "Коммунизм":   { name: "Японская НДР",         nameEn: "Japanese People's Republic", leader: "Носака Сандзё",     leaderEn: "Sanzo Nosaka",           color: "#990000", flag: "japan_communist" },
            "Нейтралитет": { name: "Япония",               nameEn: "Japan",                leader: "Кидзюро Шидехара",        leaderEn: "Kijūrō Shidehara",      color: "#6b7280", flag: "japan_neutral" },
        }
    },
    china: {
        name: "Китай",
        nameEn: "China",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Китайская Республика",  nameEn: "Republic of China",    leader: "Чан Кайши",              leaderEn: "Chiang Kai-shek",       color: "#00247d", flag: "china_democratic" },
            "Фашизм":      { name: "Китай",                nameEn: "China",                leader: "Ван Цзинвэй",            leaderEn: "Wang Jingwei",          color: "#dc2626", flag: "china_fascist" },
            "Коммунизм":   { name: "КНР",                  nameEn: "People's Republic of China", leader: "Мао Цзэдун",       leaderEn: "Mao Zedong",            color: "#990000", flag: "china_communist" },
            "Нейтралитет": { name: "Китай",                nameEn: "China",                leader: "Линь Сэнь",              leaderEn: "Lin Sen",               color: "#6b7280", flag: "china_neutral" },
        }
    },
    india: {
        name: "Индия",
        nameEn: "India",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Британская Индия",      nameEn: "British India",        leader: "Лорд Линлитгоу",         leaderEn: "Marquess of Linlithgow", color: "#ff9933", flag: "india_democratic" },
            "Фашизм":      { name: "Индия",                nameEn: "India",                leader: "Субхас Чандра Бос",      leaderEn: "Subhas Chandra Bose",   color: "#dc2626", flag: "india_fascist" },
            "Коммунизм":   { name: "Индия",                nameEn: "India",                leader: "Б.Т. Ранадиве",           leaderEn: "B.T. Ranadive",         color: "#990000", flag: "india_communist" },
            "Нейтралитет": { name: "Индия",                nameEn: "India",                leader: "Махатма Ганди",           leaderEn: "Mahatma Gandhi",        color: "#6b7280", flag: "india_neutral" },
        }
    },
    thailand: {
        name: "Таиланд",
        nameEn: "Thailand",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Таиланд",              nameEn: "Thailand",             leader: "Плек Пибунсонгкрам",      leaderEn: "Plaek Phibunsongkhram", color: "#0050a0", flag: "thailand_neutral" },
            "Демократия":  { name: "Таиланд",              nameEn: "Thailand",             leader: "Прidi Пхахонмонгкол",     leaderEn: "Pridi Banomyong",       color: "#3b82f6", flag: "thailand_democratic" },
            "Фашизм":      { name: "Таиланд",              nameEn: "Thailand",             leader: "Плек Пибунсонгкрам",      leaderEn: "Plaek Phibunsongkhram", color: "#dc2626", flag: "thailand_fascist" },
            "Коммунизм":   { name: "Таиланд",              nameEn: "Thailand",             leader: "Приди Баномйонг",         leaderEn: "Pridi Banomyong",       color: "#990000", flag: "thailand_communist" },
        }
    },
    afghanistan: {
        name: "Афганистан",
        nameEn: "Afghanistan",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Афганистан",           nameEn: "Afghanistan",          leader: "Мохаммед Захир-шах",      leaderEn: "Mohammad Zahir Shah",   color: "#000000", flag: "afghanistan_neutral" },
            "Демократия":  { name: "Афганистан",           nameEn: "Afghanistan",          leader: "Мохаммед Дауд Хан",       leaderEn: "Mohammad Daoud Khan",   color: "#3b82f6", flag: "afghanistan_democratic" },
            "Фашизм":      { name: "Афганистан",           nameEn: "Afghanistan",          leader: "Хабибулла Калакани",      leaderEn: "Habibullah Kalakani",   color: "#dc2626", flag: "afghanistan_fascist" },
            "Коммунизм":   { name: "Афганистан",           nameEn: "Afghanistan",          leader: "Нур Мухаммад Тараки",     leaderEn: "Nur Muhammad Taraki",   color: "#990000", flag: "afghanistan_communist" },
        }
    },
    egypt: {
        name: "Египет",
        nameEn: "Egypt",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Египет",               nameEn: "Egypt",                leader: "Фуад II",                 leaderEn: "Fuad II",               color: "#f59e0b", flag: "egypt_democratic" },
            "Фашизм":      { name: "Египет",               nameEn: "Egypt",                leader: "Ахмад Махер",             leaderEn: "Ahmad Maher Pasha",     color: "#dc2626", flag: "egypt_fascist" },
            "Коммунизм":   { name: "Египет",               nameEn: "Egypt",                leader: "Халид бин Уль-Валид",     leaderEn: "Khaled al-Hakim",       color: "#990000", flag: "egypt_communist" },
            "Нейтралитет": { name: "Египет",               nameEn: "Egypt",                leader: "Фарук I",                 leaderEn: "King Farouk",           color: "#6b7280", flag: "egypt_neutral" },
        }
    },

    // === ВОСТОЧНАЯ АЗИЯ ===
    manchukuo: {
        name: "Маньчжоу-Го",
        nameEn: "Manchukuo",
        ideology: "Фашизм",
        ideologies: {
            "Фашизм":      { name: "Маньчжоу-Го",          nameEn: "Manchukuo",            leader: "Пу И",                    leaderEn: "Puyi",                  color: "#1e40af", flag: "manchukuo_fascist" },
            "Демократия":  { name: "Маньчжоу-Го",          nameEn: "Manchukuo",            leader: "Пу И",                    leaderEn: "Puyi",                  color: "#3b82f6", flag: "manchukuo_fascist" },
            "Коммунизм":   { name: "Маньчжоу-Го",          nameEn: "Manchukuo",            leader: "Ли Л-sanь",              leaderEn: "Li San",                color: "#990000", flag: "manchukuo_fascist" },
            "Нейтралитет": { name: "Маньчжоу-Го",          nameEn: "Manchukuo",            leader: "Пу И",                    leaderEn: "Puyi",                  color: "#6b7280", flag: "manchukuo_fascist" },
        }
    },
    korea: {
        name: "Корея",
        nameEn: "Korea",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Корея",                nameEn: "Korea",                leader: "Сонджин",                 leaderEn: "King Sunjong",          color: "#003478", flag: "korea_neutral" },
            "Демократия":  { name: "Республика Корея",     nameEn: "Republic of Korea",    leader: "Ли Сынман",              leaderEn: "Syngman Rhee",          color: "#3b82f6", flag: "korea_neutral" },
            "Фашизм":      { name: "Корея",                nameEn: "Korea",                leader: "Пак Ёнхё",              leaderEn: "Park Yeong-hyo",        color: "#dc2626", flag: "korea_neutral" },
            "Коммунизм":   { name: "КНДР",                 nameEn: "North Korea",          leader: "Ким Ир Сен",             leaderEn: "Kim Il-sung",           color: "#990000", flag: "korea_neutral" },
        }
    },
    taiwan: {
        name: "Тайвань",
        nameEn: "Taiwan",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Тайвань",              nameEn: "Taiwan",               leader: "Линь Сэн",               leaderEn: "Lin Sen",               color: "#fe0000", flag: "taiwan_neutral" },
            "Демократия":  { name: "Тайвань",              nameEn: "Taiwan",               leader: "Чан Кайши",              leaderEn: "Chiang Kai-shek",       color: "#3b82f6", flag: "taiwan_neutral" },
            "Фашизм":      { name: "Тайвань",              nameEn: "Taiwan",               leader: "Чан Кайши",              leaderEn: "Chiang Kai-shek",       color: "#dc2626", flag: "taiwan_neutral" },
            "Коммунизм":   { name: "Тайвань",              nameEn: "Taiwan",               leader: "Те Чжиминь",             leaderEn: "Xie Xuehong",           color: "#990000", flag: "taiwan_neutral" },
        }
    },
    philippines: {
        name: "Филиппины",
        nameEn: "Philippines",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Филиппины",            nameEn: "Philippines",          leader: "Мануэль Кесон",          leaderEn: "Manuel Quezon",         color: "#2563eb", flag: "philippines_democratic" },
            "Фашизм":      { name: "Филиппины",            nameEn: "Philippines",          leader: "Бенгасино",              leaderEn: "Batasan",              color: "#dc2626", flag: "philippines_democratic" },
            "Коммунизм":   { name: "Филиппины",            nameEn: "Philippines",          leader: "Луис Тарук",             leaderEn: "Luis Taruc",           color: "#990000", flag: "philippines_democratic" },
            "Нейтралитет": { name: "Филиппины",            nameEn: "Philippines",          leader: "Мануэль Кесон",          leaderEn: "Manuel Quezon",         color: "#6b7280", flag: "philippines_democratic" },
        }
    },

    // === ЮГО-ВОСТОЧНАЯ АЗИЯ ===
    burma: {
        name: "Бирма",
        nameEn: "Burma",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Бирма",                nameEn: "Burma",                leader: "Ба Мо",                   leaderEn: "Ba Maw",               color: "#fecb00", flag: "burma_neutral" },
            "Демократия":  { name: "Бирма",                nameEn: "Burma",                leader: "У Ну",                    leaderEn: "U Nu",                  color: "#3b82f6", flag: "burma_neutral" },
            "Фашизм":      { name: "Бирма",                nameEn: "Burma",                leader: "Ба Мо",                   leaderEn: "Ba Maw",               color: "#dc2626", flag: "burma_neutral" },
            "Коммунизм":   { name: "Бирма",                nameEn: "Burma",                leader: "Тхакин Со",              leaderEn: "Thakin So",            color: "#990000", flag: "burma_neutral" },
        }
    },
    vietnam: {
        name: "Вьетнам",
        nameEn: "Vietnam",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Вьетнам",              nameEn: "Vietnam",              leader: "Бао Дай",                 leaderEn: "Bảo Đại",              color: "#da251d", flag: "vietnam_neutral" },
            "Демократия":  { name: "Вьетнам",              nameEn: "Vietnam",              leader: "Нго Динь Зьем",          leaderEn: "Ngô Đình Diệm",        color: "#3b82f6", flag: "vietnam_neutral" },
            "Фашизм":      { name: "Вьетнам",              nameEn: "Vietnam",              leader: "Бао Дай",                 leaderEn: "Bảo Đại",              color: "#dc2626", flag: "vietnam_neutral" },
            "Коммунизм":   { name: "ДРВ",                  nameEn: "North Vietnam",        leader: "Хо Ши Мин",               leaderEn: "Ho Chi Minh",          color: "#990000", flag: "vietnam_neutral" },
        }
    },
    laos: {
        name: "Лаос",
        nameEn: "Laos",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Лаос",                 nameEn: "Laos",                 leader: "Сисаванг Вонг",           leaderEn: "Sisavang Vong",        color: "#ce1126", flag: "laos_neutral" },
            "Демократия":  { name: "Лаос",                 nameEn: "Laos",                 leader: "Сисаванг Вонг",           leaderEn: "Sisavang Vong",        color: "#3b82f6", flag: "laos_neutral" },
            "Фашизм":      { name: "Лаос",                 nameEn: "Laos",                 leader: "Сисаванг Вонг",           leaderEn: "Sisavang Vong",        color: "#dc2626", flag: "laos_neutral" },
            "Коммунизм":   { name: "Лаос",                 nameEn: "Laos",                 leader: "Супханнувонг",            leaderEn: "Suphanouvong",         color: "#990000", flag: "laos_neutral" },
        }
    },
    cambodia: {
        name: "Камбоджа",
        nameEn: "Cambodia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Камбоджа",             nameEn: "Cambodia",             leader: "Нородом Сианук",          leaderEn: "Norodom Sihanouk",     color: "#032ea1", flag: "cambodia_neutral" },
            "Демократия":  { name: "Камбоджа",             nameEn: "Cambodia",             leader: "Нородом Сианук",          leaderEn: "Norodom Sihanouk",     color: "#3b82f6", flag: "cambodia_neutral" },
            "Фашизм":      { name: "Камбоджа",             nameEn: "Cambodia",             leader: "Нородом Сианук",          leaderEn: "Norodom Sihanouk",     color: "#dc2626", flag: "cambodia_neutral" },
            "Коммунизм":   { name: "Камбоджа",             nameEn: "Cambodia",             leader: "Пол Пот",                 leaderEn: "Pol Pot",              color: "#990000", flag: "cambodia_neutral" },
        }
    },
    indonesia: {
        name: "Индонезия",
        nameEn: "Indonesia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Индонезия",            nameEn: "Indonesia",            leader: "Сукарно",                 leaderEn: "Sukarno",              color: "#ff0000", flag: "indonesia_neutral" },
            "Демократия":  { name: "Индонезия",            nameEn: "Indonesia",            leader: "Сукарно",                 leaderEn: "Sukarno",              color: "#3b82f6", flag: "indonesia_neutral" },
            "Фашизм":      { name: "Индонезия",            nameEn: "Indonesia",            leader: "Сукарно",                 leaderEn: "Sukarno",              color: "#1a1a2e", flag: "indonesia_neutral" },
            "Коммунизм":   { name: "Индонезия",            nameEn: "Indonesia",            leader: "Дипа Нусантара",          leaderEn: "Dipanegara",           color: "#990000", flag: "indonesia_neutral" },
        }
    },
    malaysia: {
        name: "Малайя",
        nameEn: "Malaya",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Малайя",               nameEn: "Malaya",               leader: "Абдул Рахман",            leaderEn: "Tunku Abdul Rahman",   color: "#dc2626", flag: "malaysia_democratic" },
            "Фашизм":      { name: "Малайя",               nameEn: "Malaya",               leader: "Коннолли",                leaderEn: "Connolly",             color: "#1a1a2e", flag: "malaysia_democratic" },
            "Коммунизм":   { name: "Малайя",               nameEn: "Malaya",               leader: "Чин Пен",                 leaderEn: "Chin Peng",            color: "#990000", flag: "malaysia_democratic" },
            "Нейтралитет": { name: "Малайя",               nameEn: "Malaya",               leader: "Абдул Рахман",            leaderEn: "Tunku Abdul Rahman",   color: "#6b7280", flag: "malaysia_democratic" },
        }
    },

    // === ЮЖНАЯ АЗИЯ ===
    nepal: {
        name: "Непал",
        nameEn: "Nepal",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Непал",                nameEn: "Nepal",                leader: "Трибхуван",               leaderEn: "Tribhuvan",            color: "#dc143c", flag: "nepal_neutral" },
            "Демократия":  { name: "Непал",                nameEn: "Nepal",                leader: "Трибхуван",               leaderEn: "Tribhuvan",            color: "#3b82f6", flag: "nepal_neutral" },
            "Фашизм":      { name: "Непал",                nameEn: "Nepal",                leader: "Махендра",                leaderEn: "Mahendra",             color: "#1a1a2e", flag: "nepal_neutral" },
            "Коммунизм":   { name: "Непал",                nameEn: "Nepal",                leader: "Пушпа Лал Шреста",        leaderEn: "Pushpa Lal Shrestha",   color: "#990000", flag: "nepal_neutral" },
        }
    },
    bhutan: {
        name: "Бутан",
        nameEn: "Bhutan",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Бутан",                nameEn: "Bhutan",               leader: "Джигме Вангчук",          leaderEn: "Jigme Wangchuck",      color: "#f59e0b", flag: "bhutan_neutral" },
            "Демократия":  { name: "Бутан",                nameEn: "Bhutan",               leader: "Джигме Вангчук",          leaderEn: "Jigme Wangchuck",      color: "#3b82f6", flag: "bhutan_neutral" },
            "Фашизм":      { name: "Бутан",                nameEn: "Bhutan",               leader: "Джигме Вангчук",          leaderEn: "Jigme Wangchuck",      color: "#dc2626", flag: "bhutan_neutral" },
            "Коммунизм":   { name: "Бутан",                nameEn: "Bhutan",               leader: "Джигме Вангчук",          leaderEn: "Jigme Wangchuck",      color: "#990000", flag: "bhutan_neutral" },
        }
    },

    // === БЛИЖНИЙ ВОСТОК ===
    yemen: {
        name: "Йемен",
        nameEn: "Yemen",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Йемен",                nameEn: "Yemen",                leader: "Ахмед Якуб",              leaderEn: "Ahmad ibn Yahya",      color: "#166534", flag: "yemen_neutral" },
            "Демократия":  { name: "Йемен",                nameEn: "Yemen",                leader: "Ибрагим Хамди",          leaderEn: "Ibrahim al-Hamdi",     color: "#3b82f6", flag: "yemen_neutral" },
            "Фашизм":      { name: "Йемен",                nameEn: "Yemen",                leader: "Ахмед Якуб",              leaderEn: "Ahmad ibn Yahya",      color: "#dc2626", flag: "yemen_neutral" },
            "Коммунизм":   { name: "Йемен",                nameEn: "Yemen",                leader: "Абдулла аль-Ахмар",       leaderEn: "Abdullah al-Ahmar",    color: "#990000", flag: "yemen_neutral" },
        }
    },
    oman: {
        name: "Оман",
        nameEn: "Oman",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Оман",                 nameEn: "Oman",                 leader: "Саид бин Таймур",         leaderEn: "Said bin Taimur",      color: "#15803d", flag: "oman_neutral" },
            "Демократия":  { name: "Оман",                 nameEn: "Oman",                 leader: "Саид бин Таймур",         leaderEn: "Said bin Taimur",      color: "#3b82f6", flag: "oman_neutral" },
            "Фашизм":      { name: "Оман",                 nameEn: "Oman",                 leader: "Саид бин Таймур",         leaderEn: "Said bin Taimur",      color: "#dc2626", flag: "oman_neutral" },
            "Коммунизм":   { name: "Оман",                 nameEn: "Oman",                 leader: "Саид бин Таймур",         leaderEn: "Said bin Taimur",      color: "#990000", flag: "oman_neutral" },
        }
    },
    kuwait: {
        name: "Кувейт",
        nameEn: "Kuwait",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Кувейт",               nameEn: "Kuwait",               leader: "Ахмед Аль-Джабер",        leaderEn: "Ahmad Al-Jaber",       color: "#059669", flag: "kuwait_neutral" },
            "Демократия":  { name: "Кувейт",               nameEn: "Kuwait",               leader: "Ахмед Аль-Джабер",        leaderEn: "Ahmad Al-Jaber",       color: "#3b82f6", flag: "kuwait_neutral" },
            "Фашизм":      { name: "Кувейт",               nameEn: "Kuwait",               leader: "Ахмед Аль-Джабер",        leaderEn: "Ahmad Al-Jaber",       color: "#dc2626", flag: "kuwait_neutral" },
            "Коммунизм":   { name: "Кувейт",               nameEn: "Kuwait",               leader: "Ахмед Аль-Джабер",        leaderEn: "Ahmad Al-Jaber",       color: "#990000", flag: "kuwait_neutral" },
        }
    },
    bahrain: {
        name: "Бахрейн",
        nameEn: "Bahrain",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Бахрейн",              nameEn: "Bahrain",              leader: "Хамад бин Иса",           leaderEn: "Hamad bin Isa",        color: "#dc2626", flag: "bahrain_neutral" },
            "Демократия":  { name: "Бахрейн",              nameEn: "Bahrain",              leader: "Хамад бин Иса",           leaderEn: "Hamad bin Isa",        color: "#3b82f6", flag: "bahrain_neutral" },
            "Фашизм":      { name: "Бахрейн",              nameEn: "Bahrain",              leader: "Хамад бин Иса",           leaderEn: "Hamad bin Isa",        color: "#1a1a2e", flag: "bahrain_neutral" },
            "Коммунизм":   { name: "Бахрейн",              nameEn: "Bahrain",              leader: "Хамад бин Иса",           leaderEn: "Hamad bin Isa",        color: "#990000", flag: "bahrain_neutral" },
        }
    },
    qatar: {
        name: "Катар",
        nameEn: "Qatar",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Катар",                nameEn: "Qatar",                leader: "Абдулла бин Касим",       leaderEn: "Abdullah bin Qasim",   color: "#7f1d1d", flag: "qatar_neutral" },
            "Демократия":  { name: "Катар",                nameEn: "Qatar",                leader: "Абдулла бин Касим",       leaderEn: "Abdullah bin Qasim",   color: "#3b82f6", flag: "qatar_neutral" },
            "Фашизм":      { name: "Катар",                nameEn: "Qatar",                leader: "Абдулла бин Касим",       leaderEn: "Abdullah bin Qasim",   color: "#dc2626", flag: "qatar_neutral" },
            "Коммунизм":   { name: "Катар",                nameEn: "Qatar",                leader: "Абдулла бин Касим",       leaderEn: "Abdullah bin Qasim",   color: "#990000", flag: "qatar_neutral" },
        }
    },
    lebanon: {
        name: "Ливан",
        nameEn: "Lebanon",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Ливан",                nameEn: "Lebanon",              leader: "Бишара эль-Хури",         leaderEn: "Bechara El-Khoury",    color: "#166534", flag: "lebanon_neutral" },
            "Демократия":  { name: "Ливан",                nameEn: "Lebanon",              leader: "Бишара эль-Хури",         leaderEn: "Bechara El-Khoury",    color: "#3b82f6", flag: "lebanon_neutral" },
            "Фашизм":      { name: "Ливан",                nameEn: "Lebanon",              leader: "Бишара эль-Хури",         leaderEn: "Bechara El-Khoury",    color: "#dc2626", flag: "lebanon_neutral" },
            "Коммунизм":   { name: "Ливан",                nameEn: "Lebanon",              leader: "Карим Пакладон",          leaderEn: "Karim Pakladon",       color: "#990000", flag: "lebanon_neutral" },
        }
    },
    israel: {
        name: "Израиль",
        nameEn: "Israel",
        ideology: "Демократия",
        ideologies: {
            "Демократия":  { name: "Израиль",              nameEn: "Israel",               leader: "Давид Бен-Гурион",        leaderEn: "David Ben-Gurion",     color: "#2563eb", flag: "israel_democratic" },
            "Фашизм":      { name: "Израиль",              nameEn: "Israel",               leader: "Менахем Бегин",           leaderEn: "Menachem Begin",       color: "#dc2626", flag: "israel_democratic" },
            "Коммунизм":   { name: "Израиль",              nameEn: "Israel",               leader: "Меир Вильнер",            leaderEn: "Meir Vilner",          color: "#990000", flag: "israel_democratic" },
            "Нейтралитет": { name: "Израиль",              nameEn: "Israel",               leader: "Давид Бен-Гурион",        leaderEn: "David Ben-Gurion",     color: "#6b7280", flag: "israel_democratic" },
        }
    },

    // === АФРИКА ===
    sudan: {
        name: "Судан",
        nameEn: "Sudan",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Судан",                nameEn: "Sudan",                leader: "Сайид Абдель Рахман",     leaderEn: "Sayyid Abdel Rahman",  color: "#dc2626", flag: "sudan_neutral" },
            "Демократия":  { name: "Судан",                nameEn: "Sudan",                leader: "Исмаил аль-Азхари",       leaderEn: "Ismail al-Azhari",     color: "#3b82f6", flag: "sudan_neutral" },
            "Фашизм":      { name: "Судан",                nameEn: "Sudan",                leader: "Сайид Абдель Рахман",     leaderEn: "Sayyid Abdel Rahman",  color: "#1a1a2e", flag: "sudan_neutral" },
            "Коммунизм":   { name: "Судан",                nameEn: "Sudan",                leader: "Абдель Халим Хафиз",      leaderEn: "Abdel Khalim Kafiz",   color: "#990000", flag: "sudan_neutral" },
        }
    },
    ethiopia: {
        name: "Эфиопия",
        nameEn: "Ethiopia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Эфиопия",              nameEn: "Ethiopia",             leader: "Хайле Селассие",          leaderEn: "Haile Selassie",       color: "#105d10", flag: "ethiopia_neutral" },
            "Демократия":  { name: "Эфиопия",              nameEn: "Ethiopia",             leader: "Хайле Селассие",          leaderEn: "Haile Selassie",       color: "#3b82f6", flag: "ethiopia_neutral" },
            "Фашизм":      { name: "Эфиопия",              nameEn: "Ethiopia",             leader: "Хайле Селассие",          leaderEn: "Haile Selassie",       color: "#dc2626", flag: "ethiopia_neutral" },
            "Коммунизм":   { name: "Эфиопия",              nameEn: "Ethiopia",             leader: "Мэнгисту Хайле Марьям",  leaderEn: "Mengistu Haile Mariam", color: "#990000", flag: "ethiopia_neutral" },
        }
    },
    somalia: {
        name: "Сомали",
        nameEn: "Somalia",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Сомали",               nameEn: "Somalia",              leader: "Абдуллахи Юсуф",          leaderEn: "Abdullahi Yusuf",      color: "#3b82f6", flag: "somalia_neutral" },
            "Демократия":  { name: "Сомали",               nameEn: "Somalia",              leader: "Абдуллахи Юсуф",          leaderEn: "Abdullahi Yusuf",      color: "#3b82f6", flag: "somalia_neutral" },
            "Фашизм":      { name: "Сомали",               nameEn: "Somalia",              leader: "Мухаммед Хассан Али",     leaderEn: "Mohammed Hassan Ali",  color: "#dc2626", flag: "somalia_neutral" },
            "Коммунизм":   { name: "Сомали",               nameEn: "Somalia",              leader: "Мухammad Барре",          leaderEn: "Siad Barre",           color: "#990000", flag: "somalia_neutral" },
        }
    },
    eritrea: {
        name: "Эритрея",
        nameEn: "Eritrea",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Эритрея",              nameEn: "Eritrea",              leader: "Ибрагим Султан",          leaderEn: "Ibrahim Sultan",       color: "#f59e0b", flag: "eritrea_neutral" },
            "Демократия":  { name: "Эритрея",              nameEn: "Eritrea",              leader: "Ибрагим Султан",          leaderEn: "Ibrahim Sultan",       color: "#3b82f6", flag: "eritrea_neutral" },
            "Фашизм":      { name: "Эритрея",              nameEn: "Eritrea",              leader: "Ибрагим Султан",          leaderEn: "Ibrahim Sultan",       color: "#dc2626", flag: "eritrea_neutral" },
            "Коммунизм":   { name: "Эритрея",              nameEn: "Eritrea",              leader: "Исайас Афеворки",         leaderEn: "Isaias Afwerki",       color: "#990000", flag: "eritrea_neutral" },
        }
    },
    tuva: {
        name: "Тува",
        nameEn: "Tannu Tuva",
        ideology: "Коммунизм",
        ideologies: {
            "Коммунизм":  { name: "Тува",              nameEn: "Tannu Tuva",        leader: "Хорлоогийн Чойбалан",     leaderEn: "Khorloogiin Choibalsan",  color: "#cc0000", flag: "tuva_communist" },
            "Фашизм":     { name: "Тува",              nameEn: "Tannu Tuva",        leader: "Хорлоогийн Чойбалан",     leaderEn: "Khorloogiin Choibalsan",  color: "#990000", flag: "tuva_communist" },
            "Демократия":  { name: "Тува",              nameEn: "Tannu Tuva",        leader: "Хорлоогийн Чойбалан",     leaderEn: "Khorloogiin Choibalsan",  color: "#3b82f6", flag: "tuva_communist" },
            "Нейтралитет": { name: "Тува",              nameEn: "Tannu Tuva",        leader: "Хорлоогийн Чойбалан",     leaderEn: "Khorloogiin Choibalsan",  color: "#6b7280", flag: "tuva_communist" },
        }
    },
    mongolia: {
        name: "Монголия",
        nameEn: "Mongolia",
        ideology: "Коммунизм",
        ideologies: {
            "Коммунизм":  { name: "Монголия",           nameEn: "Mongolia",           leader: "Хорлоогийн Чойбалан",     leaderEn: "Khorloogiin Choibalsan",  color: "#0064c8", flag: "mongolia_communist" },
            "Фашизм":     { name: "Монголия",           nameEn: "Mongolia",           leader: "Дамдинбазар",             leaderEn: "Damdinbazar",             color: "#990000", flag: "mongolia_communist" },
            "Демократия":  { name: "Монголия",           nameEn: "Mongolia",           leader: "Бадамдорж",               leaderEn: "Baldandorj",              color: "#3b82f6", flag: "mongolia_communist" },
            "Нейтралитет": { name: "Монголия",           nameEn: "Mongolia",           leader: "Богд-хан",                leaderEn: "Bogd Khan",               color: "#6b7280", flag: "mongolia_communist" },
        }
    },
    sinkiang: {
        name: "Синьцзян",
        nameEn: "Sinkiang",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Синьцзян",           nameEn: "Sinkiang",           leader: "Шэн Шицай",              leaderEn: "Sheng Shicai",            color: "#1e40af", flag: "sinkiang_neutral" },
            "Коммунизм":   { name: "Синьцзян",           nameEn: "Sinkiang",           leader: "Шэн Шицай",              leaderEn: "Sheng Shicai",            color: "#cc0000", flag: "sinkiang_neutral" },
            "Фашизм":      { name: "Синьцзян",           nameEn: "Sinkiang",           leader: "Шэн Шицай",              leaderEn: "Sheng Shicai",            color: "#dc2626", flag: "sinkiang_neutral" },
            "Демократия":  { name: "Синьцзян",           nameEn: "Sinkiang",           leader: "Шэн Шицай",              leaderEn: "Sheng Shicai",            color: "#3b82f6", flag: "sinkiang_neutral" },
        }
    },
    tibet: {
        name: "Тибет",
        nameEn: "Tibet",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Тибет",              nameEn: "Tibet",              leader: "Далай-Лама XIII",         leaderEn: "13th Dalai Lama",         color: "#dc2626", flag: "tibet_neutral" },
            "Коммунизм":   { name: "Тибет",              nameEn: "Tibet",              leader: "Далай-Лама XIII",         leaderEn: "13th Dalai Lama",         color: "#cc0000", flag: "tibet_neutral" },
            "Фашизм":      { name: "Тибет",              nameEn: "Tibet",              leader: "Далай-Лама XIII",         leaderEn: "13th Dalai Lama",         color: "#dc2626", flag: "tibet_neutral" },
            "Демократия":  { name: "Тибет",              nameEn: "Tibet",              leader: "Далай-Лама XIII",         leaderEn: "13th Dalai Lama",         color: "#3b82f6", flag: "tibet_neutral" },
        }
    },
    ccp: {
        name: "Коммунистический Китай",
        nameEn: "Chinese Communists",
        ideology: "Коммунизм",
        ideologies: {
            "Коммунизм":  { name: "Коммунистический Китай", nameEn: "Chinese Communists", leader: "Мао Цзэдун",              leaderEn: "Mao Zedong",             color: "#cc0000", flag: "ccp_communist" },
            "Фашизм":     { name: "Коммунистический Китай", nameEn: "Chinese Communists", leader: "Мао Цзэдун",              leaderEn: "Mao Zedong",             color: "#990000", flag: "ccp_communist" },
            "Демократия":  { name: "Коммунистический Китай", nameEn: "Chinese Communists", leader: "Чжу Дэ",                  leaderEn: "Zhu De",                 color: "#3b82f6", flag: "ccp_communist" },
            "Нейтралитет": { name: "Коммунистический Китай", nameEn: "Chinese Communists", leader: "Мао Цзэдун",              leaderEn: "Mao Zedong",             color: "#6b7280", flag: "ccp_communist" },
        }
    },
    ma_clique: {
        name: "Сибэй Сань-Ма",
        nameEn: "Ma Clique",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Сибэй Сань-Ма",    nameEn: "Ma Clique",            leader: "Ма Буфан",               leaderEn: "Ma Bufang",             color: "#8b4513", flag: "ma_clique_neutral" },
            "Фашизм":      { name: "Сибэй Сань-Ма",    nameEn: "Ma Clique",            leader: "Ма Буфан",               leaderEn: "Ma Bufang",             color: "#dc2626", flag: "ma_clique_neutral" },
            "Демократия":  { name: "Сибэй Сань-Ма",    nameEn: "Ma Clique",            leader: "Ма Буфан",               leaderEn: "Ma Bufang",             color: "#3b82f6", flag: "ma_clique_neutral" },
            "Коммунизм":   { name: "Сибэй Сань-Ма",    nameEn: "Ma Clique",            leader: "Ма Буфан",               leaderEn: "Ma Bufang",             color: "#990000", flag: "ma_clique_neutral" },
        }
    },
    yunnan: {
        name: "Юньнаньская клика",
        nameEn: "Yunnan Clique",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Юньнаньская клика", nameEn: "Yunnan Clique",       leader: "Лунь Юнь",               leaderEn: "Long Yun",              color: "#228b22", flag: "yunnan_neutral" },
            "Фашизм":      { name: "Юньнаньская клика", nameEn: "Yunnan Clique",       leader: "Лунь Юнь",               leaderEn: "Long Yun",              color: "#dc2626", flag: "yunnan_neutral" },
            "Демократия":  { name: "Юньнаньская клика", nameEn: "Yunnan Clique",       leader: "Лунь Юнь",               leaderEn: "Long Yun",              color: "#3b82f6", flag: "yunnan_neutral" },
            "Коммунизм":   { name: "Юньнаньская клика", nameEn: "Yunnan Clique",       leader: "Лунь Юнь",               leaderEn: "Long Yun",              color: "#990000", flag: "yunnan_neutral" },
        }
    },
    guangxi: {
        name: "Новая Гуансийская клика",
        nameEn: "New Guangxi Clique",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Новая Гуансийская клика", nameEn: "New Guangxi Clique", leader: "Ли Цзунжэнь",           leaderEn: "Li Zongren",            color: "#2f4f4f", flag: "guangxi_neutral" },
            "Фашизм":      { name: "Новая Гуансийская клика", nameEn: "New Guangxi Clique", leader: "Ли Цзунжэнь",           leaderEn: "Li Zongren",            color: "#dc2626", flag: "guangxi_neutral" },
            "Демократия":  { name: "Новая Гуансийская клика", nameEn: "New Guangxi Clique", leader: "Ли Цзунжэнь",           leaderEn: "Li Zongren",            color: "#3b82f6", flag: "guangxi_neutral" },
            "Коммунизм":   { name: "Новая Гуансийская клика", nameEn: "New Guangxi Clique", leader: "Ли Цзунжэнь",           leaderEn: "Li Zongren",            color: "#990000", flag: "guangxi_neutral" },
        }
    },
    shanxi: {
        name: "Шаньси",
        nameEn: "Shanxi Clique",
        ideology: "Нейтралитет",
        ideologies: {
            "Нейтралитет": { name: "Шаньси",             nameEn: "Shanxi Clique",       leader: "Янь Сишань",             leaderEn: "Yan Xishan",            color: "#b8860b", flag: "shanxi_neutral" },
            "Фашизм":      { name: "Шаньси",             nameEn: "Shanxi Clique",       leader: "Янь Сишань",             leaderEn: "Yan Xishan",            color: "#dc2626", flag: "shanxi_neutral" },
            "Демократия":  { name: "Шаньси",             nameEn: "Shanxi Clique",       leader: "Янь Сишань",             leaderEn: "Yan Xishan",            color: "#3b82f6", flag: "shanxi_neutral" },
            "Коммунизм":   { name: "Шаньси",             nameEn: "Shanxi Clique",       leader: "Янь Сишань",             leaderEn: "Yan Xishan",            color: "#990000", flag: "shanxi_neutral" },
        }
    },
};

// Хелпер для получения данных по идеологии
export function getIdeologyData(countryId, ideology) {
    const c = COUNTRIES[countryId];
    if (!c) return { leader: "Неизвестно", color: "#666666", flag: countryId };
    if (c.ideologies && c.ideologies[ideology]) {
        return c.ideologies[ideology];
    }
    return { leader: c.leader || "Неизвестно", color: c.color || "#666666", flag: countryId };
}

// Для совместимости
export function getDefaultCountryInfo(id) {
    return COUNTRIES[id] || { name: id.toUpperCase(), color: "#666666", leader: "Неизвестно", ideology: "Нейтралитет" };
}
