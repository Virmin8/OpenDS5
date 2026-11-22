#!/usr/bin/env bash
set -u
. "$(dirname "$0")/harness.sh"
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"

# root stub: invoked once as `bash <runner>`; logs the runner's contents
# instead of executing it, and simulates a step failure (exit 4, as the real
# runner's fail() would) when the plan contains the word FAILME.
cat > "$tmp/rootstub" <<'EOF'
#!/usr/bin/env bash
echo "$@" >> "$ROOTLOG"
if [ "$1" = bash ] && [ -f "${2:-}" ]; then
  cat "$2" >> "$ROOTLOG"
  grep -q FAILME "$2" && exit 4
fi
exit 0
EOF
chmod +x "$tmp/rootstub"

base_env=(ROOTLOG="$tmp/log" OPENDS5_ROOT_CMD="$tmp/rootstub"
  OPENDS5_OS_RELEASE="$here/fixtures/fedora/os-release"
  OPENDS5_UNAME_R=6.15.4-200.fc44.x86_64 OPENDS5_SYSROOT=/nonexistent
  OPENDS5_SB_STATE=disabled OPENDS5_SKIP_VERIFY=1)

: > "$tmp/log"
env "${base_env[@]}" bash "$here/../opends5-install" --yes >/dev/null
assert_contains "$(cat "$tmp/log")" "modprobe vhci-hcd 2>/dev/null || { dnf install -y kernel-modules-extra-6.15.4-200.fc44.x86_64" "steps executed via root helper"
assert_contains "$(cat "$tmp/log")" "modules-load.d/vds.conf" "boot entry step executed"
assert_eq 1 "$(grep -c '^bash ' "$tmp/log")" "root helper invoked exactly once (single auth prompt)"

# with verify enabled, the runner loads vhci-hcd and (re)starts vdsd if installed
: > "$tmp/log"
env "${base_env[@]}" OPENDS5_SKIP_VERIFY=0 bash "$here/../opends5-install" --yes >/dev/null
assert_contains "$(cat "$tmp/log")" "modprobe vhci-hcd >>" "runner loads vhci-hcd"
assert_contains "$(cat "$tmp/log")" "systemctl enable vdsd.service && systemctl restart vdsd.service" "runner restarts vdsd so an updated binary runs"

# failure stops the run and exits 4 (nothing to roll back without DKMS)
: > "$tmp/log"
set +e
env "${base_env[@]}" OPENDS5_TEST_INJECT_FAIL=FAILME bash "$here/../opends5-install" --yes >/dev/null 2>&1
rc=$?
set -e
assert_eq 4 "$rc" "exit code 4 on step failure"
case "$(cat "$tmp/log")" in *"dkms add"*|*"dkms install"*) f=1 ;; *) f=0 ;; esac
assert_eq 0 "$f" "no DKMS build anywhere in the runner"
rm -rf "$tmp"
finish
