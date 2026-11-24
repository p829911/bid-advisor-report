# 관내 입찰 2024~ 업체별 습관 모델 검증 결과 → src/habit.ts (익명)
# 실행: uv run --project ~/hero/bid-advisor-engine python scripts/make_habit.py
import json, os, collections
from bidadv.backtest import G, k_of, x_of, paired_bootstrap
from bidadv.client_backtest import fill_from_db, load_client_csv, outcome, run_client_backtest
from bidadv.habit import HabitParams, competitor_bids, run_habit_backtest

HOME = os.path.expanduser('~')
DB = os.path.join(f'{HOME}/hero/bid-advisor-engine/data', 'bids' + '.sqlite')
A = load_client_csv(f'{HOME}/hero/bid-advisor/info21c/info21c_bids.csv')
fill_from_db(A, DB, '4158146420')
bids = competitor_bids(A, DB, '4158146420')
REG, SINCE = '완도 관내', '2024-01-01'

h = run_habit_backtest(A, bids, REG, params=HabitParams())
bp = run_client_backtest(A, min_train=40, window=200, region=REG)
bpm = {a.no: w for a, w in zip(bp.tests, bp.res['best_past'].lo)}
idx = [i for i, a in enumerate(h.tests) if a.date >= SINCE]
R = [h.tests[i] for i in idx]
d = [float(h.habit[i] - h.actual[i]) for i in idx]
lo, hi, _ = paired_bootstrap(d)
best_k = max(range(G), key=lambda k: sum(outcome(a, k)[0] for a in R))

# 업체별 1순위 몫(고객 포함, 같은 공고 안에서)
win, part = collections.Counter(), collections.Counter()
for a in R:
    xs = dict(bids.get(a.no, {})); xs['C'] = a.own
    for bz in xs: part[bz] += 1
    valid = [(x, bz) for bz, x in xs.items() if x >= a.s - 1e-12]
    if valid: win[min(valid)[1]] += 1
beat_all = collections.Counter()
import csv
rows = {r['공고번호'].split('-')[0]: r for r in csv.DictReader(open(f'{HOME}/hero/bid-advisor/info21c/info21c_bids.csv', encoding='utf-8-sig'))}
for a in A:
    if not a.own_win and rows[a.no]['1순위사업자번호']:
        beat_all[rows[a.no]['1순위사업자번호']] += 1
alias = {b: f'경쟁사 {chr(65 + i)}' for i, (b, _) in enumerate(beat_all.most_common(26))}
shares = [{'name': '고객 A' if bz == 'C' else alias.get(bz, '기타'), 'part': p, 'win': win[bz], 'rate': round(win[bz] / p * 100, 1)}
          for bz, p in part.most_common() if p >= 10]

by = collections.defaultdict(lambda: {'n': 0, 'actual': 0, 'habit': 0, 'best': 0})
for a, hw, aw in zip(h.tests, h.habit, h.actual):
    y = by[a.date[:4]]; y['n'] += 1; y['actual'] += aw; y['habit'] += hw; y['best'] += bpm.get(a.no, 0)
out = {
    'since': SINCE, 'n': len(R), 'bidders': round(sum(len(bids.get(a.no, {})) + 1 for a in R) / len(R), 1),
    'actual': sum(h.actual[i] for i in idx), 'habit': sum(h.habit[i] for i in idx), 'best': sum(bpm.get(a.no, 0) for a in R),
    'oracle': sum(outcome(a, best_k)[0] for a in R), 'oracleX': round(x_of(best_k) * 100, 2),
    'diff': int(sum(d)), 'lo': round(lo), 'hi': round(hi),
    'predicted': round(sum(h.probs[i] for i in idx) / len(idx) * 100, 1), 'realized': round(sum(h.habit[i] for i in idx) / len(idx) * 100, 1),
    'fairShare': round(100 / (sum(len(bids.get(a.no, {})) + 1 for a in R) / len(R)), 1),
    'shares': shares, 'years': [{'year': y, **v} for y, v in sorted(by.items())],
}
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'habit.ts'), 'w').write(
    '// 자동 생성(scripts/make_habit.py) — 익명 집계\nexport const HABIT = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print(json.dumps(out, ensure_ascii=False))
