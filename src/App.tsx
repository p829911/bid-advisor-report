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
import {FINAL} from './final';
import Easy from './Easy';

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
  const [view, setView] = useState<string>('easy');
  const region = REGIONS.find(r => r.id === rid)!;

  const body = (
    <VStack gap={8}>
      <VStack gap={3}>
        <Text type="supporting" color="secondary">
          입찰가 어드바이저 · 최종 정리 리포트 · 2026-11-24
        </Text>
        <Heading level={1}>고객 A 투찰 기록 10년: 무엇이 통하고 무엇이 안 통하나</Heading>
        <Text type="body" color="secondary">
          고객 A(해양환경 분야)가 {S.from.slice(0, 7)}부터 {S.to.slice(0, 7)}까지 낸 투찰 {S.total}건과 공공데이터포털의 공개 개찰 결과로, '투찰 가격을 데이터로 정하면 더 이기나'와
          '어디서 더 이길 수 있나'를 검증했어요.
        </Text>
        <Banner
          status="info"
          title="실제 기록을 익명으로 정리한 페이지예요"
          description="업체·발주처·지명은 빼고 '경쟁사 A', '이웃 시·군 A'처럼 바꿨어요. 1순위는 개찰 1등이라 적격심사 결과에 따라 최종 낙찰과 다를 수 있어요. 낙찰을 보장하는 방법은 없어요."
        />
      </VStack>

      <Card>
        <VStack gap={3}>
          <Heading level={3}>최종 결론</Heading>
          <List density="compact" listStyle="decimal">
            <ListItem
              label={
                <>
                  <B>투찰 가격 추천은 하지 않기로 했어요.</B> 네 가지 방식으로 시험했지만 지금 시장에서 고객 A의 실제 선택보다 1순위를 늘린 방법이 없었어요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  <B>관내 입찰</B>({local.biddersMedian}곳 경쟁)에서 고객 A는 이미 1순위 비율이 가장 높아요({pct(HABIT.actual, HABIT.n)}, 똑같이 나누면 약 {HABIT.fairShare}%). 2024년부터는 모두가 실제 사정률
                  바로 위에 붙어 쓰는 '운 나누기' 판이에요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  <B>지역입찰</B>(보통 {wide.biddersMedian}곳)은 이길 수 있는 폭이 {wide.gapMedian}%p라 사실상 추첨이에요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  <B>'놓친 공고'도 생각보다 작아요.</B> 참여 2~6곳인 비슷한 공고 중 고객 A가 안 들어간 {FINAL.missN}건을 찾았지만, {FINAL.suspectN}건은 다른 시·군 업체만 들어올 수 있는 공고로 보여요. 실제로
                  들어갈 수 있었던 건 약 {FINAL.okN}건(관내 {FINAL.okLocal}건)이고, 들어갔다면 1순위는 약 {FINAL.okEv}건 더였어요(같은 기간 실제 1순위 {FINAL.own25Win}건).
                </>
              }
            />
          </List>
        </VStack>
      </Card>

      <Divider />

      <VStack gap={4}>
        <SectionHead n="1" title="시장별 현황" desc="우리 군 업체만 들어오는 관내 입찰과, 도 안 업체 누구나 들어오는 지역입찰은 경쟁 구조가 완전히 달라요. 위에서 시장을 고르면 숫자·차트가 바뀌어요." />
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
        <SectionHead n="2" title="가격 방식 검증: 모두 안 통했어요" desc="관내 입찰 2024년 이후 기준. 공고마다 그 이전 기록만 보고 정한 뒤 실제 결과에 대입했어요." />
        <Grid columns={{minWidth: 230, max: 2, repeat: 'fit'}} gap={4}>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="error" label="안 통함" />
                <Heading level={4}>① 빈 구간 찾기</Heading>
              </HStack>
              <Text type="body">
                과거에 '그 값이었으면 1순위였을 횟수'가 가장 많은 값. 2023년까지는 크게 앞섰지만 2024년부터 {HABIT.best}건(실제 {HABIT.actual}건).
              </Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="error" label="안 통함" />
                <Heading level={4}>② 업체별 습관 모델</Heading>
              </HStack>
              <Text type="body">
                경쟁 업체마다 최근 쓴 값·참여 빈도로 1순위 확률이 가장 높은 값. {HABIT.habit}건(실제 {HABIT.actual}건). 예측은 맞았지만(예상 {HABIT.predicted}% vs 실제 {HABIT.realized}%) 이길 자리가 없었어요.
              </Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="error" label="안 통함" />
                <Heading level={4}>③ 추첨 번호 고르기</Heading>
              </HStack>
              <Text type="body">
                15개 예비가격의 번호와 가격 사이 관계 없음(순위상관 {FINAL.picksCorr}, {FINAL.picksN}건). 어떤 번호를 골라도 예정가격 방향을 바꿀 수 없어요.
              </Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="warning" label="불가능" />
                <Heading level={4}>④ 경쟁 업체 값 예측</Heading>
              </HStack>
              <Text type="body">
                경쟁사 값을 미리 정확히 안다면 {FINAL.boundN}건 중 약 {FINAL.boundExp}건까지 가능(실제 {FINAL.actual}건). 하지만 경쟁사 값의 흔들림은 직전 값·승패·사정률·금액 어느 것과도 상관이{' '}
                {FINAL.predictMaxCorr} 이하라 예측이 안 돼요. 마감 전에 남의 가격을 아는 건 담합이라 불법이에요.
              </Text>
            </VStack>
          </Card>
        </Grid>
        <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
          <ChartCard title="2024년 이후 관내 업체별 1순위 비율" desc={`같은 공고 안에서 계산. 보통 ${HABIT.bidders}곳이 들어와 똑같이 나누면 약 ${HABIT.fairShare}%(점선).`}>
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
          <ChartCard title="연도별 1순위 건수(관내)" desc="2023년까지는 데이터 방식이 크게 앞섰지만, 경쟁 업체들이 값을 바꾼 2024년부터는 고객 A 실제와 비슷하거나 낮아요.">
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
      </VStack>

      <VStack gap={4}>
        <SectionHead n="3" title="공고 선택: 놓친 공고는 거의 없었어요" desc="가격으로는 못 넘으니, 경쟁이 적은 공고에 더 들어갈 여지가 있는지 봤어요." />
        <Grid columns={{minWidth: 170, max: 4, repeat: 'fit'}} gap={4}>
          <Metric label="놓친 경쟁 적은 공고(1차)" value={`${FINAL.missN}건`} hint={`${FINAL.from} ~ ${FINAL.to} · 참여 2~6곳 · 같은 품목`} />
          <Metric label="다른 시·군 전용으로 보임" value={`${FINAL.suspectN}건`} hint="관내 업체가 한 곳도 안 들어옴" />
          <Metric label="들어갈 수 있었던 공고" value={`약 ${FINAL.okN}건`} hint={`관내 ${FINAL.okLocal}건 포함`} />
          <Metric label="들어갔다면 1순위(추정)" value={`약 ${FINAL.okEv}건`} hint={`같은 기간 실제 1순위 ${FINAL.own25Win}건`} />
        </Grid>
        <Card>
          <VStack gap={2}>
            <Heading level={4}>어떻게 걸렀나</Heading>
            <List density="compact" listStyle="disc">
              <ListItem label={<>고객 A가 들어간 도 단위 지역입찰에는 {Math.round((FINAL.wideWith / FINAL.wideHave) * 100)}%({FINAL.wideHave}건 중 {FINAL.wideWith}건)에 다른 관내 업체도 같이 들어왔어요.</>} />
              <ListItem label={<>그런데 놓친 공고 {FINAL.suspectN}건에는 관내 업체({FINAL.wandoFirms}곳)가 한 곳도 없었어요. 그 시·군 업체만 들어올 수 있게 제한된 공고였을 가능성이 높아요.</>} />
              <ListItem label={<>남은 {FINAL.okN}건 중 {FINAL.okLocal}건은 관내 공고예요. 섬 지역 공고가 반복해서 빠져 있어, 거리·수익성 때문에 일부러 안 들어간 것인지 확인이 필요해요.</>} />
            </List>
          </VStack>
        </Card>
        <Banner
          status="info"
          title="참가 자격은 아직 추정이에요"
          description="참가 가능 지역·면허를 공식 데이터(입찰공고정보 API)로 확인하면 숫자가 조금 바뀔 수 있어요. 다만 방향은 같아요: 놓친 공고로 늘릴 수 있는 1순위는 1년에 1~2건 수준이에요."
        />
      </VStack>

      <VStack gap={4}>
        <SectionHead n="4" title="어떻게 계산했나" />
        <Card>
          <List density="compact" listStyle="disc">
            <ListItem label={<>투찰금액을 '기초금액 × 하한율의 몇 %로 썼나'로 바꾸면, 1순위 = 실제 사정률 이상인 값 중 가장 작은 값을 쓴 업체예요.</>} />
            <ListItem label={<>그래서 다른 값을 썼을 때 1순위였는지는 '실제 사정률 이상, 바로 위 업체 값 미만'인지로 판정할 수 있어요. 바로 위 업체 값은 기록의 1순위 값이나 공개 개찰 결과(공공데이터포털)에서 가져왔어요.</>} />
            <ListItem label={<>{`이 판정을 공개 개찰 결과 전체 투찰 목록과 맞춰 보니 ${S.checked} 일치했어요.`}</>} />
            <ListItem label={<>놓친 공고: 해양쓰레기·폐합성수지·부표·스티로폼·영농폐기물 등 같은 품목, 수의시담·건설폐기물·설계·감리 제외, 고객 A와 3번 이상 같이 들어온 업체({FINAL.peers}곳) 중 2곳 이상이 참여한 도 안 공고.</>} />
            <ListItem label={<>가정: 고객 A가 값을 바꿔도 다른 업체 투찰은 그대로, 고객 A가 고른 추첨 번호의 영향은 무시, 적격심사 점수는 무시.</>} />
          </List>
        </Card>
      </VStack>

      <VStack gap={4}>
        <SectionHead n="5" title="다음 단계" />
        <Card>
          <List density="compact" listStyle="decimal">
            <ListItem label={<>참가 자격(지역·면허)을 공식 데이터로 한 번 더 확인해 숫자를 확정해요.</>} />
            <ListItem label={<>고객 A에게 관내 섬 지역 공고를 왜 안 들어갔는지(거리·수익성·처리 능력 등) 확인해요.</>} />
            <ListItem label={<>놓친 공고로 늘릴 수 있는 몫이 작아서, 공고 알림 같은 도구도 '1순위를 늘려주는 도구'로는 약해요. 만든다면 시간 절약(공고 찾기·마감 알림·기록 정리)이 목적이에요. 가격은 추천하지 않아요.</>} />
            <ListItem label={<>관내 경쟁 업체들이 다시 넓게 흩어지는지(2023년 이전처럼)는 공개 개찰 결과로 계속 지켜봐요.</>} />
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
              <VStack gap={6}>
                <SegmentedControl label="보기" value={view} onChange={v => setView(v as string)} layout={isMobile ? 'fill' : undefined}>
                  <SegmentedControlItem value="easy" label="쉽게 보기" />
                  <SegmentedControlItem value="detail" label="상세 분석" />
                </SegmentedControl>
                {view === 'easy' ? (
                  <VStack gap={8}>
                    <VStack gap={3}>
                      <Text type="supporting" color="secondary">
                        입찰가 어드바이저 · 결과 요약 · 2026-11-24
                      </Text>
                      <Heading level={1}>투찰 기록 분석 결과, 쉽게 정리했어요</Heading>
                      <Banner
                        status="info"
                        title="실제 기록을 익명으로 정리한 페이지예요"
                        description="업체·발주처·지명은 빼고 정리했어요. 1순위는 개찰 1등이라 적격심사 결과에 따라 최종 낙찰과 다를 수 있어요. 낙찰을 보장하는 방법은 없어요. 근거 숫자와 차트는 '상세 분석' 탭에 있어요."
                      />
                    </VStack>
                    <Easy />
                  </VStack>
                ) : (
                  body
                )}
              </VStack>
            </Section>
          </Center>
        </LayoutContent>
      }
    />
  );
}
