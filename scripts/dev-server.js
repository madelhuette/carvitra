#!/usr/bin/env node
/**
 * Smart Dev Server Manager
 * Verhindert mehrfache Server-Instanzen und Port-Konflikte
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const LOCK_FILE = path.join(__dirname, '..', '.server-lock.json');
const DEFAULT_PORT = 3000;
const MAX_RETRIES = 3;

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Prüft ob Server auf Port antwortet
function checkServerHealth(port = DEFAULT_PORT) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode < 500);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Liest Lock-File
function readLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    }
  } catch (error) {
    log('Lock-File konnte nicht gelesen werden', 'yellow');
  }
  return null;
}

// Schreibt Lock-File
function writeLockFile(data) {
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    log('Lock-File konnte nicht geschrieben werden', 'yellow');
  }
}

// Löscht Lock-File
function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (error) {
    log('Lock-File konnte nicht gelöscht werden', 'yellow');
  }
}

// Prüft ob Prozess mit PID läuft
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

// Startet den Dev-Server
function startDevServer() {
  log('🚀 Starte Next.js Development Server...', 'cyan');
  
  const server = spawn('npx', ['next', 'dev', '--turbopack'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: DEFAULT_PORT }
  });

  const lockData = {
    port: DEFAULT_PORT,
    pid: server.pid,
    started: new Date().toISOString(),
    status: 'running'
  };

  writeLockFile(lockData);
  
  log(`✅ Server gestartet auf http://localhost:${DEFAULT_PORT}`, 'green');
  log(`   PID: ${server.pid}`, 'green');

  // Cleanup bei Beenden
  process.on('SIGINT', () => {
    log('\n🛑 Server wird beendet...', 'yellow');
    removeLockFile();
    server.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    removeLockFile();
    server.kill();
    process.exit(0);
  });

  server.on('close', (code) => {
    removeLockFile();
    if (code !== 0) {
      log(`Server beendet mit Code ${code}`, 'red');
    }
    process.exit(code);
  });
}

// Hauptfunktion
async function main() {
  log('🔍 Prüfe bestehende Server...', 'cyan');
  
  const lock = readLockFile();
  
  if (lock && lock.pid) {
    // Prüfe ob der Prozess noch läuft
    if (isProcessRunning(lock.pid)) {
      log(`📌 Server läuft bereits auf Port ${lock.port} (PID: ${lock.pid})`, 'yellow');
      
      // Prüfe ob Server antwortet
      const isHealthy = await checkServerHealth(lock.port);
      
      if (isHealthy) {
        log('✅ Server ist gesund und antwortet', 'green');
        log(`   URL: http://localhost:${lock.port}`, 'green');
        log('   Nutze --force um einen neuen Server zu erzwingen', 'yellow');
        
        // Wenn Force-Flag gesetzt ist, beende alten Server
        if (process.argv.includes('--force')) {
          log('⚠️  Force-Flag erkannt, beende alten Server...', 'yellow');
          try {
            process.kill(lock.pid, 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000));
            removeLockFile();
          } catch (error) {
            log('Fehler beim Beenden des alten Servers', 'red');
          }
        } else {
          process.exit(0);
        }
      } else {
        log('⚠️  Server antwortet nicht, räume auf...', 'yellow');
        try {
          process.kill(lock.pid, 'SIGTERM');
        } catch (error) {
          // Prozess existiert nicht mehr
        }
        removeLockFile();
      }
    } else {
      log('🧹 Bereinige veraltetes Lock-File', 'yellow');
      removeLockFile();
    }
  }
  
  // Prüfe ob Port frei ist
  const portInUse = await new Promise((resolve) => {
    const server = require('net').createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(DEFAULT_PORT);
  });
  
  if (portInUse) {
    log(`⚠️  Port ${DEFAULT_PORT} ist belegt`, 'red');
    log('   Versuche Prozess zu finden und zu beenden...', 'yellow');
    
    // Versuche den blockierenden Prozess zu finden
    exec(`lsof -ti:${DEFAULT_PORT}`, (error, stdout) => {
      if (stdout) {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            log(`   Prozess ${pid} beendet`, 'green');
          } catch (err) {
            log(`   Konnte Prozess ${pid} nicht beenden`, 'red');
          }
        });
        
        // Warte kurz und starte dann
        setTimeout(() => startDevServer(), 2000);
      } else {
        log('   Konnte blockierenden Prozess nicht finden', 'red');
        log('   Nutze "npm run dev:clean" zum Aufräumen', 'yellow');
        process.exit(1);
      }
    });
  } else {
    startDevServer();
  }
}

// Script ausführen
main().catch(error => {
  log(`Fehler: ${error.message}`, 'red');
  process.exit(1);
});