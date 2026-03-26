param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

$rootPath = (Resolve-Path $Root).Path
$outDir = Join-Path $rootPath "_scan_output"

if (!(Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$essentialFiles = @(
  "mobile\package.json",
  "mobile\app.json",
  "mobile\eas.json",
  "mobile\.env",
  "mobile\.env.example",
  "supabase\functions\api\index.ts",
  "supabase\sql\app_locks.sql",
  "README.md"
)

$essentialDirs = @(
  "mobile",
  "supabase",
  "supabase\functions",
  "supabase\functions\api"
)

$optionalDirs = @(
  "mobile\app",
  "mobile\src",
  "mobile\assets",
  "mobile\components",
  "mobile\services",
  "mobile\utils",
  "supabase\sql",
  "apps_script",
  "tests",
  "docs"
)

$junkDirNames = @(
  "node_modules",
  ".expo",
  "dist",
  "build",
  "coverage",
  ".idea",
  ".vscode",
  ".turbo",
  ".next"
)

$junkFilePatterns = @(
  "*.log",
  "*.tmp",
  "*.temp",
  "*.bak",
  "*.old",
  "*.orig",
  "*.rej",
  "*.zip",
  "*.rar",
  "*.7z",
  "*.apk",
  "*.aab",
  "*.keystore",
  "*.jks",
  "Thumbs.db",
  ".DS_Store"
)

$sensitiveFilePatterns = @(
  ".env",
  ".env.local",
  ".env.production",
  "credentials.json",
  "*.pem",
  "*.key",
  "*.p12"
)

function Test-RelPath {
  param(
    [string]$Base,
    [string]$Rel
  )
  $full = Join-Path $Base $Rel
  return Test-Path $full
}

$report = New-Object System.Collections.Generic.List[string]
$tree = New-Object System.Collections.Generic.List[string]

$report.Add("SCAN ESSENCIAIS")
$report.Add("Root: $rootPath")
$report.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$report.Add("")

$report.Add("=== 1. ESSENTIAL DIRECTORIES ===")
foreach ($dir in $essentialDirs) {
  $status = if (Test-RelPath -Base $rootPath -Rel $dir) { "OK" } else { "MISSING" }
  $report.Add("$status  $dir")
}
$report.Add("")

$report.Add("=== 2. ESSENTIAL FILES ===")
foreach ($file in $essentialFiles) {
  $status = if (Test-RelPath -Base $rootPath -Rel $file) { "OK" } else { "MISSING" }
  $report.Add("$status  $file")
}
$report.Add("")

$report.Add("=== 3. OPTIONAL USEFUL DIRECTORIES ===")
foreach ($dir in $optionalDirs) {
  $status = if (Test-RelPath -Base $rootPath -Rel $dir) { "PRESENT" } else { "ABSENT" }
  $report.Add("$status  $dir")
}
$report.Add("")

$allFiles = Get-ChildItem -LiteralPath $rootPath -Recurse -Force -ErrorAction SilentlyContinue

$junkDirsFound = $allFiles |
  Where-Object { $_.PSIsContainer -and ($junkDirNames -contains $_.Name) } |
  Select-Object -ExpandProperty FullName

$junkFilesFound = $allFiles |
  Where-Object { -not $_.PSIsContainer } |
  Where-Object {
    $matched = $false
    foreach ($pattern in $junkFilePatterns) {
      if ($_.Name -like $pattern) {
        $matched = $true
        break
      }
    }
    $matched
  } |
  Select-Object FullName, Length

$sensitiveFound = $allFiles |
  Where-Object { -not $_.PSIsContainer } |
  Where-Object {
    $matched = $false
    foreach ($pattern in $sensitiveFilePatterns) {
      if ($_.Name -like $pattern) {
        $matched = $true
        break
      }
    }
    $matched
  } |
  Select-Object -ExpandProperty FullName

$largeFiles = $allFiles |
  Where-Object { -not $_.PSIsContainer } |
  Sort-Object Length -Descending |
  Select-Object -First 30 FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length / 1MB, 2)}}

$report.Add("=== 4. JUNK DIRECTORIES ===")
if ($junkDirsFound.Count -eq 0) {
  $report.Add("None found")
} else {
  foreach ($item in $junkDirsFound) {
    $report.Add($item)
  }
}
$report.Add("")

$report.Add("=== 5. JUNK FILES ===")
if ($junkFilesFound.Count -eq 0) {
  $report.Add("None found")
} else {
  foreach ($item in $junkFilesFound) {
    $report.Add("$($item.FullName)  [$([math]::Round($item.Length / 1KB, 2)) KB]")
  }
}
$report.Add("")

$report.Add("=== 6. SENSITIVE FILES REVIEW ===")
if ($sensitiveFound.Count -eq 0) {
  $report.Add("None found")
} else {
  foreach ($item in $sensitiveFound) {
    $report.Add($item)
  }
}
$report.Add("")

$report.Add("=== 7. LARGEST FILES ===")
foreach ($item in $largeFiles) {
  $report.Add("$($item.SizeMB) MB  $($item.FullName)")
}
$report.Add("")

$tree.Add("PROJECT TREE")
$tree.Add("Root: $rootPath")
$tree.Add("")

Get-ChildItem -LiteralPath $rootPath -Force |
  Sort-Object -Property @{Expression='PSIsContainer'; Descending=$true}, @{Expression='Name'; Descending=$false} |
  ForEach-Object {
    $prefix = if ($_.PSIsContainer) { "[DIR]" } else { "[FILE]" }
    $tree.Add("$prefix $($_.Name)")

    if ($_.PSIsContainer -and ($_.Name -in @("mobile","supabase","apps_script","tests","docs"))) {
      Get-ChildItem -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue |
        Sort-Object -Property @{Expression='PSIsContainer'; Descending=$true}, @{Expression='Name'; Descending=$false} |
        Select-Object -First 80 |
        ForEach-Object {
          $subPrefix = if ($_.PSIsContainer) { "  [DIR]" } else { "  [FILE]" }
          $tree.Add("$subPrefix $($_.Name)")
        }
    }
  }

$gitignore = @"
node_modules/
.expo/
dist/
build/
coverage/
.turbo/
.next/
*.log
*.tmp
*.temp
*.bak
*.old
*.zip
*.rar
*.7z
*.apk
*.aab
*.keystore
*.jks
.env
.env.*
credentials.json
_scan_output/
"@

$reportPath = Join-Path $outDir "scan_essenciais.txt"
$treePath = Join-Path $outDir "tree_resumida.txt"
$gitignorePath = Join-Path $outDir "gitignore_sugerido.txt"

$report | Set-Content -Path $reportPath -Encoding UTF8
$tree | Set-Content -Path $treePath -Encoding UTF8
$gitignore | Set-Content -Path $gitignorePath -Encoding UTF8

Write-Host ""
Write-Host "OK - Scan finished"
Write-Host "Report: $reportPath"
Write-Host "Tree:   $treePath"
Write-Host "Gitignore suggestion: $gitignorePath"
Write-Host ""

$missing = @()
foreach ($item in ($essentialDirs + $essentialFiles)) {
  if (-not (Test-RelPath -Base $rootPath -Rel $item)) {
    $missing += $item
  }
}

if ($missing.Count -gt 0) {
  Write-Host "WARNING - Missing essentials:" -ForegroundColor Yellow
  foreach ($item in $missing) {
    Write-Host " - $item" -ForegroundColor Yellow
  }
} else {
  Write-Host "All essential items found." -ForegroundColor Green
}

if ($sensitiveFound.Count -gt 0) {
  Write-Host ""
  Write-Host "REVIEW - Sensitive files found:" -ForegroundColor Red
  foreach ($item in $sensitiveFound) {
    Write-Host " - $item" -ForegroundColor Red
  }
}