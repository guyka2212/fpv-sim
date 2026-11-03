// FPV Sim plugin API, version 2. Docs: https://guyka2212.github.io/fpv-sim/plugins.html
// Put this file next to your plugin and start it with:
//   /** @param {import('./flysim-plugin').PluginApi} api */
//   export default function (api) { ... }

import type * as THREE_NS from 'three';

export type GameState = 'menu' | 'loading' | 'flying' | 'paused' | 'map' | 'naming' | 'replay' | 'lobby';
export type When = 'flying' | 'menu' | 'always';

export interface PluginEvents {
  /** Every rendered frame. dt: seconds since the last frame. */
  frame: { dt: number; state: GameState };
  /** A flight begins: map and drone ids, and whether it's a multiplayer round. */
  flightStart: { map: string; drone: string; multiplayer: boolean };
  /** Back to the main menu. */
  flightEnd: undefined;
  /** The drone was put back on the start. */
  reset: undefined;
  /** A crash or a drowning. speed in m/s. */
  crash: { speed: number; drowned: boolean };
  /** A trick was recognised. */
  trick: { name: string; points: number; combo: number };
  /** A multiplayer chat line (system: join / leave notes). */
  chat: { from: string; text: string; system: boolean };
  pause: undefined;
  resume: undefined;
  /** A main-menu tab was clicked. */
  tab: { tab: string };
  /** The motors were armed / disarmed (in flight). */
  arm: undefined;
  disarm: undefined;
  /** We joined a server (we're in its lobby). */
  join: { address: string; server: string };
  /** We left a server, or it closed. */
  leave: { reason: string };
  /** Another pilot joined / left the server. */
  playerJoin: { id: number; name: string };
  playerLeave: { id: number; name: string };
}

export interface Sticks {
  /** 0..1 */
  throttle: number;
  /** -1..1 (right = +) */
  yaw: number;
  /** -1..1 (forward = +) */
  pitch: number;
  /** -1..1 (right = +) */
  roll: number;
}

/** A shortcut in info.keys. The player can change it in Settings → Plugin shortcuts. */
export interface KeyDecl {
  /** Shown in Settings. */
  name: string;
  /** Default key: a KeyboardEvent.code like 'KeyG', 'Digit1', 'F2'. */
  key?: string;
  /** Default controller button: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Back, 9 Start, 10 / 11 stick clicks, 12-15 D-pad. */
  pad?: number;
}

export interface ScreenItem {
  el: HTMLElement;
  /** New text (or HTML when created with html: true). */
  set(content: string): void;
  show(on?: boolean): void;
  remove(): void;
}

export interface Panel {
  el: HTMLElement;
  /** Put your content here. */
  body: HTMLElement;
  show(on?: boolean): void;
  remove(): void;
}

export interface PluginApi {
  /** Plugin API version of this game. */
  readonly version: number;
  readonly info: { id: string; name: string; version: string };
  /** The three.js library the game uses. */
  readonly THREE: typeof THREE_NS;
  /** console.log with the plugin id in front. */
  log(...args: unknown[]): void;
  /** Runs fn on a game event. Returns a function that stops listening. */
  on<E extends keyof PluginEvents>(event: E, fn: (data: PluginEvents[E]) => void): () => void;
  off<E extends keyof PluginEvents>(event: E, fn: (data: PluginEvents[E]) => void): void;
  /** Runs when the plugin is turned off or removed. */
  onUnload(fn: () => void): void;
  /** Calls fn every ms milliseconds until the plugin stops. Returns a stop function. */
  every(ms: number, fn: () => void): () => void;
  /** Calls fn once after ms milliseconds (cancelled if the plugin stops). */
  after(ms: number, fn: () => void): () => void;

  game: {
    readonly state: GameState;
    /** In a multiplayer round. */
    readonly multiplayer: boolean;
    /** The player's settings, live. Call applySettings() after changing them. */
    readonly settings: Record<string, any>;
    /** Saves settings and redraws the Settings tab. */
    applySettings(): void;
    /** The whole game object. Internals may change between versions. */
    readonly raw: any;
  };

  drone: {
    /** Live: change it to move the drone (metres). */
    readonly position: THREE_NS.Vector3;
    /** Live, m/s. */
    readonly velocity: THREE_NS.Vector3;
    /** Live attitude. */
    readonly quaternion: THREE_NS.Quaternion;
    /** Live body rates, rad/s (x pitch, y yaw, z roll). */
    readonly rates: THREE_NS.Vector3;
    readonly speed: number;
    /** Metres above the ground straight below. */
    readonly altitude: number;
    /** Radians; 0 faces -Z. */
    readonly heading: number;
    readonly armed: boolean;
    /** Flight mode; set it to switch. */
    mode: 'acro' | 'angle' | 'horizon';
    readonly crashed: boolean;
    /** The drone's spec (name, mass, motor, prop, battery, rates, crashSpeed...). */
    readonly spec: Record<string, any>;
    /** voltage (V), charge 0..1, usedMah. */
    readonly battery: { voltage: number; charge: number; usedMah: number };
    arm(): void;
    disarm(): void;
    /** Back to the start of the map. */
    reset(): void;
    /** Moves the drone there, stopped (stays armed). */
    teleport(x: number, y: number, z: number, heading?: number): void;
  };

  /** Multipliers on the real physics (1 = normal); every plugin's values multiply together. Undone when the plugin stops. */
  physics: {
    /** Lift from the props (not the steering). */
    thrust: number;
    /** Air drag on the body and props. */
    drag: number;
    gravity: number;
    /** How fast the props can still push: above 1 raises the top speed. */
    propSpeed: number;
    /** Battery drain (0 = never runs down). */
    battery: number;
    /** Back to 1 for this plugin. */
    reset(): void;
  };

  /** Game speed: 1 real time, 0.25 slow motion, 2 double (0.05 to 4). */
  time: { scale: number };

  input: {
    /** This frame's sticks (a copy). */
    readonly sticks: Sticks;
    /** fn runs every flight frame before the flight controller reads the sticks: change them to fly the drone. Returns a stop function. */
    modify(fn: (sticks: Sticks) => void): () => void;
    /** True while that key (KeyboardEvent.code) is held. */
    isDown(code: string): boolean;
    /** Controller buttons held right now. */
    readonly buttons: number[];
  };

  camera: {
    /** The three.js camera being drawn. */
    readonly object: THREE_NS.PerspectiveCamera;
    readonly mode: 'fpv' | 'chase' | 'los';
    /** FPV field of view, degrees (horizontal). */
    fov: number;
    /** FPV camera uptilt, degrees. */
    uptilt: number;
    /** Next camera (FPV, chase, line of sight). */
    cycle(): string;
  };

  sound: {
    /** A beep: Hz, ms, volume 0..1, wave. */
    beep(freq?: number, ms?: number, volume?: number, wave?: 'sine' | 'square' | 'sawtooth' | 'triangle'): void;
    /** Reads text aloud with the system voice. */
    say(text: string): void;
  };

  world: {
    readonly scene: THREE_NS.Scene;
    /** The loaded map, or null in the menu. */
    readonly map: { id: string; name: string } | null;
    /** Start point on the ground. */
    readonly spawn: THREE_NS.Vector3 | null;
    /** Adds an object to the scene (removed when the plugin stops). */
    add<T extends THREE_NS.Object3D>(object: T): T;
    remove(object: THREE_NS.Object3D): void;
    /** Metres straight down from the point to the first surface, or Infinity. */
    groundDistance(x: number, y: number, z: number, max?: number): number;
  };

  ui: {
    /** Builds an element: el('button', { textContent: 'Go', onclick: fn }, [children]). */
    el<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Record<string, any>, children?: (Node | string)[]): HTMLElementTagNameMap[K];
    /** Text on the screen. x / y: 0..1 of the screen. when: 'flying' (default), 'menu' or 'always'. */
    text(content: string, options?: { x?: number; y?: number; html?: boolean; when?: When; style?: Partial<CSSStyleDeclaration> }): ScreenItem;
    /** A boxed panel with a title. when defaults to 'always'. */
    panel(title: string, options?: { x?: number; y?: number; width?: number; when?: When }): Panel;
    /** A tab in the main menu; render draws it each time it's opened. */
    menuTab(title: string, render: (container: HTMLElement) => void): { open(): void; redraw(): void };
    /** A section at the end of Settings. */
    settingsSection(title: string, render: (container: HTMLElement) => void): void;
    /** A message on the flight screen. */
    osd(text: string, kind?: '' | 'warn' | 'bad', seconds?: number): void;
    /** A short popup like trick points. */
    popup(html: string, kind?: '' | 'bank' | 'bail'): void;
    /** A message box with an OK button. */
    notice(text: string): void;
    /** Adds CSS to the page (removed with the plugin). */
    css(text: string): void;
  };

  keys: {
    /**
     * Runs fn when a shortcut is pressed. name: a shortcut from info.keys (key and/or controller
     * button, changeable in Settings), or a raw KeyboardEvent.code like 'KeyG'. Not while typing in
     * a text box. Returns an unbind function.
     */
    bind(name: string, fn: (e?: KeyboardEvent) => void, when?: 'flying' | 'menu' | 'paused' | 'always'): () => void;
    /** What a declared shortcut is set to now, e.g. "G" or "B / 🎮 Y". */
    label(name: string): string;
  };

  storage: {
    get<T = unknown>(key: string, fallback?: T): T;
    set(key: string, value: unknown): void;
    remove(key: string): void;
  };

  multiplayer: {
    readonly connected: boolean;
    /** Your player id (0 when not on a server). */
    readonly myId: number;
    /** Everyone on the server. */
    readonly players: { id: number; name: string; drone: string; level?: number; ping: number }[];
    /** Where the other drones are right now. */
    readonly drones: { id: number; position: THREE_NS.Vector3; drone: string }[];
    /** Sends a chat line as you. */
    say(text: string): void;
  };
}

export interface PluginInfo {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  /** Lowest plugin API version needed. */
  api?: number;
  /** Shortcuts the player can change in Settings → Plugin shortcuts. */
  keys?: Record<string, KeyDecl>;
}
