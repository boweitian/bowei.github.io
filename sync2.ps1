param([string]$Message = 'Update website and blog')

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
if ($gitCommand) {
    $gitPath = $gitCommand.Source
} else {
    $gitPath = Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd\git.exe'
}
if (-not (Test-Path -LiteralPath $gitPath)) {
    Write-Error 'Git was not found. Install Git or add it to PATH.' -ErrorAction Continue
    exit 1
}

function Invoke-Git {
    & $gitPath -c "safe.directory=$PSScriptRoot" @args
    if ($LASTEXITCODE -ne 0) { throw "Git failed. Sync stopped; your files are preserved." }
}

try {
    $branch = Invoke-Git branch --show-current
    if ($branch -ne 'main') { throw 'Switch to main before publishing.' }

    Write-Host 'Checking GitHub for updates...'
    Invoke-Git fetch origin main
    & $gitPath -c "safe.directory=$PSScriptRoot" merge-base --is-ancestor origin/main HEAD
    if ($LASTEXITCODE -ne 0) {
        throw 'GitHub has newer changes. Save your work and integrate origin/main before publishing. No files have been staged or committed.'
    }

    $quartoCommand = Get-Command quarto -ErrorAction SilentlyContinue
    if ($quartoCommand) {
        $quartoPath = $quartoCommand.Source
    } else {
        $quartoPath = Join-Path $env:LOCALAPPDATA 'Programs\Quarto\bin\quarto.exe'
    }
    if (-not (Test-Path -LiteralPath $quartoPath)) { throw 'Quarto was not found. Install Quarto or add it to PATH.' }

    $previousPython = $env:QUARTO_PYTHON
    try {
        # Python is only needed for posts that execute code (`jupyter: python3`).
        $condaPython = Join-Path $env:USERPROFILE 'miniconda3\python.exe'
        if (Test-Path -LiteralPath $condaPython) {
            $env:QUARTO_PYTHON = $condaPython
            Write-Host "Using Python: $env:QUARTO_PYTHON"
            & $condaPython -c "import yaml, jupyter, nbformat, nbclient, ipykernel"
            if ($LASTEXITCODE -ne 0) { throw 'Required Python packages could not be loaded. Rendering stopped.' }
        } else {
            Write-Host "Python not found at $condaPython; rendering without it (fine unless a post executes Python)."
        }
        Write-Host 'Rendering the blog...'
        & $quartoPath render (Join-Path $PSScriptRoot 'blog-source')
        if ($LASTEXITCODE -ne 0) { throw 'Quarto failed. Nothing has been committed or pushed.' }
    } finally {
        $env:QUARTO_PYTHON = $previousPython
    }

    Write-Host 'Committing website changes...'
    Invoke-Git add --all
    $staged = Invoke-Git diff --cached --name-only
    if ($staged) {
        Invoke-Git commit -m $Message
    } else {
        Write-Host 'No new changes to commit.'
    }

    Invoke-Git push origin main
    Write-Host 'Pushed successfully. Netlify will publish the update at https://bowei.netlify.app/'
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
 
