// Flight stats: a small panel with crashes, tricks and top speed for this flight.
// Shows: ui.panel, crash / trick / reset events, keys.bind to show and hide it.

export const info = {
  id: 'flight-stats',
  name: 'Flight Stats',
  version: '1.0.0',
  author: 'FPV Sim',
  description: 'A panel counting crashes, tricks and top speed. Press H to show or hide it.',
  api: 2,
  // Shortcuts the player can change in Settings → Plugin shortcuts.
  keys: {
    toggle: { name: 'Show / hide', key: 'KeyH' },
  },
};

export default function (api) {
  const stats = { crashes: 0, tricks: 0, points: 0, top: 0 };
  const panel = api.ui.panel('Flight stats', { x: 0.02, y: 0.3, width: 200, when: 'flying' });
  const lines = api.ui.el('div');
  panel.body.append(lines, api.ui.el('div', { class: 'sub', textContent: `${api.keys.label('toggle')}: show / hide` }));

  function draw() {
    lines.innerHTML = '';
    for (const [k, v] of [
      ['Crashes', stats.crashes],
      ['Tricks', stats.tricks],
      ['Trick points', stats.points],
      ['Top speed', `${(stats.top * 3.6).toFixed(0)} km/h`],
    ]) lines.append(api.ui.el('div', { textContent: `${k}: ${v}` }));
  }
  draw();

  api.on('crash', () => {
    stats.crashes++;
    draw();
  });
  api.on('trick', (t) => {
    stats.tricks++;
    stats.points += t.points;
    draw();
  });
  api.on('flightStart', () => {
    Object.assign(stats, { crashes: 0, tricks: 0, points: 0, top: 0 });
    draw();
  });
  api.every(500, () => {
    if (api.game.state !== 'flying') return;
    if (api.drone.speed > stats.top) {
      stats.top = api.drone.speed;
      draw();
    }
  });

  let visible = true;
  api.keys.bind('toggle', () => panel.show((visible = !visible)));
}
