#!/bin/bash
# Installs the operations scripts on the VPS (idempotent). From the repo on your PC:
#   scp -r ops mindcoded:/root/ && ssh mindcoded 'bash /root/ops/install.sh'
# Secrets are never part of the repo: the backup credentials file is created once by hand (see ops/README.md).
set -euo pipefail
cd "$(dirname "$0")"

apt-get install -y -qq restic curl python3 >/dev/null

for f in bin/*; do
  install -m 0755 "$f" "/usr/local/bin/$(basename "$f")"
  sed -i 's/\r$//' "/usr/local/bin/$(basename "$f")"
done
chmod 0700 /usr/local/bin/mc-backup /usr/local/bin/mc-restic

install -m 0644 systemd/* /etc/systemd/system/
install -m 0644 apt/52unattended-reboot /etc/apt/apt.conf.d/52unattended-reboot
sed -i 's/\r$//' /etc/systemd/system/mc-*.service /etc/systemd/system/mc-*.timer /etc/apt/apt.conf.d/52unattended-reboot

# Old name from the first setup
rm -f /usr/local/bin/mc-backup.sh

systemctl daemon-reload
systemctl enable --now mc-backup.timer mc-weekly-report.timer >/dev/null
mkdir -p /var/cache/restic /root/.config && chmod 700 /root/.config

[ -f /root/.config/mc-backup.env ] || echo "WARNING: backup credentials missing - see ops/README.md"
systemctl list-timers 'mc-*' --no-pager
