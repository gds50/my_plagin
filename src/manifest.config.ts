import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'MyStart',
  short_name: 'MyStart',
  version: pkg.version,
  description: pkg.description,
  minimum_chrome_version: '114',
  action: {
    default_title: 'MyStart',
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  chrome_url_overrides: {
    newtab: 'src/newtab/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: [
    'storage',
    'bookmarks',
    'topSites',
    'sessions',
    'favicon',
    'alarms',
    'downloads',
  ],
  host_permissions: ['https://api.github.com/*'],
  // Requested on-demand (per-origin) when the user clicks "fetch title" for a
  // bookmark URL. Chrome will show a permission prompt scoped to that origin.
  optional_host_permissions: ['*://*/*'],
  // Allow access to chrome://favicon/ via the new favicon API
  web_accessible_resources: [
    {
      resources: ['_favicon/*'],
      matches: ['<all_urls>'],
      extension_ids: [],
    },
  ],
});
