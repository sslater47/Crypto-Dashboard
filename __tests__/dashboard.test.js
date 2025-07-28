import { createCard, analyzeCoin } from '../dashboard.js';

const sampleCoin = {
  image: 'logo.png',
  name: 'Bitcoin',
  symbol: 'btc',
  current_price: 12345.67,
  price_change_percentage_24h: 1.23,
  sparkline_in_7d: { price: [12000, 12500, 13000] }
};

test('createCard returns a DOM element with expected fields', () => {
  const card = createCard(sampleCoin);
  expect(card).toBeInstanceOf(HTMLElement);
  expect(card.className).toBe('card');
  expect(card.querySelector('img').src).toContain(sampleCoin.image);
  expect(card.querySelector('h3').textContent).toBe('Bitcoin (BTC)');
  expect(card.querySelector('.price').textContent).toContain('12,345.67');
  expect(card.querySelector('.change').textContent).toContain('1.23');
  expect(card.querySelector('.analysis')).not.toBeNull();
});

test('analyzeCoin provides recommendation data', () => {
  const result = analyzeCoin(sampleCoin);
  expect(result).toHaveProperty('recommendation');
  expect(result).toHaveProperty('percentChange');
});
