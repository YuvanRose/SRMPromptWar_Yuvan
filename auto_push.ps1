$gitDir = "$env:LOCALAPPDATA\Programs\MinGit\cmd"
$env:PATH = "$env:PATH;$gitDir"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SRMPromptWar Auto-Push Watcher Active   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Watching directory : $PSScriptRoot"
Write-Host "Remote Repository  : YuvanRose/SRMPromptWar_Yuvan"
Write-Host "Target Branch      : main"
Write-Host "Status             : Polling for changes every 5 seconds..."
Write-Host "Press Ctrl+C at any time to stop.`n" -ForegroundColor Yellow

while ($true) {
    try {
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] Detected changes:" -ForegroundColor Yellow
            $status | ForEach-Object { Write-Host "   $_" }
            
            git add -A
            git commit -m "Auto-update: $timestamp"
            Write-Host "[$timestamp] Pushing to GitHub..." -ForegroundColor Cyan
            $pushOutput = git push origin main 2>&1
            Write-Host $pushOutput
            Write-Host "[$timestamp] Successfully pushed to GitHub!`n" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error during push: $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds 5
}
