param(
  [string]$LaptopPath = 'C:\Users\PC\Downloads\list1.xlsx',
  [string]$PhonePath = 'C:\Users\PC\Downloads\list2.xlsx',
  [string]$OutputPath = "$PSScriptRoot\..\supabase\import-list-data.sql"
)

$ErrorActionPreference = 'Stop'

function Clean([object]$value) {
  if ($null -eq $value) { return '' }
  $text = [string]$value
  if ($text -match '^(N/A|-|�|#)$') { return '' }
  return ($text -replace '\s+', ' ').Trim()
}

function Sql([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return 'null' }
  return "'$(($value -replace "'", "''"))'"
}

function IsPerson([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return $false }
  return $name -notmatch '(?i)spare|available|router|sales team|front office|front desk|vault|debtors phone|hotel|telesales|cannot be used|^cro$|^gcr$|^15$'
}

$assets = [System.Collections.Generic.List[object]]::new()
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false

try {
  $book = $excel.Workbooks.Open($LaptopPath, $null, $true)
  $genericSheets = @('Head Office', 'Sheet1', 'Musgrave', 'Cape Town')
  $specificSheets = @('Gateway', 'Sandton', 'Alice Lane', 'Rosebank')

  foreach ($sheetName in $genericSheets) {
    $sheet = $book.Worksheets.Item($sheetName)
    $start = if ($sheetName -eq 'Sheet1') { 1 } else { 2 }
    if ($sheetName -eq 'Head Office') { $start = 3 }
    for ($r = $start; $r -le $sheet.UsedRange.Rows.Count; $r++) {
      $name = Clean $sheet.Cells.Item($r, 2).Text
      $make = Clean $sheet.Cells.Item($r, 4).Text
      $model = Clean $sheet.Cells.Item($r, 5).Text
      $serial = Clean $sheet.Cells.Item($r, 6).Text
      if (-not $name -or -not $serial) { continue }
      $assets.Add([pscustomobject]@{ Category='Laptop'; Site=if($sheetName -eq 'Sheet1'){'Head Office'}else{$sheetName}; Person=$name; Department=(Clean $sheet.Cells.Item($r,3).Text); Make=$make; Model=$model; Serial=$serial; Imei=''; Phone=''; Supplier=''; Condition='Used' })
    }
  }

  foreach ($sheetName in $specificSheets) {
    $sheet = $book.Worksheets.Item($sheetName)
    for ($r = 2; $r -le $sheet.UsedRange.Rows.Count; $r++) {
      $name = if ($sheetName -eq 'Alice Lane') { Clean $sheet.Cells.Item($r,6).Text } elseif ($sheetName -eq 'Sandton') { Clean $sheet.Cells.Item($r,2).Text } else { Clean $sheet.Cells.Item($r,5).Text }
      $make = if ($sheetName -eq 'Sandton') { Clean $sheet.Cells.Item($r,3).Text } else { Clean $sheet.Cells.Item($r,2).Text }
      $serial = if ($sheetName -eq 'Sandton') { Clean $sheet.Cells.Item($r,4).Text } else { Clean $sheet.Cells.Item($r,3).Text }
      $model = if ($sheetName -eq 'Sandton') { Clean $sheet.Cells.Item($r,5).Text } else { Clean $sheet.Cells.Item($r,4).Text }
      $notes = if ($sheetName -eq 'Sandton') { Clean $sheet.Cells.Item($r,7).Text } elseif ($sheetName -eq 'Rosebank') { Clean $sheet.Cells.Item($r,6).Text } else { '' }
      if (-not $serial) { continue }
      $category = if ($notes -match '(?i)screen|monitor|desktop|tower|vault') { 'Other' } else { 'Laptop' }
      $assets.Add([pscustomobject]@{ Category=$category; Site=$sheetName; Person=$name; Department=''; Make=$make; Model=$model; Serial=$serial; Imei=''; Phone=''; Supplier=''; Condition=if($notes -match '(?i)new'){'New'}else{'Used'} })
    }
  }
  $book.Close($false)

  $book = $excel.Workbooks.Open($PhonePath, $null, $true)
  foreach ($sheetName in @('Head Office','Gateway','Park Square','Musgrave','GCR','Sandton','Alice Lane','Rosebank','Cape Town')) {
    $sheet = $book.Worksheets.Item($sheetName)
    for ($r = 1; $r -le $sheet.UsedRange.Rows.Count; $r++) {
      $number = Clean $sheet.Cells.Item($r,7).Text
      $person = Clean $sheet.Cells.Item($r,10).Text
      $make = Clean $sheet.Cells.Item($r,2).Text
      if ($number -notmatch '^\d{9,10}$' -or -not $make) { continue }
      $assets.Add([pscustomobject]@{ Category='Phone'; Site=$sheetName; Person=$person; Department=''; Make=$make; Model=(Clean $sheet.Cells.Item($r,4).Text); Serial=''; Imei=(Clean $sheet.Cells.Item($r,3).Text); Phone=$number; Supplier=(Clean $sheet.Cells.Item($r,11).Text); Condition='Used' })
    }
  }
  $sheet = $book.Worksheets.Item('BHM Console Revised')
  for ($r = 3; $r -le $sheet.UsedRange.Rows.Count; $r++) {
    $number = Clean $sheet.Cells.Item($r,2).Text
    if ($number -notmatch '^\d{9,10}$') { continue }
    $assets.Add([pscustomobject]@{ Category='Phone'; Site='Bayside Head Office'; Person=(Clean $sheet.Cells.Item($r,3).Text); Department=''; Make=(Clean $sheet.Cells.Item($r,5).Text); Model=''; Serial=''; Imei=''; Phone=$number; Supplier=(Clean $sheet.Cells.Item($r,4).Text); Condition='Used' })
  }
  $book.Close($false)
} finally {
  $excel.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}

$deduped = @{}
foreach ($asset in $assets) {
  $key = if ($asset.Category -eq 'Phone') { "phone:$($asset.Phone)" } else { "serial:$($asset.Serial.ToLowerInvariant())" }
  if (-not $deduped.ContainsKey($key)) { $deduped[$key] = $asset }
}
$assets = @($deduped.Values | Sort-Object Category, Site, Serial, Phone)

$people = @{}
foreach ($asset in $assets) {
  if (-not (IsPerson $asset.Person)) { continue }
  $key = $asset.Person.ToLowerInvariant()
  if (-not $people.ContainsKey($key)) { $people[$key] = [pscustomobject]@{ Name=$asset.Person; Department=$asset.Department } }
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('-- Generated from list1.xlsx and list2.xlsx. Safe to run more than once.')
$lines.Add('begin;')
$lines.Add('create unique index if not exists people_name_unique on public.people (lower(name));')
$lines.Add('')
foreach ($person in ($people.Values | Sort-Object Name)) {
  $lines.Add("insert into public.people (name, department) values ($(Sql $person.Name), $(Sql $person.Department)) on conflict ((lower(name))) do update set department = coalesce(excluded.department, public.people.department);")
}
$lines.Add('')
$index = 1
foreach ($asset in $assets) {
  $code = if ($asset.Category -eq 'Phone') { 'PHN-' } elseif ($asset.Category -eq 'Laptop') { 'LAP-' } else { 'OTH-' }
  $code += $index.ToString('0000')
  $status = if (IsPerson $asset.Person) { 'Assigned' } else { 'In stock' }
  $lines.Add("insert into public.assets (asset_code, category, site, assignee, department, make, model, serial, imei, phone_number, supplier, status, condition) values ($(Sql $code), $(Sql $asset.Category), $(Sql $asset.Site), $(Sql $(if(IsPerson $asset.Person){$asset.Person}else{''})), $(Sql $asset.Department), $(Sql $(if($asset.Make){$asset.Make}else{'Unknown'})), $(Sql $(if($asset.Model){$asset.Model}else{'Unknown'})), $(Sql $asset.Serial), $(Sql $asset.Imei), $(Sql $asset.Phone), $(Sql $asset.Supplier), $(Sql $status), $(Sql $asset.Condition)) on conflict (asset_code) do update set category=excluded.category, site=excluded.site, assignee=excluded.assignee, department=excluded.department, make=excluded.make, model=excluded.model, serial=excluded.serial, imei=excluded.imei, phone_number=excluded.phone_number, supplier=excluded.supplier, status=excluded.status, condition=excluded.condition;")
  if (IsPerson $asset.Person) {
    $lines.Add("insert into public.assignment_history (asset_id, person_id, action, assigned_at, notes) select a.id, p.id, 'Assigned', now(), 'Imported from Excel register' from public.assets a join public.people p on lower(p.name)=lower($(Sql $asset.Person)) where a.asset_code=$(Sql $code) and not exists (select 1 from public.assignment_history h where h.asset_id=a.id and h.person_id=p.id and h.action='Assigned');")
  }
  $index++
}
$lines.Add('commit;')
$lines.Add("-- Imported people: $($people.Count)")
$lines.Add("-- Imported assets: $($assets.Count)")

[IO.File]::WriteAllLines($OutputPath, $lines, [Text.UTF8Encoding]::new($false))
"Generated $OutputPath"
"People: $($people.Count)"
"Assets: $($assets.Count)"
