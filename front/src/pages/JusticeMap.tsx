import React, { useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip as LeafletTooltip } from
'react-leaflet';
import { MapFilters } from '../components/map/MapFilters';
import { useData } from '../contexts/DataContext';
import { faNum, faShortBudget } from '../utils/format';

const KERMAN: [number, number] = [30.2885, 57.0722];

/** طیف رنگ محرومیت: سبز (برخوردار) → زرد → قرمز (محروم) */
function heatColor(deprivation: number): string {
  if (deprivation >= 0.75) return '#E53935';
  if (deprivation >= 0.6) return '#FB8C00';
  if (deprivation >= 0.4) return '#FDD835';
  if (deprivation >= 0.25) return '#9CCC65';
  return '#00A86B';
}

export function JusticeMap() {
  const { projects, neighborhoods, categoryColors } = useData();
  const [showHeat, setShowHeat] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [active, setActive] = useState(Object.keys(categoryColors));
  const [minBudget, setMinBudget] = useState(0);

  const visible = useMemo(
    () =>
    projects.filter(
      (p) => active.includes(p.category) && p.budget >= minBudget
    ),
    [projects, active, minBudget]
  );

  return (
    <div className="relative h-[calc(100vh-10rem)] w-full overflow-hidden rounded-xl border border-navy-800/8 shadow-soft dark:border-white/8">
      <MapContainer
        center={KERMAN}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}>
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO — داده محرومیت: معاونت برنامه‌ریزی شهرداری کرمان"
          subdomains={['a', 'b', 'c', 'd']} />
        

        {/* لایه حرارتی محرومیت محلات */}
        {showHeat ?
        neighborhoods.map((n) =>
        <React.Fragment key={n.id}>
                <CircleMarker
            center={[n.lat, n.lng]}
            radius={54}
            pathOptions={{
              color: 'transparent',
              fillColor: heatColor(n.deprivation),
              fillOpacity: 0.16 + n.deprivation * 0.14
            }} />
          
                <CircleMarker
            center={[n.lat, n.lng]}
            radius={30}
            pathOptions={{
              color: 'transparent',
              fillColor: heatColor(n.deprivation),
              fillOpacity: 0.22 + n.deprivation * 0.2
            }}>
            
                  <LeafletTooltip
              className="justice-tip"
              direction="top"
              offset={[0, -8]}>
              
                    <div className="w-[200px] p-3">
                      <p className="text-[11px] font-extrabold">{n.name}</p>
                      <div className="mt-2 space-y-1 text-[10px] text-white/65">
                        <p>
                          ضریب محرومیت:{' '}
                          <b style={{ color: heatColor(n.deprivation) }}>
                            {faNum(n.deprivation, 2)}
                          </b>
                        </p>
                        <p>پروژه‌های فعال: {faNum(n.projects)}</p>
                        <p>جمعیت: {faNum(n.population)} نفر</p>
                      </div>
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              </React.Fragment>
        ) :
        null}

        {/* پین پروژه‌ها */}
        {showPins ?
        visible.map((p) =>
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={p.score >= 84 ? 14 : 10}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: categoryColors[p.category],
            fillOpacity: 0.95
          }}>
          
                <LeafletTooltip
            className="justice-tip"
            direction="top"
            offset={[0, -8]}>
            
                  <div className="w-[200px] p-3">
                    <p className="text-[11px] font-extrabold leading-4">{p.name}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-white/60">بودجه</span>
                      <b>{faShortBudget(p.budget)}</b>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-white/60">امتیاز تاثیر بر عدالت</span>
                      <b className="text-amber-400">{faNum(p.justice * 100)}</b>
                    </div>
                  </div>
                </LeafletTooltip>
              </CircleMarker>
        ) :
        null}
      </MapContainer>

      {/* پنل فیلتر شناور */}
      <div className="pointer-events-none absolute top-6 z-[500] ltr:left-6 rtl:right-6">
        <MapFilters
          showHeat={showHeat}
          onToggleHeat={() => setShowHeat((v) => !v)}
          showPins={showPins}
          onTogglePins={() => setShowPins((v) => !v)}
          active={active}
          onToggleCategory={(cat) =>
          setActive((prev) =>
          prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
          )
          }
          minBudget={minBudget}
          onMinBudget={setMinBudget}
          visibleCount={visible.length} />
        
      </div>

      {/* هشدار عدم توازن */}
      <div className="absolute bottom-6 z-[500] w-[320px] rounded-xl border border-white/10 bg-night-900/92 p-5 text-white shadow-lift backdrop-blur-md ltr:right-6 rtl:left-6">
        <p className="text-xs font-extrabold text-amber-400">
          تشخیص عدم توازن فضایی
        </p>
        <p className="mt-2 text-[11px] leading-6 text-white/65">
          محلات <b className="text-white">سرآسیاب</b> و{' '}
          <b className="text-white">شهرک الغدیر</b> با ضریب محرومیت بالای ۰٫۶، کمترین
          سهم پروژه را دارند؛ در حالی‌که محله مشتاق با محرومیت ۰٫۱۷ چهار پروژه فعال
          دارد.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
          {[
          { label: 'محلات محروم', value: faNum(4), tone: 'text-rose-400' },
          { label: 'بدون پروژه', value: faNum(1), tone: 'text-amber-400' },
          { label: 'اشباع‌شده', value: faNum(3), tone: 'text-emerald-400' }].
          map((s) =>
          <div key={s.label} className="rounded-lg bg-white/6 px-2 py-2">
              <p className={`text-sm font-extrabold ${s.tone}`}>{s.value}</p>
              <p className="mt-0.5 text-white/45">{s.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>);

}
