// Ring race: glowing rings in front of the start. Fly through them in order; your best time is kept.
// Shows: THREE and world.add, flightStart / reset events, a menu tab, storage.

export const info = {
  id: 'rings',
  name: 'Ring Race',
  version: '1.0.0',
  author: 'FPV Sim',
  description: 'Adds 5 rings near the start of every map. Fly through them in order for a time. Best times in their own menu tab.',
  api: 1,
};

export default function (api) {
  const { THREE } = api;
  const best = api.storage.get('best', {}); // map id -> seconds
  let rings = [];
  let next = 0;
  let start = 0;
  const timer = api.ui.text('', { x: 0.5, y: 0.2, style: { transform: 'translateX(-50%)', fontSize: '24px' } });

  function clear() {
    for (const r of rings) api.world.remove(r.mesh);
    rings = [];
  }

  function build() {
    clear();
    const spawn = api.world.spawn;
    if (!spawn) return;
    const yaw = api.drone.heading;
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    for (let i = 0; i < 5; i++) {
      const pos = spawn.clone()
        .addScaledVector(fwd, 15 + i * 14)
        .addScaledVector(side, Math.sin(i * 1.3) * 6);
      pos.y += 2.5 + (i % 2) * 1.5;
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.12, 12, 40),
        new THREE.MeshBasicMaterial({ color: 0xff6a1a }),
      );
      mesh.position.copy(pos);
      mesh.lookAt(pos.clone().add(fwd));
      api.world.add(mesh);
      rings.push({ mesh, pos });
    }
    next = 0;
    start = 0;
    paint();
    timer.set('Fly through the rings!');
  }

  function paint() {
    rings.forEach((r, i) => r.mesh.material.color.set(i < next ? 0x39ff6a : i === next ? 0xff6a1a : 0x666666));
  }

  api.on('flightStart', build);
  api.on('reset', build);
  api.on('flightEnd', clear);

  let clock = 0;
  api.on('frame', ({ dt, state }) => {
    if (state !== 'flying' || !rings.length) return;
    clock += dt;
    const ring = rings[next];
    if (ring && api.drone.position.distanceTo(ring.pos) < 1.6) {
      if (next === 0) start = clock;
      next++;
      paint();
      if (next === rings.length) {
        const time = clock - start;
        const map = api.world.map?.id ?? '?';
        const record = !best[map] || time < best[map];
        if (record) {
          best[map] = time;
          api.storage.set('best', best);
        }
        timer.set(`${time.toFixed(2)} s${record ? '  NEW BEST!' : ''}`);
        api.ui.popup(`RINGS <b>${time.toFixed(2)} s</b>`, record ? 'bank' : '');
      }
    }
    if (next > 0 && next < rings.length) timer.set(`${(clock - start).toFixed(2)} s   ${next}/${rings.length}`);
  });

  api.ui.menuTab('Rings', (box) => {
    const rows = Object.entries(best).sort((a, b) => a[1] - b[1]);
    box.append(
      api.ui.el('div', { class: 'mp-box' }, [
        api.ui.el('h2', { textContent: 'Ring Race: best times' }),
        rows.length
          ? api.ui.el('ul', {}, rows.map(([map, s]) => api.ui.el('li', { textContent: `${map}: ${s.toFixed(2)} s` })))
          : api.ui.el('p', { class: 'sub', textContent: 'No times yet. Start a flight and fly through the rings.' }),
        api.ui.el('button', {
          textContent: 'Clear times',
          onclick: () => {
            for (const k of Object.keys(best)) delete best[k];
            api.storage.set('best', best);
            box.innerHTML = '';
            box.append(api.ui.el('p', { class: 'sub', textContent: 'Cleared.' }));
          },
        }),
      ]),
    );
  });
}
