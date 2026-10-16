# Development audio only. Freeze these exact bytes across all conditions.
# Voice redistribution and educational review are required before research use.
Add-Type -AssemblyName System.Speech
$visualLesson = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../content/lessons/water-cycle/v1.json') -Raw | ConvertFrom-Json
$visualAudioDir = Join-Path $PSScriptRoot '../public/audio/water-cycle'
New-Item -ItemType Directory -Force -Path $visualAudioDir | Out-Null
$visualSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$visualSynth.Rate = -1
try {
  foreach ($visualSegment in $visualLesson.segments) {
    $visualSynth.SetOutputToWaveFile((Join-Path $visualAudioDir ($visualSegment.id + '.wav')))
    $visualSynth.Speak($visualSegment.body)
    $visualSynth.SetOutputToNull()
  }
} finally { $visualSynth.Dispose() }
Write-Output 'Generated five real development WAV recordings. Approval still required.'
