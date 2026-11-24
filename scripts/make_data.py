# 고객 기록(info21c_bids.csv) + 검증 엔진 백테스트 → 공개 리포트용 익명 집계(src/data.ts).
# 실행: uv run --project ~/hero/bid-advisor-engine python scripts/make_data.py
# 업체·발주처 실명, 공고번호, 지명은 넣지 않는다. 지역 구분은 '관내 입찰'/'도 단위 지역입찰'로만 쓴다.
import csv, json, os, sqlite3, statistics as st
from collections import Counter, defaultdict

from bidadv.backtest import paired_bootstrap
from bidadv.client_backtest import fill_from_db, load_client_csv, run_client_backtest

HOME = os.path.expanduser('~')
SRC = f'{HOME}/hero/bid-advisor/info21c/info21c_bids.csv'
DB = os.path.join(f'{HOME}/hero/bid-advisor-engine/data', 'bids' + '.sqlite')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data.ts')
BIZ = '4158146420'
REG = {'완도 관내': ('local', '관내 입찰', '우리 군 업체만 참여'), '전남 지역': ('wide', '도 단위 지역입찰', '도 안 업체 누구나 참여')}

A = load_client_csv(SRC)
FILL = fill_from_db(A, DB, BIZ)
rows = {r['공고번호'].split('-')[0]: r for r in csv.DictReader(open(SRC, encoding='utf-8-sig'))}
con = sqlite3.connect(DB)

# 경쟁사 익명 이름: 전체 기간 고객을 이긴 횟수 순
beat_all = Counter(rows[a.no]['1순위사업자번호'] for a in A if not a.own_win and rows[a.no]['1순위사업자번호'])
alias = {b: f'경쟁사 {chr(65 + i)}' for i, (b, _) in enumerate(beat_all.most_common(26))}


def res_of(a):
    return '1순위' if a.own_win else ('하한미달' if a.own < a.s else '탈락')


regions = []
for key, (rid, label, desc) in REG.items():
    g = [a for a in A if a.region == key]
    res = Counter(res_of(a) for a in g)
    nb = [n for (n,) in (con.execute("select count(distinct bizno) from bids where bid_ntce_no=?", (a.no,)).fetchone() for a in g) if n]
    gaps = [(a.upper - a.s) * 100 for a in g if a.upper and a.upper < 5]
    years = []
    for y in sorted({a.date[:4] for a in g}):
        gy = [a for a in g if a.date[:4] == y]; c = Counter(res_of(a) for a in gy)
        tops = [a.upper * 100 for a in gy if a.upper and a.upper < 5]
        years.append({'year': y, 'total': len(gy), 'win': c['1순위'], 'lose': c['탈락'], 'under': c['하한미달'],
                      'underRate': round(c['하한미달'] / len(gy) * 100, 1), 'winRate': round(c['1순위'] / len(gy) * 100, 1),
                      'sMean': round(st.mean(a.s for a in gy) * 100, 2), 'ownMean': round(st.mean(a.own for a in gy) * 100, 2),
                      'rivalMin': round(st.median(tops), 2) if tops else None})
    dev = defaultdict(Counter)
    for a in g:
        d = min(max((a.own - a.s) * 100, -3.0), 2.999); b = round(-3.0 + int((d + 3.0) // 0.25) * 0.25, 2); dev[b][res_of(a)] += 1
    deviation = [{'bin': f'{b:+.2f}', 'win': dev[b]['1순위'], 'lose': dev[b]['탈락'], 'under': dev[b]['하한미달']}
                 for b in [round(-3.0 + i * 0.25, 2) for i in range(24)]]
    beat = Counter(rows[a.no]['1순위사업자번호'] for a in g if not a.own_win and rows[a.no]['1순위사업자번호'])
    lost = sum(beat.values())
    comps = [{'name': alias.get(b, '기타'), 'beat': v} for b, v in beat.most_common(5)]

    r = run_client_backtest(A, min_train=40, window=200, region=key)
    T = r.tests; half = len(T) // 2

    def cmp(a_name, b_name):
        d = [x - y for x, y in zip(r.res[a_name].lo, r.res[b_name].lo)]
        lo, hi, _ = paired_bootstrap([float(x) for x in d])
        return {'diff': sum(d), 'lo': round(lo), 'hi': round(hi), 'first': sum(d[:half]), 'second': sum(d[half:])}

    by = defaultdict(lambda: {'n': 0, 'actual': 0, 'best': 0, 'mean': 0})
    for i, a in enumerate(T):
        y = by[a.date[:4]]; y['n'] += 1
        y['actual'] += r.res['actual'].lo[i]; y['best'] += r.res['best_past'].lo[i]; y['mean'] += r.res['mean_s'].lo[i]
    bt = {'n': len(T), 'from': T[0].date, 'to': T[-1].date, 'splitDate': T[half].date,
          'actual': sum(r.res['actual'].lo), 'best': sum(r.res['best_past'].lo), 'mean': sum(r.res['mean_s'].lo),
          'bestUnder': sum(1 for a, x in zip(T, r.res['best_past'].picks) if x < a.s - 1e-12),
          'actualUnder': sum(1 for a in T if a.own < a.s), 'unknown': sum(1 for a in T if a.upper is None),
          'bestVsActual': cmp('best_past', 'actual'), 'bestVsMean': cmp('best_past', 'mean_s'), 'actualVsMean': cmp('actual', 'mean_s'),
          'years': [{'year': y, **v} for y, v in sorted(by.items())]}
    regions.append({'id': rid, 'label': label, 'desc': desc, 'total': len(g), 'win': res['1순위'], 'lose': res['탈락'], 'under': res['하한미달'],
                    'from': min(a.date for a in g), 'to': max(a.date for a in g),
                    'biddersMedian': st.median(nb) if nb else None, 'biddersP25': sorted(nb)[len(nb) // 4] if nb else None,
                    'biddersP75': sorted(nb)[3 * len(nb) // 4] if nb else None, 'biddersN': len(nb),
                    'gapMedian': round(st.median(gaps), 3), 'sMean': round(st.mean(a.s for a in g) * 100, 3), 'sSd': round(st.pstdev(a.s for a in g) * 100, 3),
                    'ownMean': round(st.mean(a.own for a in g) * 100, 3), 'ownSd': round(st.pstdev(a.own for a in g) * 100, 3),
                    'top3Share': round(sum(c['beat'] for c in comps[:3]) / lost * 100, 1) if lost else 0, 'lost': lost,
                    'years': years, 'deviation': deviation, 'competitors': comps, 'backtest': bt})

below = [a for a in A if a.own < a.s]
summary = {'total': len(A), 'from': min(a.date for a in A), 'to': max(a.date for a in A),
           'win': sum(a.own_win for a in A), 'under': len(below), 'underAllBelow': all(res_of(a) == '하한미달' for a in below),
           'checked': f"{FILL['match']}/{FILL['checked']}"}
ts = '// 자동 생성(scripts/make_data.py) — 실제 기록의 익명 집계. 업체·발주처·지명 없음.\n'
ts += f'export const SUMMARY = {json.dumps(summary, ensure_ascii=False, indent=1)} as const;\n'
ts += f'export const REGIONS = {json.dumps(regions, ensure_ascii=False, indent=1)};\n'
open(OUT, 'w').write(ts)
for rg in regions:
    b = rg['backtest']
    print(rg['label'], rg['total'], 'bidders', rg['biddersMedian'], rg['biddersP25'], rg['biddersP75'], 'gap', rg['gapMedian'],
          'bt', b['actual'], b['best'], b['mean'], b['bestVsActual'], b['bestVsMean'], b['splitDate'])
    print('  years', [(y['year'], y['ownMean'], y['sMean'], y['rivalMin']) for y in rg['years']])
print(summary)
