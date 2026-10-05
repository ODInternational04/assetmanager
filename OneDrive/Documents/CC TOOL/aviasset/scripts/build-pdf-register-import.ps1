$ErrorActionPreference = 'Stop'
$output = "$PSScriptRoot\..\supabase\import-pdf-registers.sql"

$laptops = @'
C02FP4TCQ6W1|Ashok|Marketing|iMac|M1 - 24 inch|Head Office
2BR95S2|Shivani|Management|Dell|Core i7|Head Office
FVFFP5N4Q05D|Varsha|Marketing|iMac|M1 - 13 inch|Head Office
K2101N0036756|Uneil (taken to Santon)|Marketing|MSI|Core i9|Head Office
M4NOCXI3NI28175|Nancy|Marketing|Asus|Core i5|Head Office
7QJ06Z2|Nazmeera|Legal + Compliance|Dell|Core i7|Head Office
PF2QZKLC|Naseeha|Finance|Lenovo|Core i7|Head Office
PF11DE7L|Shaz|Marketing|Lenovo|Core i3|Head Office
BJL56Z2|Ashley A|Finance|Dell|Core i5|Head Office
N3N0CX24A195122|Avirash|IT|Asus|Core i5|Head Office
PF1M25VS|Ashley M|Finance|Lenovo|Core i3|Head Office
R8NOCX06D594341|Jocelyn|Debtors|Asus|Core i7|Head Office
PF40KM7C|Magenta|AI|Lenovo|Core i5|Head Office
PKX56FD|Alison|MSI|MSI|Core i7|Head Office
CJL806Z2|SarahLee|Finance|Asus|Core i7|Head Office
NXADDEA014250002293400|Nancy R|Sales|Acer|Core i5|Head Office
JY1P1F2|Aneesa Beeky|HR|Dell|Core i5|Head Office
NXADDEA0242490F5C53400|Kartik M|Prive|Acer|Core i5|Head Office
PF2NQGGF|Sharon|Debtors|Lenovo|Core i5|Gateway
32KJZ2|Rowann|Branch Manager|Dell||Gateway
N6N0CV10B90124A|Nicole|Duty Manager|Asus|Core i5|Gateway
3463032|Kamhan|CRO|Dell|Core i5|Gateway
J2ZN1F2|Shika|Duty Manager|Dell|Core i5|Gateway
91FLJZ2|Sheetal|Gold|Dell|Core i5|Gateway
8CG2W6T9MP|Tasmeena|Gold|Lenovo|Core i5|Park Square
5CD4N8V7QJ|Kevin|Restaurant|Lenovo|Core i5|Park Square
MANOCX13N155517A|Nikkisha|Finance|Asus|Core i5|Park Square
PF3K7M92LX|Sashen K|Finance|Asus|Core i7|Park Square
CNU6R8X4Q2|Irfaan|Gold|Dell|Core i7|Park Square
3VJ7P9K4RX|Perumal|Finance|Asus|Core i5|Park Square
S4N8Q2L6TZ|Keshav|Legal + Compliance|Lenovo|Core i7|Park Square
MX7F4K2R8N|Restaurant|Ops|Lenovo|Core i5|Park Square
PF1G2W37|Santhuri|Gateway|Lenovo|Core i5|Park Square
R8NOCXO6D22O347|Taliah T|Legal + Compliance|Asus|Core i7|Park Square
M4N0CX13M952177|Varenya|Concierge|Asus|Core i5|Park Square
PF45AWF5|Yashvir|DMS|Lenovo|Core i5|Park Square
YPBF2548|Naadiya|Vaults|Lenovo||Musgrave
NXADDEA024290FBE53400|Simone|Branch Manager|Acer|Core i5|Musgrave
N3N0CV12914811A|Fiza|Vaults|Asus|Core i5|Musgrave
M4N0CX13N15517A|Brandon|Security|Asus|Core i5|Musgrave
'@ -split "`n" | Where-Object { $_.Trim() }

$phones = @'
0794966196|Shivani Gosai|Vodacom|iPhone||Head Office|2 Year|2319.00|
0824446620|Ashok Sewnarain|Vodacom|iPhone||Head Office|2 Year|1299.00|
0605021334|Nikkisha Pillay|Skylite|iPhone|13|Head Office|2 Year|540.61|
0810462819|IBV Gold Online - Irfaan|Skylite|Samsung|A25|Head Office|2 Year|489.00|
0810463103|Buyback Gold Online - Irwin|Skylite|Samsung|A25|Head Office|2 Year|489.00|
0736862676|Alison Kannigan|Skylite|Samsung|A32|Head Office|2 Year|249.00|
0837935335|Irwin Chetty|Skylite|Samsung|A07|Head Office|2 Year|769.00|
0817361335|Feroz Saib|Skylite|Samsung||Head Office|2 Year|249.00|
0658856453|Nancy Ramdhani|Skylite|Samsung|A30s|Head Office|2 Year|419.00|
0604853121|Cannot Be Used On Whatsapp|Skylite|iPhone||Head Office|2 Year|169.00|
0824824653|IBV Gold Telesales (HowsitAI)|SuperbNumbers|Samsung|A32|Head Office||0.00|
0822222444|IBV Vaults Telesales (Nancy G)|SuperbNumbers|Samsung|A07|Head Office||0.00|
0315667050|15|Global Host|Landline||Head Office||750.00|
0812553812|Nicole Peters|Skylite|Samsung|A30s|Gateway|2 Year|279.00|
0764092799|Namisha Ramluckan|Skylite|Samsung|A30s|Gateway|2 Year|279.00|
0812761755|Debtors Phone (Sharon)|Skylite|Hauwei|P10 LITE|Gateway|2 Year|279.00|
0718748714|Rowann Chetty|Skylite|Samsung||Gateway|2 Year|249.00|
0784724657|Spare (With Irwin) Mekhail Old|Skylite|Samsung||Gateway|2 Year|169.00|
0832696397|Spare (With Irwin) Keshavan Old|Skylite|Samsung||Gateway|2 Year|259.00|
0315663984|10|Global Host|Landline||Gateway||500.00|
0718748864|Keshav Maharaj|Skylite|Samsung|A30s|Park Square|2 Year|279.00|
0832546389|Talia H.|Skylite|Samsung|A30s|Park Square|2 Year|249.00|
0764097378|Taliah T|Skylite|Samsung|A33|Park Square|3 Year|279.00|
0764091372|Sheetal Singh|Skylite|Samsung|A30s|Park Square|2 Year|279.00|
0718748805|Perumal Govender|Skylite|Samsung|A30s|Park Square|2 Year|279.00|
0658560859|Tasmeena Pillay|Skylite|Samsung|A30s|Park Square|2 Year|279.00|
0837833933|Varenya Naidu|Skylite|Samsung|A07|Park Square|2 Year|769.00|
0837832365|Zaahra Mahomed - Phone has been lost|Skylite|Samsung|A07|Park Square|2 Year|769.00|
0764095568|Spare (With Irwin) Farina Old|Skylite|Samsung|A30s|Park Square|2 Year|179.00|
0318800293|10|Global Host|Landline||Park Square||500.00|
0604853172|Simone Govender|Skylite|Sim Card|A32|Musgrave|2 Year|169.00|
0672260483|Fiza Haniff|Skylite|Samsung|A30s|Musgrave|2 Year|329.00|
0837838131|Naadiya Singh|Skylite|Samsung|A07|Musgrave|2 Year|769.00|
0318802119|3|Global Host|Landline||Musgrave||150.00|
'@ -split "`n" | Where-Object { $_.Trim() }

function Q([string]$v) { if ([string]::IsNullOrWhiteSpace($v)) { 'null' } else { "'$(($v -replace "'", "''"))'" } }
function PersonName([string]$v) { $v -and $v -notmatch '(?i)spare|available|cannot be used|telesales|phone|^\d+$|global host' }

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('-- Generated from the supplied laptop and cellphone PDF registers.')
$lines.Add('begin;')
$lines.Add('create temp table pdf_register_rows (source_type text, phone text, serial text, person_name text, department text, supplier text, make text, model text, site text, contract_term text, monthly_cost numeric);')
foreach ($row in $laptops) { $p=$row -split '\|'; $lines.Add("insert into pdf_register_rows values ('laptop', null, $(Q $p[0]), $(Q $p[1]), $(Q $p[2]), null, $(Q $p[3]), $(Q $p[4]), $(Q $p[5]), null, null) on conflict do nothing;") }
foreach ($row in $phones) { $p=$row -split '\|'; $lines.Add("insert into pdf_register_rows values ('phone', $(Q $p[0]), null, $(Q $p[1]), null, $(Q $p[2]), $(Q $p[3]), $(Q $p[4]), $(Q $p[5]), $(Q $p[6]), $(if($p[7]){$p[7]}else{'null'})) on conflict do nothing;") }
$lines.Add('create temp table pdf_import_results (source_type text, lookup_value text, result text, asset_code text, person_name text);')
$lines.Add(@'
do $$
declare r record; a public.assets; p public.people; code text; result text; clean_person text; valid_person boolean; desired_status text;
begin
  for r in select * from pdf_register_rows loop
    clean_person=trim(regexp_replace(coalesce(r.person_name,''), '\s*-\s*Phone has been lost\s*$', '', 'i'));
    valid_person=clean_person<>'' and clean_person !~* '(spare|available|cannot be used|telesales|phone|^[0-9]+$|global host)';
    desired_status=case when r.person_name ~* 'lost' then 'Junk' when valid_person then 'Assigned' else 'In stock' end;
    if valid_person then
      select * into p from public.people where lower(name)=lower(clean_person) limit 1;
      if p.id is null then
        insert into public.people(name, department) values (clean_person, r.department) returning * into p;
      else
        update public.people set department=coalesce(r.department,department) where id=p.id returning * into p;
      end if;
    end if;
    if r.source_type='phone' then
      select * into a from public.assets where phone_number=r.phone limit 1;
    else
      select * into a from public.assets where lower(coalesce(serial,''))=lower(r.serial) limit 1;
    end if;
    if a.id is not null then
      update public.assets set category=case when r.source_type='laptop' then 'Laptop' when r.make='Landline' then 'Other' else 'Phone' end, site=r.site, assignee=case when valid_person then clean_person else null end, department=coalesce(r.department,department), make=r.make, model=coalesce(nullif(r.model,''),'Unknown'), serial=coalesce(nullif(r.serial,''),serial), phone_number=coalesce(nullif(r.phone,''),phone_number), supplier=r.supplier, on_contract=(r.contract_term is not null and r.contract_term<>''), cost=r.monthly_cost, status=desired_status where id=a.id returning * into a;
      result='updated'; code=a.asset_code;
    else
      code=upper(r.source_type)||'-PDF-'||substr(md5(coalesce(r.phone,r.serial)),1,8);
      insert into public.assets(asset_code,category,site,assignee,department,make,model,serial,phone_number,supplier,on_contract,cost,status,condition) values(code,case when r.source_type='laptop' then 'Laptop' when r.make='Landline' then 'Other' else 'Phone' end,r.site,case when valid_person then clean_person else null end,r.department,coalesce(nullif(r.make,''),'Unknown'),coalesce(nullif(r.model,''),'Unknown'),r.serial,r.phone,r.supplier,(r.contract_term is not null and r.contract_term<>''),r.monthly_cost,desired_status,'Used') returning * into a;
      result='created';
    end if;
    if valid_person and desired_status='Assigned' and not exists(select 1 from public.assignment_history h where h.asset_id=a.id and h.person_id=p.id and h.action in ('Assigned','Transferred')) then
      insert into public.assignment_history(asset_id,person_id,action,assigned_at,notes) values(a.id,p.id,'Assigned',now(),'Merged from supplied PDF register');
    end if;
    insert into pdf_import_results values(r.source_type,coalesce(r.phone,r.serial),result,code,case when valid_person then clean_person else r.person_name end);
  end loop;
end $$;
select * from pdf_import_results order by result, source_type, lookup_value;
commit;
'@)
[IO.File]::WriteAllLines($output, $lines, [Text.UTF8Encoding]::new($false))
"Generated $output"
"Laptop rows: $($laptops.Count)"
"Phone rows: $($phones.Count)"
