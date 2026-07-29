const fs = require('fs');
const pids = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d));
for (const pid of pids) {
  try {
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
    if (cmd && !cmd.startsWith('node /app/scripts/proc')) {
      let ppid = '';
      try { ppid = (fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(/\s+/)[3] || ''); } catch {}
      console.log(pid, 'ppid=' + ppid, cmd.slice(0, 160));
    }
  } catch {}
}
