(() => {
  'use strict';

  const ids = [
    'empireValue','cash','dailyPnl','wanted','countdown','businessCount','businessList',
    'missionId','missionTitle','missionObjective','missionStage','missionReward','missionDistrict',
    'missionProgress','missionPercent','syncStatus','missionCount','decisionCount','lastPacket',
    'pnlPanel','pnlValue','pnlVelocity','pnlChart','targetPercent','targetFill','feed','roster',
    'agentLayer','handoffLayer','agentTemplate'
  ];
  const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const agentNodes = new Map();
  const liveAgents = new Map();
  let state = null;
  let serverOffset = 0;
  let lastPacketKey = '';
  let cashBurstStep = -1;
  let pollBusy = false;

  function money(value, compact = false) {
    const number = Number(value) || 0;
    const sign = number > 0 ? '+' : number < 0 ? '' : '';
    const absolute = Math.abs(number);
    if (compact && absolute >= 1000000) return sign + '$' + (absolute / 1000000).toFixed(2) + 'M';
    if (compact && absolute >= 1000) return sign + '$' + (absolute / 1000).toFixed(1) + 'K';
    return sign + '$' + absolute.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function clock(value) {
    return new Date(value).toLocaleTimeString('en-US', { hour12: false });
  }

  function setValueClass(node, value) {
    node.classList.toggle('positive', value >= 0);
    node.classList.toggle('negative', value < 0);
  }

  function renderCountdown() {
    if (!state) return;
    const remaining = Math.max(0, state.release.at - (Date.now() + serverOffset));
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(remaining / 3600000) % 24;
    const minutes = Math.floor(remaining / 60000) % 60;
    const seconds = Math.floor(remaining / 1000) % 60;
    ui.countdown.textContent = `${days}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`;
  }

  function renderEmpire(data) {
    ui.empireValue.textContent = money(data.empire.value);
    ui.cash.textContent = money(data.empire.cash);
    ui.dailyPnl.textContent = money(data.empire.daily);
    ui.pnlValue.textContent = money(data.pnl.current);
    setValueClass(ui.dailyPnl, data.empire.daily);
    setValueClass(ui.pnlValue, data.pnl.current);
    ui.wanted.textContent = ''.repeat(data.wanted) + ''.repeat(5 - data.wanted);
    ui.targetPercent.textContent = (data.empire.progress * 100).toFixed(1) + '%';
    ui.targetFill.style.width = Math.min(100, data.empire.progress * 100) + '%';
    const history = data.pnl.history;
    const velocity = history[history.length - 1] - history[history.length - 2];
    ui.pnlVelocity.textContent = money(velocity) + ' / 5 SEC';
    setValueClass(ui.pnlVelocity, velocity);
    drawPnl(history);
  }

  function renderMission(mission) {
    ui.missionId.textContent = mission.id + ' // ACTIVE OPERATION';
    ui.missionTitle.textContent = mission.title;
    ui.missionObjective.textContent = mission.objective;
    ui.missionStage.textContent = mission.stage;
    ui.missionReward.textContent = money(mission.reward);
    ui.missionDistrict.textContent = mission.district;
    ui.missionProgress.style.width = mission.progress + '%';
    ui.missionPercent.textContent = mission.progress + '%';
  }

  function renderBusinesses(businesses) {
    const signature = businesses.map((item) => item.active + ':' + item.pulse).join('|');
    if (ui.businessList.dataset.signature === signature) return;
    ui.businessList.dataset.signature = signature;
    ui.businessList.replaceChildren(...businesses.map((business) => {
      const card = document.createElement('article');
      const head = document.createElement('div');
      const title = document.createElement('strong');
      const income = document.createElement('b');
      const meta = document.createElement('small');
      const track = document.createElement('i');
      card.className = 'business-card ' + (business.active ? 'active' : 'inactive') + (business.pulse ? ' pulse' : '');
      title.textContent = business.name;
      income.textContent = business.active ? '+' + money(business.income).replace('+', '') + '/SHIFT' : 'LOCKED';
      meta.textContent = business.type + ' // ' + money(business.value) + ' ASSET';
      track.style.setProperty('--asset', business.active ? Math.min(100, 28 + business.value / 1800) + '%' : '8%');
      head.append(title, income);
      card.append(head, meta, track);
      return card;
    }));
    ui.businessCount.textContent = businesses.filter((item) => item.active).length + ' ACTIVE';
  }

  function ensureAgents(agents) {
    agents.forEach((agent) => {
      if (agentNodes.has(agent.id)) return;
      const node = ui.agentTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = agent.id;
      node.style.setProperty('--bot', agent.color);
      node.querySelector('b').textContent = agent.name;
      ui.agentLayer.append(node);
      agentNodes.set(agent.id, node);
    });
  }

  function renderAgents(agents) {
    ensureAgents(agents);
    liveAgents.clear();
    agents.forEach((agent) => {
      liveAgents.set(agent.id, agent);
      const node = agentNodes.get(agent.id);
      node.querySelector('.thought').textContent = agent.thought;
    });
  }

  function activeMotion(agent, now) {
    const plan = agent.motionPlan || [];
    const segment = plan.find((part) => now >= part.startsAt && now < part.endsAt)
      || plan.find((part) => now < part.endsAt)
      || plan[plan.length - 1];
    if (!segment) return { x: agent.x, y: agent.y, moving: agent.moving, type: '', zone: agent.zone };
    const moving = now < segment.movesUntil;
    const phase = moving
      ? Math.max(0, Math.min(1, (now - segment.startsAt) / Math.max(1, segment.movesUntil - segment.startsAt)))
      : 1;
    const eased = phase * phase * (3 - 2 * phase);
    return {
      x: segment.fromX + (segment.toX - segment.fromX) * eased,
      y: segment.fromY + (segment.toY - segment.fromY) * eased,
      moving,
      type: segment.destinationType,
      zone: segment.destination
    };
  }

  function renderHandoffs(points) {
    if (!state) return;
    const key = state.handoffs.map((item) => item.id).join('|');
    if (lastPacketKey === key && ui.handoffLayer.childElementCount) {
      ui.handoffLayer.querySelectorAll('[data-link]').forEach((path) => {
        const handoff = state.handoffs.find((item) => item.id === path.dataset.link);
        if (!handoff) return;
        const from = points.get(handoff.from);
        const to = points.get(handoff.to);
        if (!from || !to) return;
        const bend = Math.max(40, Math.abs(to.x - from.x) * .22);
        path.setAttribute('d', `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - bend} ${to.x} ${to.y}`);
      });
      return;
    }

    lastPacketKey = key;
    ui.handoffLayer.replaceChildren();
    state.handoffs.forEach((handoff) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      path.dataset.link = handoff.id;
      path.classList.add('handoff-path');
      path.style.stroke = handoff.color;
      path.style.color = handoff.color;
      packet.classList.add('handoff-node');
      packet.setAttribute('r', '6');
      packet.setAttribute('fill', handoff.color);
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      animate.setAttribute('dur', '.72s');
      animate.setAttribute('repeatCount', 'indefinite');
      const motionPath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
      const linkId = 'route-' + handoff.id.replace(/[^a-z0-9-]/gi, '');
      path.id = linkId;
      motionPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + linkId);
      animate.append(motionPath);
      packet.append(animate);
      ui.handoffLayer.append(path, packet);
    });
  }

  function animateAgents() {
    const now = Date.now() + serverOffset;
    const points = new Map();
    liveAgents.forEach((agent, id) => {
      const point = activeMotion(agent, now);
      points.set(id, point);
      const node = agentNodes.get(id);
      if (!node) return;
      node.style.left = (point.x / 10) + '%';
      node.style.top = (point.y / 8) + '%';
      node.classList.toggle('walking', point.moving);
      node.classList.toggle('working', !point.moving);
      node.classList.toggle('seated', !point.moving && point.type === 'desk');
      node.querySelector('small').textContent = point.moving ? 'MOVING TO ' + point.zone : point.zone;
    });
    renderHandoffs(points);
    requestAnimationFrame(animateAgents);
  }

  function renderFeed(items) {
    const signature = items.map((item) => item.id).join('|');
    if (ui.feed.dataset.signature === signature) return;
    ui.feed.dataset.signature = signature;
    const colors = Object.fromEntries((state?.agents || []).map((agent) => [agent.name, agent.color]));
    ui.feed.replaceChildren(...items.map((item) => {
      const article = document.createElement('article');
      const head = document.createElement('div');
      const agent = document.createElement('b');
      const time = document.createElement('time');
      const message = document.createElement('p');
      article.className = 'feed-item';
      article.style.setProperty('--agent-color', colors[item.agent] || '#ffd447');
      agent.textContent = item.agent;
      time.textContent = clock(item.time);
      message.textContent = item.message;
      head.append(agent, time);
      article.append(head, message);
      return article;
    }));
  }

  function renderRoster(agents) {
    if (ui.roster.childElementCount) return;
    ui.roster.replaceChildren(...agents.map((agent) => {
      const item = document.createElement('span');
      const light = document.createElement('i');
      const copy = document.createElement('div');
      const name = document.createElement('b');
      const role = document.createElement('small');
      item.style.setProperty('--agent-color', agent.color);
      name.textContent = agent.name;
      role.textContent = agent.role;
      copy.append(name, role);
      item.append(light, copy);
      return item;
    }));
  }

  function drawPnl(values) {
    const canvas = ui.pnlChart;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || 280;
    const height = canvas.clientHeight || 100;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => ({
      x: index / (values.length - 1) * width,
      y: height - 10 - ((value - min) / range) * (height - 20)
    }));
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff4f7b');
    gradient.addColorStop(.52, '#ffd447');
    gradient.addColorStop(1, '#65e581');
    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.beginPath();
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.stroke();
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    const fill = context.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, 'rgba(101,229,129,.24)');
    fill.addColorStop(1, 'rgba(101,229,129,0)');
    context.fillStyle = fill;
    context.fill();
    const last = points[points.length - 1];
    context.fillStyle = '#fff5e6';
    context.beginPath();
    context.arc(last.x, last.y, 4, 0, Math.PI * 2);
    context.fill();
  }

  function launchCashBurst() {
    if (!state || !ui.pnlPanel) return;
    const step = Math.floor((Date.now() + serverOffset) / 5600);
    if (step === cashBurstStep) return;
    cashBurstStep = step;
    const agents = [...agentNodes.values()];
    if (!agents.length) return;
    const source = agents[step % agents.length].getBoundingClientRect();
    const target = ui.pnlPanel.getBoundingClientRect();
    const gain = Math.round(45 + Math.abs(Math.sin(step * 1.7)) * 680);
    const loss = step % 5 === 0;
    const badge = document.createElement('b');
    badge.className = 'cash-packet ' + (loss ? 'loss' : 'gain');
    badge.textContent = (loss ? '$' : '+$') + (loss ? Math.round(gain * .35) : gain);
    badge.style.left = source.left + source.width / 2 + 'px';
    badge.style.top = source.top + 'px';
    badge.style.setProperty('--cash-x', target.left - source.left + target.width / 2 + 'px');
    badge.style.setProperty('--cash-y', target.top - source.top + 80 + 'px');
    document.body.append(badge);
    setTimeout(() => badge.remove(), 1500);
  }

  function render(data) {
    state = data;
    serverOffset = data.generatedAt - Date.now();
    renderEmpire(data);
    renderMission(data.mission);
    renderBusinesses(data.businesses);
    renderAgents(data.agents);
    renderFeed(data.feed);
    renderRoster(data.agents);
    ui.syncStatus.textContent = 'CONNECTED';
    ui.missionCount.textContent = String(data.stats.missions).padStart(3, '0');
    ui.decisionCount.textContent = data.stats.decisions.toLocaleString('en-US');
    ui.lastPacket.textContent = clock(data.generatedAt);
    renderCountdown();
    launchCashBurst();
  }

  async function poll() {
    if (pollBusy) return;
    pollBusy = true;
    try {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      render(await response.json());
    } catch (error) {
      ui.syncStatus.textContent = 'RECONNECTING';
      console.error(error);
    } finally {
      pollBusy = false;
    }
  }

  poll();
  setInterval(poll, 2500);
  setInterval(renderCountdown, 1000);
  setInterval(launchCashBurst, 900);
  window.addEventListener('resize', () => state && drawPnl(state.pnl.history));
  requestAnimationFrame(animateAgents);
})();

