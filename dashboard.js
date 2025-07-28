// dashboard.js

export function analyzeCoin(coin) {
  if (!coin.sparkline_in_7d || !Array.isArray(coin.sparkline_in_7d.price)) {
    return { percentChange: '0.00', recommendation: 'No data' };
  }
  const prices = coin.sparkline_in_7d.price;
  const first = prices[0];
  const last = prices[prices.length - 1];
  const percentChange = ((last - first) / first) * 100;
  let recommendation = 'Hold';
  if (percentChange > 5) recommendation = 'Consider selling';
  else if (percentChange < -5) recommendation = 'Consider buying';
  return { percentChange: percentChange.toFixed(2), recommendation };
}

export function createCard(coin) {
  const analysis = analyzeCoin(coin);
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="header">
      <img src="${coin.image}" alt="${coin.name} logo" />
      <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
    </div>
    <div class="price">Price: $${coin.current_price.toLocaleString()}</div>
    <div class="change">24h: ${coin.price_change_percentage_24h.toFixed(2)}%</div>
    <canvas class="chart" width="200" height="100"></canvas>
    <div class="analysis">7d change: ${analysis.percentChange}% - ${analysis.recommendation}</div>
  `;

  const canvas = card.querySelector('canvas');
  if (typeof Chart !== 'undefined' && coin.sparkline_in_7d) {
    renderChart(canvas.getContext('2d'), coin.sparkline_in_7d.price);
  }
  return card;
}

function renderChart(ctx, prices) {
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        data: prices,
        borderColor: '#3e95cd',
        borderWidth: 1,
        pointRadius: 0,
        fill: false
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/');
    if (!res.ok) throw new Error('API error');
    const { data } = await res.json();
    const fng = data[0];
    document.getElementById('fear-greed').textContent =
      `Fear & Greed Index: ${fng.value} (${fng.value_classification})`;
  } catch (e) {
    document.getElementById('fear-greed').textContent = 'Fear & Greed Index unavailable';
  }
}

const coins = ['cronos','bitcoin','ripple','ethereum','cardano','hedera-hashgraph','loaded-lions'];
const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + coins.join(',') + '&order=market_cap_desc&per_page=7&page=1&sparkline=true';

async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const container = document.getElementById('cards');
    container.innerHTML = '';
    data.forEach(coin => container.appendChild(createCard(coin)));
    fetchFearGreed();
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

