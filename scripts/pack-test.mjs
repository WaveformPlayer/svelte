/**
 * scripts/pack-test.mjs
 * ---------------------
 *
 * Packs this package and installs the tarball into throwaway consumers, the
 * way a user would get it from npm:
 *
 *   1. all four cores installed — a Vite build importing every sub-path
 *      compiles each component and resolves each core's dynamic import, and
 *      tsc resolves each sub-path's types;
 *   2. ONLY `@arraypress/waveform-player` installed — importing `./player`
 *      builds; importing `./bar` gets Vite's throwing stub for the missing
 *      optional core;
 *   3. the bare package name is not exported.
 *
 * The cores install from npm at their devDependency range. A core whose
 * devDependency is temporarily a `file:` path (cross-repo work before a
 * release) is packed too and installed from its tarball, as npm would
 * deliver it.
 *
 * Needs network access (installs the tools from the registry). Usage:
 *   npm run test:pack            # keeps nothing
 *   KEEP=1 npm run test:pack     # leaves the consumer dirs for inspection
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = (await import(join(root, 'package.json'), { with: { type: 'json' } })).default;
const work = mkdtempSync(join(tmpdir(), 'waveform-svelte-pack-'));

const run = (cmd, args, cwd) =>
	execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Like `run`, but returns the failure output instead of throwing. */
const runExpectingFailure = (cmd, args, cwd) => {
	try {
		run(cmd, args, cwd);
	} catch (err) {
		return `${err.stdout ?? ''}${err.stderr ?? ''}`;
	}
	throw new Error(`expected \`${cmd} ${args.join(' ')}\` to fail in ${cwd}`);
};

let failures = 0;
const check = (label, fn) => {
	try {
		fn();
		console.log(`  ok   ${label}`);
	} catch (err) {
		failures++;
		console.log(`  FAIL ${label}\n${String(err.stdout ?? '')}${String(err.stderr ?? err.message)}`);
	}
};

console.log('build + pack');
run('npm', ['run', 'build'], root);
const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], root));
// npm <= 11 prints an array of results; npm 12 prints an object keyed by
// package name.
const result = Array.isArray(packed) ? packed[0] : (packed[pkg.name] ?? Object.values(packed)[0]);
const tarball = join(work, result.filename);
const shipped = result.files.map((f) => f.path).sort();
console.log(`  ${result.filename}: ${shipped.length} files`);
check('tarball holds dist/, README, LICENSE and package.json only', () => {
	const stray = shipped.filter((p) => !/^(dist\/|README\.md$|LICENSE$|package\.json$)/.test(p));
	if (stray.length) throw new Error(`unexpected files: ${stray.join(', ')}`);
	for (const sub of ['player', 'bar', 'playlist', 'sounds']) {
		if (!shipped.includes(`dist/${sub}/index.js`)) throw new Error(`missing dist/${sub}/index.js`);
		if (!shipped.includes(`dist/${sub}/index.d.ts`)) throw new Error(`missing dist/${sub}/index.d.ts`);
	}
});

/** Install spec for a core: its tarball when the devDependency is `file:`. */
const coreSpecs = {};
for (const sub of ['player', 'bar', 'playlist', 'sounds']) {
	const name = `@arraypress/waveform-${sub}`;
	const range = pkg.devDependencies[name];
	if (range.startsWith('file:')) {
		const out = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work, resolve(root, range.slice(5))], root));
		const r = Array.isArray(out) ? out[0] : (out[name] ?? Object.values(out)[0]);
		coreSpecs[name] = join(work, r.filename);
		console.log(`  ${r.filename} (from ${range})`);
	} else {
		coreSpecs[name] = `${name}@${range}`;
	}
}

const viteConfig = `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
	plugins: [svelte()],
	logLevel: 'error',
	build: { lib: { entry: 'src/main.js', formats: ['es'] }, outDir: 'out', emptyOutDir: true },
});
`;
const toolDeps = {
	svelte: pkg.devDependencies.svelte,
	vite: pkg.devDependencies.vite,
	'@sveltejs/vite-plugin-svelte': pkg.devDependencies['@sveltejs/vite-plugin-svelte'],
	typescript: pkg.devDependencies.typescript,
};

function makeConsumer(name, cores) {
	const dir = join(work, name);
	mkdirSync(join(dir, 'src'), { recursive: true });
	writeFileSync(
		join(dir, 'package.json'),
		JSON.stringify({ name, private: true, type: 'module' }, null, 2),
	);
	writeFileSync(join(dir, 'vite.config.js'), viteConfig);
	const deps = [tarball, ...Object.entries(toolDeps).map(([n, v]) => `${n}@${v}`), ...cores.map((c) => coreSpecs[c])];
	run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', ...deps], dir);
	return dir;
}

/** Mounting each component client-side forces Vite to compile it. */
const mountAll = (subs) =>
	subs
		.map(
			([sub, names]) =>
				`import { ${names.join(', ')} } from '${pkg.name}/${sub}';\n` +
				names.map((n) => `mount(${n}, { target: document.body });`).join('\n'),
		)
		.join('\n');

const ALL = [
	['player', ['WaveformPlayer']],
	['bar', ['WaveformBar', 'WaveformBarTrigger']],
	['playlist', ['WaveformPlaylist']],
	['sounds', ['WaveformSounds']],
];

console.log('\nconsumer with all four cores');
const full = makeConsumer('consumer-all', Object.keys(coreSpecs));
writeFileSync(join(full, 'src/main.js'), `import { mount } from 'svelte';\n${mountAll(ALL)}\n`);
/** Every emitted chunk, concatenated. */
const output = (dir) =>
	readdirSync(join(dir, 'out'))
		.map((f) => readFileSync(join(dir, 'out', f), 'utf8'))
		.join('\n');
check('vite build importing every sub-path bundles all four real cores', () => {
	run('npx', ['vite', 'build'], full);
	if (output(full).includes('Could not resolve')) throw new Error('a core was stubbed out');
});
writeFileSync(
	join(full, 'src/types.ts'),
	`import type { WaveformPlayerProps, WaveformPlayerExpose } from '${pkg.name}/player';
import type { WaveformBarConfig, WaveformBarTriggerProps } from '${pkg.name}/bar';
import type { WaveformPlaylistProps, WaveformPlaylistExpose } from '${pkg.name}/playlist';
import type { WaveformSoundsProps, WaveformSoundsExpose } from '${pkg.name}/sounds';
import type { ComponentProps } from 'svelte';
import { WaveformPlayer } from '${pkg.name}/player';
export const p: WaveformPlayerProps = { url: '/a.mp3', waveformStyle: 'bars', duration: 187, preload: 'none', waveform: 'wp1:AIC_' };
export const onseek: ComponentProps<typeof WaveformPlayer>['onseek'] = (d) => d.currentTime.toFixed(1);
export const b: WaveformBarConfig = { persist: true };
export const t: WaveformBarTriggerProps = { url: '/a.mp3' };
export const l: WaveformPlaylistProps = { tracks: [{ url: '/a.mp3', duration: '3:45', downloadUrl: '/a.wav' }] };
export const s: WaveformSoundsProps = { sounds: [] };
export type E = [WaveformPlayerExpose, WaveformPlaylistExpose, WaveformSoundsExpose];
`,
);
writeFileSync(
	join(full, 'tsconfig.json'),
	JSON.stringify({
		compilerOptions: {
			target: 'ES2022',
			module: 'ESNext',
			moduleResolution: 'Bundler',
			strict: true,
			noEmit: true,
			lib: ['ES2022', 'DOM'],
		},
		include: ['src/types.ts'],
	}),
);
check('tsc resolves every sub-path\'s types', () => run('npx', ['tsc', '-p', '.'], full));

console.log('\nconsumer with ONLY @arraypress/waveform-player');
const only = makeConsumer('consumer-player-only', ['@arraypress/waveform-player']);
writeFileSync(join(only, 'src/main.js'), `import { mount } from 'svelte';\n${mountAll([ALL[0]])}\n`);
check('vite build importing ./player bundles the real core', () => {
	run('npx', ['vite', 'build'], only);
	if (output(only).includes('Could not resolve')) throw new Error('the player core was stubbed out');
});
check('importing ./bar without its core: Vite stubs the optional peer with a throw', () => {
	// Vite turns an unresolvable OPTIONAL peer into a chunk that throws
	// "Could not resolve ... Is it installed?" when loaded, so the build
	// passes and the bar fails at mount. Bundlers without that rule
	// (webpack, plain Rollup, esbuild) fail the build instead.
	writeFileSync(join(only, 'src/main.js'), `import { mount } from 'svelte';\n${mountAll([ALL[1]])}\n`);
	run('npx', ['vite', 'build'], only);
	if (!output(only).includes('Could not resolve \\"@arraypress/waveform-bar\\"')) {
		throw new Error('expected the optional-peer stub for @arraypress/waveform-bar in the output');
	}
});
check('the bare package name is not exported', () => {
	const out = runExpectingFailure(
		'node',
		['--input-type=module', '-e', `await import.meta.resolve('${pkg.name}')`],
		only,
	);
	if (!out.includes('ERR_PACKAGE_PATH_NOT_EXPORTED')) throw new Error(out);
});

if (process.env.KEEP) console.log(`\nkept ${work}`);
else rmSync(work, { recursive: true, force: true });
if (failures) {
	console.log(`\n${failures} check(s) failed`);
	process.exit(1);
}
console.log('\npack test passed');
