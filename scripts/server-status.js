#!/usr/bin/env node
/**
 * Server Status Check
 * Zeigt den Status des Development Servers
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

const LOCK_FILE = path.join(__dirname, '..', '.server-lock.json');

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Server Health Check
async function checkServerHealth(port) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve({ healthy: true, statusCode: res.statusCode });
    });

    req.on('error', () => resolve({ healthy: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ healthy: false });
    });

    req.end();
  });
}

// Prozess-Check
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

// Zähle Node-Prozesse
async function countNodeProcesses() {
  return new Promise((resolve) => {
    exec('ps aux | grep -E "(node|npm|next)" | grep -v grep | wc -l', (error, stdout) => {
      if (error) {
        resolve(0);
      } else {
        resolve(parseInt(stdout.trim()) || 0);
      }
    });
  });
}

// Port-Nutzung prüfen
async function getPortUsage() {
  return new Promise((resolve) => {
    exec('lsof -i :3000-3010 | grep LISTEN', (error, stdout) => {
      if (error || !stdout) {
        resolve([]);
      } else {
        const lines = stdout.trim().split('\n');
        const ports = lines.map(line => {
          const parts = line.split(/\s+/);
          const portMatch = line.match(/:(\d+)/);
          return {
            process: parts[0],
            pid: parts[1],
            port: portMatch ? portMatch[1] : 'unknown'
          };
        });
        resolve(ports);
      }
    });
  });
}

// Hauptfunktion
async function main() {
  log('\n╔══════════════════════════════════════╗', 'cyan');
  log('║     🚀 SERVER STATUS CHECK 🚀        ║', 'cyan');
  log('╚══════════════════════════════════════╝\n', 'cyan');

  // Lock-File prüfen
  let lockData = null;
  try {
    if (fs.existsSync(LOCK_FILE)) {
      lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    }
  } catch (error) {
    log('⚠️  Lock-File konnte nicht gelesen werden', 'yellow');
  }

  if (lockData) {
    log('📋 Lock-File gefunden:', 'bright');
    log(`   Port: ${lockData.port}`, 'reset');
    log(`   PID: ${lockData.pid}`, 'reset');
    log(`   Gestartet: ${lockData.started}`, 'reset');
    
    // Prozess-Check
    const processRunning = isProcessRunning(lockData.pid);
    if (processRunning) {
      log(`   Status: ✅ Prozess läuft`, 'green');
      
      // Health-Check
      const health = await checkServerHealth(lockData.port);
      if (health.healthy) {
        log(`   Health: ✅ Server antwortet (Status ${health.statusCode})`, 'green');
        log(`\n🌐 URL: http://localhost:${lockData.port}\n`, 'bright');
      } else {
        log(`   Health: ❌ Server antwortet nicht`, 'red');
      }
    } else {
      log(`   Status: ❌ Prozess läuft nicht mehr`, 'red');
      log(`   ℹ️  Lock-File ist veraltet`, 'yellow');
    }
  } else {
    log('📋 Kein Lock-File gefunden', 'yellow');
    log('   Server läuft vermutlich nicht über dev-server.js\n', 'reset');
  }

  // Port-Nutzung
  const portsInUse = await getPortUsage();
  if (portsInUse.length > 0) {
    log('🔌 Belegte Ports:', 'bright');
    portsInUse.forEach(p => {
      log(`   Port ${p.port}: ${p.process} (PID: ${p.pid})`, 'reset');
    });
  } else {
    log('🔌 Keine Ports 3000-3010 belegt', 'green');
  }

  // Node-Prozesse zählen
  const nodeCount = await countNodeProcesses();
  log(`\n📊 Node/npm Prozesse gesamt: ${nodeCount}`, nodeCount > 5 ? 'yellow' : 'green');
  
  if (nodeCount > 10) {
    log('   ⚠️  Viele Prozesse! Nutze "npm run dev:clean" zum Aufräumen', 'red');
  }

  // Empfehlungen
  log('\n💡 Verfügbare Befehle:', 'magenta');
  log('   npm run dev        - Startet Server (oder nutzt bestehenden)', 'reset');
  log('   npm run dev:clean  - Räumt auf und startet neu', 'reset');
  log('   npm run dev:force  - Erzwingt neuen Server', 'reset');
  log('   npm run dev:status - Zeigt diesen Status\n', 'reset');
}

// Script ausführen
main().catch(error => {
  log(`Fehler: ${error.message}`, 'red');
  process.exit(1);
});