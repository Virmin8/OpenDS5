import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { UUID } = require('builder-util-runtime');

const packageJsonUrl = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(fs.readFileSync(packageJsonUrl, 'utf8'));
const readText = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const build = packageJson.build ?? {};
const nsis = build.nsis ?? {};

const expected = {
  appId: 'io.github.sundaymoments.ds5bridge',
  nsisGuid: '40464839-1bb3-5f24-b04b-13b55106e88b',
  productName: 'OpenDS5',
  uninstallDisplayName: 'OpenDS5'
};

const nsisNamespace = UUID.parse('50e065bc-3134-11e6-9bab-38c9862bdaf3');
const legacyDerivedGuid = String(UUID.v5(expected.appId, nsisNamespace));

const commonNsh = readText('../node_modules/app-builder-lib/templates/nsis/common.nsh');
const installSectionNsh = readText('../node_modules/app-builder-lib/templates/nsis/installSection.nsh');
const installUtilNsh = readText('../node_modules/app-builder-lib/templates/nsis/include/installUtil.nsh');
const uninstallerNsh = readText('../node_modules/app-builder-lib/templates/nsis/uninstaller.nsh');

const checks = [
  ['productName stays stable', packageJson.productName === expected.productName],
  ['appId stays stable', build.appId === expected.appId],
  ['pinned NSIS GUID matches legacy electron-builder derivation', nsis.guid === legacyDerivedGuid],
  ['pinned NSIS GUID stays stable', nsis.guid === expected.nsisGuid],
  ['installer stays assisted', nsis.oneClick === false],
  ['installer stays per-user', nsis.perMachine === false],
  ['fresh installs cannot pick a side-by-side directory', nsis.allowToChangeInstallationDirectory === false],
  ['uninstall/upgrade does not delete app data by default', nsis.deleteAppDataOnUninstall === false],
  ['Apps & features display name stays stable', nsis.uninstallDisplayName === expected.uninstallDisplayName],
  ['custom NSIS script is not overriding upgrade flow', nsis.script == null],
  // The include only adds an uninstall step (remove the vdsd service) that must
  // never run during an upgrade's old-version uninstall.
  ['custom NSIS include is the vdsd uninstall hook', nsis.include === 'nsis/installer.nsh'],
  ['vdsd uninstall hook is skipped on upgrade', (() => {
    const include = readText('../nsis/installer.nsh');
    const start = include.indexOf('!macro customUnInstall');
    const body = include.slice(start, include.indexOf('!macroend', start));
    return start >= 0 && body.trimStart().split('\n')[1]?.trim() === '${ifNot} ${isUpdated}'
      && !/!macro (customInstall|customRemoveFiles|preInit|customInit)\b/.test(include);
  })()],
  ['electron-builder skips fresh-install pages during upgrade', commonNsh.includes('!macro skipPageIfUpdated') && commonNsh.includes('${if} ${isUpdated}') && commonNsh.includes('Abort')],
  ['electron-builder checks/closes the running app before file replacement', installSectionNsh.includes('!insertmacro CHECK_APP_RUNNING')],
  ['electron-builder invokes the old uninstaller before writing new files', installSectionNsh.includes('!insertmacro uninstallOldVersion SHELL_CONTEXT')],
  ['electron-builder marks old uninstall as an update', installUtilNsh.includes('StrCpy $0 "$0 --updated"')],
  ['electron-builder preserves app data on update uninstalls', uninstallerNsh.includes('!ifdef DELETE_APP_DATA_ON_UNINSTALL') && uninstallerNsh.includes('${ifNot} ${isUpdated}')]
];

const failures = checks.filter(([, passed]) => !passed);

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`FAIL ${label}`);
  }
  process.exitCode = 1;
} else {
  for (const [label] of checks) {
    console.log(`PASS ${label}`);
  }
}
