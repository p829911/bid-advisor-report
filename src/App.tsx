import {useState} from 'react';
import type {ReactNode} from 'react';
import {Layout, LayoutContent} from '@astryxdesign/core/Layout';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Grid} from '@astryxdesign/core/Grid';
import {List, ListItem} from '@astryxdesign/core/List';
import {Center} from '@astryxdesign/core/Center';
import {Section} from '@astryxdesign/core/Section';
import {Divider} from '@astryxdesign/core/Divider';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {REGIONS, SUMMARY as S} from './data';
import {HABIT} from './habit';

type Region = (typeof REGIONS)[number];

const C = {
  blue: 'var(--color-data-categorical-blue)',
  orange: 'var(--color-data-categorical-orange)',
  purple: 'var(--color-data-categorical-purple)',
  teal: 'var(--color-data-categorical-teal)',
  pink: 'var(--color-data-categorical-pink)',
  grid: 'var(--color-border)',
  tick: 'var(--color-text-secondary)',
};
const tick = {fontSize: 'var(--font-size-sm)', fill: C.tick};
const legend = {fontSize: 'var(--font-size-sm)'};
const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function B({children}: {children: ReactNode}) {
  return (
    <Text as="span" type="body" weight="semibold">
      {children}
    </Text>
  );
}

function Metric({label, value, hint}: {label: string; value: string; hint?: string}) {
  return (
    <Card>
      <VStack gap={1}>
        <Text type="supporting" color="secondary">
          {label}
        </Text>
        <Text type="display-3" weight="semibold">
          {value}
        </Text>
        {hint && (
          <Text type="supporting" color="secondary">
            {hint}
          </Text>
        )}
      </VStack>
    </Card>
  );
}

function ChartCard({title, desc, children}: {title: string; desc: string; children: ReactNode}) {
  return (
    <Card>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={4}>{title}</Heading>
          <Text type="supporting" color="secondary">
            {desc}
          </Text>
        </VStack>
        {children}
      </VStack>
    </Card>
  );
}

function SectionHead({n, title, desc}: {n: string; title: string; desc?: string}) {
  return (
    <VStack gap={1}>
      <HStack gap={2} vAlign="center">
        <Badge variant="neutral" label={n} />
        <Heading level={2}>{title}</Heading>
      </HStack>
      {desc && (
        <Text type="body" color="secondary">
          {desc}
        </Text>
      )}
    </VStack>
  );
}

const local = REGIONS.find(r => r.id === 'local')!;
const wide = REGIONS.find(r => r.id === 'wide')!;

function RegionView({r}: {r: Region}) {
  const bt = r.backtest;
  const isLocal = r.id === 'local';
  return (
    <VStack gap={6}>
      <Grid columns={{minWidth: 150, max: 5, repeat: 'fit'}} gap={4}>
        <Metric label="투찰" value={`${r.total}건`} hint={`${r.from.slice(0, 4)} ~ ${r.to.slice(0, 4)}`} />
        <Metric label="참여 업체 수(보통)" value={`${r.biddersMedian}곳`} hint={`대부분 ${r.biddersP25}~${r.biddersP75}곳 · ${r.biddersN}건 확인`} />
        <Metric label="1순위" value={pct(r.win, r.total)} hint={`${r.win}건`} />
        <Metric label="하한 미달" value={pct(r.under, r.total)} hint={`${r.under}건`} />
        <Metric label="이길 수 있는 폭(보통)" value={`${r.gapMedian.toFixed(2)}%p`} hint="실제 사정률 ~ 바로 위 업체" />
      </Grid>

      <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
        <ChartCard title="연도별 결과" desc="막대 = 건수, 선 = 하한 미달 비율(오른쪽 축).">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={r.years} margin={{top: 8, right: 4, left: 0, bottom: 4}}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="n" tick={tick} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="r" orientation="right" tick={tick} axisLine={false} tickLine={false} width={40} unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={legend} />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="win" stackId="a" fill={C.blue} name="1순위" />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="lose" stackId="a" fill={C.teal} name="탈락" />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="under" stackId="a" fill={C.orange} name="하한 미달" radius={[4, 4, 0, 0]} />
              <Line isAnimationActive={false} yAxisId="r" type="monotone" dataKey="underRate" stroke={C.pink} strokeWidth={2} dot name="하한 미달 비율" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="사정률 판의 변화"
          desc="해마다 평균(%). 실제 사정률, 고객 A가 쓴 값, 그리고 '고객 A를 빼고 하한을 넘긴 업체 중 가장 낮은 값'(=고객이 이기려면 그보다 낮게 써야 하는 선). 두 선 사이가 이길 수 있는 자리예요.">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={r.years} margin={{top: 8, right: 8, left: 0, bottom: 4}}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={48} domain={[98.5, 103]} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={legend} />
              <Line isAnimationActive={false} type="monotone" dataKey="sMean" stroke={C.blue} strokeWidth={2} dot name="실제 사정률" />
              <Line isAnimationActive={false} type="monotone" dataKey="rivalMin" stroke={C.purple} strokeWidth={2} dot name="경쟁 업체 최저 유효값" />
              <Line isAnimationActive={false} type="monotone" dataKey="ownMean" stroke={C.orange} strokeWidth={2} strokeDasharray="4 3" dot name="고객 A가 쓴 값" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>

      {isLocal && (
        <Banner
          status="warning"
          title="2024년부터 판이 바뀌었어요"
          description="2023년까지는 경쟁 업체의 최저 유효값이 101~102%대라 실제 사정률(약 99.8%)과 사이에 1%p 넘는 빈자리가 있었어요. 2024년부터는 100.0~100.3%로 내려와 빈자리가 거의 사라졌어요. 경쟁 업체들이 실제 사정률 쪽으로 바짝 붙어 쓰기 시작한 거예요."
        />
      )}

      <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
        <ChartCard title="써낸 값 − 실제 값에 따른 결과" desc="0보다 왼쪽은 전부 하한 미달. 0 바로 오른쪽에서 1순위가 나오고, 멀어질수록 다른 업체에 밀려요.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={r.deviation} margin={{top: 20, right: 8, left: 0, bottom: 4}}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="bin" tick={tick} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Legend wrapperStyle={legend} />
              <Bar isAnimationActive={false} dataKey="under" stackId="d" fill={C.orange} name="하한 미달" />
              <Bar isAnimationActive={false} dataKey="lose" stackId="d" fill={C.teal} name="탈락" />
              <Bar isAnimationActive={false} dataKey="win" stackId="d" fill={C.blue} name="1순위" radius={[3, 3, 0, 0]} />
              <ReferenceLine x="+0.00" stroke={C.purple} label={{value: '실제 = 써낸 값', fill: C.purple, fontSize: 12, position: 'top'}} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="1순위를 가져간 업체" desc={`고객 A가 진 ${r.lost}건 중 상위 5곳. 상위 3곳이 ${r.top3Share}%. 업체 이름은 전체 리포트에서 같은 알파벳을 써요.`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={r.competitors} layout="vertical" margin={{top: 4, right: 16, left: 8, bottom: 4}}>
              <CartesianGrid horizontal={false} stroke={C.grid} />
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={72} />
              <Tooltip />
              <Bar isAnimationActive={false} dataKey="beat" fill={C.blue} name="이긴 횟수" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>

      {/* 백테스트 */}
      <Card>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={3}>백테스트: 그때 데이터로 정했다면</Heading>
            <Text type="supporting" color="secondary">
              {bt.from} ~ {bt.to}, {bt.n}건. 공고마다 그 이전 기록만 보고 값을 정한 뒤, 실제 결과에 대입했어요. 앞 절반/뒤 절반 경계는 {bt.splitDate}.
            </Text>
          </VStack>
          <Grid columns={{minWidth: 180, max: 3, repeat: 'fit'}} gap={4}>
            <Metric label="고객 A 실제 선택" value={`1순위 ${bt.actual}건`} hint={`하한 미달 ${bt.actualUnder}건`} />
            <Metric label="빈 구간 찾기(데이터 방식)" value={`1순위 ${bt.best}건`} hint={`실제 대비 ${sign(bt.bestVsActual.diff)}건 · 앞 ${sign(bt.bestVsActual.first)} / 뒤 ${sign(bt.bestVsActual.second)}`} />
            <Metric label="과거 평균 사정률로 쓰기" value={`1순위 ${bt.mean}건`} hint="흔한 방식(비교용)" />
          </Grid>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bt.years} margin={{top: 8, right: 8, left: 0, bottom: 4}}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Legend wrapperStyle={legend} />
              <Bar isAnimationActive={false} dataKey="actual" fill={C.orange} name="고객 A 실제" radius={[3, 3, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="best" fill={C.blue} name="빈 구간 찾기" radius={[3, 3, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="mean" fill={C.teal} name="평균 사정률" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {isLocal ? (
            <Banner
              status="warning"
              title="효과 판정: 확인 못 함"
              description={`전체로는 실제보다 ${bt.bestVsActual.diff}건 많지만(95% 구간 ${sign(bt.bestVsActual.lo)}~${sign(bt.bestVsActual.hi)}), 2023년까지(앞 절반 ${sign(bt.bestVsActual.first)}건)에서 나온 차이예요. 판이 바뀐 뒤 절반에서는 오히려 ${Math.abs(bt.bestVsActual.second)}건 적었어요. 지금 시장에서는 이 방식이 고객 A의 감을 이긴다고 말할 수 없어요.`}
            />
          ) : (
            <Banner
              status="error"
              title="효과 판정: 없음"
              description={`데이터 방식이 실제 선택보다 ${Math.abs(bt.bestVsActual.diff)}건 적었고(95% 구간 ${sign(bt.bestVsActual.lo)}~${sign(bt.bestVsActual.hi)}), 앞/뒤 절반 모두 마찬가지예요(${sign(bt.bestVsActual.first)}/${sign(bt.bestVsActual.second)}). 참여 업체가 많아 이길 수 있는 폭이 ${r.gapMedian}%p밖에 안 돼서 사실상 추첨에 가까워요.`}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)', true);
  const [rid, setRid] = useState<string>('local');
  const region = REGIONS.find(r => r.id === rid)!;

  const body = (
    <VStack gap={8}>
      <VStack gap={3}>
        <Text type="supporting" color="secondary">
          입찰가 어드바이저 · 데이터 리포트 #3 · 2026-11-24
        </Text>
        <Heading level={1}>고객 A 투찰 기록: 지역별 분석과 검증</Heading>
        <Text type="body" color="secondary">
          고객 A(해양환경 분야)가 {S.from.slice(0, 7)}부터 {S.to.slice(0, 7)}까지 낸 투찰 {S.total}건을 두 시장으로 나눠 봤어요. 우리 군 업체만 들어오는
          관내 입찰과, 도 안 업체 누구나 들어오는 지역입찰은 경쟁 구조가 완전히 달라서 전략도 따로 봐야 해요.
        </Text>
        <Banner
          status="info"
          title="실제 기록을 익명으로 정리한 페이지예요"
          description="업체·발주처·지명은 빼고 '경쟁사 A'처럼 바꿨어요. 1순위는 개찰 1등이라 적격심사 결과에 따라 최종 낙찰과 다를 수 있어요. 낙찰을 보장하는 방법은 없어요."
        />
      </VStack>

      <Card>
        <VStack gap={3}>
          <Heading level={3}>결론</Heading>
          <List density="compact" listStyle="disc">
            <ListItem
              label={
                <>
                  <B>관내 입찰({local.biddersMedian}곳 경쟁)</B>은 이길 수 있는 폭이 넓고(보통 {local.gapMedian.toFixed(2)}%p) 1순위 비율도 {pct(local.win, local.total)}로 높아요. 다만{' '}
                  <B>2024년부터 경쟁 업체들이 실제 사정률 쪽으로 바짝 붙어</B> 빈자리가 거의 사라졌어요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  <B>지역입찰(보통 {wide.biddersMedian}곳, 많으면 30곳 이상)</B>은 이길 수 있는 폭이 {wide.gapMedian}%p로 좁아 사실상 추첨이에요. 1순위 비율 {pct(wide.win, wide.total)}, 하한 미달{' '}
                  {pct(wide.under, wide.total)}.
                </>
              }
            />
            <ListItem
              label={
                <>
                  데이터 방식(빈 구간 찾기)은 <B>두 시장 모두 지금은 고객 A 실제 선택보다 낫다고 확인되지 않았어요.</B> 관내는 2023년까지만 크게 앞섰고(앞 절반 {sign(local.backtest.bestVsActual.first)}건), 최근에는{' '}
                  {sign(local.backtest.bestVsActual.second)}건. 지역입찰은 내내 뒤졌어요({sign(wide.backtest.bestVsActual.diff)}건).
                </>
              }
            />
            <ListItem
              label={
                <>
                  관내 입찰을 업체별 습관 모델로 다시 시험해도 2024년 이후 <B>{HABIT.habit}건 vs 고객 A 실제 {HABIT.actual}건</B>이었어요. 고객 A는 이미 관내에서 1순위 비율이 가장 높아요(
                  {pct(HABIT.actual, HABIT.n)}, 공평한 몫 약 {HABIT.fairShare}%). → <B>투찰가 추천 개발은 멈추는 걸 권해요.</B>
                </>
              }
            />
            <ListItem
              label={
                <>
                  실제보다 낮게 쓴 {S.under}건은 {S.underAllBelow ? '전부' : '대부분'} 하한 미달이었어요. 구조상 피할 수 없는 결과라, 하한 미달 자체는 '공격적으로 쓴 대가'로 봐야 해요.
                </>
              }
            />
          </List>
        </VStack>
      </Card>

      <Divider />

      <VStack gap={4}>
        <SectionHead n="1" title="시장별 상세" desc="위에서 시장을 고르면 아래 숫자·차트가 바뀌어요." />
        <SegmentedControl label="시장" value={rid} onChange={v => setRid(v as string)} layout={isMobile ? 'fill' : undefined}>
          {REGIONS.map(r => (
            <SegmentedControlItem key={r.id} value={r.id} label={`${r.label} · ${r.total}건`} />
          ))}
        </SegmentedControl>
        <Text type="supporting" color="secondary">
          {region.label}: {region.desc}
        </Text>
        <RegionView r={region} />
      </VStack>

      <VStack gap={4}>
        <SectionHead
          n="2"
          title="관내 입찰 재검증: 업체별 습관 모델"
          desc={`관내는 경쟁 업체가 고정이라, 업체마다 '최근 어디에 쓰는지·얼마나 자주 들어오는지'를 따로 추적해 1순위 확률이 가장 높은 값을 고르는 방식을 2024년 이후 ${HABIT.n}건으로 다시 시험했어요.`}
        />
        <Grid columns={{minWidth: 160, max: 4, repeat: 'fit'}} gap={4}>
          <Metric label="고객 A 실제 선택" value={`${HABIT.actual}건`} hint={`1순위 ${pct(HABIT.actual, HABIT.n)}`} />
          <Metric label="업체별 습관 모델" value={`${HABIT.habit}건`} hint={`실제 대비 ${sign(HABIT.diff)}건 (95% ${sign(HABIT.lo)}~${sign(HABIT.hi)})`} />
          <Metric label="빈 구간 찾기" value={`${HABIT.best}건`} hint="리포트 1번 방식" />
          <Metric label="사후 최적 고정값" value={`${HABIT.oracle}건`} hint={`정답을 알고 ${HABIT.oracleX}%로 고정했을 때`} />
        </Grid>
        <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
          <ChartCard
            title="2024년 이후 업체별 1순위 비율"
            desc={`같은 공고 안에서 계산. 보통 ${HABIT.bidders}곳이 들어와서 공평한 몫은 약 ${HABIT.fairShare}%(점선). 고객 A가 이미 가장 높아요.`}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={HABIT.shares} layout="vertical" margin={{top: 4, right: 16, left: 8, bottom: 4}}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" tick={tick} axisLine={false} tickLine={false} unit="%" domain={[0, 40]} />
                <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={72} />
                <Tooltip />
                <Bar isAnimationActive={false} dataKey="rate" fill={C.blue} name="1순위 비율(%)" radius={[0, 4, 4, 0]} />
                <ReferenceLine x={HABIT.fairShare} stroke={C.purple} strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="연도별 1순위 건수(관내)" desc="2023년까지는 두 데이터 방식이 크게 앞섰지만, 2024년부터는 고객 A 실제 선택과 비슷하거나 낮아요.">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={HABIT.years} margin={{top: 8, right: 8, left: 0, bottom: 4}}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Legend wrapperStyle={legend} />
                <Bar isAnimationActive={false} dataKey="actual" fill={C.orange} name="고객 A 실제" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="habit" fill={C.purple} name="업체별 습관" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="best" fill={C.blue} name="빈 구간 찾기" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Banner
          status="error"
          title="최종 판정: 가격 추천으로 지금보다 낫게 만들기는 어려워요"
          description={`습관 모델은 예측 자체는 크게 빗나가지 않았지만(예상 1순위 확률 ${HABIT.predicted}% vs 실제 ${HABIT.realized}%), 고객 A 실제 선택보다 ${Math.abs(HABIT.diff)}건 적었어요. 정답을 미리 알고 하나의 값으로 고정했어도 ${HABIT.oracle}건이라 ${HABIT.actual}건에 못 미쳐요. 지금 관내 시장은 모두가 실제 사정률 근처에 붙어 쓰는 '운 나누기' 상태이고, 고객 A는 그 안에서 이미 가장 많이 이기고 있어요.`}
        />
      </VStack>

      <VStack gap={4}>
        <SectionHead n="3" title="어떻게 계산했나" />
        <Card>
          <List density="compact" listStyle="disc">
            <ListItem label={<>투찰금액을 '기초금액 × 하한율의 몇 %로 썼나'로 바꾸면, 1순위 = 실제 사정률 이상인 값 중 가장 작은 값을 쓴 업체예요.</>} />
            <ListItem label={<>그래서 다른 값을 썼을 때 1순위였는지는 '실제 사정률 이상, 바로 위 업체 값 미만'인지로 판정할 수 있어요. 바로 위 업체 값은 기록의 1순위 값이나 공개 개찰 결과(공공데이터포털)에서 가져왔어요.</>} />
            <ListItem label={<>{`이 판정을 공개 개찰 결과 전체 투찰 목록과 맞춰 보니 ${S.checked} 일치했어요.`}</>} />
            <ListItem label={<>빈 구간 찾기 = 같은 시장 직전 기록(최대 200건)에서 '그 값이었으면 1순위였을 횟수'가 가장 많은 값을 고르는 방식이에요.</>} />
            <ListItem label={<>가정: 고객 A가 값을 바꿔도 다른 업체 투찰은 그대로, 고객 A가 고른 추첨 번호의 영향은 무시, 적격심사 점수는 무시.</>} />
          </List>
        </Card>
      </VStack>

      <VStack gap={4}>
        <SectionHead n="4" title="권하는 방향" />
        <Card>
          <List density="compact" listStyle="decimal">
            <ListItem label={<>투찰가 추천 프로그램 개발은 여기서 멈추는 걸 권해요. 두 시장 모두 지금 방식보다 1순위를 늘린다는 근거가 없어요.</>} />
            <ListItem label={<>관내 입찰은 지금처럼 하되, 경쟁 업체들이 다시 값을 크게 바꾸면(2023년 이전처럼 빈자리가 생기면) 그때 다시 볼 가치가 있어요. 이건 공개 개찰 결과로 가볍게 지켜볼 수 있어요.</>} />
            <ListItem label={<>도움이 될 수 있는 건 가격이 아니라 시간이에요: 공고 찾기·마감 알림·투찰 기록 자동 정리. 필요하면 이 범위로 따로 이야기해요.</>} />
          </List>
        </Card>
        <Text type="supporting" color="secondary">
          데이터: 고객 A 본인 계정의 입찰정보 서비스 투찰 기록 내보내기 + 공공데이터포털 조달청 나라장터 낙찰정보 · 사정률 = 예정가격 ÷ 기초금액
        </Text>
      </VStack>
    </VStack>
  );

  return (
    <Layout
      height="auto"
      content={
        <LayoutContent role="main" isScrollable={false} padding={isMobile ? 4 : 8}>
          <Center axis="horizontal">
            <Section variant="transparent" width="100%" maxWidth={1080} padding={0}>
              {body}
            </Section>
          </Center>
        </LayoutContent>
      }
    />
  );
}
