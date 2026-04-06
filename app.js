const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
};

const state = { topic: 'web', lang: '', sort: 'stars', page: 1, query: '' };

const $ = id => document.getElementById(id);
const grid = $('repoGrid');
const pageInfo = $('pageInfo');
const prevBtn = $('prevBtn');
const nextBtn = $('nextBtn');
const searchInput = $('searchInput');
const clearBtn = $('clearBtn');

function formatNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}

function buildQuery() {
  const lang = state.lang ? ` language:${state.lang}` : '';
  return state.query
    ? `${state.query}${lang}`
    : `topic:${state.topic}${lang}`;
}

async function fetchRepos() {
  grid.innerHTML = '<div class="loading">⏳ Yükleniyor...</div>';
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(buildQuery())}&sort=${state.sort}&order=desc&per_page=12&page=${state.page}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });

    if (res.status === 403) {
      grid.innerHTML = '<div class="error">⚠️ GitHub API rate limit aşıldı. Birkaç dakika bekleyin.</div>';
      return;
    }

    if (!res.ok) {
      grid.innerHTML = `<div class="error">❌ Hata: ${res.status}</div>`;
      return;
    }

    const data = await res.json();
    renderRepos(data.items || []);

    const total = Math.ceil(Math.min(data.total_count, 1000) / 12);
    pageInfo.textContent = `Sayfa ${state.page} / ${total}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= total;
  } catch {
    grid.innerHTML = '<div class="error">❌ Bağlantı hatası.</div>';
  }
}

function renderRepos(repos) {
  if (!repos.length) {
    grid.innerHTML = '<div class="loading">Sonuç bulunamadı.</div>';
    return;
  }

  grid.innerHTML = repos.map(repo => {
    const color = LANG_COLORS[repo.language] || '#8b949e';
    const topics = (repo.topics || []).slice(0, 3)
      .map(t => `<span class="topic-badge">${t}</span>`).join('');

    return `
      <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noopener">
        <div class="repo-header">
          <img class="repo-avatar" src="${repo.owner.avatar_url}" alt="" loading="lazy"/>
          <div>
            <div class="repo-name">${repo.full_name}</div>
            <div class="repo-owner">${repo.owner.type === 'Organization' ? '🏢' : '👤'} ${repo.owner.login}</div>
          </div>
        </div>
        <div class="repo-desc">${repo.description || 'Açıklama yok'}</div>
        ${topics ? `<div class="topics">${topics}</div>` : ''}
        <div class="repo-meta">
          ${repo.language ? `<span class="meta-item"><span class="lang-dot" style="background:${color}"></span>${repo.language}</span>` : ''}
          <span class="meta-item">⭐ ${formatNum(repo.stargazers_count)}</span>
          <span class="meta-item">🍴 ${formatNum(repo.forks_count)}</span>
          <span class="meta-item">👁️ ${formatNum(repo.watchers_count)}</span>
        </div>
      </a>`;
  }).join('');
}

function doSearch() {
  state.query = searchInput.value.trim();
  state.page = 1;
  clearBtn.style.display = state.query ? 'inline-block' : 'none';
  fetchRepos();
}

function clearSearch() {
  searchInput.value = '';
  state.query = '';
  state.page = 1;
  clearBtn.style.display = 'none';
  fetchRepos();
}

$('searchBtn').addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => e.key === 'Enter' && doSearch());
clearBtn.addEventListener('click', clearSearch);

$('categoryTags').addEventListener('click', e => {
  const btn = e.target.closest('.tag');
  if (!btn) return;
  document.querySelectorAll('#categoryTags .tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.topic = btn.dataset.topic;
  state.page = 1;
  fetchRepos();
});

$('langTags').addEventListener('click', e => {
  const btn = e.target.closest('.tag');
  if (!btn) return;
  document.querySelectorAll('#langTags .tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.lang = btn.dataset.lang;
  state.page = 1;
  fetchRepos();
});

$('sortSelect').addEventListener('change', e => {
  state.sort = e.target.value;
  state.page = 1;
  fetchRepos();
});

prevBtn.addEventListener('click', () => { state.page--; fetchRepos(); });
nextBtn.addEventListener('click', () => { state.page++; fetchRepos(); });

fetchRepos();
