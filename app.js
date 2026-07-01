(function () {
  const STRINGS = window.DISPLAY_STRINGS || {};
  const page = document.body.dataset.page || 'home';

  const FIELD = {
    date: '日期',
    duration: '时长',
    note: '备注',
    scheduleName: '规划名称',
    scheduleStatus: '规划情况',
    scheduleProgress: '进度展示',
    scheduleProgressContent: '完成内容',
    scheduleRemark: '规划备注',
    essayTitle: '标题',
    name: '名字',
    path: 'path',
    scale: 'scale',
    x: 'x',
    y: 'y'
  };

  const state = {
    phone: [],
    learning: []
  };

  const chartCards = {
    phone: {
      mode: 'recent',
      panel: null,
      monthSelect: null
    },
    learning: {
      mode: 'recent',
      panel: null,
      monthSelect: null
    }
  };

  init().catch((error) => console.error(error));

  async function init() {
    applyShell();

    if (page === 'home') {
      await initHome();
    } else if (page === 'schedule') {
      await initSchedule();
    } else if (page === 'feelfree') {
      await initFeelFree();
    } else if (page === 'article') {
      await initArticle();
    } else if (page === 'other') {
      await initOther();
    }
  }

  function applyShell() {
    const navNode = document.querySelector('[data-role="sidebar-nav"]');
    if (navNode) {
      navNode.innerHTML = '';
      const items = [
        { key: 'home', href: './index.html', label: STRINGS.navHome },
        { key: 'schedule', href: './schedule.html', label: STRINGS.navSchedule },
        { key: 'feelfree', href: './feelfree.html', label: STRINGS.navFeelFree },
        { key: 'other', href: './other.html', label: STRINGS.navOther }
      ];

      for (const item of items) {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `sidebar-link${getNavKey(page) === item.key ? ' is-active' : ''}`;
        link.textContent = item.label;
        navNode.appendChild(link);
      }
    }

    document.title = getPageTitle(page);
  }

  function getNavKey(key) {
    return key === 'article' ? 'feelfree' : key;
  }

  function getPageTitle(key) {
    if (key === 'schedule') return STRINGS.navSchedule;
    if (key === 'feelfree' || key === 'article') return STRINGS.navFeelFree;
    if (key === 'other') return STRINGS.navOther;
    return STRINGS.navHome;
  }

  async function initHome() {
    setText('[data-mode-target="phone"] [data-mode="recent"]', STRINGS.modeRecent);
    setText('[data-mode-target="phone"] [data-mode="month"]', STRINGS.modeMonth);
    setText('[data-mode-target="learning"] [data-mode="recent"]', STRINGS.modeRecent);
    setText('[data-mode-target="learning"] [data-mode="month"]', STRINGS.modeMonth);
    setText('[data-role="reason-copy"]', STRINGS.reasonCopy);
    setAttribute('[data-role="phone-title-image"]', 'alt', STRINGS.phoneTitleAlt);
    setAttribute('[data-role="learning-title-image"]', 'alt', STRINGS.learningTitleAlt);
    setAttribute('[data-role="reason-image"]', 'alt', STRINGS.reasonImageAlt);

    chartCards.phone.panel = document.querySelector('[data-role="phone-chart"]');
    chartCards.phone.monthSelect = document.querySelector('[data-role="phone-month"]');
    chartCards.learning.panel = document.querySelector('[data-role="learning-chart"]');
    chartCards.learning.monthSelect = document.querySelector('[data-role="learning-month"]');

    const [phone, learning] = await Promise.all([
      loadJson('./data/OnThePhone.json'),
      loadJson('./data/Learning.json')
    ]);

    state.phone = Array.isArray(phone) ? phone : [];
    state.learning = Array.isArray(learning) ? learning : [];

    bindControls();
    renderAll();
  }

  async function initSchedule() {
    setAttribute('[data-role="schedule-image"]', 'alt', STRINGS.scheduleImageAlt);
    const list = document.querySelector('[data-role="schedule-list"]');
    const entries = await loadJson('./data/Schedule.json');
    renderScheduleList(list, Array.isArray(entries) ? entries : []);
  }

  async function initFeelFree() {
    setAttribute('[data-role="essay-image"]', 'alt', STRINGS.essayImageAlt);
    const list = document.querySelector('[data-role="essay-list"]');
    const entries = await loadJson('./data/FeelFree.json');
    renderEssayList(list, Array.isArray(entries) ? entries : []);
  }

  async function initArticle() {
    const detail = document.querySelector('[data-role="article-detail"]');
    const title = new URLSearchParams(window.location.search).get('title') || '';
    const entries = await loadJson('./data/FeelFree.json');
    const article = Array.isArray(entries)
      ? entries.find((entry) => entry[FIELD.essayTitle] === title)
      : null;

    if (!detail || !article) return;

    const body = await loadText(`./article/${encodeURIComponent(title)}.txt`);
    renderArticleDetail(detail, article, body);
    document.title = title;
  }

  async function initOther() {
    setText('[data-other-tab="yard"]', STRINGS.otherCloudYard);
    setText('[data-other-tab="wishes"]', STRINGS.otherWishList);

    const [plants, wishes] = await Promise.all([
      loadJson('./data/MyPlants.json'),
      loadJson('./data/Wishes.json')
    ]);

    renderCloudYard(
      document.querySelector('[data-other-panel="yard"]'),
      Array.isArray(plants) ? plants : []
    );
    renderWishList(
      document.querySelector('[data-other-panel="wishes"]'),
      Array.isArray(wishes) ? wishes : []
    );

    const buttons = document.querySelectorAll('[data-other-tab]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => switchOtherPanel(button.dataset.otherTab));
    });

    switchOtherPanel('yard');
  }

  function switchOtherPanel(activeKey) {
    document.querySelectorAll('[data-other-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.otherTab === activeKey);
    });

    document.querySelectorAll('[data-other-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.otherPanel === activeKey);
    });
  }

  function renderCloudYard(target, plants) {
    if (!target) return;
    target.innerHTML = '';

    const stage = document.createElement('div');
    stage.className = 'yard-stage';

    for (const plant of plants) {
      const item = document.createElement('div');
      item.className = 'yard-plant';
      item.style.left = `${Number(plant[FIELD.x]) || 0}px`;
      item.style.top = `${Number(plant[FIELD.y]) || 0}px`;
      item.style.setProperty('--plant-scale', String(Number(plant[FIELD.scale]) || 1));

      const image = document.createElement('img');
      image.className = 'yard-plant-image';
      image.src = normalizeLocalPath(plant[FIELD.path] || '');
      image.alt = plant[FIELD.name] || '';
      item.appendChild(image);

      const bubble = document.createElement('div');
      bubble.className = 'info-bubble yard-bubble';

      const name = document.createElement('div');
      name.className = 'info-bubble-name';
      name.textContent = plant[FIELD.name] || '';
      bubble.appendChild(name);

      const note = document.createElement('div');
      note.className = 'info-bubble-note fz-font';
      note.textContent = plant[FIELD.note] || '';
      bubble.appendChild(note);

      item.appendChild(bubble);
      stage.appendChild(item);
    }

    const topLayer = document.createElement('img');
    topLayer.className = 'yard-top-layer';
    topLayer.src = './picture/其他背景图层2.png';
    topLayer.alt = '';
    stage.appendChild(topLayer);

    target.appendChild(stage);
  }

  function renderWishList(target, wishes) {
    if (!target) return;
    target.innerHTML = '';

    const blocksPerBoard = getMondrianBlocks(0).filter((block) => block.color !== 'white').length;
    const boardCount = Math.max(1, Math.ceil(wishes.length / blocksPerBoard));

    for (let boardIndex = 0; boardIndex < boardCount; boardIndex += 1) {
      const canvas = document.createElement('div');
      canvas.className = 'mondrian-board';
      const blocks = getMondrianBlocks(boardIndex);
      let wishCursor = boardIndex * blocksPerBoard;

      blocks.forEach((block) => {
        const tile = document.createElement('div');
        tile.className = `mondrian-block mondrian-block--${block.color}`;
        tile.style.gridColumn = block.column;
        tile.style.gridRow = block.row;

        if (block.color !== 'white' && wishes[wishCursor]) {
          const wish = wishes[wishCursor];
          wishCursor += 1;

          const name = document.createElement('div');
          name.className = 'mondrian-wish-name';
          name.textContent = wish[FIELD.name] || '';
          tile.appendChild(name);

          const bubble = document.createElement('div');
          bubble.className = 'info-bubble wish-bubble';
          const note = document.createElement('div');
          note.className = 'info-bubble-note fz-font';
          note.textContent = wish[FIELD.note] || '';
          bubble.appendChild(note);
          tile.appendChild(bubble);
        }

        canvas.appendChild(tile);
      });

      target.appendChild(canvas);
    }
  }

  function getMondrianBlocks(variant) {
    const patterns = [
      [
      { color: 'white', column: '1 / 3', row: '1 / 3' },
      { color: 'red', column: '3 / 7', row: '1 / 5' },
      { color: 'yellow', column: '7 / 9', row: '1 / 2' },
      { color: 'white', column: '7 / 9', row: '2 / 5' },
      { color: 'blue', column: '1 / 3', row: '3 / 7' },
      { color: 'white', column: '3 / 5', row: '5 / 7' },
      { color: 'black', column: '5 / 7', row: '5 / 7' },
      { color: 'yellow', column: '7 / 9', row: '5 / 8' },
      { color: 'white', column: '1 / 5', row: '7 / 9' },
      { color: 'red', column: '5 / 8', row: '7 / 9' },
      { color: 'blue', column: '8 / 9', row: '8 / 9' }
      ],
      [
      { color: 'yellow', column: '1 / 3', row: '1 / 2' },
      { color: 'white', column: '3 / 6', row: '1 / 3' },
      { color: 'blue', column: '6 / 9', row: '1 / 4' },
      { color: 'red', column: '1 / 5', row: '2 / 6' },
      { color: 'black', column: '5 / 6', row: '3 / 6' },
      { color: 'white', column: '6 / 8', row: '4 / 7' },
      { color: 'yellow', column: '8 / 9', row: '4 / 9' },
      { color: 'white', column: '1 / 2', row: '6 / 9' },
      { color: 'blue', column: '2 / 5', row: '6 / 9' },
      { color: 'red', column: '5 / 8', row: '7 / 9' },
      { color: 'white', column: '6 / 8', row: '6 / 7' }
      ]
    ];
    return patterns[variant % patterns.length];
  }

  function renderScheduleList(target, entries) {
    if (!target) return;
    target.innerHTML = '';

    for (const entry of entries) {
      const statusValue = Number(entry[FIELD.scheduleStatus]);
      const item = document.createElement('article');
      item.className = `entry-item schedule-item ${getScheduleStateClass(statusValue)}`;

      const main = document.createElement('div');
      main.className = 'schedule-main';

      const name = document.createElement('div');
      name.className = 'schedule-name';
      name.textContent = entry[FIELD.scheduleName] || '';
      main.appendChild(name);

      const status = document.createElement('div');
      status.className = `schedule-status ${getStatusClass(statusValue)}`;
      status.textContent = getStatusText(statusValue);
      main.appendChild(status);

      const progressWrap = document.createElement('div');
      progressWrap.className = 'schedule-progress';

      const progressLabel = document.createElement('div');
      progressLabel.className = 'progress-label';
      progressLabel.textContent = STRINGS.progressLabel;
      progressWrap.appendChild(progressLabel);

      const beads = document.createElement('div');
      beads.className = 'progress-beads';

      const progressEntries = entry[FIELD.scheduleProgress] || [];
      progressEntries.forEach((progress, index) => {
        const progressItem = document.createElement('div');
        progressItem.className = `progress-item${index === progressEntries.length - 1 ? ' is-latest' : ''}`;

        const date = document.createElement('div');
        date.className = 'progress-date fz-font';
        date.textContent = progress[FIELD.date] || '';
        progressItem.appendChild(date);

        const content = document.createElement('div');
        content.className = 'progress-content fz-font';
        content.textContent = progress[FIELD.scheduleProgressContent] || '';
        progressItem.appendChild(content);

        beads.appendChild(progressItem);
      });

      progressWrap.appendChild(beads);
      main.appendChild(progressWrap);

      const remark = document.createElement('div');
      remark.className = 'schedule-remark fz-font';
      remark.textContent = entry[FIELD.scheduleRemark] || '';

      item.appendChild(main);
      item.appendChild(remark);
      target.appendChild(item);
    }
  }

  function renderEssayList(target, entries) {
    if (!target) return;
    target.innerHTML = '';

    for (const entry of entries) {
      const frame = document.createElement('div');
      frame.className = 'essay-hover-frame';

      const link = document.createElement('a');
      link.className = 'entry-item essay-item';
      link.href = `./article.html?title=${encodeURIComponent(entry[FIELD.essayTitle] || '')}`;

      const title = document.createElement('div');
      title.className = 'essay-title';
      title.textContent = entry[FIELD.essayTitle] || '';
      link.appendChild(title);

      const date = document.createElement('div');
      date.className = 'essay-date fz-font';
      date.textContent = entry[FIELD.date] || '';
      link.appendChild(date);

      frame.appendChild(link);
      target.appendChild(frame);
    }
  }

  function renderArticleDetail(target, article, body) {
    target.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'article-title';
    title.textContent = article[FIELD.essayTitle] || '';
    target.appendChild(title);

    const date = document.createElement('div');
    date.className = 'article-date fz-font';
    date.textContent = article[FIELD.date] || '';
    target.appendChild(date);

    const content = document.createElement('div');
    content.className = 'article-body fz-font';
    content.textContent = body;
    target.appendChild(content);
  }

  function getStatusText(status) {
    if (status === 1) return STRINGS.statusInProgress;
    if (status === 2) return STRINGS.statusDone;
    return STRINGS.statusNotStarted;
  }

  function getStatusClass(status) {
    if (status === 1) return 'status--progress';
    if (status === 2) return 'status--done';
    return 'status--todo';
  }

  function getScheduleStateClass(status) {
    if (status === 1) return 'schedule-item--progress';
    if (status === 2) return 'schedule-item--done';
    return 'schedule-item--todo';
  }

  function bindControls() {
    for (const key of Object.keys(chartCards)) {
      const card = chartCards[key];
      const buttons = document.querySelectorAll(`[data-mode-target="${key}"] [data-mode]`);

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          card.mode = button.dataset.mode;
          buttons.forEach((item) => item.classList.toggle('is-active', item === button));
          card.monthSelect.hidden = card.mode !== 'month';
          renderSection(key);
        });
      });

      card.monthSelect.addEventListener('change', () => renderSection(key));
    }
  }

  function renderAll() {
    renderSection('phone');
    renderSection('learning');
  }

  function renderSection(section) {
    const data = state[section];
    const card = chartCards[section];
    const isLearning = section === 'learning';
    const valueMap = groupByDate(data, FIELD.duration);
    const noteMap = isLearning ? groupByDate(data, FIELD.note) : null;
    const monthOptions = getMonthOptions(data);

    populateMonthSelect(card.monthSelect, monthOptions);

    const sortedDates = data
      .map((entry) => parseDateKey(entry[FIELD.date]))
      .sort((a, b) => a.getTime() - b.getTime());
    const latestDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : new Date();
    const selectedMonth = card.monthSelect.value || monthOptions[monthOptions.length - 1] || monthKey(latestDate);

    let start;
    let end;
    if (card.mode === 'month') {
      const monthDate = new Date(`${selectedMonth}-01T00:00:00`);
      start = startOfMonth(monthDate);
      end = endOfMonth(monthDate);
      card.monthSelect.hidden = false;
    } else {
      start = addDays(latestDate, -13);
      end = latestDate;
      card.monthSelect.hidden = true;
    }

    const series = buildSeries(start, end, valueMap, noteMap);

    renderChart({
      target: card.panel,
      title: isLearning ? STRINGS.learningChartTitle : STRINGS.phoneChartTitle,
      series,
      chartType: section,
      showNoteLegend: isLearning
    });
  }

  function populateMonthSelect(select, options) {
    if (!select) return;
    const current = select.value;
    const optionsKey = options.join('|');
    select.title = STRINGS.monthPlaceholder;
    select.setAttribute('aria-label', STRINGS.monthPlaceholder);

    if (select.dataset.optionsKey === optionsKey) {
      if (!current && options.length) {
        select.value = options[options.length - 1];
      }
      return;
    }

    select.innerHTML = '';

    for (const optionValue of options) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = formatMonth(optionValue);
      select.appendChild(option);
    }

    select.dataset.optionsKey = optionsKey;

    if (current && options.includes(current)) {
      select.value = current;
    } else if (options.length) {
      select.value = options[options.length - 1];
    }
  }

  function renderChart({ target, title, series, chartType, showNoteLegend }) {
    if (!target) return;
    target.innerHTML = '';

    if (!series.length) {
      target.innerHTML = `<div class="empty-state">${STRINGS.noDataText}</div>`;
      return;
    }

    const values = series.map((item) => item.value);
    const maxValue = chartType === 'phone' ? computeMax([...values, 60]) : computeMax(values);
    const width = 1000;
    const height = 380;
    const padding = { top: 20, right: 28, bottom: 92, left: 68 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const slotWidth = plotWidth / Math.max(series.length, 1);
    const barWidth = Math.min(18, Math.max(9, slotWidth * 0.5));

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-body';
    const noteLayer = document.createElement('div');
    noteLayer.className = 'note-marker-layer';

    const svg = createSvg('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);

    for (let i = 0; i <= 4; i += 1) {
      const ratio = i / 4;
      const y = padding.top + plotHeight * ratio;

      const axis = createSvg('text');
      axis.setAttribute('x', String(padding.left - 10));
      axis.setAttribute('y', String(y + 4));
      axis.setAttribute('text-anchor', 'end');
      axis.setAttribute('class', 'axis-label');
      axis.textContent = formatAxisValue(maxValue - (maxValue * ratio));
      svg.appendChild(axis);
    }

    const yAxis = createSvg('line');
    yAxis.setAttribute('x1', String(padding.left));
    yAxis.setAttribute('x2', String(padding.left));
    yAxis.setAttribute('y1', String(padding.top));
    yAxis.setAttribute('y2', String(padding.top + plotHeight));
    yAxis.setAttribute('class', 'axis-line');
    svg.appendChild(yAxis);

    const xAxis = createSvg('line');
    xAxis.setAttribute('x1', String(padding.left));
    xAxis.setAttribute('x2', String(width - padding.right));
    xAxis.setAttribute('y1', String(padding.top + plotHeight));
    xAxis.setAttribute('y2', String(padding.top + plotHeight));
    xAxis.setAttribute('class', 'axis-line');
    svg.appendChild(xAxis);

    if (chartType === 'phone') {
      const limitY = padding.top + plotHeight - (60 / maxValue) * plotHeight;
      const limitLine = createSvg('line');
      limitLine.setAttribute('x1', String(padding.left));
      limitLine.setAttribute('x2', String(width - padding.right));
      limitLine.setAttribute('y1', String(limitY));
      limitLine.setAttribute('y2', String(limitY));
      limitLine.setAttribute('class', 'limit-line');
      svg.appendChild(limitLine);

      const limitText = createSvg('text');
      limitText.setAttribute('x', String(width - padding.right - 4));
      limitText.setAttribute('y', String(limitY - 8));
      limitText.setAttribute('text-anchor', 'end');
      limitText.setAttribute('class', 'limit-label');
      limitText.textContent = STRINGS.phoneLimitLabel;
      svg.appendChild(limitText);
    }

    series.forEach((item, index) => {
      const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const barHeight = (item.value / maxValue) * plotHeight;
      const y = padding.top + plotHeight - barHeight;
      const bar = createSvg('rect');
      bar.setAttribute('x', String(x));
      bar.setAttribute('y', String(y));
      bar.setAttribute('width', String(barWidth));
      bar.setAttribute('height', String(Math.max(barHeight, 2)));
      bar.setAttribute('class', `bar${showNoteLegend && item.note ? ' bar--note' : ''}`);

      if (!showNoteLegend) {
        const titleNode = createSvg('title');
        titleNode.textContent = [formatDate(item.date), formatDuration(item.value)].join('\n');
        bar.appendChild(titleNode);
      }
      svg.appendChild(bar);

      if (showNoteLegend && item.note) {
        const marker = document.createElement('div');
        marker.className = 'note-marker';
        marker.tabIndex = 0;
        marker.style.left = `${((x + barWidth / 2) / width) * 100}%`;
        marker.style.top = `${(y / height) * 100}%`;

        const bubble = document.createElement('span');
        bubble.className = 'note-bubble fz-font';
        bubble.textContent = item.note;
        marker.appendChild(bubble);

        noteLayer.appendChild(marker);
      }

      const tick = createSvg('text');
      tick.setAttribute('x', String(x + barWidth / 2));
      tick.setAttribute('y', String(padding.top + plotHeight + 18));
      tick.setAttribute('text-anchor', 'start');
      tick.setAttribute('class', 'tick-label');
      tick.setAttribute('transform', `rotate(45 ${x + barWidth / 2} ${padding.top + plotHeight + 18})`);
      tick.textContent = item.date.slice(5);
      svg.appendChild(tick);
    });

    wrapper.appendChild(svg);
    if (noteLayer.childElementCount) {
      wrapper.appendChild(noteLayer);
    }

    target.appendChild(wrapper);
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) {
      node.textContent = value;
    }
  }

  function setAttribute(selector, name, value) {
    const node = document.querySelector(selector);
    if (node) {
      node.setAttribute(name, value);
    }
  }

  function normalizeLocalPath(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('./')) return path;
    return `./${path}`;
  }

  function getMonthOptions(entries) {
    return [...new Set(entries.map((entry) => entry[FIELD.date].slice(0, 7)))].sort();
  }

  function groupByDate(entries, valueKey) {
    const map = new Map();
    for (const entry of entries) {
      map.set(entry[FIELD.date], entry[valueKey] || 0);
    }
    return map;
  }

  function buildSeries(start, end, valueMap, noteMap = null) {
    const series = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = toDateKey(cursor);
      series.push({
        date: key,
        value: valueMap.get(key) || 0,
        note: noteMap ? noteMap.get(key) || '' : ''
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return series;
  }

  function computeMax(values) {
    const max = Math.max(...values, 0);
    const step = 60;
    const minimum = 120;
    return Math.max(minimum, Math.ceil(max / step) * step);
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(`${dateString}T00:00:00`));
  }

  function formatMonth(monthKey) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(`${monthKey}-01T00:00:00`));
  }

  function formatDuration(minutes) {
    const value = Math.max(0, Math.round(minutes));
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    if (hours === 0) return `${rest}${STRINGS.unitMinute}`;
    if (rest === 0) return `${hours}${STRINGS.unitHour}`;
    return `${hours}${STRINGS.unitHour}${rest}${STRINGS.unitMinute}`;
  }

  function formatAxisValue(minutes) {
    const value = Math.max(0, Math.round(minutes));
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    if (value === 0) return '0';
    if (hours === 0) return `${rest}${STRINGS.unitMinute}`;
    if (rest === 0) return `${hours}${STRINGS.unitHour}`;
    return `${hours}${STRINGS.unitHour}${rest}${STRINGS.unitMinute}`;
  }

  function parseDateKey(dateString) {
    return new Date(`${dateString}T00:00:00`);
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function monthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function createSvg(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return response.json();
  }

  async function loadText(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return response.text();
  }
})();
