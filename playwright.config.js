/** Browser tests own a separate local server so they do not disturb your preview. */
import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  workers:1,
  use:{baseURL:'http://127.0.0.1:8766',browserName:'chromium',headless:true},
  webServer:{command:'python3 -m http.server 8766 --bind 127.0.0.1 --directory web',url:'http://127.0.0.1:8766',reuseExistingServer:false},
  reporter:'list',
});
