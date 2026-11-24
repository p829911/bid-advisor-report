# info21c_bids.csv → 공개 리포트용 익명 집계(src/data.ts). 업체·발주처 실명, 공고번호는 넣지 않는다.
import csv, json, os, statistics as st
from collections import Counter, defaultdict

SRC = os.path.expanduser('~/hero/bid-advisor/info21c/info21c_bids.csv')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data.ts')
rows = list(csv.DictReader(open(SRC, encoding='utf-8-sig')))
f = lambda v: float(v) if v not in ('', None) else None
for r in rows:
    r['own'], r['org'], r['top'] = f(r['자사사정률']), f(r['발주처사정률']), f(r['1순위사정률'])
    r['y'] = r['개찰일'][:4]
    r['agency'] = r['발주처'].split()[-1] if r['발주처'] else '-'  # 통합특별시 개명 합치기
n = len(rows); res = Counter(r['결과'] for r in rows)

years = []
for y in sorted({r['y'] for r in rows}):
    g = [r for r in rows if r['y'] == y]; c = Counter(r['결과'] for r in g)
    years.append({'year': y, 'win': c['1순위'], 'lose': c['탈락'], 'under': c['하한미달'], 'total': len(g),
                  'underRate': round(c['하한미달'] / len(g) * 100, 1), 'winRate': round(c['1순위'] / len(g) * 100, 1)})

def hist(vals, lo, hi, step):
    bins = []; x = lo
    while x < hi - 1e-9:
        bins.append(round(x, 2)); x += step
    cnt = Counter()
    for v in vals:
        v = min(max(v, lo), hi - 1e-9); cnt[bins[int((v - lo) // step)]] += 1
    return bins, cnt
own = [r['own'] for r in rows if r['own']]; org = [r['org'] for r in rows if r['org']]
bins, co = hist(own, 97.0, 103.0, 0.25); _, cg = hist(org, 97.0, 103.0, 0.25)
sajeong = [{'bin': f'{b:.2f}', 'own': co[b], 'actual': cg[b]} for b in bins]

pairs = [r for r in rows if r['own'] and r['org']]
dbins, _ = hist([0], -3.0, 3.0, 0.25)
dev = {b: Counter() for b in dbins}
for r in pairs:
    d = min(max(r['own'] - r['org'], -3.0), 3.0 - 1e-9); b = dbins[int((d + 3.0) // 0.25)]; dev[b][r['결과']] += 1
deviation = [{'bin': f'{b:+.2f}', 'win': dev[b]['1순위'], 'lose': dev[b]['탈락'], 'under': dev[b]['하한미달']} for b in dbins]

# 경쟁사: 사업자번호 기준 익명화(많이 이긴 순 A, B, C…)
beat = Counter(r['1순위사업자번호'] for r in rows if r['결과'] != '1순위' and r['1순위사업자번호'])
comps = []
for i, (k, v) in enumerate(beat.most_common(8)):
    g = [r for r in rows if r['1순위사업자번호'] == k and r['top']]
    comps.append({'name': f'경쟁사 {chr(65+i)}', 'beat': v, 'avgTop': round(st.mean(r['top'] for r in g), 3) if g else None})
others = sum(beat.values()) - sum(c['beat'] for c in comps)

# 발주처: 익명화(건수 순)
ag = Counter(r['agency'] for r in rows)
agencies = []
for i, (k, v) in enumerate(ag.most_common(8)):
    g = [r for r in rows if r['agency'] == k]; c = Counter(r['결과'] for r in g)
    agencies.append({'id': str(i), 'name': '주력 발주처' if i == 0 else f'발주처 {chr(65+i)}', 'total': v, 'win': c['1순위'],
                     'under': c['하한미달'], 'winRate': round(c['1순위'] / v * 100, 1), 'underRate': round(c['하한미달'] / v * 100, 1)})

recent = [r for r in pairs if r['y'] >= '2024']
summary = {
    'total': n, 'from': rows[-1]['개찰일'] if rows[-1]['개찰일'] < rows[0]['개찰일'] else min(r['개찰일'] for r in rows),
    'to': max(r['개찰일'] for r in rows), 'win': res['1순위'], 'lose': res['탈락'], 'under': res['하한미달'],
    'actualMean': round(st.mean(org), 3), 'actualSd': round(st.pstdev(org), 3),
    'ownMean': round(st.mean(own), 3), 'ownSd': round(st.pstdev(own), 3),
    'devUnder': round(st.mean(r['own'] - r['org'] for r in pairs if r['결과'] == '하한미달'), 3),
    'devWin': round(st.mean(r['own'] - r['org'] for r in pairs if r['결과'] == '1순위'), 3),
    'devLose': round(st.mean(r['own'] - r['org'] for r in pairs if r['결과'] == '탈락'), 3),
    'ownBelowActual': sum(1 for r in pairs if r['own'] < r['org']), 'pairs': len(pairs),
    'underWhenBelow': sum(1 for r in pairs if r['own'] < r['org'] and r['결과'] == '하한미달'),
    'recentOwnSd': round(st.pstdev(r['own'] for r in recent), 3), 'recentActualSd': round(st.pstdev(r['org'] for r in recent), 3),
    'mainShare': round(agencies[0]['total'] / n * 100, 1), 'othersBeat': others,
    'top3Share': round(sum(c['beat'] for c in comps[:3]) / sum(beat.values()) * 100, 1),
}
ts = '// 자동 생성(scripts/make_data.py) — 실제 기록의 익명 집계. 업체·발주처 실명 없음.\n'
for k, v in [('SUMMARY', summary), ('YEARS', years), ('SAJEONG', sajeong), ('DEVIATION', deviation), ('COMPETITORS', comps), ('AGENCIES', agencies)]:
    ts += f'export const {k} = {json.dumps(v, ensure_ascii=False, indent=1)} as const;\n'
open(OUT, 'w').write(ts)
print(json.dumps(summary, ensure_ascii=False, indent=1)); print(years[-3:]); print(comps[:3]); print(agencies[:3])
