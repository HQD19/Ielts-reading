param([Parameter(Mandatory=$true)][int]$Book)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime]
$null=[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null=[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType=WindowsRuntime]
$asTask=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod } | Select-Object -First 1
function Await($operation,$resultType){
 $task=$asTask.MakeGenericMethod($resultType).Invoke($null,@($operation));$task.Wait(-1)|Out-Null;$task.Result
}
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
$bookRoot=Join-Path $PSScriptRoot ('library\'+$Book)
$out=Join-Path $bookRoot 'ocr'
[IO.Directory]::CreateDirectory($out)|Out-Null
$counter=0
foreach($image in Get-ChildItem -LiteralPath (Join-Path $bookRoot 'scans') -Filter '*.jpg' | Sort-Object Name){
 $target=Join-Path $out ($image.BaseName+'.json')
 if(Test-Path -LiteralPath $target){continue}
 $file=Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($image.FullName)) ([Windows.Storage.StorageFile])
 $stream=Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
 $decoder=Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
 $bitmap=Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
 $result=Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
 $lines=@($result.Lines | ForEach-Object{
  $words=@($_.Words | ForEach-Object{@{text=$_.Text;x=$_.BoundingRect.X;y=$_.BoundingRect.Y;width=$_.BoundingRect.Width;height=$_.BoundingRect.Height}})
  @{text=$_.Text;words=$words}
 })
 @{page=[int]$image.BaseName;width=$bitmap.PixelWidth;height=$bitmap.PixelHeight;lines=$lines} | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $target -Encoding UTF8
 $result.Lines.Text | Set-Content -LiteralPath (Join-Path $out ($image.BaseName+'.txt')) -Encoding UTF8
 $bitmap.Dispose();$stream.Dispose();$counter++
 if($counter%25 -eq 0){Write-Output ('BOOK '+$Book+' OCR '+$counter)}
}
Write-Output ('BOOK '+$Book+' OCR DONE')
