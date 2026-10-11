; Uninstalling OpenDS5 from Windows Settings also removes the vdsd service and
; C:\Program Files\OpenDS5\vds, like Settings > Uninstall in the app. The setup
; script asks for administrator rights itself. USB/IP and HidHide stay: other
; tools use them too.
;
; Skipped on upgrades: electron-builder runs the old uninstaller (--updated)
; before installing the new version, and the setup wizard updates vdsd then.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    ${If} ${FileExists} "$INSTDIR\resources\installer\windows\opends5-setup.ps1"
      DetailPrint "Removing the vdsd service..."
      ExecWait '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\resources\installer\windows\opends5-setup.ps1" -Uninstall -Yes'
    ${EndIf}
  ${endIf}
!macroend
