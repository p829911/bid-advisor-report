# 최종 리포트용: 가격 방식 추가 검증(추첨번호·상한선·경쟁사 예측성) + 공고 선택 기회 → src/final.ts (익명)
# 실행: uv run --project ~/hero/bid-advisor-engine python scripts/make_final.py
import csv, json, math, os, re, sqlite3, statistics as st, collections
from bidadv.client_backtest import fill_from_db, load_client_csv
from bidadv.habit import competitor_bids

HOME = os.path.expanduser('~')
DB = os.path.join(f'{HOME}/hero/bid-advisor-engine/data', 'bids' + '.sqlite')
ME = '4158146420'
A = load_client_csv(f'{HOME}/hero/bid-advisor/info21c/info21c_bids.csv')
fill_from_db(A, DB, ME)
bids = competitor_bids(A, DB, ME)
con = sqlite3.connect(DB); con.row_factory = sqlite3.Row
info_rows = list(csv.DictReader(open(f'{HOME}/hero/bid-advisor/info21c/info21c_bids.csv', encoding='utf-8-sig')))
info = {r['공고번호'].split('-')[0] for r in info_rows}

# 1) 추첨 번호 ↔ 가격 순위상관
by = collections.defaultdict(list)
for r in con.execute('select bid_ntce_no, sno, price from prelim'):
    by[r[0]].append((r[1], r[2]))
def spearman(a, b):
    ra = {v: i for i, v in enumerate(sorted(a))}; rb = {v: i for i, v in enumerate(sorted(b))}
    x = [ra[v] for v in a]; y = [rb[v] for v in b]; mx, my = st.mean(x), st.mean(y)
    num = sum((p - mx) * (q - my) for p, q in zip(x, y)); den = math.sqrt(sum((p - mx) ** 2 for p in x) * sum((q - my) ** 2 for q in y))
    return num / den if den else 0
cors = [spearman([s for s, _ in v], [p + i * 1e-9 for i, (_, p) in enumerate(v)]) for v in by.values() if len(v) == 15]

# 2) 상한선: 경쟁사 값을 완벽히 알 때(관내 2024~)
L = [a for a in A if a.region == '완도 관내']
R = [a for a in L if a.date >= '2024-01-01']
exp_sum = real = 0
for a in R:
    i = L.index(a); ss = sorted(b.s for b in L[max(0, i - 200):i]); xs = sorted(bids.get(a.no, {}).values())
    cands = {x - 1e-5 for x in xs} | {ss[int(q / 100 * len(ss))] for q in range(1, 100)}
    best = (0, None)
    for c in cands:
        p = sum(1 for s in ss if s <= c and not any(s <= x < c for x in xs)) / len(ss)
        if p > best[0]: best = (p, c)
    exp_sum += best[0]; real += int(a.s <= best[1] < (a.upper if a.upper is not None else 9))

# 3) 경쟁사 예측성: 최근10 평균 대비 잔차와 특징 상관 최대값
def corr(a, b):
    ma, mb = st.mean(a), st.mean(b); sa, sb = st.pstdev(a), st.pstdev(b)
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / len(a) / (sa * sb) if sa and sb else 0
hist = collections.defaultdict(list); feats = collections.defaultdict(lambda: collections.defaultdict(list))
for i, a in enumerate(L):
    xs = {bz: x for bz, x in bids.get(a.no, {}).items() if 0.95 < x < 1.06}
    for bz, x in xs.items():
        h = hist[bz]
        if len(h) >= 11 and a.date >= '2023-01-01':
            m = st.mean(h[-10:]); f = feats[bz]
            f['r'].append(x - m); f['prev'].append(h[-1] - st.mean(h[-11:-1])); f['s'].append(L[i - 1].s); f['base'].append(math.log10(a.base))
        h.append(x)
maxc = 0
for bz, f in feats.items():
    if len(f['r']) >= 100:
        for k in ('prev', 's', 'base'):
            maxc = max(maxc, abs(corr(f['r'], f[k])))

# 4) 공고 선택 기회
co = collections.Counter()
for (no,) in con.execute('select distinct bid_ntce_no from bids where bizno=?', (ME,)):
    for (bz,) in con.execute('select distinct bizno from bids where bid_ntce_no=? and bizno!=?', (no, ME)):
        co[bz] += 1
peers = {b for b, c in co.items() if c >= 3}
CORE = re.compile('해양쓰레기|폐합성|부표|스티로폼|영농폐기물|폐어구|폐어망|폐비닐|폐농약|해안쓰레기|부유쓰레기|침적쓰레기')
EXCL = re.compile('시담|연구|감리|설계|건설폐기물|모니터링|구조개선|임대차')
rows = con.execute("select * from notices where openg_dt >= '2025-01-01' and progrs like '%개찰완료%'").fetchall()
core = [r for r in rows if CORE.search(r['name'] or '') and not EXCL.search(r['name'] or '')]
miss = []
for r in core:
    if r['bid_ntce_no'] in info or not (2 <= (r['prtcpt_cnum'] or 0) <= 6):
        continue
    bz = {x[0] for x in con.execute('select bizno from bids where bid_ntce_no=?', (r['bid_ntce_no'],))}
    jn = '전남' in (r['dminstt'] or '') or '전라남도' in (r['dminstt'] or '')
    if jn and len(bz & peers) >= 2 and ME not in bz:
        miss.append((r, len(bz)))
ag = collections.Counter((r['dminstt'] or '').split()[-1] for r, _ in miss)
# 지역 조건 추정: 완도 관내 업체(관내 입찰 3회+)가 하나라도 들어왔거나 완도군 발주면 '지역 OK'
wcnt = collections.Counter()
for a in A:
    if a.region == '완도 관내':
        for (bz,) in con.execute('select distinct bizno from bids where bid_ntce_no=?', (a.no,)):
            if bz != ME: wcnt[bz] += 1
wfirms = {b for b, c in wcnt.items() if c >= 3}
def bzs(no): return {x[0] for x in con.execute('select distinct bizno from bids where bid_ntce_no=?', (no,))}
ok = [(r, n) for r, n in miss if '완도' in (r['dminstt'] or '') or (bzs(r['bid_ntce_no']) & wfirms)]
wide_have = wide_w = 0
for a in A:
    if a.region == '전남 지역':
        b = bzs(a.no)
        if b: wide_have += 1; wide_w += bool((b - {ME}) & wfirms)
names = {}
for i, (k, _) in enumerate(ag.most_common()):
    names[k] = '관내(우리 군)' if k == '완도군' else f'이웃 시·군 {chr(65 + len([n for n in names.values() if n.startswith("이웃")]))}'
agencies = [{'name': names[k], 'n': v, 'ev': round(sum(1 / (n + 1) for r, n in miss if (r['dminstt'] or '').split()[-1] == k), 1)} for k, v in ag.most_common(8)]
pc = collections.Counter(n for _, n in miss)
own25 = [r for r in info_rows if r['개찰일'] >= '2025-01-01']
months = sorted({r['openg_dt'][:7] for r, _ in miss})
out = {
    'picksCorr': round(st.mean(cors), 3), 'picksN': len(cors),
    'boundN': len(R), 'boundExp': round(exp_sum, 1), 'boundReal': real, 'actual': sum(a.own_win for a in R),
    'predictMaxCorr': round(maxc, 2),
    'coreTotal': len(core), 'coreEntered': sum(1 for r in core if r['bid_ntce_no'] in info),
    'missN': len(miss), 'missEv': round(sum(1 / (n + 1) for _, n in miss), 1), 'peers': len(peers),
    'own25': len(own25), 'own25Win': sum(r['결과'] == '1순위' for r in own25),
    'from': months[0] if months else None, 'to': months[-1] if months else None,
    'agencies': agencies, 'byBidders': [{'n': f'{k}곳', 'cnt': pc[k]} for k in sorted(pc)],
    'okN': len(ok), 'okEv': round(sum(1 / (n + 1) for _, n in ok), 1), 'okLocal': sum(1 for r, _ in ok if '완도' in (r['dminstt'] or '')),
    'okYears': dict(collections.Counter(r['openg_dt'][:4] for r, _ in ok)), 'suspectN': len(miss) - len(ok),
    'wideHave': wide_have, 'wideWith': wide_w, 'wandoFirms': len(wfirms),
}
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'final.ts'), 'w').write(
    '// 자동 생성(scripts/make_final.py) — 익명 집계\nexport const FINAL = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print(json.dumps(out, ensure_ascii=False))
