// dashboard.js

export function createCard(coin) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = coin.id;
  card.innerHTML = `
    <div class="header">
      <img src="${coin.image}" alt="${coin.name} logo" />
      <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
    </div>
    <div class="price">Price: $${coin.current_price.toLocaleString()}</div>
    <div class="change">24h: ${coin.price_change_percentage_24h.toFixed(2)}%</div>
    <div class="prediction"></div>
    <div class="portfolio">
      <input type="number" class="holding" placeholder="Holdings" step="any" />
      <div class="value"></div>
    </div>
    <canvas class="chart" height="80"></canvas>
  `;
  return card;
}

const coins = ['cronos','bitcoin','ripple','ethereum','cardano','hedera-hashgraph','loaded-lions'];
const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + coins.join(',') + '&order=market_cap_desc&per_page=7&page=1&sparkline=false';

async function fetchHistory(id) {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.prices.map(p => ({ time: p[0], price: p[1] }));
}

function predictPrices(history) {
  if (history.length < 2) return { day1: NaN, day7: NaN };
  const diffs = [];
  for (let i = 1; i < history.length; i++) {
    diffs.push(history[i].price - history[i - 1].price);
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const last = history[history.length - 1].price;
  return {
    day1: last + avg,
    day7: last + avg * 7
  };
}

function renderChart(card, history) {
  const ctx = card.querySelector('canvas').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => new Date(h.time).toLocaleDateString()),
      datasets: [{
        data: history.map(h => h.price),
        borderColor: 'blue',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { display: false } } }
    }
  });
}

async function fetchFearGreed() {
  const url = 'https://api.alternative.me/fng/?limit=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.data[0];
}

async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const container = document.getElementById('cards');
    container.innerHTML = '';
    for (const coin of data) {
      const card = createCard(coin);
      container.appendChild(card);
      try {
        const history = await fetchHistory(coin.id);
        renderChart(card, history);
        const preds = predictPrices(history);
        const predEl = card.querySelector('.prediction');
        if (predEl)
          predEl.textContent = `1d: $${preds.day1.toFixed(2)}, 7d: $${preds.day7.toFixed(2)}`;
      } catch (err) {
        console.error('Error rendering chart:', err);
      }

      const input = card.querySelector('.holding');
      const valueEl = card.querySelector('.value');
      const key = `holding-${coin.id}`;
      const stored = parseFloat(localStorage.getItem(key) || '0');
      if (stored) input.value = stored;
      const updateValue = () => {
        const qty = parseFloat(input.value) || 0;
        valueEl.textContent = `Value: $${(qty * coin.current_price).toLocaleString()}`;
      };
      updateValue();
      input.addEventListener('input', () => {
        localStorage.setItem(key, input.value);
        updateValue();
      });
    }

    try {
      const fg = await fetchFearGreed();
      const fgEl = document.getElementById('fear-greed');
      fgEl.textContent = `Fear & Greed Index: ${fg.value} (${fg.value_classification})`;
    } catch (err) {
      console.error('Error fetching fear/greed index:', err);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('cards').innerHTML = '<p>Failed to load data. Please try again later.</p>';
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark');

    document.getElementById('toggle-mode').addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const newTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
    });
    document.getElementById('search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });

    fetchData();
    setInterval(fetchData, 60000);
  });
}

