import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, RefreshCw, Filter } from "lucide-react";
import Papa from "papaparse";

// --- DEMO DATA ---
const sampleData: any[] = [
  {"Vstup":"1.10.2025 10:47","Výstup":"1.10.2025 10:54","Směr":"long","Instrument":"USDJPY","Strategie":"2HL","Časový rámec":3,"Cena":146.989,"Směrové přesvědčení":"rising","ADX":33.0353204221,"DI+":9.039799538,"DI-":30.6812506357,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":true,"TP3":true},
  {"Vstup":"1.10.2025 11:02","Výstup":"1.10.2025 11:33","Směr":"short","Instrument":"EURUSD","Strategie":"2HL","Časový rámec":5,"Cena":1.12102,"Směrové přesvědčení":"falling","ADX":21.1151225179,"DI+":16.2277312415,"DI-":20.9239342569,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":true,"TP3":false},
  {"Vstup":"1.10.2025 11:17","Výstup":"1.10.2025 11:37","Směr":"long","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18315.7,"Směrové přesvědčení":"rising","ADX":15.0479091045,"DI+":20.9972039439,"DI-":19.3806123549,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":false,"TP3":false},
  {"Vstup":"1.10.2025 11:29","Výstup":"1.10.2025 11:40","Směr":"long","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18321.7,"Směrové přesvědčení":"rising","ADX":14.0849326281,"DI+":32.7363218612,"DI-":8.2542146101,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":false,"TP3":false},
  {"Vstup":"1.10.2025 11:54","Výstup":"1.10.2025 12:41","Směr":"short","Instrument":"EURUSD","Strategie":"2HL","Časový rámec":5,"Cena":1.12157,"Směrové přesvědčení":"falling","ADX":23.7561728524,"DI+":8.3804920499,"DI-":37.8295208316,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":false,"TP3":false},
  {"Vstup":"1.10.2025 12:49","Výstup":"1.10.2025 13:17","Směr":"short","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18302.9,"Směrové přesvědčení":"falling","ADX":17.3289115054,"DI+":32.1000045087,"DI-":27.2138243339,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":true,"TP3":false},
  {"Vstup":"1.10.2025 13:30","Výstup":"1.10.2025 13:39","Směr":"short","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18312.3,"Směrové přesvědčení":"falling","ADX":18.8825586022,"DI+":29.5501854116,"DI-":17.9196376454,"Swingové číslo":0,"SL":true,"TP1":false,"TP2":false,"TP3":false},
  {"Vstup":"1.10.2025 13:52","Výstup":"1.10.2025 14:00","Směr":"short","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18291.2,"Směrové přesvědčení":"falling","ADX":21.6316493918,"DI+":21.8361310011,"DI-":18.5697258221,"Swingové číslo":0,"SL":true,"TP1":false,"TP2":false,"TP3":false},
  {"Vstup":"1.10.2025 14:23","Výstup":"1.10.2025 14:32","Směr":"short","Instrument":"US100","Strategie":"2HL","Časový rámec":3,"Cena":18279.9,"Směrové přesvědčení":"falling","ADX":26.5081518163,"DI+":12.4355398812,"DI-":22.0824384046,"Swingové číslo":0,"SL":false,"TP1":true,"TP2":true,"TP3":false}
];

type Trade = typeof sampleData[number];

const RESULT_OPTIONS = [
  { value: "ANY", label: "(vše)" },
  { value: "SL_ONLY", label: "Pouze SL" },
  { value: "TP1_PLUS", label: "TP1+ (RRR ≥ 1:1)" },
  { value: "TP2_PLUS", label: "TP2+ (RRR ≥ 2:1)" },
  { value: "TP3", label: "TP3 (RRR ≥ 3:1)" },
] as const;

type ResultFilter = typeof RESULT_OPTIONS[number]["value"];

function parseCzDateTime(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [_, d, mo, y, h, mi] = m;
  const dd = Number(d), mm = Number(mo) - 1, yy = Number(y), hh = Number(h), mii = Number(mi);
  const dt = new Date(yy, mm, dd, hh, mii, 0, 0);
  return dt.getTime();
}

export default function App() {
  const [rows, setRows] = useState<Trade[]>(sampleData);

  // Filtry
  const [instrument, setInstrument] = useState("ANY");
  const [direction, setDirection] = useState("ANY");
  const [strategy, setStrategy] = useState("ANY");
  const [timeframe, setTimeframe] = useState("ANY");
  const [conviction, setConviction] = useState("ANY");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ANY");

  const [adxRange, setAdxRange] = useState<[number, number]>([0, 100]);
  const [diPlusRange, setDiPlusRange] = useState<[number, number]>([0, 100]);
  const [diMinusRange, setDiMinusRange] = useState<[number, number]>([0, 100]);
  const [swingRange, setSwingRange] = useState<[number, number]>([0, 20]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);

  // Dropdown options
  const instruments = useMemo(() => Array.from(new Set(rows.map(r => r["Instrument"]))), [rows]);
  const directions = useMemo(() => Array.from(new Set(rows.map(r => r["Směr"]))), [rows]);
  const strategies = useMemo(() => Array.from(new Set(rows.map(r => r["Strategie"]))), [rows]);
  const timeframes = useMemo(() => Array.from(new Set(rows.map(r => String(r["Časový rámec"]))),), [rows]);
  const convictions = useMemo(() => Array.from(new Set(rows.map(r => String(r["Směrové přesvědčení"])))).filter(Boolean), [rows]);

  useEffect(() => {
    const swings = rows.map(r => Number(r["Swingové číslo"]) || 0);
    const min = Math.min(...swings);
    const max = Math.max(...swings);
    if (Number.isFinite(min) && Number.isFinite(max)) setSwingRange([min, max]);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (instrument !== "ANY" && r["Instrument"] !== instrument) return false;
      if (direction !== "ANY" && r["Směr"] !== direction) return false;
      if (strategy !== "ANY" && r["Strategie"] !== strategy) return false;
      if (timeframe !== "ANY" && String(r["Časový rámec"]) !== timeframe) return false;
      if (conviction !== "ANY" && String(r["Směrové přesvědčení"]) !== conviction) return false;

      if (!(r["ADX"] >= adxRange[0] && r["ADX"] <= adxRange[1])) return false;
      if (!(r["DI+"] >= diPlusRange[0] && r["DI+"] <= diPlusRange[1])) return false;
      if (!(r["DI-"] >= diMinusRange[0] && r["DI-"] <= diMinusRange[1])) return false;
      if (!(Number(r["Swingové číslo"]) >= swingRange[0] && Number(r["Swingové číslo"]) <= swingRange[1])) return false;

      const vstupTs = parseCzDateTime(String(r["Vstup"]));
      if (vstupTs === null) return false;
      if (dateFrom) { const fromTs = new Date(dateFrom).getTime(); if (vstupTs < fromTs) return false; }
      if (dateTo) { const toTs = new Date(dateTo).getTime(); if (vstupTs > toTs) return false; }
      const h = new Date(vstupTs).getHours();
      if (!(h >= hourRange[0] && h <= hourRange[1])) return false;

      const sl = !!r["SL"]; const tp1 = !!r["TP1"]; const tp2 = !!r["TP2"]; const tp3 = !!r["TP3"];
      if (resultFilter === "SL_ONLY") { if (!(sl && !tp1 && !tp2 && !tp3)) return false; }
      else if (resultFilter === "TP3") { if (!tp3 || sl) return false; }
      else if (resultFilter === "TP2_PLUS") { if (!(tp2 && !sl)) return false; }
      else if (resultFilter === "TP1_PLUS") { if (!(tp1 && !sl)) return false; }

      return true;
    });
  }, [rows, instrument, direction, strategy, timeframe, conviction, adxRange, diPlusRange, diMinusRange, swingRange, dateFrom, dateTo, hourRange, resultFilter]);

  const onUpload = (file?: File | null) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      delimiter: "\t",
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data as any[]).map((r) => {
          const toBool = (v: any) => (v === true || v === "true" || v === 1 || v === "1");
          return { ...r, SL: toBool(r.SL), TP1: toBool(r.TP1), TP2: toBool(r.TP2), TP3: toBool(r.TP3) };
        });
        setRows(data as Trade[]);
        resetFilters();
      }
    });
  };

  const resetFilters = () => {
    setInstrument("ANY"); setDirection("ANY"); setStrategy("ANY"); setTimeframe("ANY");
    setConviction("ANY"); setResultFilter("ANY");
    setAdxRange([0,100]); setDiPlusRange([0,100]); setDiMinusRange([0,100]);
    setDateFrom(""); setDateTo(""); setHourRange([0,23]);
  };

  const total = filtered.length || 1;
  const counts = {
    tp1: filtered.filter(r=>r["TP1"]).length,
    tp2: filtered.filter(r=>r["TP2"]).length,
    tp3: filtered.filter(r=>r["TP3"]).length,
    slOnly: filtered.filter(r=>r["SL"] && !r["TP1"] && !r["TP2"] && !r["TP3"]).length,
    rising: filtered.filter(r=>String(r["Směrové přesvědčení"]) === "rising").length,
    falling: filtered.filter(r=>String(r["Směrové přesvědčení"]) === "falling").length,
  };
  const winrate = {
    tp1: Math.round((counts.tp1/total)*100),
    tp2: Math.round((counts.tp2/total)*100),
    tp3: Math.round((counts.tp3/total)*100),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto grid gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Obchodní filtr</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Input type="file" accept=".tsv,.csv,.txt" className="hidden" onChange={(e)=>onUpload(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-2 text-sm"><Upload className="w-4 h-4"/>Načíst data (TSV/CSV)</span>
            </label>
            <Button variant="outline" onClick={resetFilters} className="gap-2"><RefreshCw className="w-4 h-4"/>Reset filtrů</Button>
          </div>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/>Filtry</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label>Trh (Instrument)</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Vyber"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">(vše)</SelectItem>
                  {instruments.map(it => (<SelectItem key={it} value={it}>{it}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Směr</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">(vše)</SelectItem>
                  {directions.map(it => (<SelectItem key={it} value={it}>{it}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Strategie</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">(vše)</SelectItem>
                  {strategies.map(it => (<SelectItem key={it} value={it}>{it}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Časový rámec</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">(vše)</SelectItem>
                  {timeframes.map(it => (<SelectItem key={it} value={it}>{it}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Směrové přesvědčení</Label>
              <Select value={conviction} onValueChange={setConviction}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">(vše)</SelectItem>
                  {convictions.map(it => (<SelectItem key={it} value={it}>{it}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label>ADX rozsah: {adxRange[0]} – {adxRange[1]}</Label>
              <Slider value={adxRange} min={0} max={100} step={1} onValueChange={(v:any)=>setAdxRange([v[0], v[1]])}/>
            </div>
            <div className="grid gap-2">
              <Label>DI+ rozsah: {diPlusRange[0]} – {diPlusRange[1]}</Label>
              <Slider value={diPlusRange} min={0} max={100} step={1} onValueChange={(v:any)=>setDiPlusRange([v[0], v[1]])}/>
            </div>
            <div className="grid gap-2">
              <Label>DI- rozsah: {diMinusRange[0]} – {diMinusRange[1]}</Label>
              <Slider value={diMinusRange} min={0} max={100} step={1} onValueChange={(v:any)=>setDiMinusRange([v[0], v[1]])}/>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label>Swingové číslo: {swingRange[0]} – {swingRange[1]}</Label>
              <Slider value={swingRange} min={0} max={50} step={1} onValueChange={(v:any)=>setSwingRange([v[0], v[1]])}/>
            </div>
            <div className="grid gap-2">
              <Label>Datum od</Label>
              <Input type="datetime-local" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Datum do</Label>
              <Input type="datetime-local" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label>Hodinové okno: {hourRange[0]}:00 – {hourRange[1]}:59</Label>
              <Slider value={hourRange} min={0} max={23} step={1} onValueChange={(v:any)=>setHourRange([v[0], v[1]])}/>
            </div>
            <div className="grid gap-2">
              <Label>Výsledek</Label>
              <Select value={resultFilter} onValueChange={(v:ResultFilter)=>setResultFilter(v)}>
                <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Souhrn</CardTitle></CardHeader>
            <CardContent className="text-sm grid gap-1">
              <div>Počet záznamů: <b>{filtered.length}</b> / {rows.length}</div>
              <div>TP3: <b>{counts.tp3}</b></div>
              <div>TP2+: <b>{counts.tp2}</b></div>
              <div>TP1+: <b>{counts.tp1}</b></div>
              <div>Pouze SL: <b>{counts.slOnly}</b></div>
              <div>Rising: <b>{counts.rising}</b> | Falling: <b>{counts.falling}</b></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Winrate (RRR)</CardTitle></CardHeader>
            <CardContent className="text-sm grid gap-1">
              <div>TP1+ (≥1:1): <b>{winrate.tp1}%</b></div>
              <div>TP2+ (≥2:1): <b>{winrate.tp2}%</b></div>
              <div>TP3 (≥3:1): <b>{winrate.tp3}%</b></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Tip</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-600">
              Kombinuj hodinové okno s ADX/DI a směrovým přesvědčením pro hledání nejziskovějších úseků dne.
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Výsledky</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    {Object.keys(sampleData[0]).map((col) => (
                      <th key={col} className="text-left px-3 py-2 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                      {Object.keys(sampleData[0]).map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {typeof r[col as keyof Trade] === 'boolean' ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${r[col as keyof Trade] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {String(r[col as keyof Trade])}
                            </span>
                          ) : (
                            String(r[col as keyof Trade] ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => {
            const csv = Papa.unparse(filtered);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `obchody_export.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
          }}>
            <Download className="w-4 h-4"/> Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
