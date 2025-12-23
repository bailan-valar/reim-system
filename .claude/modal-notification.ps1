param(
    [string]$Title = "Claude Code",
    [string]$Message = "Notification"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 创建窗体
$form = New-Object System.Windows.Forms.Form
$form.Text = $Title
$form.Width = 400
$form.Height = 200
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false

# 创建消息标签
$label = New-Object System.Windows.Forms.Label
$label.Text = $Message
$label.AutoSize = $false
$label.Width = 360
$label.Height = 80
$label.Left = 20
$label.Top = 20
$label.TextAlign = "MiddleCenter"
$label.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 10)
$form.Controls.Add($label)

# 创建确定按钮
$okButton = New-Object System.Windows.Forms.Button
$okButton.Text = "确定"
$okButton.Width = 100
$okButton.Height = 35
$okButton.Left = 150
$okButton.Top = 110
$okButton.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 9)
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.Controls.Add($okButton)
$form.AcceptButton = $okButton

# 激活并聚焦窗口
$form.Add_Shown({
    $form.Activate()
    $form.Focus()
})

# 显示对话框
$form.ShowDialog() | Out-Null