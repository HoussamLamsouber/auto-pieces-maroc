$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$baseUrl='http://127.0.0.1:4174'
$ready=$false
try { $state=Invoke-RestMethod "$baseUrl/api/session" -TimeoutSec 2; $ready=($null -ne $state.needsSetup) } catch {}
if(-not $ready){
 $node=(Get-Command node -ErrorAction Stop).Source
 New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'data') | Out-Null
 Start-Process -FilePath $node -ArgumentList @(('"'+(Join-Path $PSScriptRoot 'server.cjs')+'"')) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'data/server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'data/server-error.log')
 for($attempt=0;$attempt -lt 20;$attempt++){
  Start-Sleep -Milliseconds 300
  try { $state=Invoke-RestMethod "$baseUrl/api/session" -TimeoutSec 2; $ready=($null -ne $state.needsSetup); if($ready){break} } catch {}
 }
}
if(-not $ready){throw 'Le serveur ne demarre pas. Consultez data/server-error.log.'}
$adminUrl="$baseUrl/admin.html"
$keyPath=Join-Path $PSScriptRoot 'data/setup-key.txt'
if($state.needsSetup -and (Test-Path -LiteralPath $keyPath)){$adminUrl+='#setup='+([IO.File]::ReadAllText($keyPath).Trim())}
Start-Process $adminUrl
Write-Host 'Administration ouverte. Boutique : http://127.0.0.1:4174/'
