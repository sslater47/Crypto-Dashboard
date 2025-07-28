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

test('generateHourlyPredictions returns 24 hourly entries', () => {
  const list = generateHourlyPredictions(100, 200);
  expect(list).toHaveLength(24);
  expect(list[0].price).toBeCloseTo(100 + (200 - 100) * (1 / 24));
  expect(list[23].price).toBeCloseTo(200);
});
