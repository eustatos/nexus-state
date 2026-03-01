module.exports = {
  launch: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  server: {
    command: 'npm run dev',
    port: 5173,
    launchTimeout: 10000,
  },
};