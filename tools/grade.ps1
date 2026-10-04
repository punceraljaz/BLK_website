# Room/TV clip colour grade (2026-10-03, matched to the cool greige + mahogany palette).
# Re-exports every clip's frames (h264 for the GPU path + webp fallback) from the
# original Kling videos on the Desktop, with the same geometry as before.
#   powershell -File tools\grade.ps1 -Test     # only writes comparison frames to lab\grade
#   powershell -File tools\grade.ps1           # re-exports all 8 clips
param([switch]$Test)
$ErrorActionPreference = 'Stop'
$D = 'C:\Users\Kugler\Desktop'
# New grade: close to the original colours; turquoise/blue tamed toward smoke grey,
# a little less saturation and contrast, whites kept neutral-cool, darks leaning
# slightly to mahogany. (Old warm grade: see CLAUDE.md §3a.)
$GRADE = "huesaturation=saturation=-0.38:colors=c+b:strength=1,eq=saturation=0.9:contrast=0.97,colorbalance=rs=0.04:gs=0.008:bs=-0.015:rh=-0.006:gh=0:bh=0.004,curves=all='0/0.03 0.5/0.495 1/0.96'"
$FIT = 'scale=1930:1088,crop=1904:1088'
$clips = @(
  @{ dir = 'room';  src = "$D\empty_room_furnishing_transfor_52805_Kling_25_Turbo_Pro.mp4"; geo = '' },
  @{ dir = 'room2'; src = "$D\empty_room_furnishing_transfor_52934_Kling_O3.mp4"; geo = '' },
  @{ dir = 'room3'; src = "$D\bedroom_makeover_transformatio_02847_Kling_O3.mp4"; geo = '' },
  @{ dir = 'room4'; src = "$D\bedroom_makeover_transformatio_65130_Kling_O3.mp4"; geo = $FIT },
  @{ dir = 'tv1';   src = "$D\bedroom_makeover_transformatio_45631_Kling_O3.mp4"; geo = $FIT },
  @{ dir = 'tv2';   src = "$D\bedroom_makeover_transformatio_34934_Kling_O3.mp4"; geo = $FIT },
  @{ dir = 'tv3';   src = "$D\bedroom_makeover_transformatio_23333_Kling_O3.mp4"; geo = $FIT },
  @{ dir = 'tv4';   src = "$D\bedroom_makeover_transformatio_68891_Kling_O3.mp4"; geo = "crop=1660:936:0:154,$FIT" }
)
function vf($geo, $grade) { (@($geo, $grade) | Where-Object { $_ }) -join ',' }

if ($Test) {
  New-Item -ItemType Directory -Force lab\grade | Out-Null
  foreach ($t in @(@('room', 121), @('room3', 120), @('tv2', 120), @('room4', 120))) {
    $c = $clips | Where-Object { $_.dir -eq $t[0] }; $n = $t[1]
    ffmpeg -v error -y -i $c.src -vf ("select=eq(n\,$n)," + (vf $c.geo '')) -frames:v 1 "lab\grade\$($t[0])-1-original.png"
    Copy-Item ("assets\frames\{0}\{1:D4}.webp" -f $t[0], ($n + 1)) "lab\grade\$($t[0])-2-old.webp"
    ffmpeg -v error -y -i $c.src -vf ("select=eq(n\,$n)," + (vf $c.geo $GRADE)) -frames:v 1 "lab\grade\$($t[0])-3-new.png"
  }
  'test frames in lab\grade'
  return
}

foreach ($c in $clips) {
  $d = "assets\frames\$($c.dir)"
  $tmp = "$d.new"; Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Force $tmp | Out-Null
  $v = vf $c.geo $GRADE
  ffmpeg -v error -y -i $c.src -an -vf $v -c:v libx264 -preset slow -profile:v high -level 4.0 -crf 16 -pix_fmt yuv420p -x264-params "keyint=1:min-keyint=1:repeat-headers=1:scenecut=0" -f image2 "$tmp\%04d.h264"
  ffmpeg -v error -y -i $c.src -an -vf "$v,unsharp=5:5:0.55:5:5:0" -c:v libwebp -quality 82 -compression_level 6 "$tmp\%04d.webp"
  $old = (Get-ChildItem "$d\*.webp").Count; $new = (Get-ChildItem "$tmp\*.webp").Count; $newH = (Get-ChildItem "$tmp\*.h264").Count
  if ($new -ne $old -or $newH -ne $old) { throw "$($c.dir): frame count $new/$newH, expected $old (left unchanged)" }
  Remove-Item -Recurse -Force $d; Move-Item $tmp $d
  "{0}: {1} frames regraded" -f $c.dir, $new
}
