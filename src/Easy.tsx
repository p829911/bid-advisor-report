import type {ReactNode} from 'react';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {Heading, Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Badge} from '@astryxdesign/core/Badge';
import {Banner} from '@astryxdesign/core/Banner';
import {Grid} from '@astryxdesign/core/Grid';
import {List, ListItem} from '@astryxdesign/core/List';
import {Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis} from 'recharts';
import {HABIT} from './habit';
import {FINAL} from './final';
import {REGIONS} from './data';

const tick = {fontSize: 'var(--font-size-sm)', fill: 'var(--color-text-secondary)'};
const wide = REGIONS.find(r => r.id === 'wide')!;

function B({children}: {children: ReactNode}) {
  return (
    <Text as="span" type="body" weight="semibold">
      {children}
    </Text>
  );
}

function Step({n, title, children}: {n: string; title: string; children: ReactNode}) {
  return (
    <Card>
      <VStack gap={2}>
        <HStack gap={2} vAlign="center">
          <Badge variant="info" label={n} />
          <Heading level={4}>{title}</Heading>
        </HStack>
        <Text type="body">{children}</Text>
      </VStack>
    </Card>
  );
}

export default function Easy() {
  const perfect = Math.round((FINAL.boundExp / FINAL.boundN) * 1000) / 10;
  const bars = [
    {name: '똑같이 나눌 때', v: HABIT.fairShare, c: 'var(--color-data-categorical-teal)'},
    {name: '데이터 모델', v: HABIT.realized, c: 'var(--color-data-categorical-purple)'},
    {name: '대표님 실제', v: Math.round((HABIT.actual / HABIT.n) * 1000) / 10, c: 'var(--color-data-categorical-orange)'},
    {name: '남의 가격을 미리 알 때', v: perfect, c: 'var(--color-data-categorical-blue)'},
  ];
  return (
    <VStack gap={8}>
      <Card>
        <VStack gap={3}>
          <Text type="supporting" color="secondary">
            한 줄 결론
          </Text>
          <Heading level={2}>지금 투찰 방식이 이미 거의 최선이에요.</Heading>
          <Text type="body">
            10년 치 투찰 기록과 공개 개찰 결과로 여러 방법을 시험해 봤어요. 그런데 대표님이 지금 쓰시는 값보다 1순위를 더 많이 받게 해주는 방법은 찾지 못했어요. 대표님은 관내에서 이미 1순위를 가장 많이
            가져가고 계세요. 그래서 <B>투찰 가격을 추천해 드리는 프로그램은 만들지 않기로</B> 했어요.
          </Text>
        </VStack>
      </Card>

      <VStack gap={4}>
        <Heading level={2}>숫자로 보면</Heading>
        <Text type="body" color="secondary">
          2024년 이후 관내 입찰 {HABIT.n}건에서 1순위를 받은 비율이에요.
        </Text>
        <Card>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bars} layout="vertical" margin={{top: 4, right: 48, left: 8, bottom: 4}}>
              <CartesianGrid horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false} unit="%" domain={[0, 60]} />
              <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={156} />
              <Bar isAnimationActive={false} dataKey="v" radius={[0, 4, 4, 0]}>
                {bars.map(b => (
                  <Cell key={b.name} fill={b.c} />
                ))}
                <LabelList dataKey="v" position="right" formatter={(v: unknown) => `${v}%`} style={tick} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <List density="compact" listStyle="disc">
          <ListItem label={<>한 공고에 보통 {HABIT.bidders}곳이 들어와요. 운만으로 똑같이 나누면 한 업체 몫은 약 {HABIT.fairShare}%예요.</>} />
          <ListItem label={<>대표님은 {bars[2].v}%예요. 관내 업체 중 가장 높아요.</>} />
          <ListItem label={<>데이터로 업체별 습관까지 계산한 모델은 {HABIT.realized}%였어요. 대표님보다 낮아요.</>} />
          <ListItem label={<>더 이기려면 경쟁 업체가 이번에 얼마를 쓸지 미리 알아야 해요(그러면 약 {perfect}%). 하지만 마감 전에 남의 가격을 아는 건 담합이라 불법이에요.</>} />
        </List>
      </VStack>

      <VStack gap={4}>
        <Heading level={2}>왜 데이터로도 더 못 이기나요?</Heading>
        <Grid columns={{minWidth: 300, max: 2, repeat: 'fit'}} gap={4}>
          <Step n="1" title="이기는 자리가 아주 좁아요">
            1순위가 되려면 내 금액이 '낙찰하한가 바로 위, 그리고 다른 업체보다 아래'라는 좁은 틈에 들어가야 해요. 눈을 가리고 보이지 않는 선 바로 위에 서는 게임과 비슷해요.
          </Step>
          <Step n="2" title="그 선(예정가격)은 순전히 추첨이에요">
            예비가격 15개 중 4개를 뽑아 평균을 내서 정해져요. 매번 ±0.7%p쯤 흔들려요. 번호와 가격 사이에는 아무 관계가 없어서, 어떤 번호를 골라도 미리 맞힐 수 없어요.
          </Step>
          <Step n="3" title="경쟁 업체 값도 사실상 주사위예요">
            경쟁 업체마다 평소 쓰는 구간은 있어요. 하지만 매번 ±1%p 가까이 흔들려요. 직전 결과나 금액 크기로 예측해 봐도 맞지 않았어요. 알 수 있는 건 '대략 이 근처'까지예요.
          </Step>
          <Step n="4" title="'대략'만 알면 나눠 먹기가 돼요">
            모두가 비슷한 근처에 쓰면 아무리 계산을 잘해도 참가자끼리 비슷하게 나눠 갖게 돼요. 대표님은 이미 그 안에서 가장 많이 가져가고 계세요.
          </Step>
          <Step n="5" title="예전에 보이던 빈자리는 사라졌어요">
            2021~2023년에는 경쟁 업체들이 높게 쓰는 습관이 있어서 그 아래에 빈자리가 있었어요(그때였다면 데이터 방식이 2배 넘게 이겼을 거예요). 2024년부터 다들 바짝 붙어 쓰면서 그 자리가 없어졌어요.
          </Step>
          <Step n="6" title="지역입찰은 그냥 추첨이에요">
            도 단위 지역입찰은 보통 {wide.biddersMedian}곳이 아주 촘촘히 붙어 있어요. 어디에 쓰든 확률은 대략 {Math.round(100 / (wide.biddersMedian ?? 16))}% 안팎이에요. 전략이 끼어들 틈이 없어요.
          </Step>
        </Grid>
        <Banner
          status="info"
          title="운의 몫이 얼마나 큰가요?"
          description={`1순위 확률이 30%쯤일 때 1년 60건을 들어가면, 운만으로도 1순위가 해마다 ±4건쯤 오르내려요. 그래서 '1년에 2~3건 더'처럼 작은 개선은 몇 년 데이터로도 운과 구별이 안 돼요. '효과가 있다'고 말씀드릴 근거를 만들 수 없는 구조예요.`}
        />
      </VStack>

      <VStack gap={4}>
        <Heading level={2}>그럼 데이터 분석은 쓸모없나요?</Heading>
        <Grid columns={{minWidth: 300, max: 2, repeat: 'fit'}} gap={4}>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="error" label="의미 없음" />
                <Heading level={4}>1순위 확률 올리기</Heading>
              </HStack>
              <Text type="body">"이 값에 쓰면 더 잘 된다"는 추천은 대표님 시장에서는 근거가 없어요. 이걸 효과라고 말하는 서비스가 있다면 조심하시는 게 좋아요.</Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="success" label="의미 있음" />
                <Heading level={4}>실수 막기 · 시간 아끼기</Heading>
              </HStack>
              <Text type="body">하한율·금액 계산 실수 확인, 공고 찾기·마감 알림, 개찰 결과 자동 정리. 1순위를 늘려주진 않지만 일을 줄여줘요.</Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="warning" label="가끔 의미 있음" />
                <Heading level={4}>판이 바뀌는지 지켜보기</Heading>
              </HStack>
              <Text type="body">경쟁 업체들이 다시 한쪽으로 몰리면(2023년 이전처럼) 그때는 빈자리가 생겨요. 평소엔 조용히 보다가 그런 변화가 생기면 알려드리는 정도가 맞아요.</Text>
            </VStack>
          </Card>
          <Card>
            <VStack gap={2}>
              <HStack gap={2} vAlign="center">
                <Badge variant="neutral" label="작음" />
                <Heading level={4}>놓친 공고 찾기</Heading>
              </HStack>
              <Text type="body">
                경쟁이 적었는데 안 들어가신 공고를 찾아봤어요. 대부분은 다른 시·군 업체만 들어올 수 있는 공고였어요. 들어갈 수 있었던 건 2년간 약 {FINAL.okN}건이었고, 그중 {FINAL.okLocal}건이 관내 섬 지역 공고였어요.
              </Text>
            </VStack>
          </Card>
        </Grid>
      </VStack>

      <Card>
        <VStack gap={3}>
          <Heading level={3}>정리하면</Heading>
          <List density="compact" listStyle="decimal">
            <ListItem label={<>투찰 가격은 지금처럼 정하시면 돼요. 데이터로 바꿀 이유를 찾지 못했어요.</>} />
            <ListItem label={<>하한 미달은 '공격적으로 쓴 대가'라 완전히 없앨 수는 없어요. 실제보다 낮게 쓴 건은 구조상 전부 하한 미달이 돼요.</>} />
            <ListItem label={<>관내 섬 지역 공고 중 안 들어가신 것들이 있었어요. 거리나 수익성 때문이었는지 한번 알려주세요.</>} />
          </List>
        </VStack>
      </Card>
    </VStack>
  );
}
