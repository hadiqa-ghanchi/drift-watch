const navItems = document.querySelectorAll('[data-view]');
const sections = document.querySelectorAll('.page-section');
const scanOverlay = document.getElementById('scan-overlay');
const scanButton = document.getElementById('scan-button');
const closeScan = document.getElementById('close-scan');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const scanSteps = [...document.querySelectorAll('.scan-step')];
const searchInput = document.getElementById('repo-search');
const onboarding = document.getElementById('onboarding');
const appShell = document.getElementById('app-shell');
const repoForm = document.getElementById('repo-form');
const repoUrlInput = document.getElementById('repo-url');
const sampleButton = document.getElementById('sample-button');
const onboardingScanButton = document.getElementById('onboarding-scan');
const githubConnectButton = document.getElementById('github-connect');
const githubConnected = document.getElementById('github-connected');
const githubLogin = document.getElementById('github-login');
const githubSwitchButton = document.getElementById('github-switch');
const githubMessage = document.getElementById('github-message');
const githubRepoPicker = document.getElementById('github-repo-picker');
const githubRepoSearch = document.getElementById('github-repo-search');
const githubRepoList = document.getElementById('github-repo-list');
const githubRepoEmpty = document.getElementById('github-repo-empty');
const githubSelection = document.getElementById('github-selection');
const githubDisconnectButton = document.getElementById('github-disconnect');
const githubSettingsStatus = document.getElementById('github-settings-status');
const githubSettingsMessage = document.getElementById('github-settings-message');
const scanError = document.getElementById('scan-error');
const scanDialogDescription = document.getElementById('scan-dialog-description');
const mapCanvas = document.querySelector('.architecture-canvas');
const mapZoomLevel = document.getElementById('map-zoom-level');
const themeToggles = [...document.querySelectorAll('[data-theme-toggle]')];
const brandLogos = [...document.querySelectorAll('.brand-logo, .onboarding-brand img')];
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
const mobileSidebarQuery = window.matchMedia('(max-width: 700px)');
const panelMenuToggles = [...document.querySelectorAll('.more-button')];
let mapZoom = 100;
let isSidebarOpen = !mobileSidebarQuery.matches;
let githubRepositories = [];
let selectedRepository = null;
let activeScanId = null;
let currentScan = null;

function setSidebarOpen(isOpen) {
  isSidebarOpen = isOpen;
  appShell.classList.toggle('sidebar-open', isSidebarOpen);
  sidebarToggle.setAttribute('aria-expanded', String(isSidebarOpen));
  sidebarToggle.setAttribute('aria-label', `${isSidebarOpen ? 'Collapse' : 'Expand'} navigation`);
  sidebarToggle.setAttribute('title', `${isSidebarOpen ? 'Collapse' : 'Expand'} navigation`);
  if (!isSidebarOpen && sidebar.contains(document.activeElement)) sidebarToggle.focus();
  sidebar.inert = !isSidebarOpen;
  sidebar.setAttribute('aria-hidden', String(!isSidebarOpen));
  sidebarBackdrop.hidden = !mobileSidebarQuery.matches || !isSidebarOpen;
}

setSidebarOpen(isSidebarOpen);
sidebarToggle.addEventListener('click', () => setSidebarOpen(!isSidebarOpen));
sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));
mobileSidebarQuery.addEventListener('change', (event) => setSidebarOpen(!event.matches));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isSidebarOpen && mobileSidebarQuery.matches) {
    setSidebarOpen(false);
    sidebarToggle.focus();
  }
});

function setTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  window.localStorage.setItem('driftwatch-theme', isLight ? 'light' : 'dark');
  themeToggles.forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
    button.setAttribute('title', `Switch to ${isLight ? 'dark' : 'light'} mode`);
    button.setAttribute('aria-pressed', String(isLight));
  });
  brandLogos.forEach((logo) => {
    logo.src = isLight ? 'drift-logo.png' : 'drift-logo-dark.png';
    logo.srcset = isLight
      ? 'drift-logo.png 1x, drift-logo.png 2x'
      : 'drift-logo-dark.png 1x, drift-logo-dark@2x.png 2x';
  });
}

setTheme(window.localStorage.getItem('driftwatch-theme') === 'light' ? 'light' : 'dark');
themeToggles.forEach((button) => {
  button.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });
});

function showView(viewName) {
  closePanelMenus(true);
  sections.forEach((section) => {
    section.classList.toggle('active-view', section.id === `${viewName}-view`);
  });
  document.querySelectorAll('.nav-item').forEach((item) => {
    const isActive = item.dataset.view === viewName;
    item.classList.toggle('active', isActive);
    if (isActive) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePanelMenus(restoreFocus = false) {
  panelMenuToggles.forEach((button) => {
    const menu = document.getElementById(button.getAttribute('aria-controls'));
    const wasOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    if (restoreFocus && wasOpen && menu.contains(document.activeElement)) button.focus();
  });
}

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    showView(item.dataset.view);
    if (mobileSidebarQuery.matches) setSidebarOpen(false);
  });
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('#activity-rows .table-row').forEach((row) => {
    row.hidden = query && !row.textContent.toLowerCase().includes(query);
  });
});

function resetScan() {
  document.getElementById('scan-dialog-heading').firstChild.textContent = 'Scanning repository';
  closeScan.disabled = false;
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Waiting to start...';
  progressPercent.textContent = '0%';
  scanError.hidden = true;
  scanError.textContent = '';
  scanSteps.forEach((step, index) => {
    step.classList.toggle('active', index === 0);
    step.classList.remove('done');
    step.querySelector('i').textContent = '○';
  });
}

function updateScanProgress(progress, stage) {
  progressBar.style.width = `${progress}%`;
  progressLabel.textContent = stage;
  progressPercent.textContent = `${progress}%`;
  const activeIndex = progress < 10 ? 0
    : progress < 20 ? 1
      : progress < 80 ? 2
        : progress < 92 ? 3 : 4;
  scanSteps.forEach((step, index) => {
    step.classList.toggle('active', index === activeIndex && progress < 100);
    step.classList.toggle('done', index < activeIndex || progress >= 100);
    step.querySelector('i').textContent = index < activeIndex || progress >= 100 ? '✓' : '○';
  });
}

async function runRepositoryScan(target) {
  resetScan();
  scanOverlay.classList.add('visible');
  onboardingScanButton.disabled = true;
  scanButton.disabled = true;
  closeScan.disabled = true;
  scanDialogDescription.textContent = `Preparing a read-only scan of ${target.label}.`;
  try {
    const started = await githubJson('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target.request, source: target.source })
    });
    activeScanId = started.scanId;
    closeScan.disabled = false;
    let job;
    while (activeScanId === started.scanId) {
      job = await githubJson(`/api/scans/${encodeURIComponent(started.scanId)}`);
      updateScanProgress(job.progress, job.stage);
      if (job.status === 'complete') break;
      if (job.status === 'failed') {
        throw new Error(job.error?.message || 'The repository scan could not be completed.');
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    if (activeScanId !== started.scanId) return;
    if (!job || job.status !== 'complete' || !job.result) {
      throw new Error('The scan ended without returning repository analysis.');
    }
    activeScanId = null;
    applyScanResults(job.result);
    updateScanProgress(100, job.stage);
    onboarding.classList.remove('visible');
    appShell.classList.add('ready');
    window.localStorage.setItem('driftwatch-onboarded', 'true');
    if (job.result.repository) {
      setRepositorySelection({ ...job.result.repository, updated_at: job.result.repository.updated_at }, target.source);
    }
    scanButton.disabled = false;
    onboardingScanButton.disabled = !selectedRepository && !repoUrlInput.value.trim();
    setGithubMessage(`${job.result.repository.full_name} scanned successfully.`, false);
    window.setTimeout(() => scanOverlay.classList.remove('visible'), 900);
  } catch (error) {
    activeScanId = null;
    scanError.textContent = error.message;
    scanError.hidden = false;
    document.getElementById('scan-dialog-heading').firstChild.textContent = 'Scan could not complete';
    progressLabel.textContent = 'Scan failed';
    progressPercent.textContent = '!';
    closeScan.disabled = false;
      scanButton.disabled = false;
    onboardingScanButton.disabled = !selectedRepository && !repoUrlInput.value.trim();
  }
}

async function scanSelectedRepository() {
  if (!selectedRepository) {
    onboarding.classList.add('visible');
    appShell.classList.remove('ready');
    setGithubMessage('Select a public repository or enter its GitHub URL to scan.');
    return;
  }
  const request = selectedRepository.source === 'github'
    ? { repository: { id: selectedRepository.id, full_name: selectedRepository.full_name } }
    : { url: selectedRepository.html_url };
  await runRepositoryScan({ request, label: selectedRepository.full_name, source: selectedRepository.source });
}

scanButton.addEventListener('click', scanSelectedRepository);
function setGithubMessage(message, isError = true) {
  githubMessage.textContent = message;
  githubMessage.hidden = !message;
  githubMessage.classList.toggle('is-error', isError);
  githubMessage.classList.toggle('is-success', Boolean(message) && !isError);
}

function setGithubSettingsMessage(message, isError = true) {
  githubSettingsMessage.textContent = message;
  githubSettingsMessage.hidden = !message;
  githubSettingsMessage.classList.toggle('is-error', isError);
}

function setRepositorySelection(repository, source) {
  selectedRepository = repository ? { ...repository, source } : null;
  onboardingScanButton.disabled = !selectedRepository && !repoUrlInput.value.trim();
  githubSelection.replaceChildren();
  githubSelection.hidden = !selectedRepository;
  if (!selectedRepository) return;

  const name = document.createElement('strong');
  name.textContent = selectedRepository.full_name;
  const details = document.createElement('span');
  const updatedAt = new Date(selectedRepository.updated_at || '');
  const updatedText = Number.isNaN(updatedAt.getTime())
    ? ''
    : ` · Updated ${updatedAt.toLocaleDateString()}`;
  details.textContent = `Public${updatedText}`;
  githubSelection.append(name, details);
  setGithubMessage(`${selectedRepository.full_name} selected.`, false);
}

function updateGithubRepoList() {
  const query = githubRepoSearch.value.trim().toLowerCase();
  const visibleRepositories = githubRepositories.filter((repository) =>
    repository.full_name.toLowerCase().includes(query));
  githubRepoList.replaceChildren();
  visibleRepositories.forEach((repository) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'github-repo-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(selectedRepository?.id === repository.id));
    const name = document.createElement('strong');
    name.textContent = repository.full_name;
    const metadata = document.createElement('span');
    const updatedAt = new Date(repository.updated_at);
    metadata.textContent = `Public · Updated ${Number.isNaN(updatedAt.getTime()) ? 'date unavailable' : updatedAt.toLocaleDateString()}`;
    option.append(name, metadata);
    option.addEventListener('click', () => setRepositorySelection(repository, 'github'));
    githubRepoList.append(option);
  });
  githubRepoEmpty.hidden = visibleRepositories.length !== 0;
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderLanguageChart(languages) {
  const chart = document.getElementById('language-chart');
  chart.replaceChildren();
  if (!languages.length) {
    chart.append(createElement('p', 'empty-state', 'No recognizable source languages were found.'));
    return;
  }
  const topLanguages = languages.slice(0, 6);
  const maxCount = Math.max(...topLanguages.map((language) => language.count));
  for (const language of topLanguages) {
    const row = createElement('div', 'language-row');
    const label = createElement('div', 'language-row-label');
    label.append(createElement('strong', '', language.name));
    label.append(createElement('span', '', `${language.count} files`));
    const track = createElement('div', 'language-bar-track');
    const bar = createElement('span', 'language-bar');
    bar.style.width = `${Math.max(3, (language.count / maxCount) * 100)}%`;
    track.append(bar);
    row.append(label, track);
    chart.append(row);
  }
}

function renderRepositoryTree(repository, analysis) {
  const root = document.getElementById('repository-tree-root');
  root.querySelector('strong').textContent = `${repository.full_name}/`;
  root.querySelector('.tree-meta').textContent = `${repository.default_branch} · scanned ${formatRelativeDate(new Date().toISOString())}`;
  const entries = document.getElementById('repository-tree-entries');
  entries.replaceChildren();
  const topFolders = [...new Set(analysis.folders.map((folder) => folder.split('/')[0]))];
  const topFiles = analysis.files.filter((file) => !file.includes('/')).slice(0, Math.max(0, 5 - topFolders.length));
  const visibleEntries = [
    ...topFolders.slice(0, 5).map((folder) => ({ name: `${folder}/`, path: folder, isFolder: true })),
    ...topFiles.map((file) => ({ name: file, path: file, isFolder: false }))
  ].slice(0, 7);
  visibleEntries.forEach((entry, index) => {
    const row = createElement('div', 'tree-line');
    row.append(createElement('span', 'tree-branch', index === visibleEntries.length - 1 ? '└' : '├'));
    row.append(createElement('span', `folder-mini ${entry.isFolder ? 'blue' : 'purple'}`, entry.isFolder ? '▰' : '·'));
    row.append(createElement('span', '', entry.name));
    if (entry.isFolder) {
      const module = analysis.modules.find((item) => item.id === entry.path);
      if (module) {
        const chipClass = module.layer === 'frontend' ? 'frontend'
          : module.layer === 'database' ? 'data'
            : module.layer === 'backend' ? 'backend' : 'service';
        row.append(createElement('span', `layer-chip ${chipClass}`, `${module.layer} layer`));
      }
    }
    entries.append(row);
  });
  if (!visibleEntries.length) entries.append(createElement('p', 'empty-state', 'No top-level files or folders were found.'));
  const manifestList = document.getElementById('repository-manifests');
  manifestList.replaceChildren();
  if (analysis.manifests.length) {
    manifestList.append(createElement('span', 'manifest-label', 'Dependency manifests'));
    analysis.manifests.slice(0, 5).forEach((manifest) => {
      manifestList.append(createElement('span', 'manifest-chip', `${manifest.path}${manifest.dependencyCount === null ? '' : ` · ${manifest.dependencyCount} dependencies`}`));
    });
  }
  document.getElementById('repository-file-count').textContent = analysis.fileCount.toLocaleString();
  document.getElementById('repository-folder-count').textContent = analysis.folderCount.toLocaleString();
  document.getElementById('repository-layer-count').textContent = new Set(analysis.modules.map((item) => item.layer)).size.toLocaleString();
}

function renderArchitectureMap(analysis) {
  const canvas = document.getElementById('generated-map-content');
  canvas.replaceChildren();
  const modules = analysis.modules;
  const edges = analysis.edges;
  const layerOrder = ['frontend', 'backend', 'service', 'shared', 'database'];
  const columnCenters = [130, 340, 550, 760, 970];
  const rowCounts = new Map();
  const positions = new Map();
  const groups = new Map();
  modules.forEach((module) => {
    const layerIndex = Math.max(0, layerOrder.indexOf(module.layer));
    if (!groups.has(module.layer)) groups.set(module.layer, []);
    groups.get(module.layer).push(module);
    const row = rowCounts.get(module.layer) || 0;
    rowCounts.set(module.layer, row + 1);
    positions.set(module.id, {
      x: columnCenters[layerIndex],
      y: 76 + row * 104
    });
  });
  const maxRows = Math.max(1, ...rowCounts.values());
  const height = Math.max(560, 150 + (maxRows - 1) * 104);
  mapCanvas.style.height = `${height}px`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'connections');
  svg.setAttribute('viewBox', `0 0 1100 ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'generated-arrow');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrow.setAttribute('d', 'M0,0 L0,6 L6,3 z');
  arrow.setAttribute('fill', 'var(--accent)');
  marker.append(arrow);
  defs.append(marker);
  svg.append(defs);

  edges.slice(0, 100).forEach((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return;
    const direction = to.x >= from.x ? 1 : -1;
    const startX = from.x + direction * 80;
    const endX = to.x - direction * 80;
    const midpoint = (startX + endX) / 2;
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', `M${startX} ${from.y} C${midpoint} ${from.y}, ${midpoint} ${to.y}, ${endX} ${to.y}`);
    pathElement.setAttribute('marker-end', 'url(#generated-arrow)');
    pathElement.setAttribute('aria-label', `${edge.from} imports from ${edge.to}: ${edge.count} detected imports`);
    pathElement.setAttribute('data-from', edge.from);
    pathElement.setAttribute('data-to', edge.to);
    svg.append(pathElement);
  });
  canvas.append(svg);

  const iconForLayer = {
    frontend: ['◇', 'blue-icon'],
    backend: ['⇄', 'indigo-icon'],
    database: ['▤', 'purple-icon'],
    service: ['●', 'green-icon'],
    shared: ['⌘', 'blue-icon']
  };
  modules.forEach((module) => {
    const position = positions.get(module.id);
    const node = createElement('div', `map-node generated-node ${module.layer}-node`);
    node.dataset.layer = module.layer;
    node.style.left = `${(position.x / 1100) * 100}%`;
    node.style.top = `${position.y}px`;
    const [icon, iconClass] = iconForLayer[module.layer] || ['●', 'green-icon'];
    node.append(createElement('span', `node-icon ${iconClass}`, icon));
    const description = createElement('div');
    description.append(createElement('strong', '', module.name));
    description.append(createElement('small', '', `${module.path} · ${module.fileCount.toLocaleString()} files`));
    node.append(description);
    canvas.append(node);
  });

  const layerCount = groups.size;
  document.getElementById('map-summary').textContent =
    `${modules.length} modules · ${layerCount} inferred layers · ${edges.length} local import links`;
  document.getElementById('map-repository-name').textContent =
    document.getElementById('repository-name').textContent;
}

function renderStructureObservations(analysis) {
  const container = document.getElementById('structure-observations');
  const violations = document.getElementById('violation-cards');
  container.replaceChildren();
  violations.replaceChildren();
  const moduleMap = new Map(analysis.modules.map((module) => [module.id, module]));
  const crossLayerEdges = analysis.edges.filter((edge) =>
    moduleMap.get(edge.from)?.layer !== moduleMap.get(edge.to)?.layer);
  document.getElementById('drift-title').textContent = `${crossLayerEdges.length} cross-layer links`;

  if (!crossLayerEdges.length) {
    container.append(createElement('p', 'empty-state', 'No cross-layer imports were detected in the analyzed files.'));
    violations.append(createElement('p', 'empty-state', 'No cross-layer imports were detected. Static import detection is heuristic and does not enforce architecture rules.'));
    return;
  }

  crossLayerEdges.slice(0, 8).forEach((edge) => {
    const source = moduleMap.get(edge.from);
    const target = moduleMap.get(edge.to);
    const sourceName = source ? source.name : edge.from;
    const targetName = target ? target.name : edge.to;
    const item = createElement('div', 'signal-item');
    item.append(createElement('span', 'signal-icon amber', '↗'));
    const details = createElement('div');
    details.append(createElement('strong', '', `${sourceName} → ${targetName}`));
    details.append(createElement('small', '', `${source?.layer || 'module'} → ${target?.layer || 'module'} · ${edge.count} local imports`));
    item.append(details);
    item.append(createElement('span', 'signal-time', 'static'));
    container.append(item);

    const card = createElement('article', 'violation-card panel');
    const top = createElement('div', 'violation-top');
    top.append(createElement('span', 'warning-badge', 'STATIC OBSERVATION'));
    top.append(createElement('span', 'mono muted', `${edge.count} imports`));
    card.append(top);
    card.append(createElement('h3', '', `${sourceName} → ${targetName}`));
    card.append(createElement('p', '', `Detected local imports between the inferred ${source?.layer || 'module'} and ${target?.layer || 'module'} layers. This is an observation, not a configured architecture-rule violation.`));
    const footer = createElement('div', 'violation-footer');
    footer.append(createElement('span', '', 'Inferred module dependency'));
    footer.append(createElement('span', 'rule-id', `${source?.fileCount || 0} source files`));
    card.append(footer);
    violations.append(card);
  });
}

function renderRepositoryHistory(commits) {
  const activity = document.getElementById('activity-rows');
  activity.replaceChildren();
  const timeline = document.getElementById('repository-timeline');
  timeline.replaceChildren();
  const caption = document.getElementById('repository-timeline-caption');
  caption.replaceChildren();
  document.getElementById('timeline-commit-count').textContent = commits.length.toLocaleString();
  if (!commits.length) {
    const empty = createElement('p', 'empty-state', 'No commits were found in the shallow clone.');
    activity.append(empty);
    timeline.append(createElement('p', 'empty-state timeline-empty', 'No commit history is available.'));
    return;
  }

  const trackLine = createElement('div', 'track-line');
  timeline.append(trackLine);
  const orderedCommits = commits.slice(0, 5).reverse();
  orderedCommits.forEach((commit, index) => {
    const activityRow = createElement('div', 'table-row');
    const event = createElement('span', 'event-name');
    event.append(createElement('span', 'event-avatar purple', '⌁'));
    const eventDetails = createElement('span');
    eventDetails.append(createElement('strong', '', commit.message || 'Untitled commit'));
    eventDetails.append(createElement('small', '', `${commit.shortSha} · ${formatRelativeDate(commit.date)}`));
    event.append(eventDetails);
    activityRow.append(event);
    activityRow.append(createElement('span', 'status-pill', 'Git history'));
    activityRow.append(createElement('span', 'mono', commit.shortSha));
    activityRow.append(createElement('span', 'mono muted', formatRelativeDate(commit.date)));
    activity.append(activityRow);

    const position = orderedCommits.length === 1 ? 50 : 8 + (index / (orderedCommits.length - 1)) * 84;
    const entry = createElement('div', 'timeline-commit repository-commit');
    entry.style.left = `${position}%`;
    const card = createElement('div', 'commit-card');
    card.append(createElement('span', 'commit-number', commit.shortSha));
    card.append(createElement('strong', '', commit.message || 'Untitled commit'));
    card.append(createElement('small', '', new Date(commit.date).toLocaleDateString()));
    entry.append(card, createElement('span', 'commit-dot'), createElement('span', 'timeline-state', 'History only'));
    timeline.append(entry);
    caption.append(createElement('span', '', new Date(commit.date).toLocaleDateString()));
  });
}

function applyScanResults(scan) {
  const { repository, analysis } = scan;
  if (!repository || !analysis) throw new Error('The scan returned incomplete repository data.');
  currentScan = scan;
  const repositoryName = repository.full_name;
  const [repositoryOwner, repositoryShortName] = repositoryName.split('/');
  const moduleLayers = new Map(analysis.modules.map((module) => [module.id, module.layer]));
  document.getElementById('repository-name').textContent = repositoryName;
  document.getElementById('workspace-name').textContent = repositoryShortName || repositoryName;
  document.getElementById('workspace-avatar').textContent = (repositoryShortName || repositoryName).slice(0, 1).toUpperCase();
  document.getElementById('repository-owner-name').textContent = repositoryOwner || repositoryName;
  document.getElementById('repository-owner-avatar').textContent = (repositoryOwner || repositoryName).slice(0, 2).toUpperCase();
  document.getElementById('guardian-status').textContent = 'Scan complete';
  document.getElementById('guardian-last-scan').textContent = `Last scan ${formatRelativeDate(scan.scannedAt || new Date().toISOString())}`;
  document.querySelector('.live-dot').hidden = true;
  const violationCount = analysis.edges.filter((edge) =>
    moduleLayers.get(edge.from) !== moduleLayers.get(edge.to)).length;
  const violationBadge = document.getElementById('violation-count');
  violationBadge.textContent = violationCount.toLocaleString();
  violationBadge.hidden = violationCount === 0;
  document.getElementById('workspace-repository-name').textContent = repositoryName.split('/').pop();
  document.getElementById('scan-date').textContent = `Scanned ${new Date(scan.scannedAt || Date.now()).toLocaleString()}`;
  document.getElementById('health-title').textContent = 'Repository analyzed';
  document.getElementById('health-score').textContent = analysis.fileCount.toLocaleString();
  document.getElementById('health-ring').style.setProperty('--score', '100');
  document.getElementById('health-summary').textContent =
    `Analyzed ${analysis.fileCount.toLocaleString()} files across ${analysis.modules.length} modules. The structure score is not an architecture quality or drift verdict.`;
  document.getElementById('cross-layer-summary').textContent =
    `${analysis.edges.length.toLocaleString()} detected module import links`;
  document.getElementById('scan-timestamp').textContent = new Date(scan.scannedAt || Date.now()).toLocaleTimeString();
  document.getElementById('healthy-count').textContent = `${analysis.modules.length.toLocaleString()} modules`;
  document.getElementById('warning-count').textContent = `${analysis.edges.filter((edge) =>
    moduleLayers.get(edge.from) !== moduleLayers.get(edge.to)).length.toLocaleString()} cross-layer links`;
  document.getElementById('critical-count').textContent = `${analysis.manifests.length.toLocaleString()} manifests`;
  document.getElementById('repository-file-count').textContent = analysis.fileCount.toLocaleString();
  document.getElementById('repository-folder-count').textContent = analysis.folderCount.toLocaleString();
  document.getElementById('repository-layer-count').textContent =
    new Set(analysis.modules.map((module) => module.layer)).size.toLocaleString();
  document.getElementById('timeline-file-count').textContent = analysis.fileCount.toLocaleString();
  document.getElementById('timeline-module-count').textContent = analysis.modules.length.toLocaleString();
  renderRepositoryTree(repository, analysis);
  renderLanguageChart(analysis.languages);
  renderArchitectureMap(analysis);
  renderStructureObservations(analysis);
  renderRepositoryHistory(analysis.commits);
}

function updateGithubConnection(login) {
  const connected = Boolean(login);
  githubConnectButton.hidden = connected;
  githubConnected.hidden = !connected;
  githubRepoPicker.hidden = !connected;
  githubLogin.textContent = connected ? `@${login}` : '';
  githubSettingsStatus.textContent = connected ? `Connected as @${login}` : 'Not connected';
  githubDisconnectButton.disabled = !connected;
  if (!connected && selectedRepository?.source === 'github') setRepositorySelection(null);
}

async function githubJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  let body;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (contentType.includes('text/html')) {
        throw new Error('The Driftwatch API is not deployed at this site. Deploy the Node server and route /api requests to it.');
      }
      throw new Error('The Driftwatch server returned a non-JSON response.');
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('The Driftwatch ')) throw error;
    throw new Error('The Driftwatch server returned invalid JSON.');
  }
  if (!response.ok) {
    if (body.code === 'reconnect_required') updateGithubConnection(null);
    throw new Error(body.error || 'The request could not be completed.');
  }
  return body;
}

async function loadGithubRepositories() {
  setGithubMessage('Loading public repositories…', false);
  githubRepoList.replaceChildren();
  try {
    const result = await githubJson('/api/github/repos');
    githubRepositories = result.repositories;
    updateGithubRepoList();
    setGithubMessage(githubRepositories.length
      ? ''
      : 'No public repositories were found for this account. You can paste a public repository URL below.');
  } catch (error) {
    setGithubMessage(error.message);
  }
}

async function refreshGithubConnection() {
  try {
    const status = await githubJson('/api/github/status');
    updateGithubConnection(status.connected ? status.login : null);
    if (status.error) setGithubMessage(status.error);
    if (status.connected) await loadGithubRepositories();
  } catch (error) {
    setGithubMessage(`GitHub connection status is unavailable: ${error.message}`);
  }
}

async function beginGithubConnection() {
  githubConnectButton.disabled = true;
  setGithubMessage('Preparing secure GitHub sign-in…', false);
  try {
    const result = await githubJson('/api/github/connect');
    window.location.assign(result.url);
  } catch (error) {
    setGithubMessage(error.message);
    githubConnectButton.disabled = false;
  }
}

function parsePublicRepositoryUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a valid public GitHub repository URL.');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com'
      || parts.length < 2 || url.username || url.password || url.port) {
    throw new Error('Use a public repository URL in the form https://github.com/owner/repository.');
  }
  let owner;
  let repository;
  try {
    owner = decodeURIComponent(parts[0]);
    repository = decodeURIComponent(parts[1]).replace(/\.git$/i, '');
  } catch {
    throw new Error('Enter a valid github.com/owner/repository URL.');
  }
  if (!/^[A-Za-z0-9-]{1,100}$/.test(owner) || !/^[A-Za-z0-9._-]{1,100}$/.test(repository)) {
    throw new Error('Enter a valid github.com/owner/repository URL.');
  }
  return { owner, repo: repository };
}

repoUrlInput.addEventListener('input', () => {
  setRepositorySelection(null);
  setGithubMessage('');
});

repoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (selectedRepository) {
    await scanSelectedRepository();
    return;
  }

  try {
    const { owner, repo } = parsePublicRepositoryUrl(repoUrlInput.value.trim());
    onboardingScanButton.disabled = true;
    setGithubMessage('Checking the public GitHub repository…', false);
    const result = await githubJson(`/api/github/public-repository?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
    setRepositorySelection(result.repository, 'manual');
    await scanSelectedRepository();
  } catch (error) {
    setGithubMessage(error.message);
  } finally {
    onboardingScanButton.disabled = !selectedRepository && !repoUrlInput.value.trim();
  }
});

githubConnectButton.addEventListener('click', beginGithubConnection);
githubSwitchButton.addEventListener('click', beginGithubConnection);
githubRepoSearch.addEventListener('input', updateGithubRepoList);
githubDisconnectButton.addEventListener('click', async () => {
  githubDisconnectButton.disabled = true;
  setGithubSettingsMessage('Disconnecting GitHub…', false);
  try {
    const result = await githubJson('/api/github/disconnect', { method: 'POST' });
    updateGithubConnection(null);
    githubRepositories = [];
    githubRepoList.replaceChildren();
    setGithubMessage('');
    setGithubSettingsMessage(result.message || (result.revoked
      ? 'GitHub disconnected and access revoked.'
      : 'GitHub disconnected from Driftwatch.'), !result.revoked && Boolean(result.message));
  } catch (error) {
    setGithubSettingsMessage(error.message);
    githubDisconnectButton.disabled = false;
  }
});
sampleButton.addEventListener('click', () => {
  repoUrlInput.value = 'https://github.com/octocat/Hello-World';
  repoUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
  repoForm.requestSubmit();
});

closeScan.addEventListener('click', async () => {
  if (activeScanId) {
    const scanId = activeScanId;
    activeScanId = null;
    try {
      await githubJson(`/api/scans/${encodeURIComponent(scanId)}`, { method: 'DELETE' });
    } catch (error) {
      showToast(`Could not cancel scan: ${error.message}`);
    }
  }
    scanButton.disabled = false;
  onboardingScanButton.disabled = !selectedRepository && !repoUrlInput.value.trim();
  scanOverlay.classList.remove('visible');
});
scanOverlay.addEventListener('click', (event) => {
  if (event.target === scanOverlay) closeScan.click();
});

async function restoreLatestScan() {
  try {
    const scan = await githubJson('/api/scans/latest');
    if (!scan?.repository || !scan.analysis) return;
    applyScanResults(scan);
    repoUrlInput.value = scan.repository.html_url;
    setRepositorySelection(scan.repository, scan.repository.source || 'manual');
    onboarding.classList.remove('visible');
    appShell.classList.add('ready');
  } catch (error) {
    setGithubMessage(`Could not restore the previous repository scan: ${error.message}`);
  }
}

async function initializeRepositoryState() {
  await refreshGithubConnection();
  await restoreLatestScan();
}

onboarding.classList.add('visible');
appShell.classList.remove('ready');
initializeRepositoryState();

document.querySelectorAll('.filter-active').forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('filter-active'));
    button.classList.add('filter-active');
    button.parentElement.querySelectorAll('button').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
});

document.getElementById('notifications-button').addEventListener('click', () => {
  document.getElementById('notifications-button').setAttribute('aria-pressed', 'true');
  document.querySelector('.notification-dot').hidden = true;
  showToast('You are all caught up. No new architecture alerts.');
});

document.getElementById('activity-button').addEventListener('click', () => {
  document.querySelector('.activity-table').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Showing the latest guardian activity.');
});

document.querySelectorAll('.more-button').forEach((button) => {
  button.addEventListener('click', () => {
    const willOpen = button.getAttribute('aria-expanded') !== 'true';
    closePanelMenus();
    button.setAttribute('aria-expanded', String(willOpen));
    const menu = document.getElementById(button.getAttribute('aria-controls'));
    menu.hidden = !willOpen;
    if (willOpen) menu.querySelector('[role="menuitem"]').focus();
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.panel-menu-wrap')) closePanelMenus();
});

document.addEventListener('keydown', (event) => {
  const openMenu = event.target instanceof Element ? event.target.closest('.panel-menu') : null;
  if (event.key === 'Escape') {
    closePanelMenus(true);
  } else if (openMenu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    const items = [...openMenu.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
    event.preventDefault();
    items[nextIndex].focus();
  }
});

function updateMapZoom() {
  mapCanvas.style.setProperty('--map-zoom', `${mapZoom / 100}`);
  mapZoomLevel.textContent = `${mapZoom}%`;
  document.getElementById('map-zoom-in').disabled = mapZoom >= 130;
  document.getElementById('map-zoom-out').disabled = mapZoom <= 70;
}

document.getElementById('map-zoom-in').addEventListener('click', () => {
  mapZoom = Math.min(130, mapZoom + 10);
  updateMapZoom();
});

document.getElementById('map-zoom-out').addEventListener('click', () => {
  mapZoom = Math.max(70, mapZoom - 10);
  updateMapZoom();
});
updateMapZoom();

document.querySelectorAll('[data-action="export-report"]').forEach((button) => button.addEventListener('click', () => {
  if (!currentScan) {
    showToast('Scan a repository before exporting its report.');
    return;
  }
  const reportUrl = URL.createObjectURL(new Blob([JSON.stringify(currentScan, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = reportUrl;
  link.download = `driftwatch-${currentScan.repository.full_name.replace('/', '-')}-report.json`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(reportUrl), 1000);
  closePanelMenus(true);
  showToast('Report exported successfully.');
}));

document.querySelectorAll('.toggle-input').forEach((input) => {
  input.addEventListener('change', () => showToast(`${input.closest('.setting-row').querySelector('strong').textContent} ${input.checked ? 'enabled' : 'disabled'}.`));
});

document.getElementById('reset-onboarding').addEventListener('click', () => {
  window.localStorage.removeItem('driftwatch-onboarded');
  onboarding.classList.add('visible');
  appShell.classList.remove('ready');
  repoUrlInput.value = '';
  setRepositorySelection(null);
  currentScan = null;
  githubJson('/api/scans/latest', { method: 'DELETE' }).catch((error) => {
    setGithubSettingsMessage(`Could not clear the previous scan: ${error.message}`);
  });
  showToast('First-time setup is ready.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
