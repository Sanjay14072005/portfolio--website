param(
  [Parameter(Mandatory = $true)]
  [string]$JsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ArrayValue {
  param(
    [Parameter(ValueFromPipeline = $true)]
    $Value
  )

  if ($null -eq $Value) {
    return @()
  }

  if ($Value -is [string]) {
    return @($Value)
  }

  if ($Value -is [System.Collections.IEnumerable]) {
    return @($Value)
  }

  return @($Value)
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$resolvedJsonPath = Resolve-Path -Path $JsonPath | Select-Object -ExpandProperty Path

if (-not (Test-Path -Path $resolvedJsonPath -PathType Leaf)) {
  throw "JSON file not found: $JsonPath"
}

$dataStorePath = Join-Path $scriptRoot "data-store.js"
$indexPath = Join-Path $scriptRoot "index.html"
$adminPath = Join-Path $scriptRoot "admin.html"

foreach ($requiredFile in @($dataStorePath, $indexPath, $adminPath)) {
  if (-not (Test-Path -Path $requiredFile -PathType Leaf)) {
    throw "Required file not found: $requiredFile"
  }
}

$jsonRaw = Get-Content -Path $resolvedJsonPath -Raw -Encoding UTF8
$parsed = $jsonRaw | ConvertFrom-Json -ErrorAction Stop

$normalizedDb = [ordered]@{
  skills = Get-ArrayValue $parsed.skills
  projects = Get-ArrayValue $parsed.projects
  certificates = Get-ArrayValue $parsed.certificates
  achievements = Get-ArrayValue $parsed.achievements
  interests = Get-ArrayValue $parsed.interests
}

$jsonForJs = $normalizedDb | ConvertTo-Json -Depth 100
$siteVersion = Get-Date -Format "yyyy-MM-dd-HHmmss"
$cacheVersion = Get-Date -Format "yyyyMMddHHmmss"

$dataStoreContent = Get-Content -Path $dataStorePath -Raw -Encoding UTF8
$dataStoreContent = [regex]::Replace(
  $dataStoreContent,
  'const SITE_VERSION = "[^"]+";',
  "const SITE_VERSION = `"$siteVersion`";"
)

$defaultDbStart = $dataStoreContent.IndexOf("const defaultDb = ")
if ($defaultDbStart -lt 0) {
  throw "Could not find defaultDb in data-store.js"
}

$cloneMarker = "function cloneDefault()"
$cloneIndex = $dataStoreContent.IndexOf($cloneMarker, $defaultDbStart)
if ($cloneIndex -lt 0) {
  throw "Could not find cloneDefault() in data-store.js"
}

$beforeDefaultDb = $dataStoreContent.Substring(0, $defaultDbStart)
$afterDefaultDb = $dataStoreContent.Substring($cloneIndex)
$newDefaultDbBlock = "const defaultDb = $jsonForJs;`r`n`r`n  "
$updatedDataStore = $beforeDefaultDb + $newDefaultDbBlock + $afterDefaultDb
Set-Content -Path $dataStorePath -Value $updatedDataStore -Encoding UTF8

foreach ($htmlPath in @($indexPath, $adminPath)) {
  $htmlContent = Get-Content -Path $htmlPath -Raw -Encoding UTF8
  $htmlContent = [regex]::Replace(
    $htmlContent,
    'data-store\.js\?v=[^"\''\s>]+',
    "data-store.js?v=$cacheVersion"
  )
  Set-Content -Path $htmlPath -Value $htmlContent -Encoding UTF8
}

Write-Host ""
Write-Host "Portfolio data updated successfully." -ForegroundColor Cyan
Write-Host "JSON source  : $resolvedJsonPath"
Write-Host "SITE_VERSION : $siteVersion"
Write-Host "Cache token  : $cacheVersion"
Write-Host ""
Write-Host "Updated files:" -ForegroundColor Cyan
Write-Host " - $dataStorePath"
Write-Host " - $indexPath"
Write-Host " - $adminPath"
