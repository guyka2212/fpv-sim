// Moon gravity: press G while flying to switch to the Moon's gravity (1/6 of Earth's) and back.
// Shows: a declared shortcut (info.keys), api.physics, ui.osd.

export const info = {
  id: 'moon-gravity',
  name: 'Moon Gravity',
  version: '1.0.0',
  author: 'FPV Sim',
  description: 'Press G in flight to toggle Moon gravity (1/6 g). Floaty flips!',
  api: 2,
  keys: {
    toggle: { name: 'Moon gravity', key: 'KeyG' },
  },
};

export default function (api) {
  let moon = false;
  const badge = api.ui.text('🌙 MOON GRAVITY', { x: 0.5, y: 0.12, style: { transform: 'translateX(-50%)', color: '#c9d7ff', display: 'none' } });

  api.keys.bind('toggle', () => {
    moon = !moon;
    apply();
    badge.show(moon);
    api.ui.osd(moon ? 'MOON GRAVITY ON' : 'EARTH GRAVITY', '', 1.5);
  });

  // 1/6 of Earth's gravity: api.physics multiplies the real physics (undone when the plugin stops).
  const apply = () => (api.physics.gravity = moon ? 1 / 6 : 1);

  api.on('flightEnd', () => {
    moon = false;
    apply();
    badge.show(false);
  });
}
