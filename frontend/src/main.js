import { getMaisonData, getNews, getTrains } from './api.js';

const GRID_SIZE = 3;

let state = {
  x: 1, // Start at Center
  y: 0, // Start at Top (Overview)
  data: {} // Store all fetched data here
};

const PAGES = [
  [
    { id: 'lights', title: 'Lumières', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18h6M10 22h4M12 2v2M5.22 5.22l1.42 1.42M2 12h2M22 12h-2M18.78 5.22l-1.42 1.42M12 7a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5z"></path></svg>', getValue: (d) => d.lights || 'Mise à jour...' },
    { id: 'overview', title: 'Maison', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>', getValue: (d) => `Salon: ${d.temp || '--'}°C<br>${d.weather || 'Chargement...'}` },
    { id: 'energy', title: 'Énergie', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>', getValue: (d) => `Conso: ${d.power || '--'} W` }
  ],
  [
    { id: 'weather', title: 'Météo', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 10a6 6 0 1 0-12 0c0 7 3 9 2 10h8c-1-1 2-3 2-10z"></path><path d="M12 2v2"></path><path d="M4.22 4.22l1.42 1.42"></path><path d="M2 12h2"></path><path d="M4.22 19.78l1.42-1.42"></path><path d="M22 12h-2"></path><path d="M19.78 4.22l-1.42 1.42"></path></svg>', getValue: (d) => d.weather_info || 'Prévisions indisponibles' },
    { id: 'calendar', title: 'Agenda', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>', getValue: (d) => 'Prochain: Travail' },
    { id: 'security', title: 'Sécurité', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>', getValue: (d) => 'Alarme: ACTIVE' }
  ],
  [
    { id: 'transport', title: 'SNCF / Bus', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="9" width="20" height="9" rx="2"></rect><path d="M7 18v2"></path><path d="M17 18v2"></path><path d="M3 13h18"></path></svg>', getValue: (d) => `<div style="font-size: 1.2rem; line-height: 1.5;">${d.trains || 'Chargement trains...'}<hr style="border: 0; border-top: 2px solid #000; margin: 10px 0;">Bus: ${d.transport_info || 'Pas d\'info'}</div>` },
    { id: 'news', title: 'Dernières Infos', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>', getValue: (d) => `<div class="news-content">${d.news || 'Aucune information disponible'}</div>` },
    { id: 'system', title: 'Système', icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', getValue: (d) => `Charge: ${d.system_status || '--'}` }
  ]
];

async function refreshHAData() {
  const haData = await getMaisonData();
  state.data = { ...state.data, ...haData };
  updateView();
}

async function refreshTrains() {
  const trains = await getTrains();
  state.data = { ...state.data, trains };
  updateView();
}

async function refreshNewsData() {
  const news = await getNews();
  state.data = { ...state.data, news };
  updateView();
}

function updateView() {
  const app = document.querySelector('#app');
  if (!app) return;
  const page = PAGES[state.y][state.x];
  const content = page.getValue(state.data);
  const gridIndicator = `
    <div class="pos-indicator">
      ${[0, 1, 2].map(py =>
    [0, 1, 2].map(px => `
          <div class="pos-dot ${px === state.x && py === state.y ? 'active' : ''}"></div>
        `).join('')
  ).join('')}
    </div>
  `;

  app.innerHTML = `
    <div class="page">
      ${gridIndicator}
      <div class="label">Tableau de bord • ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem;">
        ${page.icon}
        <h1>${page.title}</h1>
      </div>
      <div class="metric" style="margin-top: 1.5rem;">${content}</div>
    </div>
  `;
}

// Map hash changes to moves
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'up' && state.y > 0) state.y--;
  if (hash === 'down' && state.y < GRID_SIZE - 1) state.y++;
  if (hash === 'left' && state.x > 0) state.x--;
  if (hash === 'right' && state.x < GRID_SIZE - 1) state.x++;

  updateView();
  window.location.hash = '';
});

// Initial Render and Polling
document.addEventListener('DOMContentLoaded', async () => {
  // Initial fetch
  await Promise.all([refreshHAData(), refreshTrains(), refreshNewsData()]);

  // Decoupled intervals
  setInterval(refreshHAData, 30000);   // Home Assistant: 30 seconds
  setInterval(refreshTrains, 300000);  // Trains: 5 minutes
  setInterval(refreshNewsData, 300000); // News: 5 minutes
});
