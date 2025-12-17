Quick start:

1) Install deps
   npm install

2) Start the local server + UI
   npm run start
   Open http://localhost:8080

3) Start server controller (click "Start Local Export Server" in UI), then choose a target and "Start Export".

Notes:
- ws-server.js contains placeholder spawn commands for electron-forge, capacitor and devvit packaging. Replace these with the exact commands your projects require.
- For desktop packaging: configure forge.config.js and add makers per your target platforms.
- For Android: ensure Capacitor is installed in the target project. Typical flow: build web assets -> npx cap sync android -> npx cap open android -> build in Android Studio or use gradlew assemble.
- For Devvit: replace the pack command with the official Devvit toolchain steps you use.

