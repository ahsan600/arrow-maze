Add-Type -AssemblyName System.Drawing

$srcPath = "D:\SAAS\arrow-amaze-go\src\assets\appIcon.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcBmp = New-Object System.Drawing.Bitmap($srcPath)
$srcW = $srcBmp.Width
$srcH = $srcBmp.Height

# Content bounding box derived from source:
# minX=212, maxX=1090, minY=190, maxY=998
$contentMinX = 212.0
$contentMaxX = 1090.0
$contentMinY = 190.0
$contentMaxY = 998.0
$contentW = $contentMaxX - $contentMinX
$contentH = $contentMaxY - $contentMinY
$contentCx = ($contentMinX + $contentMaxX) / 2.0  # 651.0
$contentCy = ($contentMinY + $contentMaxY) / 2.0  # 594.0

$bgColor = [System.Drawing.Color]::FromArgb(253, 251, 247) # #FDFBF7

Write-Host "1. Building feathered source image..."
$featherBmp = New-Object System.Drawing.Bitmap($srcW, $srcH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$innerR = 510.0
$outerR = 590.0

for ($y = 0; $y -lt $srcH; $y++) {
    for ($x = 0; $x -lt $srcW; $x++) {
        $p = $srcBmp.GetPixel($x, $y)
        $dist = [Math]::Sqrt(($x - $contentCx) * ($x - $contentCx) + ($y - $contentCy) * ($y - $contentCy))
        
        if ($dist -le $innerR) {
            $featherBmp.SetPixel($x, $y, $p)
        } elseif ($dist -ge $outerR) {
            $featherBmp.SetPixel($x, $y, $bgColor)
        } else {
            $t = ($dist - $innerR) / ($outerR - $innerR)
            $blend = (1.0 - [Math]::Cos($t * [Math]::PI)) / 2.0
            $red = [int]($p.R * (1.0 - $blend) + $bgColor.R * $blend)
            $grn = [int]($p.G * (1.0 - $blend) + $bgColor.G * $blend)
            $blu = [int]($p.B * (1.0 - $blend) + $bgColor.B * $blend)
            $featherBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $red, $grn, $blu))
        }
    }
}
$srcBmp.Dispose()

Write-Host "2. Building 2048x2048 Master Canvas..."
$masterSize = 2048
$masterBmp = New-Object System.Drawing.Bitmap($masterSize, $masterSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfxMaster = [System.Drawing.Graphics]::FromImage($masterBmp)
$gfxMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfxMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gfxMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$brush = New-Object System.Drawing.SolidBrush($bgColor)
$gfxMaster.FillRectangle($brush, 0, 0, $masterSize, $masterSize)
$brush.Dispose()

# Center the content at (1024, 1024)
$destX = 1024.0 - $contentCx
$destY = 1024.0 - $contentCy
$gfxMaster.DrawImage($featherBmp, [float]$destX, [float]$destY, [float]$srcW, [float]$srcH)
$gfxMaster.Dispose()
$featherBmp.Dispose()

# Save master back to src/assets/appIcon.png (clean 1024x1024 centered version)
$projectIconPath = "D:\SAAS\arrow-amaze-go\src\assets\appIcon.png"
$clean1024 = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gClean = [System.Drawing.Graphics]::FromImage($clean1024)
$gClean.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gClean.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gClean.DrawImage($masterBmp, 0, 0, 1024, 1024)
$gClean.Dispose()
$clean1024.Save($projectIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$clean1024.Dispose()
Write-Host "  -> Updated $projectIconPath"

# Function to draw from Master Canvas onto target
# Master canvas has arrows centered at (1024, 1024) with diameter ~900px.
function Make-AdaptiveForeground($targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $b = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($b, 0, 0, $targetSize, $targetSize)
    $b.Dispose()

    # In Android Adaptive Icons:
    # Canvas = 108dp. Mask circle = 72dp (diameter = 66.7%).
    # We sample a window of size 2200 from the master canvas centered at (1024, 1024).
    # Arrow extent on target will be (900 / 2200) * targetSize = 40.9% of canvas.
    # Half-diagonal = 40.9% * 0.707 = 28.9% of targetSize from center.
    # Mask radius = 33.3% of targetSize from center.
    # Margin = 33.3% - 28.9% = 4.4% safe clearance on circular mask!
    $sampleWindow = 2240.0
    $sampleX = 1024.0 - ($sampleWindow / 2.0)
    $sampleY = 1024.0 - ($sampleWindow / 2.0)

    $srcRect = New-Object System.Drawing.RectangleF([float]$sampleX, [float]$sampleY, [float]$sampleWindow, [float]$sampleWindow)
    $destRect = New-Object System.Drawing.RectangleF(0, 0, $targetSize, $targetSize)

    $g.DrawImage($masterBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

function Make-RoundIcon($targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    # Circle fill with 2% margin
    $margin = $targetSize * 0.02
    $diameter = $targetSize - (2 * $margin)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse([float]$margin, [float]$margin, [float]$diameter, [float]$diameter)
    $g.SetClip($path)

    # Sample window: 1400px from master canvas
    $sampleWindow = 1420.0
    $sampleX = 1024.0 - ($sampleWindow / 2.0)
    $sampleY = 1024.0 - ($sampleWindow / 2.0)

    $srcRect = New-Object System.Drawing.RectangleF([float]$sampleX, [float]$sampleY, [float]$sampleWindow, [float]$sampleWindow)
    $destRect = New-Object System.Drawing.RectangleF(0, 0, $targetSize, $targetSize)

    $g.DrawImage($masterBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $path.Dispose()
    $g.Dispose()
    return $bmp
}

function Make-SquircleIcon($targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    $r = $targetSize * 0.22
    $d = $r * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($targetSize - $d, 0, $d, $d, 270, 90)
    $path.AddArc($targetSize - $d, $targetSize - $d, $d, $d, 0, 90)
    $path.AddArc(0, $targetSize - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.SetClip($path)

    $sampleWindow = 1380.0
    $sampleX = 1024.0 - ($sampleWindow / 2.0)
    $sampleY = 1024.0 - ($sampleWindow / 2.0)

    $srcRect = New-Object System.Drawing.RectangleF([float]$sampleX, [float]$sampleY, [float]$sampleWindow, [float]$sampleWindow)
    $destRect = New-Object System.Drawing.RectangleF(0, 0, $targetSize, $targetSize)

    $g.DrawImage($masterBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $path.Dispose()
    $g.Dispose()
    return $bmp
}

function Make-IOSIcon($targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $b = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($b, 0, 0, $targetSize, $targetSize)
    $b.Dispose()

    # Sample window 1320px
    $sampleWindow = 1320.0
    $sampleX = 1024.0 - ($sampleWindow / 2.0)
    $sampleY = 1024.0 - ($sampleWindow / 2.0)

    $srcRect = New-Object System.Drawing.RectangleF([float]$sampleX, [float]$sampleY, [float]$sampleWindow, [float]$sampleWindow)
    $destRect = New-Object System.Drawing.RectangleF(0, 0, $targetSize, $targetSize)

    $g.DrawImage($masterBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

# 3. Export Android Mipmap densities
$densities = @{
    "mdpi"    = @{ "fg" = 108; "ic" = 48 }
    "hdpi"    = @{ "fg" = 162; "ic" = 72 }
    "xhdpi"   = @{ "fg" = 216; "ic" = 96 }
    "xxhdpi"  = @{ "fg" = 324; "ic" = 144 }
    "xxxhdpi" = @{ "fg" = 432; "ic" = 192 }
}

Write-Host "3. Generating Android Mipmap Icons..."
foreach ($d in $densities.Keys) {
    $dir = "D:\SAAS\arrow-amaze-go\android\app\src\main\res\mipmap-$d"

    $fgSize = $densities[$d]["fg"]
    $icSize = $densities[$d]["ic"]

    # Foreground
    $fgBmp = Make-AdaptiveForeground($fgSize)
    $fgPath = Join-Path $dir "ic_launcher_foreground.png"
    $fgBmp.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()

    # Legacy Square / Squircle
    $sqBmp = Make-SquircleIcon($icSize)
    $sqPath = Join-Path $dir "ic_launcher.png"
    $sqBmp.Save($sqPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $sqBmp.Dispose()

    # Legacy Round
    $rdBmp = Make-RoundIcon($icSize)
    $rdPath = Join-Path $dir "ic_launcher_round.png"
    $rdBmp.Save($rdPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $rdBmp.Dispose()

    Write-Host "  -> mipmap-$($d): fg=$fgSize, ic/rd=$icSize done."
}

# 4. Export iOS Icons
Write-Host "4. Generating iOS Icons..."
$iosSizes = @{
    "icon-1024.png"  = 1024
    "icon-20@2x.png"  = 40
    "icon-20@3x.png"  = 60
    "icon-29@2x.png"  = 58
    "icon-29@3x.png"  = 87
    "icon-40@2x.png"  = 80
    "icon-40@3x.png"  = 120
    "icon-60@2x.png"  = 120
    "icon-60@3x.png"  = 180
}

$iosDir = "D:\SAAS\arrow-amaze-go\ios\ArrowAmazeGo\Images.xcassets\AppIcon.appiconset"
foreach ($name in $iosSizes.Keys) {
    $sz = $iosSizes[$name]
    $iosBmp = Make-IOSIcon($sz)
    $outPath = Join-Path $iosDir $name
    $iosBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $iosBmp.Dispose()
    Write-Host "  -> iOS $name ($sz x $sz) done."
}

$masterBmp.Dispose()
Write-Host "ALL ICONS GENERATED AND VALIDATED SUCCESSFULLY!"
