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

function predictPrice(history) {
  if (history.length < 2) return history.at(-1)?.price || 0;
  const changes = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].price;
    const curr = history[i].price;
    changes.push(curr / prev - 1);
  }
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  return history.at(-1).price * (1 + avg);
}

function addInsights(card, predicted, current) {
  const predEl = document.createElement('div');
  predEl.className = 'prediction';
  predEl.textContent = `Predicted 24h Price: $${predicted.toFixed(2)}`;
  card.appendChild(predEl);

  const diff = (predicted - current) / current;
  let signal = 'Hold';
  if (diff > 0.02) signal = 'Buy';
  else if (diff < -0.02) signal = 'Sell';
  const signalEl = document.createElement('div');
  signalEl.className = 'signal';
  signalEl.textContent = `Signal: ${signal}`;
  card.appendChild(signalEl);
}

function addPortfolio(card, coin, updateNetWorth) {
  const key = `holdings_${coin.id}`;
  const stored = parseFloat(localStorage.getItem(key)) || 0;
  const wrapper = document.createElement('div');
  wrapper.className = 'portfolio';
  wrapper.innerHTML = `
    <label>Holdings: <input type="number" step="any" value="${stored}" /></label>
    <div class="value">Value: $${(stored * coin.current_price).toLocaleString()}</div>
  `;
  const input = wrapper.querySelector('input');
  const valueEl = wrapper.querySelector('.value');
  input.addEventListener('input', () => {
    const val = parseFloat(input.value) || 0;
    localStorage.setItem(key, val);
    valueEl.textContent = `Value: $${(val * coin.current_price).toLocaleString()}`;
    updateNetWorth();
  });
  card.appendChild(wrapper);
}

async function fetchFearGreed() {
  const url = 'https://api.alternative.me/fng/?limit=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.data[0];
}

let currentData = null;

function updateNetWorth() {
  if (!currentData) return;
  let total = 0;
  for (const coin of currentData) {
    const amt = parseFloat(localStorage.getItem(`holdings_${coin.id}`)) || 0;
    total += amt * coin.current_price;
  }
  const el = document.getElementById('net-worth');
  if (el) el.textContent = 'Portfolio Value: $' + total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    currentData = data;
    const container = document.getElementById('cards');
    container.innerHTML = '';
    for (const coin of data) {
      const card = createCard(coin);
      container.appendChild(card);
      try {
        const history = await fetchHistory(coin.id);
        renderChart(card, history);
        const predicted = predictPrice(history);
        addInsights(card, predicted, coin.current_price);
      } catch (err) {
        console.error('Error rendering chart:', err);
      }
      addPortfolio(card, coin, updateNetWorth);
    }

    updateNetWorth();

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

