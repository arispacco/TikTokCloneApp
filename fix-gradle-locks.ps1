<#
.SYNOPSIS
    Debloque Gradle (erreur EBUSY / modules-2.lock) SANS detruire le cache.

.DESCRIPTION
    Script CIBLE et non destructif pensee pour une connexion Internet limitee.
    - Arrete proprement le daemon Gradle (gradlew --stop)
    - Tue de force TOUS les process Gradle / Java / Kotlin verrouilles
    - Supprime UNIQUEMENT les verrous corrompus (*.lock dont modules-2.lock)
    - Supprime l'ancien plugin foojay corrompu (force le re-telechargement de la
      seule version 1.0.0, quelques Ko)
    - PRESERVE toutes les autres dependances deja telechargees

    Le script continue meme si une etape echoue (kill d'un process deja mort,
    fichier introuvable, etc.).

.NOTES
    A lancer depuis PowerShell : 
        cd C:\Users\pacco\TikTokClone
        powershell -ExecutionPolicy Bypass -File .\fix-gradle-locks.ps1
#>

$ErrorActionPreference = 'Continue'

$ProjectRoot   = $PSScriptRoot
$AndroidDir    = Join-Path $ProjectRoot 'android'
$GradlewBat    = Join-Path $AndroidDir 'gradlew.bat'
$GradleUserHome = Join-Path $env:USERPROFILE '.gradle'
$CachesDir     = Join-Path $GradleUserHome 'caches'

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Ok([string]$msg)   { Write-Host "    [OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

# --------------------------------------------------------------------------
Write-Step "1/5 - Arret propre du daemon Gradle (gradlew --stop)"
if (Test-Path $GradlewBat) {
    Push-Location $AndroidDir
    try {
        & cmd /c "gradlew.bat --stop" 2>&1 | Out-Null
        Write-Ok "gradlew --stop execute"
    } catch {
        Write-Warn "gradlew --stop a echoue (on continue, on va tuer de force)"
    }
    Pop-Location
} else {
    Write-Warn "gradlew.bat introuvable dans $AndroidDir (on continue)"
}

# --------------------------------------------------------------------------
Write-Step "2/5 - Kill force des process Gradle / Java / Kotlin"

# a) Kill par nom de process
$names = @('java', 'javaw', 'gradle', 'kotlin-daemon', 'KotlinCompileDaemon')
foreach ($n in $names) {
    $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction Stop
            Write-Ok "Process tue : $($p.ProcessName) (PID $($p.Id))"
        } catch {
            Write-Warn "Impossible de tuer $($p.ProcessName) (PID $($p.Id))"
        }
    }
}

# b) Kill par ligne de commande (daemons Gradle qui se cachent sous d'autres noms)
try {
    $cimProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match 'gradle|GradleDaemon|GradleWrapperMain|foojay' }
    foreach ($cp in $cimProcs) {
        try {
            Stop-Process -Id $cp.ProcessId -Force -ErrorAction Stop
            Write-Ok "Daemon Gradle tue (PID $($cp.ProcessId))"
        } catch {
            Write-Warn "Daemon recalcitrant (PID $($cp.ProcessId))"
        }
    }
} catch {
    Write-Warn "Analyse des lignes de commande indisponible (on continue)"
}

Write-Step "Pause de 2s pour liberer les handles fichiers..."
Start-Sleep -Seconds 2

# --------------------------------------------------------------------------
Write-Step "3/5 - Suppression des verrous corrompus (*.lock)"
if (Test-Path $CachesDir) {
    $locks = Get-ChildItem -Path $CachesDir -Recurse -Filter '*.lock' -ErrorAction SilentlyContinue
    if ($locks) {
        foreach ($lock in $locks) {
            $removed = $false
            for ($i = 0; $i -lt 5 -and -not $removed; $i++) {
                try {
                    Remove-Item -LiteralPath $lock.FullName -Force -ErrorAction Stop
                    $removed = $true
                    Write-Ok "Verrou supprime : $($lock.Name)"
                } catch {
                    Start-Sleep -Milliseconds 500
                }
            }
            if (-not $removed) { Write-Warn "Verrou bloque : $($lock.FullName)" }
        }
    } else {
        Write-Ok "Aucun fichier .lock trouve"
    }
} else {
    Write-Warn "Dossier caches introuvable : $CachesDir"
}

# --------------------------------------------------------------------------
Write-Step "4/5 - Suppression de l'ancien plugin foojay (re-DL = quelques Ko)"
$foojayDirs = Get-ChildItem -Path $CachesDir -Recurse -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match 'foojay' }
if ($foojayDirs) {
    foreach ($d in $foojayDirs) {
        try {
            Remove-Item -LiteralPath $d.FullName -Recurse -Force -ErrorAction Stop
            Write-Ok "Plugin foojay purge : $($d.FullName)"
        } catch {
            # Fallback rmdir natif si Remove-Item bloque
            cmd /c "rmdir /s /q `"$($d.FullName)`"" 2>&1 | Out-Null
            if (-not (Test-Path $d.FullName)) {
                Write-Ok "Plugin foojay purge (rmdir) : $($d.FullName)"
            } else {
                Write-Warn "foojay non supprime : $($d.FullName)"
            }
        }
    }
} else {
    Write-Ok "Aucun dossier foojay residuel (parfait)"
}

# --------------------------------------------------------------------------
Write-Step "5/5 - Nettoyage du cache local du projet (.gradle du module android)"
$projectGradle = Join-Path $AndroidDir '.gradle'
if (Test-Path $projectGradle) {
    try {
        Remove-Item -LiteralPath $projectGradle -Recurse -Force -ErrorAction Stop
        Write-Ok "android\.gradle supprime (sera regenere localement, 0 Internet)"
    } catch {
        cmd /c "rmdir /s /q `"$projectGradle`"" 2>&1 | Out-Null
        Write-Warn "android\.gradle : suppression partielle (verifie manuellement si besoin)"
    }
} else {
    Write-Ok "Pas de cache projet android\.gradle"
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host " TERMINE. Tes dependances telechargees sont PRESERVEES." -ForegroundColor Green
Write-Host " Prochaine etape : ouvre Android Studio, coche" -ForegroundColor Green
Write-Host " 'Offline work' (Settings > Build > Gradle), puis Sync." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
