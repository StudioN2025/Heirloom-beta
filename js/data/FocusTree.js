// FocusTree.js — Загрузка фокусов из папки focuses/

export let FOCUS_TREE = {};

const FOCUS_FILES = [
    'focuses/germany.json',
    'focuses/france.json',
    'focuses/ussr.json',
    'focuses/uk.json',
    'focuses/poland.json',
    'focuses/italy.json',
    'focuses/luxembourg.json',
    'focuses/albania.json',
    'focuses/japan.json',
    'focuses/china.json',
    // Азия
    'focuses/manchukuo.json',
    'focuses/korea.json',
    'focuses/taiwan.json',
    'focuses/philippines.json',
    'focuses/burma.json',
    'focuses/vietnam.json',
    'focuses/laos.json',
    'focuses/cambodia.json',
    'focuses/indonesia.json',
    'focuses/malaysia.json',
    'focuses/nepal.json',
    'focuses/bhutan.json',
    'focuses/yemen.json',
    'focuses/oman.json',
    'focuses/kuwait.json',
    'focuses/bahrain.json',
    'focuses/qatar.json',
    'focuses/lebanon.json',
    'focuses/israel.json',
    'focuses/sudan.json',
    'focuses/ethiopia.json',
    'focuses/somalia.json',
    'focuses/eritrea.json',
    'focuses/tuva.json',
    'focuses/mongolia.json',
    'focuses/sinkiang.json',
    'focuses/tibet.json',
    'focuses/ccp.json',
    'focuses/ma_clique.json',
    'focuses/yunnan.json',
    'focuses/guangxi.json',
    'focuses/shanxi.json',
];

// Определяет эффект по названию и описанию фокуса
function guessEffect(name, desc) {
    const n = name.toLowerCase();
    const d = desc.toLowerCase();
    const joined = (n + ' ' + d);

    const effect = {};

    // Заводы
    if (joined.includes('завод') || joined.includes('промышл')) {
        const m = joined.match(/(\d+)\s*завод/);
        effect.factories = m ? parseInt(m[1]) : 3;
    }

    // Танки
    if (joined.includes('танк') && !joined.includes('противотанк')) {
        const m = joined.match(/(\d+)\s*танк/);
        effect.tanks = m ? parseInt(m[1]) : 2;
    }

    // Пехота / дивизии / войска
    if (joined.includes('дивизи') || joined.includes('войск') || joined.includes('пехот')) {
        const m = joined.match(/(\d+)\s*(?:дивиз|войск|пехот)/);
        effect.infantry = m ? parseInt(m[1]) : 3;
    }

    // Снаряжение
    if (joined.includes('снаряж')) {
        const m = joined.match(/(\d+)/);
        effect.equipment = m ? parseInt(m[1]) : 500;
    }

    // Люди
    if (joined.includes('призыв') || joined.includes('населени') || joined.includes('рекрут')) {
        effect.manpower = 5000;
    }

    // Порты
    if (joined.includes('порт') || joined.includes('верф')) {
        effect.ports = 1;
    }

    // Война
    if (joined.includes('война') || joined.includes('нападени') || joined.includes('атак')) {
        if (d.includes('польш')) effect.war = 'poland';
        else if (d.includes('франц')) effect.war = 'france';
        else if (d.includes('ссср') || d.includes('совет') || d.includes('восточ')) effect.war = 'ussr';
        else if (d.includes('финлянд')) effect.war = 'finland';
        else if (d.includes('британ') || d.includes('лондон')) effect.war = 'uk';
        else if (d.includes('сша') || d.includes('америк') || d.includes('пёрл')) effect.war = 'usa';
    }

    // Альянс
    if (joined.includes('альянс') || joined.includes('союз') || joined.includes('пакт')) {
        if (d.includes('итали')) effect.allies = ['italy'];
        if (d.includes('япон')) effect.allies = ['japan'];
        if (d.includes('румын')) effect.allies = ['romania'];
    }

    // Аннексия
    if (joined.includes('аннекс') || joined.includes('присоедин') || joined.includes('протекторат')) {
        if (d.includes('австри')) effect.annex = ['austria'];
        if (d.includes('чех') || d.includes('судет')) effect.annex = ['czechoslovakia'];
        if (d.includes('балтик') || d.includes('литва') || d.includes('латв') || d.includes('эстон')) effect.annex = ['lithuania', 'latvia', 'estonia'];
        if (d.includes('мемел')) effect.annex = ['lithuania'];
    }

    // Если ничего не нашли — даём хоть что-то
    if (Object.keys(effect).length === 0) {
        effect.equipment = 200;
    }

    return effect;
}

function convertFocusJSON(json, filename) {
    const result = [];

    const fname = filename.toLowerCase();
    let country = null;
    if (fname.includes('germany')) country = 'germany';
    else if (fname.includes('france')) country = 'france';
    else if (fname.includes('ussr')) country = 'ussr';
    else if (fname.includes('uk') || fname.includes('britain')) country = 'uk';
    else if (fname.includes('poland')) country = 'poland';
    else if (fname.includes('italy')) country = 'italy';
    else if (fname.includes('luxembourg')) country = 'luxembourg';
    else if (fname.includes('albania')) country = 'albania';
    else if (fname.includes('japan')) country = 'japan';
    else if (fname.includes('china')) country = 'china';
    else if (fname.includes('manchukuo')) country = 'manchukuo';
    else if (fname.includes('korea')) country = 'korea';
    else if (fname.includes('taiwan')) country = 'taiwan';
    else if (fname.includes('philippines')) country = 'philippines';
    else if (fname.includes('burma')) country = 'burma';
    else if (fname.includes('vietnam')) country = 'vietnam';
    else if (fname.includes('laos')) country = 'laos';
    else if (fname.includes('cambodia')) country = 'cambodia';
    else if (fname.includes('indonesia')) country = 'indonesia';
    else if (fname.includes('malaysia') || fname.includes('malaya')) country = 'malaysia';
    else if (fname.includes('nepal')) country = 'nepal';
    else if (fname.includes('bhutan')) country = 'bhutan';
    else if (fname.includes('yemen')) country = 'yemen';
    else if (fname.includes('oman')) country = 'oman';
    else if (fname.includes('kuwait')) country = 'kuwait';
    else if (fname.includes('bahrain')) country = 'bahrain';
    else if (fname.includes('qatar')) country = 'qatar';
    else if (fname.includes('lebanon')) country = 'lebanon';
    else if (fname.includes('israel')) country = 'israel';
    else if (fname.includes('sudan')) country = 'sudan';
    else if (fname.includes('ethiopia')) country = 'ethiopia';
    else if (fname.includes('somalia')) country = 'somalia';
    else if (fname.includes('eritrea')) country = 'eritrea';
    else if (fname.includes('tuva')) country = 'tuva';
    else if (fname.includes('mongolia')) country = 'mongolia';
    else if (fname.includes('sinkiang')) country = 'sinkiang';
    else if (fname.includes('tibet')) country = 'tibet';
    else if (fname.includes('ccp')) country = 'ccp';
    else if (fname.includes('ma_clique') || fname.includes('ma-clique')) country = 'ma_clique';
    else if (fname.includes('yunnan')) country = 'yunnan';
    else if (fname.includes('guangxi')) country = 'guangxi';
    else if (fname.includes('shanxi')) country = 'shanxi';
    if (!country) return result;

    // Формат 1: Editor — плоский объект { "id": { name, x, y, prereqs, effect } }
    const firstVal = Object.values(json)[0];
    if (firstVal && firstVal.name && firstVal.x !== undefined) {
        for (const [id, f] of Object.entries(json)) {
            result.push({
                id: country + '_' + id,
                name: f.name,
                desc: f.desc || '',
                icon: f.icon || '⭐',
                country: f.country || country,
                branch: f.branch || 'main',
                tier: f.tier || 0,
                x: f.x,
                y: f.y,
                prereqs: (f.prereqs || []).map(r => country + '_' + r),
                effect: f.effect || {},
            });
        }
        return result;
    }

    // Формат 2: DeepSeek — { "TreeName": { "Focuses": [...] } }
    for (const [treeKey, treeData] of Object.entries(json)) {
        if (!treeData || !treeData.Focuses) continue;
        const focuses = treeData.Focuses;
        if (!focuses || !focuses.length) continue;

        const nameToId = {};
        for (var fi = 0; fi < focuses.length; fi++) {
            nameToId[focuses[fi].name] = country + '_' + fi + '_' + focuses[fi].name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
        }

        const depthCache = {};
        function getDepth(name, seen) {
            if (depthCache[name] !== undefined) return depthCache[name];
            if (seen.has(name)) return 0;
            seen.add(name);
            const f = focuses.find(ff => ff.name === name);
            if (!f || !f.requirements || !f.requirements.length) { depthCache[name] = 0; return 0; }
            let maxD = 0;
            for (const r of f.requirements) {
                const d = getDepth(r, new Set(seen));
                if (d > maxD) maxD = d;
            }
            depthCache[name] = maxD + 1;
            return maxD + 1;
        }
        for (const f of focuses) getDepth(f.name, new Set());

        // Простое распределение по колонкам: глубина = tier для y, колонка для x
        const colCache = {};
        const visited = {};
        let nextCol = 0;

        // Обратная карта: name -> [имена, которые требуют этот фокус]
        const children = {};
        for (const f of focuses) {
            const id = nameToId[f.name];
            for (const r of (f.requirements || [])) {
                const rid = nameToId[r];
                if (!children[rid]) children[rid] = [];
                children[rid].push(id);
            }
        }

        // DFS от корней
        function dfs(id, col) {
            if (visited[id]) return;
            visited[id] = true;
            colCache[id] = col;
            const kids = children[id] || [];
            if (kids.length === 0) return;
            if (kids.length === 1) { dfs(kids[0], col); return; }
            for (let i = 0; i < kids.length; i++) {
                dfs(kids[i], col + i * 2);
            }
        }

        const roots = focuses.filter(f => !f.requirements || !f.requirements.length);
        for (const f of roots) {
            dfs(nameToId[f.name], nextCol);
            nextCol += 2;
        }

        // Fallback: недостижимые фокусы — после корней
        for (const f of focuses) {
            const id = nameToId[f.name];
            if (!visited[id]) {
                colCache[id] = nextCol++;
            }
        }

        for (const f of focuses) {
            const id = nameToId[f.name];
            const tier = depthCache[f.name] || 0;
            const col = colCache[id] ?? 0;
            const desc = (f.effects || []).join(', ') || '';
            const effect = f.effect || guessEffect(f.name, desc);

            result.push({
                id, name: f.name, desc, icon: f.icon || '⭐', country,
                x: f.x !== undefined ? f.x : 30 + col * 170,
                y: f.y !== undefined ? f.y : 40 + tier * 70,
                prereqs: (f.requirements || []).map(r => nameToId[r]).filter(Boolean),
                effect,
            });
        }
    }
    return result;
}

export async function loadFocusTree() {
    const allFocuses = {};
    for (const file of FOCUS_FILES) {
        try {
            const resp = await fetch(file);
            if (!resp.ok) continue;
            const json = await resp.json();
            const arr = convertFocusJSON(json, file);
            for (const f of arr) allFocuses[f.id] = f;
            console.log(`📋 ${file}: ${arr.length} фокусов`);
        } catch (e) { console.error(`❌ ${file}: ${e.message}`); }
    }
    FOCUS_TREE = allFocuses;
    console.log(`✅ Фокусов: ${Object.keys(FOCUS_TREE).length}`);
    return FOCUS_TREE;
}
