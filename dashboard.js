// dashboard.js

export function createCard(coin) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="header">
      <img src="${coin.image}" alt="${coin.name} logo" />
      <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
    </div>
    <div class="price">Price: $${coin.current_price.toLocaleString()}</div>
    <div class="change">24h: ${coin.price_change_percentage_24h.toFixed(2)}%</div>
  `;
  return card;
}

const coins = ['cronos','bitcoin','ripple','ethereum','cardano','hedera-hashgraph','loaded-lions'];
const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + coins.join(',') + '&order=market_cap_desc&per_page=7&page=1&sparkline=false';

async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const container = document.getElementById('cards');
    container.innerHTML = '';
    data.forEach(coin => container.appendChild(createCard(coin)));
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

