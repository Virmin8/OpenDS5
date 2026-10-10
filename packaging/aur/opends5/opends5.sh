#!/bin/sh
# OPENDS5_LAUNCHER tells the app it was installed by a package: the setup wizard and
# in-app uninstaller stay hidden, and "Launch at startup" points autostart here.
export OPENDS5_LAUNCHER=/usr/bin/opends5
exec @ELECTRON@ /usr/lib/opends5 "$@"
