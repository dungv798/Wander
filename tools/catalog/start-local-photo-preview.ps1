param([Parameter(Mandatory=$true)][int]$ExpectedPid)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskFolder=Join-Path $taskRoot '.logs/photo-multisource-20261107'
$taskCoverage=Get-Content -LiteralPath (Join-Path $taskRoot 'docs/research/photo-multisource-20261107/preview-coverage.json') -Raw -Encoding utf8 | ConvertFrom-Json
if($taskCoverage.usageScope -ne 'LOCAL_NONCOMMERCIAL_PREVIEW_ONLY' -or $taskCoverage.requiredBindAddress -ne '127.0.0.1'){throw 'Preview scope is missing.'}
$taskReadyPath=Join-Path $taskRoot '.logs/claude-handoff/backend-ready.json'
$taskReady=Get-Content -LiteralPath $taskReadyPath -Raw -Encoding utf8 | ConvertFrom-Json
if($taskReady.pid -ne $ExpectedPid -or $taskReady.database -ne 'wander_e2e'){throw 'Current preview metadata changed.'}
$taskListeners=@(Get-NetTCPConnection -LocalPort 8787 -State Listen)
if($taskListeners.Count -ne 1 -or $taskListeners[0].OwningProcess -ne $ExpectedPid){throw 'Port owner changed.'}
$taskJar=Join-Path $taskRoot '.logs/photo-multisource-20261107/runtime-build/wander-backend.jar'
$taskPreviousJar=Join-Path $taskRoot '.logs/photo-fill-20261107/runtime-build/wander-backend.jar'
$taskProcess=Get-CimInstance Win32_Process -Filter "ProcessId = $ExpectedPid"
if($taskProcess.Name -ne 'java.exe' -or (-not $taskProcess.CommandLine.Contains($taskJar) -and -not $taskProcess.CommandLine.Contains($taskPreviousJar))){throw 'Not the known workspace preview process.'}
if(-not(Test-Path -LiteralPath $taskJar)){throw 'Updated preview build missing.'}
$taskPrivateResources=Join-Path $taskFolder 'preview-resources'
$taskPublicResources=Join-Path $taskRoot '.logs/photo-fill-20261107/live-classpath'
$taskCatalog=Join-Path $taskFolder 'preview-catalog'
$taskCatalogFiles=@(Get-ChildItem -LiteralPath $taskCatalog -File -Filter '*.json')
if($taskCatalogFiles.Count -ne 20){throw 'Incomplete private catalog.'}
$taskCount=0
foreach($taskFile in $taskCatalogFiles){
 $taskDoc=Get-Content -LiteralPath $taskFile.FullName -Raw -Encoding utf8 | ConvertFrom-Json
 $taskCount+=$taskDoc.places.Count
 foreach($taskPlace in $taskDoc.places){foreach($taskPhoto in $taskPlace.photos){if($taskPhoto.file){
  $taskPrivateFile=Join-Path $taskPrivateResources ('catalog/photos/'+$taskPhoto.file)
  $taskPublicFile=Join-Path $taskRoot ('backend/src/main/resources/catalog/photos/'+$taskPhoto.file)
  if(-not(Test-Path -LiteralPath $taskPrivateFile) -and -not(Test-Path -LiteralPath $taskPublicFile)){throw 'Missing photo resource.'}
  if($taskPhoto.license -like '*-NC*' -and -not(Test-Path -LiteralPath $taskPrivateFile)){throw 'Noncommercial image escaped the private resource folder.'}
 }}}
}
if($taskCount -ne 704){throw 'Unexpected catalog size.'}
$taskKeyFile=Join-Path $taskRoot '.logs/dev-recovery-pepper.txt'
if(-not(Test-Path -LiteralPath $taskKeyFile)){throw 'Existing recovery key missing.'}
$env:WANDER_RECOVERY_PEPPER=(Get-Content -LiteralPath $taskKeyFile -Raw).Trim()
$env:PORT='8787';$env:WANDER_DB_URL='jdbc:postgresql://localhost:5433/wander_e2e';$env:WANDER_E2E_DB='wander_e2e'
$env:WANDER_WEB_DIR=Join-Path $taskRoot 'web/dist'
$env:WANDER_LIMIT_CATALOG='100000';$env:WANDER_LIMIT_IDENTITY='1000';$env:WANDER_LIMIT_RECOVERY='1000'
$taskClasspath=$taskPrivateResources+';'+$taskPublicResources+';'+$taskJar
$taskCatalogUri=([uri]($taskCatalog.Replace('\','/')+'/')).AbsoluteUri+'*.json'
$taskArgs=@('-cp',('"'+$taskClasspath+'"'),'org.springframework.boot.loader.launch.JarLauncher','--server.address=127.0.0.1',('--wander.catalog.location='+$taskCatalogUri))
Stop-Process -Id $ExpectedPid
Wait-Process -Id $ExpectedPid -Timeout 20 -ErrorAction SilentlyContinue
$taskStarted=Start-Process -FilePath $taskProcess.ExecutablePath -ArgumentList $taskArgs -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskFolder 'runtime.out.log') -RedirectStandardError (Join-Path $taskFolder 'runtime.err.log')
$taskRuntime=@{state='starting';database='wander_e2e';pid=$taskStarted.Id;previousPid=$ExpectedPid;baseUrl='http://127.0.0.1:8787';bindAddress='127.0.0.1';usageScope='LOCAL_NONCOMMERCIAL_PREVIEW_ONLY';catalogPlaces=$taskCount;jar=$taskJar;catalog=$taskCatalog;resources=$taskPrivateResources;startedAt=[DateTime]::UtcNow.ToString('o')}
$taskRuntime | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskFolder 'runtime.json') -Encoding utf8
$taskRuntime | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $taskReadyPath -Encoding utf8
Write-Output "Started local noncommercial photo preview PID $($taskStarted.Id), catalog $taskCount; existing database preserved."
