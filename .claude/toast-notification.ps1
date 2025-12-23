param(
    [string]$Title = "Claude Code",
    [string]$Message = "Notification"
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WindowHelper {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    public const int SW_RESTORE = 9;
}
"@

function Activate-CursorWindow {
    $cursorProcesses = Get-Process | Where-Object { $_.ProcessName -eq "Cursor" -and $_.MainWindowHandle -ne 0 }

    if ($cursorProcesses) {
        foreach ($process in $cursorProcesses) {
            $handle = $process.MainWindowHandle
            if ($handle -ne [IntPtr]::Zero) {
                if ([WindowHelper]::IsIconic($handle)) {
                    [WindowHelper]::ShowWindow($handle, [WindowHelper]::SW_RESTORE) | Out-Null
                }
                [WindowHelper]::SetForegroundWindow($handle) | Out-Null
                return $true
            }
        }
    }
    return $false
}

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast activationType="protocol" launch="cursor:activate">
    <visual>
        <binding template="ToastText02">
            <text id="1">$Title</text>
            <text id="2">$Message</text>
        </binding>
    </visual>
    <actions>
        <action content="查看" arguments="activate" activationType="foreground" />
    </actions>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml

$toast.add_Activated({
    Activate-CursorWindow
})

[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
