// Speed HUD: big speed and height numbers on screen, with a Settings section for units.
// Shows: ui.text, on('frame'), storage, ui.settingsSection.

export const info = {
  id: 'speed-hud',
  name: 'Speed HUD',
  version: '1.0.0',
  author: 'FPV Sim',
  description: 'Big speed and height readout while flying. Pick km/h or mph in Settings.',
  api: 1,
};

export default function (api) {
  let units = api.storage.get('units', 'kmh');
  const label = api.ui.text('', { x: 0.5, y: 0.78, style: { transform: 'translateX(-50%)', fontSize: '30px', textAlign: 'center' } });

  let t = 0;
  api.on('frame', ({ dt, state }) => {
    if (state !== 'flying') return;
    t += dt;
    if (t < 0.1) return; // 10 updates a second is plenty
    t = 0;
    const speed = api.drone.speed * (units === 'mph' ? 2.237 : 3.6);
    const height = api.drone.altitude;
    label.set(`${speed.toFixed(0)} ${units === 'mph' ? 'MPH' : 'KM/H'}   ${Number.isFinite(height) ? height.toFixed(1) : '--'} M`);
  });

  api.ui.settingsSection('Speed HUD', (box) => {
    const pick = api.ui.el('select', {
      onchange: (e) => {
        units = e.target.value;
        api.storage.set('units', units);
      },
    }, [api.ui.el('option', { value: 'kmh', textContent: 'km/h' }), api.ui.el('option', { value: 'mph', textContent: 'mph' })]);
    pick.value = units;
    box.append(api.ui.el('div', { class: 'field' }, [api.ui.el('label', { textContent: 'Speed units' }), pick, api.ui.el('span')]));
  });
}
