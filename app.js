const subjects = [
  ['russian', 'Русский язык'], ['math', 'Математика'], ['informatics', 'Информатика'],
  ['biology', 'Биология'], ['social', 'Обществознание']
];
const subjectNames = Object.fromEntries(subjects);
const initialDirections = ['IT и технологии', 'Медицина', 'Бизнес', 'Образование', 'Медиа и дизайн'];
const initialCareers = [
  ['Разработчик', 'IT и технологии', ['math', 'informatics']],
  ['Аналитик данных', 'IT и технологии', ['math', 'informatics']],
  ['Врач', 'Медицина', ['biology', 'russian']],
  ['Биотехнолог', 'Медицина', ['biology', 'math']],
  ['Предприниматель', 'Бизнес', ['math', 'social']],
  ['Экономист', 'Бизнес', ['math', 'social']],
  ['Учитель', 'Образование', ['russian', 'social']],
  ['Психолог', 'Образование', ['biology', 'social']],
  ['Дизайнер', 'Медиа и дизайн', ['russian', 'informatics']],
  ['Журналист', 'Медиа и дизайн', ['russian', 'social']]
].map(([name, direction, required]) => ({ name, direction, required }));
const examples = [
  ['Анна Смирнова', '11А', [5, 5, 5, 4, 4], ['IT и технологии'], 'Разработчик', 'IT и технологии', 'success'],
  ['Михаил Петров', '11А', [4, 5, 5, 3, 4], ['Бизнес'], 'Аналитик данных', 'Бизнес', 'success'],
  ['София Кузнецова', '11Б', [5, 4, 3, 5, 4], ['Медицина'], 'Врач', 'Медицина', 'success'],
  ['Артём Волков', '11А', [4, 4, 4, 5, 3], ['Медицина'], 'Биотехнолог', 'Медицина', 'failure'],
  ['Дарья Попова', '11Б', [5, 4, 4, 4, 5], ['Бизнес'], 'Экономист', 'Бизнес', 'success'],
  ['Иван Соколов', '11А', [4, 3, 4, 3, 4], ['Медиа и дизайн'], 'Предприниматель', 'Медиа и дизайн', 'success'],
  ['Мария Васильева', '11Б', [5, 4, 4, 4, 5], ['Образование'], 'Учитель', 'Образование', 'success'],
  ['Даниил Морозов', '11А', [3, 3, 4, 4, 4], ['Образование'], 'Психолог', 'Образование', 'success'],
  ['Елизавета Новикова', '11Б', [5, 3, 5, 4, 4], ['Медиа и дизайн'], 'Дизайнер', 'Медиа и дизайн', 'success'],
  ['Кирилл Фёдоров', '11А', [5, 4, 4, 3, 5], ['Медиа и дизайн'], 'Журналист', 'Медиа и дизайн', 'failure'],
  ['Полина Михайлова', '11Б', [4, 5, 5, 4, 3], ['IT и технологии'], 'Разработчик', null, null],
  ['Максим Алексеев', '11А', [4, 4, 3, 5, 4], ['Медицина'], 'Врач', 'Медицина', 'success']
].map(([name, className, grades, interests, career, trial, result], i) => ({
  id: `demo-${i}`, name, className,
  grades: Object.fromEntries(subjects.map(([key], index) => [key, grades[index]])),
  interests, career, trials: trial ? [{ direction: trial, result, feedback: '' }] : [], conclusion: null
}));

const key = 'vektor-product-v1';
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
const defaultState = () => ({ students: examples, directions: initialDirections, careers: initialCareers, videos: [], requirementsUpdated: 'Демонстрационный перечень' });
let state;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && Array.isArray(saved.students) && Array.isArray(saved.directions) && Array.isArray(saved.careers) && Array.isArray(saved.videos)) state = saved;
} catch { /* Data may be unavailable in private mode. */ }
if (!state) {
  state = defaultState();
  try {
    const old = JSON.parse(localStorage.getItem('vektor-graduates-v1'));
    if (Array.isArray(old)) state.students = old.filter((row) => row && typeof row.name === 'string').map((row) => ({
      id: row.id || uid(), name: row.name, className: row.className || '', grades: row.grades || {},
      interests: [], career: row.career || '', trials: [], conclusion: null
    }));
  } catch { /* Keep demonstration data if the old format is unreadable. */ }
}
let role = 'admin';
let view = 'overview';
let selectedStudent = state.students[0]?.id || '';
let dialogAction = null;
let studentFilter = '';
let searchText = '';

const navs = {
  admin: [['overview', 'Обзор', '▦'], ['students', 'Выпускники', '♙'], ['report', 'Отчет и риски', '◇'], ['catalog', 'Справочники', '⌘']],
  counselor: [['queue', 'Выпускники', '♙'], ['conclusions', 'Заключения', '▤']],
  student: [['cabinet', 'Мой кабинет', '◈'], ['videos', 'Видеотека', '▷']],
  parent: [['cabinet', 'Кабинет ребенка', '◈'], ['videos', 'Видеотека', '▷']]
};
const signalNames = ['Выбор не связан с интересами', 'Неуспешная проба по профессии', 'Выбор отличается от успешной пробы', 'Низкие оценки по профильным предметам'];
const recommendations = [
  'Обсудить с учеником причины выбора профессии и сопоставить их с заявленными интересами.',
  'Разобрать результаты профпробы с педагогом-профориентологом и предложить повторную или альтернативную практику.',
  'Обсудить опыт успешной профпробы и причины выбора другого профессионального направления.',
  'Составить план поддержки по приоритетным предметам с итоговой оценкой 3 и ниже.'
];
const careerOf = (student) => state.careers.find((career) => career.name === student.career);
const grade = (student, subject) => { const value = Number(student.grades?.[subject]); return Number.isInteger(value) && value >= 2 && value <= 5 ? value : null; };
const incomplete = (student) => !careerOf(student) || !student.interests?.length || (careerOf(student).required || []).some((subject) => grade(student, subject) === null);
const signalBadge = (student) => signals(student).length ? badge(`${signals(student).length} сигнал(а)`, 'alert') : incomplete(student) ? badge('Недостаточно данных', 'neutral') : badge('Нет сигналов', 'good');

function signals(student) {
  const career = careerOf(student);
  if (!career) return [];
  const direction = career.direction;
  const result = [];
  if (student.interests?.length && !student.interests.includes(direction)) result.push({ type: 0, detail: `Интересы: ${student.interests.join(', ')}. Выбор: ${student.career}.` });
  if (student.trials?.some((trial) => trial.direction === direction && trial.result === 'failure')) result.push({ type: 1, detail: `Проба «${direction}» завершилась неуспешно.` });
  const other = student.trials?.find((trial) => trial.result === 'success' && trial.direction !== direction);
  if (other) result.push({ type: 2, detail: `Успешная проба: ${other.direction}. Выбор: ${student.career}.` });
  const weak = (career.required || []).filter((subject) => grade(student, subject) !== null && grade(student, subject) <= 3);
  if (weak.length) result.push({ type: 3, detail: weak.map((subject) => `${subjectNames[subject]} — ${grade(student, subject)}`).join(', ') });
  return result;
}

function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { alert('Не удалось сохранить данные в браузере. Возможно, хранилище переполнено.'); }
  render();
}
const studentById = (id) => state.students.find((student) => student.id === id);
const person = (student) => `<div class="person"><span class="avatar">${esc(student.name?.charAt(0).toUpperCase())}</span><div class="person-info"><strong>${esc(student.name)}</strong><small>${esc(student.className)} класс</small></div></div>`;
const badge = (text, style) => `<span class="badge ${style}">${esc(text)}</span>`;
const header = (eyebrow, title, description, actions = '') => `<div class="heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}<span>.</span></h1><p>${description}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
const button = (label, action, style = 'primary', extra = '') => `<button class="button ${style}" data-action="${action}" ${extra}>${label}</button>`;
const options = (items, selected = '', empty = 'Выберите') => `<option value="">${empty}</option>${items.map((item) => `<option value="${esc(item)}" ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('')}`;

function render() {
  if (!navs[role].some(([name]) => name === view)) view = navs[role][0][0];
  $('#navigation').innerHTML = navs[role].map(([name, label, symbol]) => `<button class="nav-button ${name === view ? 'active' : ''}" data-view="${name}"><span class="nav-symbol">${symbol}</span>${label}${name === 'students' ? `<span class="nav-count">${state.students.length}</span>` : ''}</button>`).join('');
  $('#currentPage').textContent = navs[role].find(([name]) => name === view)[1];
  $('#roleSelect').value = role;
  if ((role === 'student' || role === 'parent') && state.students.length) {
    if (!studentById(selectedStudent)) selectedStudent = state.students[0].id;
    $('#profileSlot').innerHTML = `<select id="profileSelect" aria-label="Выбрать демонстрационный профиль">${state.students.map((student) => `<option value="${esc(student.id)}" ${student.id === selectedStudent ? 'selected' : ''}>${esc(student.name)}</option>`).join('')}</select>`;
  } else $('#profileSlot').innerHTML = '';
  const renderers = { overview: renderOverview, students: renderStudents, report: renderReport, catalog: renderCatalog, queue: renderQueue, conclusions: renderConclusions, cabinet: renderCabinet, videos: renderVideos };
  $('#content').innerHTML = renderers[view]();
}

function renderOverview() {
  const all = state.students.flatMap(signals);
  const atRisk = state.students.filter((student) => signals(student).length).length;
  const withTrial = state.students.filter((student) => student.trials?.length).length;
  const stats = [
    ['Выпускников', state.students.length, 'в базе школы', '♙'],
    ['Нужна консультация', atRisk, 'есть хотя бы один сигнал', '◇'],
    ['Прошли профпробы', withTrial, 'выпускников с результатом', '✳'],
    ['Заключений', state.students.filter((student) => student.conclusion?.text).length, 'сохранены педагогом', '▤']
  ];
  const riskCounts = signalNames.map((_, i) => all.filter((signal) => signal.type === i).length);
  const gradeRows = subjects.map(([key, label]) => { const grades = state.students.map((student) => grade(student, key)).filter((value) => value !== null); return [label, grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : '—']; });
  return header('УПРАВЛЕНЧЕСКАЯ ПАНЕЛЬ', 'Решения на основе данных', 'Сигналы помогают заметить расхождения между интересами, опытом и выбором выпускников.', button('↓ &nbsp; Отчет в PDF', 'print', 'secondary') + button('Открыть сигналы →', 'go-report')) +
    `<div class="section-label"><span>СИТУАЦИЯ В ШКОЛЕ</span><span>Демонстрационные данные · 2025 / 2026</span></div><div class="stats">${stats.map(([label, value, note, icon]) => `<div class="stat"><span class="stat-label">${label}</span><span class="stat-icon">${icon}</span><strong>${value}</strong><small>${note}</small></div>`).join('')}</div>` +
    `<div class="grid-two"><section class="panel"><div class="panel-head"><div><span class="overline">ЗОНЫ ВНИМАНИЯ</span><h2>Типы выявленных сигналов</h2></div><span class="panel-sub">По выпускникам</span></div><div class="risk-list">${signalNames.map((name, i) => `<div class="risk-line"><span class="risk-dot" style="background:${['#e3a16c', '#a190bf', '#769db6', '#dc957b'][i]}"></span><span class="risk-name">${name}</span><strong>${riskCounts[i]}</strong></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><span class="overline">ИТОГИ ГОДА</span><h2>Средние оценки по предметам</h2></div><span class="panel-sub">Шкала 2–5</span></div>${gradeRows.map(([label, value]) => `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${value === '—' ? 0 : Number(value) * 20}%"></div></div><strong>${value}</strong></div>`).join('')}</section></div>` +
    `<section class="panel table-panel"><div class="table-header"><h2>Выпускники, которым стоит уделить внимание</h2><button class="mini-button" data-action="go-report">Посмотреть все →</button></div><div class="table-scroll"><table><thead><tr><th>ВЫПУСКНИК</th><th>ВЫБРАННАЯ ПРОФЕССИЯ</th><th>СИГНАЛЫ</th><th>ЗАКЛЮЧЕНИЕ</th></tr></thead><tbody>${state.students.filter((student) => signals(student).length).slice(0, 6).map((student) => `<tr><td>${person(student)}</td><td><strong>${esc(student.career || 'Не выбрана')}</strong></td><td>${badge(`${signals(student).length} сигнал(а)`, 'alert')}</td><td>${student.conclusion?.text ? badge('Готово', 'good') : badge('Не подготовлено', 'neutral')}</td></tr>`).join('') || '<tr><td class="empty" colspan="4">Сигналов пока нет.</td></tr>'}</tbody></table></div></section>`;
}

function renderStudents() {
  const filtered = state.students.filter((student) => `${student.name} ${student.className} ${student.career}`.toLocaleLowerCase('ru').includes(searchText.toLocaleLowerCase('ru')) && (!studentFilter || (studentFilter === 'risk' ? signals(student).length : !signals(student).length)));
  return header('СПИСОК ВЫПУСКНИКОВ', 'Профили учеников', 'Профессии и интересы указывает ученик. Оценки загружаются из школьной системы.', button('+ Добавить выпускника', 'add-student')) +
    `<section class="panel table-panel"><div class="table-header"><h2>Все выпускники · ${filtered.length}</h2><div class="table-tools"><input class="search" id="studentSearch" type="search" placeholder="Имя, класс или профессия" aria-label="Поиск" value="${esc(searchText)}"><select class="filter-select" id="riskFilter" aria-label="Фильтр"><option value="" ${!studentFilter ? 'selected' : ''}>Все</option><option value="risk" ${studentFilter === 'risk' ? 'selected' : ''}>С сигналами</option><option value="clear" ${studentFilter === 'clear' ? 'selected' : ''}>Без сигналов</option></select></div></div><div class="table-scroll"><table><thead><tr><th>ВЫПУСКНИК</th><th>ПРОФЕССИЯ</th><th>ИНТЕРЕСЫ</th><th>ПРОФПРОБЫ</th><th>СИГНАЛЫ</th><th></th></tr></thead><tbody>${filtered.map((student) => `<tr><td>${person(student)}</td><td><strong>${esc(student.career || 'Не выбрана')}</strong></td><td>${esc(student.interests?.join(', ') || 'Не указаны')}</td><td>${student.trials?.length || 0}</td><td>${signalBadge(student)}</td><td><button class="mini-button" data-action="student-detail" data-id="${esc(student.id)}">Открыть</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Выпускники не найдены.</td></tr>'}</tbody></table></div></section>`;
}

function renderReport() {
  const riskStudents = state.students.filter((student) => signals(student).length);
  const groups = [...new Set(state.students.map((student) => student.className))].sort();
  return header('УПРАВЛЕНЧЕСКИЙ ОТЧЕТ', 'Сигналы и рекомендации', 'Четыре проверяемых признака; отсутствие данных не считается отрицательным результатом.', button('↓ &nbsp; Сохранить как PDF', 'print')) +
    `<div class="callout"><div><strong>${riskStudents.length} из ${state.students.length} выпускников требуют внимания</strong><p>В PDF попадут сводка по классам, список сигналов поименно и рекомендации. Заключения педагога включаются, если сохранены.</p></div>${badge('Порог оценок: 3 и ниже', 'good')}</div>` +
    `<div class="cards" style="margin-bottom:17px">${groups.map((group) => { const inClass = state.students.filter((student) => student.className === group); return `<div class="detail-card"><span class="overline">КЛАСС ${esc(group)}</span><h2 style="margin:9px 0">${inClass.filter((student) => signals(student).length).length} из ${inClass.length} с сигналами</h2><span class="subline">${inClass.filter((student) => student.conclusion?.text).length} заключений подготовлено</span></div>`; }).join('')}</div>` +
    `<section class="panel table-panel"><div class="table-header"><h2>Поименный список</h2><span class="panel-sub">${riskStudents.length} выпускников</span></div><div class="table-scroll"><table><thead><tr><th>ВЫПУСКНИК</th><th>ПРОФЕССИЯ</th><th>ВЫЯВЛЕНО</th><th>РЕКОМЕНДАЦИЯ</th></tr></thead><tbody>${riskStudents.map((student) => `<tr><td>${person(student)}</td><td><strong>${esc(student.career)}</strong></td><td>${signals(student).map((item) => `<div style="margin:4px 0">${badge(signalNames[item.type], 'alert')}</div>`).join('')}</td><td style="max-width:360px;white-space:normal">${esc(student.conclusion?.text || recommendations[signals(student)[0].type])}</td></tr>`).join('') || '<tr><td class="empty" colspan="4">Сигналов нет.</td></tr>'}</tbody></table></div></section>`;
}

function renderCatalog() {
  return header('НАСТРОЙКИ ШКОЛЫ', 'Справочники и данные', 'Управляйте профессиями, направлениями, видео и обновляйте годовые оценки и требования к предметам.', button('Загрузить оценки CSV', 'upload-grades', 'secondary') + button('Обновить предметы CSV', 'upload-requirements')) +
    `<div class="callout"><div><strong>Импорт без подключения к школьной системе</strong><p>Пока формат интеграции неизвестен, оценки загружаются из CSV. Приоритетные предметы обновляются отдельным CSV. Встречающиеся варианты требований объединяются внутри профессии.</p></div></div>` +
    `<div class="grid-two"><section class="panel"><div class="panel-head"><div><span class="overline">НАПРАВЛЕНИЯ ИНТЕРЕСОВ</span><h2>Направления · ${state.directions.length}</h2></div><button class="mini-button" data-action="add-direction">+ Добавить</button></div><div class="row-stack">${state.directions.map((direction) => `<div class="split-item"><strong>${esc(direction)}</strong><div><button class="mini-button" data-action="edit-direction" data-name="${esc(direction)}">Изменить</button> <button class="mini-button" data-action="delete-direction" data-name="${esc(direction)}">×</button></div></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><span class="overline">СПРАВОЧНИК</span><h2>Профессии · ${state.careers.length}</h2></div><button class="mini-button" data-action="add-career">+ Добавить</button></div><div class="row-stack">${state.careers.map((career) => `<div class="split-item"><div><strong>${esc(career.name)}</strong><small>${esc(career.direction)} · ${esc((career.required || []).map((subject) => subjectNames[subject]).join(', ') || 'предметы не загружены')}</small></div><div><button class="mini-button" data-action="edit-career" data-name="${esc(career.name)}">Изменить</button> <button class="mini-button" data-action="delete-career" data-name="${esc(career.name)}">×</button></div></div>`).join('')}</div></section></div>` +
    `<div class="grid-two"><section class="panel"><div class="panel-head"><div><span class="overline">ВИДЕОТЕКА</span><h2>Видео о профессиях</h2></div><button class="mini-button" data-action="add-video">+ Добавить ссылку</button></div><div class="row-stack">${state.videos.map((video) => `<div class="split-item"><div><strong>${esc(video.title)}</strong><small>${esc(video.career || 'Все профессии')}</small></div><button class="mini-button" data-action="delete-video" data-id="${esc(video.id)}">×</button></div>`).join('') || '<p class="hint">Добавьте ссылки на видеоролики с внешних площадок.</p>'}</div></section><section class="panel"><span class="overline">ФОРМАТЫ ЗАГРУЗКИ</span><h2>Обновление данных</h2><p><strong>Оценки:</strong> столбцы <code>имя;класс;русский язык;математика;информатика;биология;обществознание</code>. Допускаются только оценки 2–5. Неуказанные предметы не изменяются.</p><p><strong>Предметы:</strong> столбцы <code>профессия;предметы</code>. В ячейке разделяйте предметы знаком <code>|</code>; несколько строк для профессии объединяются. Обновление заменяет ее предыдущий список.</p><p class="hint">Последнее обновление перечня: ${esc(state.requirementsUpdated || 'нет данных')}. Файлы должны быть в UTF-8, разделитель столбцов — точка с запятой.</p></section></div>`;
}

function renderQueue() {
  return header('РАБОТА ПРОФОРИЕНТОЛОГА', 'Путь каждого ученика', 'Фиксируйте результаты профпроб и готовьте индивидуальные заключения.', button('+ Записать профпробу', 'add-trial')) +
    `<section class="panel table-panel"><div class="table-header"><h2>Выпускники · ${state.students.length}</h2><span class="panel-sub">Заключение доступно семье после сохранения</span></div><div class="table-scroll"><table><thead><tr><th>ВЫПУСКНИК</th><th>ПРОФЕССИЯ</th><th>ПРОФПРОБЫ</th><th>СИГНАЛЫ</th><th>ЗАКЛЮЧЕНИЕ</th><th></th></tr></thead><tbody>${state.students.map((student) => `<tr><td>${person(student)}</td><td><strong>${esc(student.career || 'Не выбрана')}</strong></td><td>${student.trials?.length || 0}</td><td>${signalBadge(student)}</td><td>${student.conclusion?.text ? badge('Опубликовано', 'good') : badge('Не готово', 'neutral')}</td><td><button class="mini-button" data-action="student-detail" data-id="${esc(student.id)}">Открыть</button></td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderConclusions() {
  return header('КОНСУЛЬТАЦИИ', 'Заключения', 'Программа предлагает рекомендации по сигналам; педагог редактирует текст перед публикацией.') +
    `<div class="cards">${state.students.map((student) => `<div class="detail-card"><div class="split-item"><div>${person(student)}</div>${student.conclusion?.text ? badge('Опубликовано', 'good') : badge('Не готово', 'neutral')}</div><p>${esc(student.conclusion?.text || (signals(student).length ? `${signals(student).length} сигнал(а). Откройте карточку, чтобы подготовить заключение.` : 'Нет сигналов. Заключение можно подготовить после беседы.'))}</p><button class="mini-button" data-action="student-detail" data-id="${esc(student.id)}">${student.conclusion?.text ? 'Редактировать' : 'Подготовить'} →</button></div>`).join('') || '<p class="hint">Выпускников пока нет.</p>'}</div>`;
}

function renderCabinet() {
  const student = studentById(selectedStudent);
  if (!student) return header('ЛИЧНЫЙ КАБИНЕТ', 'Нет данных', 'Профиль выпускника пока не создан.');
  const editable = role === 'student';
  const career = careerOf(student);
  return header(editable ? 'ЛИЧНЫЙ КАБИНЕТ' : 'КАБИНЕТ РЕБЕНКА', student.name, editable ? 'Твои интересы, результаты и следующий шаг к профессии.' : 'Результаты, интересы и заключение доступны только для просмотра.', editable ? button('Изменить интересы и выбор', 'edit-choice') : '') +
    `<div class="callout"><div><strong>${esc(student.career || 'Профессия пока не выбрана')}</strong><p>${career ? `Направление: ${esc(career.direction)}. Приоритетные предметы: ${esc((career.required || []).map((key) => subjectNames[key]).join(', ') || 'пока не определены')}.` : 'Выберите профессию, чтобы увидеть приоритетные предметы и персональные сигналы.'}</p></div>${badge(`${esc(student.className)} класс`, 'good')}</div>` +
    `<div class="cards"><section class="detail-card"><span class="overline">ЧТО ИНТЕРЕСНО</span><h2 style="margin-top:8px">Мои интересы</h2><div class="pill-list">${student.interests?.length ? student.interests.map((interest) => `<span class="pill selected">${esc(interest)}</span>`).join('') : '<p class="hint">Интересы пока не выбраны.</p>'}</div></section><section class="detail-card"><span class="overline">ИТОГОВЫЕ ОЦЕНКИ ЗА ГОД</span><h2 style="margin-top:8px">Предметы</h2><div class="row-stack">${subjects.map(([key, label]) => `<div class="split-item"><strong>${label}${career?.required?.includes(key) ? ' · профильный' : ''}</strong>${badge(grade(student, key) ?? '—', career?.required?.includes(key) && grade(student, key) !== null && grade(student, key) <= 3 ? 'alert' : 'neutral')}</div>`).join('')}</div></section><section class="detail-card"><span class="overline">ПРАКТИЧЕСКИЙ ОПЫТ</span><h2 style="margin-top:8px">Профпробы</h2>${student.trials?.length ? student.trials.map((trial, index) => `<div class="split-item"><div><strong>${esc(trial.direction)}</strong><small>${trial.feedback ? `Мой отзыв: ${esc(trial.feedback)}` : 'Отзыв пока не оставлен'}</small>${editable ? `<button class="mini-button" style="margin-top:9px" data-action="feedback" data-index="${index}">Оставить отзыв</button>` : ''}</div>${badge(trial.result === 'success' ? 'Успешно' : 'Неуспешно', trial.result === 'success' ? 'good' : 'alert')}</div>`).join('') : '<p class="hint">Результатов профпроб пока нет.</p>'}</section><section class="detail-card"><span class="overline">РЕЗУЛЬТАТ КОНСУЛЬТАЦИИ</span><h2 style="margin-top:8px">Заключение педагога</h2>${student.conclusion?.text ? `<p>${esc(student.conclusion.text)}</p><span class="subline">Сохранено ${esc(student.conclusion.savedAt || '')}</span>` : '<p class="hint">Педагог-профориентолог пока не подготовил заключение.</p>'}</section></div>` +
    `<section class="panel" style="margin-top:17px"><div class="panel-head"><div><span class="overline">НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</span><h2>Персональные сигналы</h2></div></div>${signals(student).length ? signals(student).map((signal) => `<div class="signal"><b>!</b><div><strong>${signalNames[signal.type]}</strong><br>${esc(signal.detail)}</div></div>`).join('') : '<div class="signal ok">Пока нет сигналов по заполненным данным.</div>'}<p class="hint">Сигналы помогают подготовиться к беседе, но не ограничивают выбор профессии.</p></section>`;
}

function renderVideos() {
  return header('ИССЛЕДУЙ ПРОФЕССИИ', 'Видеотека', 'Материалы о востребованных профессиях, которые добавила администрация школы.') +
    `<div class="cards">${state.videos.map((video) => `<article class="detail-card"><span class="overline">ВИДЕО О ПРОФЕССИИ</span><h2 style="margin-top:11px">${esc(video.title)}</h2><p>${esc(video.career || 'Разные профессии')}</p><a class="video-link" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer">Смотреть на внешней площадке ↗</a></article>`).join('') || '<div class="detail-card"><h2>Здесь появятся видео</h2><p>Администрация добавит ссылки на ролики о профессиях. Пока видеотека пуста.</p></div>'}</div>`;
}

function studentDetail(id) {
  const student = studentById(id);
  if (!student || !['admin', 'counselor'].includes(role)) return;
  const risk = signals(student);
  const controls = role === 'admin' ? `${button('Изменить карточку', 'edit-student', 'secondary', `data-id="${esc(id)}"`)}${button('Удалить', 'delete-student', 'secondary', `data-id="${esc(id)}"`)}` : `${button('+ Профпроба', 'add-trial', 'secondary', `data-id="${esc(id)}"`)}${button('Подготовить заключение', 'edit-conclusion', 'primary', `data-id="${esc(id)}"`)}`;
  $('#content').innerHTML = header('ПРОФИЛЬ ВЫПУСКНИКА', esc(student.name), `${esc(student.className)} класс · ${esc(student.career || 'Профессия не выбрана')}`, `<button class="button secondary" data-action="back">← Назад</button>${controls}`) +
    `<div class="grid-two"><section class="panel"><span class="overline">ИНТЕРЕСЫ И ВЫБОР</span><h2>Профессиональный маршрут</h2><p>Интересы: <strong>${esc(student.interests?.join(', ') || 'не указаны')}</strong></p><p>Профессия: <strong>${esc(student.career || 'не выбрана')}</strong></p><p>Приоритетные предметы: <strong>${esc((careerOf(student)?.required || []).map((key) => subjectNames[key]).join(', ') || 'не определены')}</strong></p></section><section class="panel"><span class="overline">ОЦЕНКИ ЗА ГОД</span><h2>Школьные предметы</h2>${subjects.map(([key, label]) => `<div class="split-item" style="margin-top:12px"><strong>${label}</strong>${badge(grade(student, key) ?? '—', grade(student, key) !== null && grade(student, key) <= 3 && careerOf(student)?.required?.includes(key) ? 'alert' : 'neutral')}</div>`).join('')}</section><section class="panel"><span class="overline">ПРОФПРОБЫ</span><h2>Практический опыт</h2>${student.trials?.map((trial, index) => `<div class="split-item" style="margin-top:15px"><div><strong>${esc(trial.direction)}</strong><small>Отзыв: ${esc(trial.feedback || 'не оставлен')}</small></div><div>${badge(trial.result === 'success' ? 'Успешно' : 'Неуспешно', trial.result === 'success' ? 'good' : 'alert')}${role === 'counselor' ? ` <button class="mini-button" data-action="edit-trial" data-id="${esc(id)}" data-index="${index}">Изменить</button>` : ''}</div></div>`).join('') || '<p class="hint">Профпроб пока нет.</p>'}</section><section class="panel"><span class="overline">КОНСУЛЬТАЦИЯ</span><h2>Заключение</h2><p>${esc(student.conclusion?.text || 'Заключение пока не подготовлено.')}</p>${student.conclusion?.savedAt ? `<p class="hint">Сохранено ${esc(student.conclusion.savedAt)}</p>` : ''}</section></div>` +
    `<section class="panel"><span class="overline">ПЕРСОНАЛЬНЫЙ АНАЛИЗ</span><h2>Сигналы и предложения</h2>${risk.length ? risk.map((signal) => `<div class="signal"><b>!</b><div><strong>${signalNames[signal.type]}</strong><br>${esc(signal.detail)}<br><span class="hint">${recommendations[signal.type]}</span></div></div>`).join('') : '<div class="signal ok">По заполненным данным сигналов нет.</div>'}</section>`;
}

function openDialog(title, fields, submit) {
  $('#dialogTitle').textContent = title;
  $('#dialogFields').innerHTML = fields;
  dialogAction = submit;
  $('#editDialog').showModal();
  $('#dialogFields').querySelector('input,select,textarea')?.focus();
}
function errorDialog(message) {
  let error = $('#dialogFields .form-error');
  if (!error) { error = document.createElement('p'); error.className = 'form-error'; $('#dialogFields').append(error); }
  error.textContent = message;
}
const field = (label, input) => `<label class="field">${label}${input}</label>`;
const input = (name, value = '', attrs = '') => `<input name="${name}" value="${esc(value)}" ${attrs}>`;

function editStudent(student = null) {
  if (role !== 'admin') return;
  openDialog(student ? 'Изменить выпускника' : 'Добавить выпускника', `<div class="form-grid">${field('Фамилия и имя', input('name', student?.name, 'required maxlength="80"'))}${field('Класс', input('className', student?.className, 'required maxlength="12"'))}</div><p class="hint">Интересы и профессию ученик указывает в своем кабинете. Итоговые оценки загружаются из школьной системы.</p>`, (data) => {
    const name = String(data.get('name') || '').trim().replace(/\s+/g, ' ');
    const className = String(data.get('className') || '').trim();
    if (!name || !className) return 'Укажите имя и класс.';
    if (state.students.some((item) => item.id !== student?.id && item.name.toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru') && item.className.toLocaleLowerCase('ru') === className.toLocaleLowerCase('ru'))) return 'Выпускник с таким именем и классом уже есть.';
    if (student) { student.name = name; student.className = className; }
    else state.students.push({ id: uid(), name, className, grades: {}, interests: [], career: '', trials: [], conclusion: null });
  });
}

function editChoice() {
  if (role !== 'student') return;
  const student = studentById(selectedStudent);
  if (!student) return;
  openDialog('Мои интересы и профессия', `<p class="hint">Выберите одно или несколько интересных направлений.</p><div class="checkbox-grid">${state.directions.map((direction) => `<label class="check-option"><input type="checkbox" name="interest" value="${esc(direction)}" ${student.interests?.includes(direction) ? 'checked' : ''}>${esc(direction)}</label>`).join('')}</div><div class="separator"></div>${field('Профессия', `<select name="career">${options(state.careers.map((career) => career.name), student.career, 'Пока не выбрана')}</select>`)}`, (data) => {
    student.interests = data.getAll('interest').filter((item) => state.directions.includes(item));
    student.career = state.careers.some((career) => career.name === data.get('career')) ? String(data.get('career')) : '';
  });
}

function editFeedback(index) {
  if (role !== 'student') return;
  const trial = studentById(selectedStudent)?.trials?.[index];
  if (!trial) return;
  openDialog('Отзыв о профпробе', `<p class="hint">${esc(trial.direction)} · ${trial.result === 'success' ? 'Успешно' : 'Неуспешно'}</p>${field('Что понравилось и что было сложно?', `<textarea name="feedback" maxlength="1000" placeholder="Расскажи о своем опыте">${esc(trial.feedback || '')}</textarea>`)}`, (data) => { trial.feedback = String(data.get('feedback') || '').trim(); });
}

function editTrial(studentId = '', index = -1) {
  if (role !== 'counselor') return;
  const student = studentById(studentId) || state.students[0];
  if (!student) return alert('Сначала добавьте выпускника.');
  const trial = student.trials?.[index];
  openDialog(trial ? 'Изменить результат профпробы' : 'Записать профпробу', `${field('Выпускник', `<select name="studentId" ${trial ? 'disabled' : ''}>${state.students.map((item) => `<option value="${esc(item.id)}" ${item.id === student.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.className)}</option>`).join('')}</select>`)}${field('Направление профпробы', `<select name="direction" required>${options(state.directions, trial?.direction)}</select>`)}${field('Результат', `<select name="result" required><option value="">Выберите статус</option><option value="success" ${trial?.result === 'success' ? 'selected' : ''}>Успешно</option><option value="failure" ${trial?.result === 'failure' ? 'selected' : ''}>Неуспешно</option></select>`)}<p class="hint">Отзыв о профпробе ученик оставляет сам в личном кабинете.</p>`, (data) => {
    const owner = trial ? student : studentById(String(data.get('studentId')));
    const direction = String(data.get('direction') || '');
    const result = String(data.get('result') || '');
    if (!owner || !state.directions.includes(direction) || !['success', 'failure'].includes(result)) return 'Выберите выпускника, направление и результат.';
    if (trial) { trial.direction = direction; trial.result = result; }
    else { owner.trials ||= []; owner.trials.push({ direction, result, feedback: '' }); }
  });
}

function editConclusion(id) {
  if (role !== 'counselor') return;
  const student = studentById(id);
  if (!student) return;
  const suggested = signals(student).map((signal) => recommendations[signal.type]).join('\n') || 'По заполненным данным значимых расхождений не выявлено. Рекомендуется обсудить интересы и дальнейший профессиональный маршрут.';
  openDialog(`Заключение: ${student.name}`, `<div class="info-strip">Программа предлагает текст по выявленным сигналам. Проверьте его, дополните результатами консультации и сохраните. После сохранения заключение сразу увидят ученик и родитель.</div>${field('Текст заключения', `<textarea name="text" required maxlength="5000" style="min-height:200px">${esc(student.conclusion?.text || suggested)}</textarea>`)}`, (data) => {
    const text = String(data.get('text') || '').trim();
    if (!text) return 'Введите текст заключения.';
    student.conclusion = { text, savedAt: new Date().toLocaleDateString('ru-RU') };
  });
}

function editDirection(oldName = '') {
  if (role !== 'admin') return;
  openDialog(oldName ? 'Изменить направление' : 'Новое направление', field('Название направления', input('name', oldName, 'required maxlength="70"')), (data) => {
    const name = String(data.get('name') || '').trim();
    if (!name || (name !== oldName && state.directions.includes(name))) return 'Укажите уникальное название.';
    if (oldName) {
      state.directions[state.directions.indexOf(oldName)] = name;
      state.careers.forEach((career) => { if (career.direction === oldName) career.direction = name; });
      state.students.forEach((student) => {
        student.interests = student.interests?.map((item) => item === oldName ? name : item) || [];
        student.trials?.forEach((trial) => { if (trial.direction === oldName) trial.direction = name; });
      });
    } else state.directions.push(name);
  });
}

function editCareer(oldName = '') {
  if (role !== 'admin') return;
  const career = state.careers.find((item) => item.name === oldName);
  openDialog(career ? 'Изменить профессию' : 'Новая профессия', `${field('Название профессии', input('name', oldName, 'required maxlength="80"'))}${field('Направление интересов', `<select name="direction">${options(state.directions, career?.direction)}</select>`)}<p class="hint">Приоритетные предметы обновляются через CSV требований. Учебные заведения в интерфейсе не отображаются.</p>`, (data) => {
    const name = String(data.get('name') || '').trim();
    const direction = String(data.get('direction') || '');
    if (!name || !state.directions.includes(direction) || (name !== oldName && state.careers.some((item) => item.name === name))) return 'Укажите уникальную профессию и направление.';
    if (career) {
      career.name = name; career.direction = direction;
      state.students.forEach((student) => { if (student.career === oldName) student.career = name; });
      state.videos.forEach((video) => { if (video.career === oldName) video.career = name; });
    } else state.careers.push({ name, direction, required: [] });
  });
}

function editVideo() {
  if (role !== 'admin') return;
  openDialog('Добавить видео', `${field('Название ролика', input('title', '', 'required maxlength="120"'))}${field('Ссылка на видео (https://)', input('url', '', 'type="url" required placeholder="https://..."'))}${field('Профессия', `<select name="career">${options(state.careers.map((career) => career.name), '', 'Для всех профессий')}</select>`)}`, (data) => {
    const title = String(data.get('title') || '').trim();
    const url = String(data.get('url') || '').trim();
    let parsed;
    try { parsed = new URL(url); } catch { return 'Введите корректную ссылку.'; }
    if (!title || parsed.protocol !== 'https:') return 'Укажите название и ссылку, начинающуюся с https://.';
    state.videos.push({ id: uid(), title, url: parsed.href, career: String(data.get('career') || '') });
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  const source = text.replace(/^\ufeff/, '');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { value += '"'; i++; }
      else if ((!quoted && value === '') || quoted) quoted = !quoted;
      else throw new Error('Неверный формат кавычек в CSV.');
    } else if (ch === ';' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += ch;
  }
  if (quoted) throw new Error('Незакрытая кавычка в CSV.');
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error('Файл должен содержать заголовок и хотя бы одну строку данных.');
  return rows;
}

function importGrades(text) {
  const rows = parseCsv(text);
  const header = rows.shift().map((value) => value.toLocaleLowerCase('ru'));
  const nameIndex = header.indexOf('имя'), classIndex = header.indexOf('класс');
  const column = subjects.map(([key, label]) => [key, header.indexOf(label.toLocaleLowerCase('ru'))]);
  if (nameIndex < 0 || classIndex < 0 || !column.some(([, index]) => index >= 0)) throw new Error('Нужны столбцы «имя», «класс» и хотя бы один предмет.');
  const updates = [], seen = new Set();
  rows.forEach((row, index) => {
    const name = row[nameIndex]?.trim(), className = row[classIndex]?.trim();
    if (!name || !className) throw new Error(`Строка ${index + 2}: не указаны имя или класс.`);
    const identity = `${name.toLocaleLowerCase('ru')}|${className.toLocaleLowerCase('ru')}`;
    if (seen.has(identity)) throw new Error(`Строка ${index + 2}: повтор выпускника.`);
    seen.add(identity);
    const grades = {};
    column.forEach(([key, position]) => {
      if (position < 0 || !row[position]) return;
      const value = Number(row[position]);
      if (!Number.isInteger(value) || value < 2 || value > 5) throw new Error(`Строка ${index + 2}: оценка «${subjectNames[key]}» должна быть от 2 до 5.`);
      grades[key] = value;
    });
    updates.push({ name, className, grades });
  });
  updates.forEach(({ name, className, grades }) => {
    let student = state.students.find((item) => item.name.toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru') && item.className.toLocaleLowerCase('ru') === className.toLocaleLowerCase('ru'));
    if (!student) { student = { id: uid(), name, className, grades: {}, interests: [], career: '', trials: [], conclusion: null }; state.students.push(student); }
    Object.assign(student.grades, grades);
  });
  return updates.length;
}

function importRequirements(text) {
  const rows = parseCsv(text);
  const header = rows.shift().map((value) => value.toLocaleLowerCase('ru'));
  const careerIndex = header.indexOf('профессия'), subjectsIndex = header.indexOf('предметы');
  if (careerIndex < 0 || subjectsIndex < 0) throw new Error('Нужны столбцы «профессия» и «предметы».');
  const changes = new Map();
  rows.forEach((row, index) => {
    const name = row[careerIndex];
    if (!state.careers.some((item) => item.name === name)) throw new Error(`Строка ${index + 2}: профессия «${name}» отсутствует в справочнике.`);
    const raw = row[subjectsIndex]?.split('|').map((item) => item.trim()).filter(Boolean) || [];
    if (!raw.length) throw new Error(`Строка ${index + 2}: нет предметов.`);
    const keys = raw.map((item) => subjects.find(([key, label]) => key === item.toLocaleLowerCase('ru') || label.toLocaleLowerCase('ru') === item.toLocaleLowerCase('ru'))?.[0]);
    if (keys.some((item) => !item)) throw new Error(`Строка ${index + 2}: неизвестный предмет. Проверьте написание.`);
    changes.set(name, [...new Set([...(changes.get(name) || []), ...keys])]);
  });
  state.careers.forEach((career) => { if (changes.has(career.name)) career.required = changes.get(career.name); });
  state.requirementsUpdated = new Date().toLocaleDateString('ru-RU');
  return changes.size;
}

function printReport() {
  if (role !== 'admin') return;
  const groups = [...new Set(state.students.map((student) => student.className))].sort();
  $('#printArea').innerHTML = `<div class="print-doc"><h1>Вектор · Отчет по профориентации</h1><p class="print-meta">Учебный год: 2025 / 2026 · Сформирован: ${new Date().toLocaleDateString('ru-RU')} · Требования к предметам: ${esc(state.requirementsUpdated || 'нет данных')}</p><p>Выпускников: ${state.students.length}. С сигналами: ${state.students.filter((student) => signals(student).length).length}. Профпробы: ${state.students.filter((student) => student.trials?.length).length}. Заключения: ${state.students.filter((student) => student.conclusion?.text).length}.</p><h2>Сводка по классам</h2><table><thead><tr><th>Класс</th><th>Выпускников</th><th>С сигналами</th><th>Заключений</th></tr></thead><tbody>${groups.map((group) => { const list = state.students.filter((student) => student.className === group); return `<tr><td>${esc(group)}</td><td>${list.length}</td><td>${list.filter((student) => signals(student).length).length}</td><td>${list.filter((student) => student.conclusion?.text).length}</td></tr>`; }).join('')}</tbody></table><h2>Поименные сигналы и рекомендации</h2>${state.students.filter((student) => signals(student).length).map((student) => `<div class="print-block"><strong>${esc(student.name)} · ${esc(student.className)} · ${esc(student.career)}</strong>${signals(student).map((signal) => `<p><b>${esc(signalNames[signal.type])}:</b> ${esc(signal.detail)}</p>`).join('')}${student.conclusion?.text ? `<p><b>Рекомендация педагога:</b> ${esc(student.conclusion.text)}</p>` : signals(student).map((signal) => `<p><b>Предложение программы:</b> ${esc(recommendations[signal.type])}</p>`).join('')}</div>`).join('') || '<p>Сигналов не выявлено.</p>'}<p class="print-meta">Сигналы носят информационный характер. Неуказанные интересы, профессии и отсутствующие оценки не считаются отрицательным результатом. PDF создается через системное окно печати браузера.</p></div>`;
  window.print();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-view]');
  if (!target) return;
  if (target.dataset.view && navs[role].some(([name]) => name === target.dataset.view)) {
    view = target.dataset.view;
    $('#sidebar').classList.remove('open');
    render(); window.scrollTo(0, 0); return;
  }
  const action = target.dataset.action, id = target.dataset.id, index = Number(target.dataset.index);
  if (action === 'go-report' && role === 'admin') { view = 'report'; render(); }
  if (action === 'back') render();
  if (action === 'student-detail') studentDetail(id);
  if (action === 'print') printReport();
  if (action === 'add-student') editStudent();
  if (action === 'edit-student' && role === 'admin') editStudent(studentById(id));
  if (action === 'delete-student' && role === 'admin') { const student = studentById(id); if (student && confirm(`Удалить ${student.name} и связанные данные?`)) { state.students = state.students.filter((item) => item.id !== id); save(); } }
  if (action === 'edit-choice') editChoice();
  if (action === 'feedback') editFeedback(index);
  if (action === 'add-trial') editTrial(id);
  if (action === 'edit-trial') editTrial(id, index);
  if (action === 'edit-conclusion') editConclusion(id);
  if (action === 'add-direction') editDirection();
  if (action === 'edit-direction') editDirection(target.dataset.name);
  if (action === 'delete-direction' && role === 'admin') {
    const name = target.dataset.name;
    if (state.careers.some((career) => career.direction === name) || state.students.some((student) => student.interests?.includes(name) || student.trials?.some((trial) => trial.direction === name))) alert('Направление используется в профессиях или карточках выпускников.');
    else if (confirm(`Удалить направление «${name}»?`)) { state.directions = state.directions.filter((item) => item !== name); save(); }
  }
  if (action === 'add-career') editCareer();
  if (action === 'edit-career') editCareer(target.dataset.name);
  if (action === 'delete-career' && role === 'admin') {
    const name = target.dataset.name;
    if (state.students.some((student) => student.career === name)) alert('Профессия выбрана выпускником. Сначала измените выбор в его кабинете.');
    else if (confirm(`Удалить профессию «${name}»?`)) { state.careers = state.careers.filter((item) => item.name !== name); state.videos.forEach((video) => { if (video.career === name) video.career = ''; }); save(); }
  }
  if (action === 'add-video') editVideo();
  if (action === 'delete-video' && role === 'admin' && confirm('Удалить ссылку на видео?')) { state.videos = state.videos.filter((video) => video.id !== id); save(); }
  if (action === 'upload-grades' && role === 'admin') $('#gradesFile').click();
  if (action === 'upload-requirements' && role === 'admin') $('#requirementsFile').click();
});

$('#roleSelect').addEventListener('change', (event) => { role = event.target.value; view = navs[role][0][0]; render(); });
$('#menuToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#closeDialog').addEventListener('click', () => $('#editDialog').close());
$('#cancelDialog').addEventListener('click', () => $('#editDialog').close());
$('#editForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!dialogAction) return;
  const error = dialogAction(new FormData(event.target));
  if (error) { errorDialog(error); return; }
  $('#editDialog').close();
  save();
});
document.addEventListener('input', (event) => { if (event.target.id === 'studentSearch') { searchText = event.target.value; const start = event.target.selectionStart; render(); $('#studentSearch')?.focus(); $('#studentSearch')?.setSelectionRange(start, start); } });
document.addEventListener('change', (event) => {
  if (event.target.id === 'riskFilter') { studentFilter = event.target.value; render(); }
  if (event.target.id === 'profileSelect') { selectedStudent = event.target.value; render(); }
});
for (const [selector, importer] of [['#gradesFile', importGrades], ['#requirementsFile', importRequirements]]) {
  $(selector).addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || role !== 'admin') return;
    try { const count = importer(await file.text()); save(); alert(`Загрузка завершена: ${count} записей обновлено.`); }
    catch (error) { alert(`Не удалось загрузить файл: ${error.message}`); }
  });
}
render();
