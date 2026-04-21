import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATUS_FILE = join(ROOT, 'status.json');
const README_FILE = join(ROOT, 'README.md');
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function formatDate(isoString) {
  return isoString.slice(0, 16).replace('T', ' ') + ' UTC';
}

const result = process.argv[2];

let history = [];
if (existsSync(STATUS_FILE)) {
  try {
    history = JSON.parse(readFileSync(STATUS_FILE, 'utf8'));
  } catch {
    history = [];
  }
}

if (result === 'success' || result === 'failure') {
  const now = new Date();
  history.push({
    date: now.toISOString(),
    status: result === 'success' ? 'up' : 'down',
  });

  const cutoff = new Date(now.getTime() - EXPIRY_MS);
  history = history.filter(e => new Date(e.date) >= cutoff);

  writeFileSync(STATUS_FILE, JSON.stringify(history, null, 2) + '\n');
}

const latest = history.length > 0 ? history[history.length - 1] : null;

let readme = '# Showdown Tests\n\n';

if (latest) {
  const badgeColor = latest.status === 'up' ? 'brightgreen' : 'red';
  const badgeLabel = latest.status === 'up' ? 'UP' : 'DOWN';
  readme += `![Status](https://img.shields.io/badge/Pokemon_Showdown-${badgeLabel}-${badgeColor})\n\n`;
  readme += `> Pokemon Showdown was **${latest.status}** at ${formatDate(latest.date)}\n\n`;
} else {
  readme += '> No status history yet. Results will appear after the first workflow run.\n\n';
}

if (history.length > 0) {
  readme += '## Status History\n\n';
  readme += '| Date | Status |\n';
  readme += '|------|--------|\n';
  for (const entry of [...history].reverse()) {
    readme += `| ${formatDate(entry.date)} | ${entry.status === 'up' ? 'Up' : 'Down'} |\n`;
  }
  readme += '\n';
}

writeFileSync(README_FILE, readme);
