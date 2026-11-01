Add-Type -AssemblyName System.Drawing

function Draw-CompassIcon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$maskable = $false,
        [int]$cornerPercent = 22
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bgColor = [System.Drawing.Color]::FromArgb(255, 0x1E, 0x22, 0x42)
    $creamColor = [System.Drawing.Color]::FromArgb(255, 0xFF, 0xFC, 0xF8)
    $ringColor = [System.Drawing.Color]::FromArgb(60, 0xFF, 0xFC, 0xF8)
    $coralColor = [System.Drawing.Color]::FromArgb(255, 0xF0, 0x6A, 0x55)
    $coralLight = [System.Drawing.Color]::FromArgb(255, 0xFF, 0x8A, 0x75)
    $butterColor = [System.Drawing.Color]::FromArgb(255, 0xE0, 0xA2, 0x1B)
    $butterLight = [System.Drawing.Color]::FromArgb(255, 0xF5, 0xC5, 0x5A)

    $scale = $size / 512.0

    if ($maskable) {
        $bgBrush = New-Object System.Drawing.SolidBrush $bgColor
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
        $bgBrush.Dispose()
    } else {
        $cornerRad = [int]($size * ($cornerPercent / 100.0))
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $cornerRad * 2
        $pad = [int](12 * $scale)
        $w = $size - 2 * $pad
        $h = $size - 2 * $pad

        $path.AddArc($pad, $pad, $d, $d, 180, 90)
        $path.AddArc($pad + $w - $d, $pad, $d, $d, 270, 90)
        $path.AddArc($pad + $w - $d, $pad + $h - $d, $d, $d, 0, 90)
        $path.AddArc($pad, $pad + $h - $d, $d, $d, 90, 90)
        $path.CloseFigure()

        $bgBrush = New-Object System.Drawing.SolidBrush $bgColor
        $g.FillPath($bgBrush, $path)
        $bgBrush.Dispose()
        $path.Dispose()
    }

    $cx = [float]($size / 2.0)
    $cy = [float]($size / 2.0)

    $dialR = [float]($(if ($maskable) { 110 * $scale } else { 142 * $scale }))
    $ringWidth = [float](7 * $scale)
    $ringPen = New-Object System.Drawing.Pen -ArgumentList $ringColor, $ringWidth
    $g.DrawEllipse($ringPen, [float]($cx - $dialR), [float]($cy - $dialR), [float]($dialR * 2), [float]($dialR * 2))
    $ringPen.Dispose()

    $dotBrush = New-Object System.Drawing.SolidBrush $ringColor
    $dotR = [float](4 * $scale)
    $g.FillEllipse($dotBrush, [float]($cx - $dotR), [float]($cy - $dialR - $dotR), [float]($dotR * 2), [float]($dotR * 2))
    $g.FillEllipse($dotBrush, [float]($cx - $dotR), [float]($cy + $dialR - $dotR), [float]($dotR * 2), [float]($dotR * 2))
    $g.FillEllipse($dotBrush, [float]($cx - $dialR - $dotR), [float]($cy - $dotR), [float]($dotR * 2), [float]($dotR * 2))
    $g.FillEllipse($dotBrush, [float]($cx + $dialR - $dotR), [float]($cy - $dotR), [float]($dotR * 2), [float]($dotR * 2))
    $dotBrush.Dispose()

    $needleLen = [float]($(if ($maskable) { 112 * $scale } else { 145 * $scale }))
    $needleWidth = [float]($(if ($maskable) { 38 * $scale } else { 48 * $scale }))

    $coralBrush = New-Object System.Drawing.SolidBrush $coralColor
    $nRight = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF $cx, ($cy - $needleLen)),
        (New-Object System.Drawing.PointF ($cx + $needleWidth), $cy),
        (New-Object System.Drawing.PointF $cx, $cy)
    )
    $g.FillPolygon($coralBrush, $nRight)
    $coralBrush.Dispose()

    $coralLightBrush = New-Object System.Drawing.SolidBrush $coralLight
    $nLeft = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF $cx, ($cy - $needleLen)),
        (New-Object System.Drawing.PointF ($cx - $needleWidth), $cy),
        (New-Object System.Drawing.PointF $cx, $cy)
    )
    $g.FillPolygon($coralLightBrush, $nLeft)
    $coralLightBrush.Dispose()

    $butterBrush = New-Object System.Drawing.SolidBrush $butterColor
    $sRight = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF $cx, ($cy + $needleLen)),
        (New-Object System.Drawing.PointF ($cx + $needleWidth), $cy),
        (New-Object System.Drawing.PointF $cx, $cy)
    )
    $g.FillPolygon($butterBrush, $sRight)
    $butterBrush.Dispose()

    $butterLightBrush = New-Object System.Drawing.SolidBrush $butterLight
    $sLeft = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF $cx, ($cy + $needleLen)),
        (New-Object System.Drawing.PointF ($cx - $needleWidth), $cy),
        (New-Object System.Drawing.PointF $cx, $cy)
    )
    $g.FillPolygon($butterLightBrush, $sLeft)
    $butterLightBrush.Dispose()

    $hubR = [float]($(if ($maskable) { 20 * $scale } else { 26 * $scale }))
    $hubBgBrush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillEllipse($hubBgBrush, [float]($cx - $hubR), [float]($cy - $hubR), [float]($hubR * 2), [float]($hubR * 2))
    $hubBgBrush.Dispose()

    $hubWidth = [float](4 * $scale)
    $hubBorderPen = New-Object System.Drawing.Pen -ArgumentList $creamColor, $hubWidth
    $g.DrawEllipse($hubBorderPen, [float]($cx - $hubR), [float]($cy - $hubR), [float]($hubR * 2), [float]($hubR * 2))
    $hubBorderPen.Dispose()

    $centerPinR = [float](8 * $scale)
    $pinBrush = New-Object System.Drawing.SolidBrush $creamColor
    $g.FillEllipse($pinBrush, [float]($cx - $centerPinR), [float]($cy - $centerPinR), [float]($centerPinR * 2), [float]($centerPinR * 2))
    $pinBrush.Dispose()

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$baseDir = "c:\Users\turfa\Downloads\makna hidup\hidup-terarah-source\hidup-terarah\public"
Draw-CompassIcon -size 512 -outputPath "$baseDir\icon-512.png" -maskable $false
Draw-CompassIcon -size 192 -outputPath "$baseDir\icon-192.png" -maskable $false
Draw-CompassIcon -size 180 -outputPath "$baseDir\apple-touch-icon.png" -maskable $false
Draw-CompassIcon -size 512 -outputPath "$baseDir\icon-maskable-512.png" -maskable $true
