import type {ReactNode} from 'react';
import {Layout, LayoutContent} from '@astryxdesign/core/Layout';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Grid} from '@astryxdesign/core/Grid';
import {List, ListItem} from '@astryxdesign/core/List';
import {Table} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {Center} from '@astryxdesign/core/Center';
import {Section} from '@astryxdesign/core/Section';
import {Divider} from '@astryxdesign/core/Divider';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {AGENCIES, COMPETITORS, DEVIATION, SAJEONG, SUMMARY as S, YEARS} from './data';

const C = {
  blue: 'var(--color-data-categorical-blue)',
  orange: 'var(--color-data-categorical-orange)',
  purple: 'var(--color-data-categorical-purple)',
  gray: 'var(--color-data-categorical-teal)',
  pink: 'var(--color-data-categorical-pink)',
  grid: 'var(--color-border)',
  tick: 'var(--color-text-secondary)',
};
const tick = {fontSize: 'var(--font-size-sm)', fill: C.tick};
const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;

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

type Agency = (typeof AGENCIES)[number];

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)', true);
  const valid = S.win + S.lose;
  const agencyCols: TableColumn<Agency>[] = [
    {key: 'name', header: '발주처'},
    {key: 'total', header: '투찰', renderCell: a => <Text type="body">{a.total}건</Text>},
    {key: 'win', header: '1순위', renderCell: a => <Text type="body">{a.win}건 ({a.winRate}%)</Text>},
    {
      key: 'under',
      header: '하한 미달',
      renderCell: a => (
        <HStack gap={2} vAlign="center">
          <Text type="body">
            {a.under}건 ({a.underRate}%)
          </Text>
          {a.underRate >= 40 && <Badge variant="warning" label="높음" />}
        </HStack>
      ),
    },
  ];

  const body = (
    <VStack gap={8}>
      {/* 표지 */}
      <VStack gap={3}>
        <Text type="supporting" color="secondary">
          입찰가 어드바이저 · 데이터 리포트 #1 · 2026-11-24
        </Text>
        <Heading level={1}>고객 A 투찰 기록 10년 분석</Heading>
        <Text type="body" color="secondary">
          고객 A(해양환경 분야)가 {S.from.slice(0, 7)}부터 {S.to.slice(0, 7)}까지 실제로 낸 투찰 {S.total}건을 모아 정리했어요.
          모두 용역이고 적격심사(하한율 이상 금액 중 가장 낮은 업체가 1순위) 방식이에요.
        </Text>
        <Banner
          status="info"
          title="실제 기록을 익명으로 정리한 페이지예요"
          description="업체·발주처 이름은 '경쟁사 A', '발주처 B'처럼 바꿨어요. 1순위는 개찰 1등이라 최종 낙찰과 다를 수 있고, 이 페이지는 현재 상태를 보는 것이지 어떤 방법의 효과를 증명하는 자료가 아니에요."
        />
      </VStack>

      <Grid columns={{minWidth: 160, max: 4, repeat: 'fit'}} gap={4}>
        <Metric label="분석한 투찰" value={`${S.total}건`} hint={`${S.from} ~ ${S.to}`} />
        <Metric label="1순위" value={`${S.win}건`} hint={`전체의 ${pct(S.win, S.total)}`} />
        <Metric label="하한 미달로 탈락" value={`${S.under}건`} hint={`전체의 ${pct(S.under, S.total)}`} />
        <Metric label="주력 발주처 비중" value={`${S.mainShare}%`} hint="한 곳에 투찰이 몰려 있음" />
      </Grid>

      {/* 핵심 요약 */}
      <Card>
        <VStack gap={3}>
          <Heading level={3}>한눈에 보기</Heading>
          <List density="compact" listStyle="disc">
            <ListItem
              label={
                <>
                  <B>세 번 중 한 번은 하한 미달로 자동 탈락</B>했어요({pct(S.under, S.total)}). 최근 3년은 37~41%로 더 늘었어요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  실제 사정률보다 낮게 쓴 {S.ownBelowActual}건은 <B>{S.underWhenBelow}건 전부 하한 미달</B>이었어요. 구조상 피할 수 없는 결과예요.
                </>
              }
            />
            <ListItem
              label={
                <>
                  써낸 사정률은 실제보다 <B>두 배 넓게 흩어져</B> 있어요(표준편차 {S.ownSd} vs 실제 {S.actualSd}).
                </>
              }
            />
            <ListItem
              label={
                <>
                  하한을 넘긴 {valid}건만 보면 1순위 비율은 {pct(S.win, valid)}예요. 1순위를 뺏긴 건의 {S.top3Share}%는 <B>같은 세 업체</B>에게 졌어요.
                </>
              }
            />
          </List>
        </VStack>
      </Card>

      <Divider />

      {/* 1. 연도별 */}
      <VStack gap={4}>
        <SectionHead n="1" title="연도별 결과" desc="투찰 건수는 꾸준히 늘었는데, 1순위 비율은 그대로이고 하한 미달 비율이 올라가고 있어요." />
        <ChartCard title="연도별 투찰 결과" desc="막대 = 건수(1순위·탈락·하한 미달), 선 = 하한 미달 비율(오른쪽 축). 2026년은 11월 24일까지.">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={[...YEARS]} margin={{top: 8, right: 8, left: 0, bottom: 4}}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="year" tick={tick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="n" tick={tick} axisLine={false} tickLine={false} width={32} />
              <YAxis yAxisId="r" orientation="right" tick={tick} axisLine={false} tickLine={false} width={40} unit="%" domain={[0, 80]} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: 'var(--font-size-sm)'}} />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="win" stackId="a" fill={C.blue} name="1순위" />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="lose" stackId="a" fill={C.gray} name="탈락(순위 밀림)" />
              <Bar isAnimationActive={false} yAxisId="n" dataKey="under" stackId="a" fill={C.orange} name="하한 미달" radius={[4, 4, 0, 0]} />
              <Line isAnimationActive={false} yAxisId="r" type="monotone" dataKey="underRate" stroke={C.pink} strokeWidth={2} dot name="하한 미달 비율" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </VStack>

      {/* 2. 사정률 */}
      <VStack gap={4}>
        <SectionHead
          n="2"
          title="사정률: 실제 vs 써낸 값"
          desc="사정률은 '예정가격이 기초금액의 몇 %로 정해졌나'예요. 예정가격은 추첨이라 미리 알 수 없고, 업체는 이 값을 예상해서 투찰 금액을 정해요."
        />
        <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
          <ChartCard
            title="사정률 분포"
            desc={`파랑 = 실제로 나온 사정률(평균 ${S.actualMean}%), 주황 = 고객 A가 써낸 사정률(평균 ${S.ownMean}%). 0.25%p 단위, 양 끝은 묶음.`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...SAJEONG]} margin={{top: 4, right: 8, left: 0, bottom: 4}} barGap={0}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="bin" tick={tick} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{fontSize: 'var(--font-size-sm)'}} />
                <Bar isAnimationActive={false} dataKey="actual" fill={C.blue} name="실제" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="own" fill={C.orange} name="써낸 값" radius={[3, 3, 0, 0]} />
                <ReferenceLine x="100.00" stroke={C.tick} strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            title="써낸 값 − 실제 값에 따른 결과"
            desc="0보다 왼쪽(실제보다 낮게 씀)은 전부 하한 미달. 0 바로 오른쪽이 1순위가 나오는 자리이고, 멀어질수록 순위에서 밀려요.">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...DEVIATION]} margin={{top: 20, right: 8, left: 0, bottom: 4}}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="bin" tick={tick} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={tick} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{fontSize: 'var(--font-size-sm)'}} />
                <Bar isAnimationActive={false} dataKey="under" stackId="d" fill={C.orange} name="하한 미달" />
                <Bar isAnimationActive={false} dataKey="lose" stackId="d" fill={C.gray} name="탈락" />
                <Bar isAnimationActive={false} dataKey="win" stackId="d" fill={C.blue} name="1순위" radius={[3, 3, 0, 0]} />
                <ReferenceLine x="+0.00" stroke={C.purple} label={{value: '실제 = 써낸 값', fill: C.purple, fontSize: 12, position: 'top'}} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Card>
          <VStack gap={2}>
            <Heading level={4}>읽는 법</Heading>
            <List density="compact" listStyle="disc">
              <ListItem label={<>하한 미달 건은 평균 {Math.abs(S.devUnder)}%p 낮게, 1순위 건은 평균 {S.devWin}%p 높게, 순위에서 밀린 건은 평균 {S.devLose}%p 높게 썼어요.</>} />
              <ListItem label={<>즉 1순위는 '실제보다 조금만 높게' 쓴 자리에서 나와요. 너무 낮으면 탈락, 너무 높으면 다른 업체에 밀려요.</>} />
              <ListItem
                label={
                  <>
                    실제 사정률은 늘 99~100.5% 근처라 좁은데(표준편차 {S.actualSd}), 써낸 값은 {S.ownSd}만큼 퍼져 있어요(최근 3년 {S.recentOwnSd}). 이 폭을 데이터로 좁히는 게
                    첫 번째 개선 지점이에요.
                  </>
                }
              />
            </List>
          </VStack>
        </Card>
      </VStack>

      {/* 3. 경쟁사 */}
      <VStack gap={4}>
        <SectionHead n="3" title="1순위를 가져간 업체" desc="고객 A가 1순위가 아니었던 건에서 1순위를 한 업체(사업자번호 기준). 소수 업체가 반복해서 나와요." />
        <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={4}>
          <ChartCard title="고객 A를 이긴 횟수 상위 8곳" desc={`나머지 업체들 합계 ${S.othersBeat}건. 상위 3곳이 ${S.top3Share}%.`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...COMPETITORS]} layout="vertical" margin={{top: 4, right: 16, left: 8, bottom: 4}}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={72} />
                <Tooltip />
                <Bar isAnimationActive={false} dataKey="beat" fill={C.blue} name="이긴 횟수" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card>
            <VStack gap={3}>
              <Heading level={4}>무엇을 뜻하나</Heading>
              <List density="compact" listStyle="disc">
                <ListItem label={<>경쟁사 A·B·C가 1순위를 할 때 쓴 사정률 평균은 {COMPETITORS.slice(0, 3).map(c => `${c.avgTop}%`).join(' · ')}예요.</>} />
                <ListItem label={<>상대가 몇 곳으로 고정돼 있어서, 이 업체들이 주로 쓰는 구간을 알면 '겹치지 않는 자리'를 고를 수 있어요.</>} />
                <ListItem label={<>이 업체들의 투찰 습관은 공개 개찰 결과(공공데이터포털)로 따로 계산할 수 있어요. 다음 리포트에서 다룰게요.</>} />
              </List>
            </VStack>
          </Card>
        </Grid>
      </VStack>

      {/* 4. 발주처 */}
      <VStack gap={4}>
        <SectionHead n="4" title="발주처별 성적" desc="투찰이 많은 발주처 8곳. 주력 발주처 밖에서는 1순위 비율이 낮고 하한 미달 비율이 높아요." />
        {isMobile ? (
          <List>
            {AGENCIES.map(a => (
              <ListItem
                key={a.id}
                label={a.name}
                description={
                  <Text type="supporting" color="secondary">
                    {a.total}건 · 1순위 {a.win}({a.winRate}%) · 하한 미달 {a.under}({a.underRate}%)
                  </Text>
                }
              />
            ))}
          </List>
        ) : (
          <Card>
            <Table<Agency> data={[...AGENCIES]} columns={agencyCols} idKey="id" density="compact" verticalAlign="middle" />
          </Card>
        )}
      </VStack>

      {/* 5. 다음 */}
      <VStack gap={4}>
        <SectionHead n="5" title="다음 단계" />
        <Card>
          <List density="compact" listStyle="decimal">
            <ListItem label="이 기록을 공개 개찰 결과와 합쳐, 공고마다 '그때 데이터로 정했다면 몇 등이었을지'를 다시 계산(백테스트)해요." />
            <ListItem label="비교 기준은 무작위가 아니라 '과거 평균 사정률로 썼을 때'예요. 그보다 1순위가 확실히 늘 때만 효과가 있다고 봐요." />
            <ListItem label="효과가 확인되지 않으면 개발을 멈추는 게 맞아요. 결과는 다음 리포트로 공유할게요." />
          </List>
        </Card>
        <Text type="supporting" color="secondary">
          데이터: 고객 A의 입찰정보 서비스 투찰 기록(본인 계정 내보내기) · 사정률 = 예정가격 ÷ 기초금액 · 하한 미달 = 낙찰하한가보다 낮은 금액이라 자동 탈락
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
            <Section variant="transparent" width="100%" maxWidth={1040} padding={0}>
              {body}
            </Section>
          </Center>
        </LayoutContent>
      }
    />
  );
}
