param(
  [Parameter(Mandatory=$true)][string]$InputPath,
  [Parameter(Mandatory=$true)][string]$OutputPath,
  [int]$MaxWidth = 1280,
  [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Image]::FromFile($InputPath)
try {
  $width = [Math]::Min($MaxWidth, $source.Width)
  $height = [int][Math]::Round($source.Height * $width / $source.Width)
  $canvas = New-Object System.Drawing.Bitmap($width, $height)
  try {
    $canvas.SetResolution(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.DrawImage($source, 0, 0, $width, $height)
    } finally { $graphics.Dispose() }
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
    $parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    $canvas.Save($OutputPath, $encoder, $parameters)
  } finally { $canvas.Dispose() }
} finally { $source.Dispose() }

$saved = Get-Item -LiteralPath $OutputPath
Write-Output ("{0} {1} bytes" -f $saved.FullName, $saved.Length)
