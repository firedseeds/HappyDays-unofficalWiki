param(
    [ValidateSet("Loop", "Pull", "Push")]
    [string]$Mode = "Loop",
    [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
if (-not $Root) {
    $Root = $PSScriptRoot
}
Set-Location $Root

$LogDir = Join-Path $Root "logs"
$LogFile = Join-Path $LogDir "sync.log"
$RunDir = Join-Path $Root ".run"
$SyncPidFile = Join-Path $RunDir "sync.pid"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
if (-not (Test-Path $RunDir)) {
    New-Item -ItemType Directory -Path $RunDir -Force | Out-Null
}
if ($Mode -eq "Loop") {
    Set-Content -Path $SyncPidFile -Value $PID -Encoding ASCII
}

if (-not $env:GIT_SSH_COMMAND -and $env:OS -eq "Windows_NT") {
    $ssh = Join-Path $env:WINDIR "System32\OpenSSH\ssh.exe"
    if (Test-Path $ssh) {
        $env:GIT_SSH_COMMAND = "`"$ssh`" -o StrictHostKeyChecking=accept-new"
    }
}

function Write-SyncLog([string]$Message) {
    $stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
    Add-Content -Path $LogFile -Value ("[$stamp] $Message") -Encoding UTF8
}

function Invoke-GitSync([string]$Label, [string[]]$Arguments) {
    if (-not (Test-Path (Join-Path $Root ".git"))) {
        Write-SyncLog "skip git $Label`: not a Git repository"
        return 0
    }
    Write-SyncLog "git $Label start"
    & git -C $Root @Arguments 2>&1 | ForEach-Object {
        Add-Content -Path $LogFile -Value $_ -Encoding UTF8
    }
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Write-SyncLog "git $Label success"
    } else {
        Write-SyncLog "git $Label failed (exit $code)"
    }
    return $code
}

function Invoke-PullSync([string]$Label) {
    $code = Invoke-GitSync "$Label-pull" @("pull", "--rebase", "--autostash")
    if ($code -ne 0) {
        & git -C $Root rebase --abort 2>&1 | ForEach-Object {
            Add-Content -Path $LogFile -Value $_ -Encoding UTF8
        }
        Write-SyncLog "git $Label-pull aborted local rebase state"
        return $code
    }
    return 0
}

function Invoke-PushSync([string]$Label) {
    $code = Invoke-PullSync "$Label-before-push"
    if ($code -ne 0) {
        return $code
    }
    return Invoke-GitSync "$Label-push" @("push")
}

if ($Mode -eq "Pull") {
    exit (Invoke-PullSync "manual")
}
if ($Mode -eq "Push") {
    exit (Invoke-PushSync "manual")
}

Write-SyncLog "sync scheduler started (daily push only)"
while ($true) {
    $now = Get-Date
    $today12 = $now.Date.AddHours(12)
    if ($now -lt $today12) {
        $next = $today12
    } else {
        $next = $today12.AddDays(1)
    }
    $delay = [int][Math]::Ceiling(($next - $now).TotalSeconds)
    if ($delay -lt 1) {
        $delay = 1
    }
    Start-Sleep -Seconds $delay
    Invoke-PushSync "daily-push" | Out-Null
    Start-Sleep -Seconds 60
}
