import { createCard, generateHourlyPredictions } from '../dashboard.js';

const sampleCoin = {
  image: 'logo.png',
  name: 'Bitcoin',
  symbol: 'btc',
  current_price: 12345.67,
  price_change_percentage_24h: 1.23
};

test('createCard returns a DOM element with expected fields', () => {
  const card = createCard(sampleCoin);
  expect(card).toBeInstanceOf(HTMLElement);
  expect(card.className).toBe('card');
  expect(card.querySelector('img').src).toContain(sampleCoin.image);
  expect(card.querySelector('h3').textContent).toBe('Bitcoin (BTC)');
  expect(card.querySelector('.price').textContent).toContain('12,345.67');
  expect(card.querySelector('.change').textContent).toContain('1.23');
});

test('generateHourlyPredictions returns 24 entries', () => {
  const list = generateHourlyPredictions(10, 12);
  expect(list).toHaveLength(24);
  const first = list[0];
  const last = list[23];
  expect(last.price).toBeCloseTo(12);
  expect(first.price).toBeGreaterThan(10);
});
