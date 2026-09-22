(()=>{
'use strict';
CS.cases=[
 {
  id:'slow-site',revision:1,kicker:'사례 1 · 성능과 관측',title:'웹사이트 일부 요청이 유독 느려요',
  symptom:'요청 10개 중 9개는 10ms인데 하나만 1000ms가 걸렸어요. 평균만 보면 느린 한 요청의 경험이 흐려질 수 있어, 구간 기록과 실행 계획을 함께 확인해야 해요.',
  prerequisites:['지연과 처리량','인덱스와 실행 계획','평균과 백분위수'],lessons:['ch05-l02','ch13-l02','ch24-l02'],labs:['observability-recovery','query-plan'],
  observations:['학습용 표본: 10ms 요청 9개와 1000ms 요청 1개','느린 요청의 학습용 구간: 네트워크 60ms + 서버 60ms + DB 880ms','같은 SELECT 결과 1행을 인덱스 전후로 비교'],
  hypotheses:[
   {id:'network',title:'모든 요청의 네트워크가 느리다',verdict:'conflict',feedback:'9개 요청이 10ms라는 관측과 충돌해요. 느린 요청 하나의 네트워크 구간도 60ms라서 전체 1000ms를 설명하지 못해요.'},
   {id:'db-path',title:'특정 DB 접근 경로가 느리다',verdict:'supported',feedback:'제공된 구간 기록은 이 가설을 우선 조사할 근거예요. 실행 계획과 실제 측정을 더 확인해야 원인을 확정할 수 있어요.'},
   {id:'average-ok',title:'평균만 괜찮으면 이상이 없다',verdict:'conflict',feedback:'최근접 순위법 p95가 1000ms라서 일부 사용자의 긴 지연을 평균만으로 숨길 수 있어요.'}
  ],
  experimentNotes:{'observability-recovery':'모두 10ms와 느린 요청 1개 표본의 평균·p95를 비교해요.','query-plan':'동일 데이터와 WHERE 조건에서 SCAN과 SEARCH 계획을 비교하고 결과 행도 같게 유지해요.'},
  improvement:['인덱스와 WHERE 조건을 점검한 뒤 같은 입력으로 다시 측정한다','느린 요청의 DB 실제 시간과 읽은 행·페이지를 운영 계측으로 확인한다','평균과 p95를 함께 보고 요청 경로별로 나누어 관찰한다'],
  cautions:['구간 시간은 이 사례를 위해 만든 학습용 자료예요.','SCAN이 SEARCH로 바뀌어도 실제 사이트가 몇 배 빨라졌다고 단정하지 않아요.','실행 계획은 접근 방법이고 실제 실행 시간은 별도로 측정해야 해요.'],
  diagrams:[
   {type:'latency',title:'요청별 지연 분포',caption:'같은 10개 중 한 요청만 긴 꼬리를 만들어요.'},
   {type:'segments',title:'느린 한 요청의 처리 구간',caption:'DB 880ms는 조사할 근거이며 전체 서비스 원인의 확정은 아니에요.'},
   {type:'plan',title:'계획과 측정의 관계',caption:'같은 결과인지 확인하고 접근 계획과 실제 시간을 따로 비교해요.'}
  ]
 },
 {
  id:'data-recovery',revision:1,kicker:'사례 2 · 저장과 복구',title:'저장했다고 생각한 데이터가 사라졌어요',
  symptom:'화면에서 데이터가 안 보인다는 증상만으로 원인을 하나로 정할 수 없어요. 작업 메모리 소실, 미완료 거래, 오래된 복제본 읽기를 서로 독립된 실험으로 구분해요.',
  prerequisites:['메모리와 저장장치','WAL과 커밋','복제 지연','RPO와 RTO'],lessons:['ch01-l01','ch14-l02','ch20-l01','ch24-l02'],labs:['memory-save','wal-recovery','replica-consistency','observability-recovery'],
  observations:['저장하지 않은 수정은 전원을 다시 켜면 사라짐','COMMIT 로그 내구화 전 장애는 100, 내구화 후 장애는 120으로 복구','비동기 응답 직후 B는 old, 복제 전달 뒤 v1을 읽음','12:00 복구 지점·12:10 장애·12:25 복구는 손실 가능 구간 10분·복구 15분'],
  hypotheses:[
   {id:'unsaved',title:'작업 메모리의 수정 내용을 저장하지 않았다',verdict:'unconfirmed',feedback:'가능한 원인이고 memory-save 실험으로 구분할 수 있어요. 실제 장애 자료에는 저장 버튼과 저장 완료 기록이 더 필요해요.'},
   {id:'uncommitted',title:'거래의 COMMIT이 내구화되기 전에 장애가 났다',verdict:'unconfirmed',feedback:'가능한 원인이며 WAL의 내구 로그 경계를 확인해야 해요. 응답 손실만으로 미커밋을 단정할 수는 없어요.'},
   {id:'stale-replica',title:'아직 갱신되지 않은 복제본을 읽었다',verdict:'unconfirmed',feedback:'가능한 원인이며 리더와 복제본 버전, 복제 전달 상태를 비교해야 해요. 데이터 삭제와 오래된 읽기는 다른 현상이에요.'}
  ],
  experimentNotes:{'memory-save':'저장 전후에 같은 수정 내용이 전원 복원 뒤 남는지 비교해요.','wal-recovery':'COMMIT 로그 내구화 전후 장애의 복구값을 비교해요.','replica-consistency':'쓰기 응답 직후와 전달 뒤 B의 읽기 버전을 비교해요.','observability-recovery':'손실 가능 구간과 서비스 복구 시간을 RPO·RTO와 따로 비교해요.'},
  improvement:['저장 완료와 COMMIT 내구화 시점을 기록한다','읽은 복제본과 버전을 응답·로그에 남긴다','복구 지점을 검증하고 RPO·RTO에 맞는 백업·복원 훈련을 한다'],
  cautions:['네 실습은 같은 시스템의 동기화된 데이터가 아니라 서로 다른 원인 후보예요.','응답 실패만으로 데이터가 저장되지 않았다고 단정하지 않아요.','10분은 손실 가능한 시간 범위이며 삭제된 레코드 수가 아니에요.'],
  diagrams:[
   {type:'storage',title:'세 위치를 먼저 구분해요',caption:'작업 메모리·확정 저장·복제본은 수명과 최신성이 달라요.'},
   {type:'wal',title:'WAL의 장애 경계',caption:'UPDATE만 내구화된 상태와 COMMIT까지 내구화된 상태의 복구 결과가 달라요.'},
   {type:'recovery',title:'RPO와 RTO 시간선',caption:'데이터 시점의 간격과 서비스 복구 시간을 서로 다른 목표로 봐요.'}
  ]
 },
 {
  id:'scale-limit',revision:1,kicker:'사례 3 · 확장과 병목',title:'서버를 늘렸는데도 일부 요청이 처리되지 않아요',
  symptom:'요청 120개를 서버 3대가 40개씩 처리할 총 용량이 있어도 핫키가 한 서버에 몰리면 초과가 생겨요. 서버 배치, 큐의 도착·처리율, 한 프로그램의 병렬 상한을 서로 다른 모형으로 구분해요.',
  prerequisites:['처리량과 지연','부하 분포','도착률과 처리율','암달의 법칙'],lessons:['ch19-l02','ch21-l01','ch21-l02'],labs:['scaling-distribution','bounded-queue','amdahl-speedup'],
  observations:['2대×40의 균등 분산은 초과 40개, 3대×40은 초과 0개','3대×40이어도 핫키 분산은 96·12·12로 초과 56개','핫키 분할은 40·40·40으로 돌아와 초과 0개','초당 8개 도착·3개 처리 무제한 큐는 5초 뒤 25개 대기','병렬 90%는 8코어 약 4.71배·16코어 6.40배·상한 10배'],
  hypotheses:[
   {id:'capacity',title:'전체 서버 용량이 부족하다',verdict:'unconfirmed',feedback:'2대에서는 맞지만 3대의 총 용량은 120으로 요청 수와 같아요. 3대에서도 실패한다면 분포를 추가로 봐야 해요.'},
   {id:'skew',title:'일부 서버에 요청이 쏠렸다',verdict:'supported',feedback:'96·12·12 배치는 첫 서버 용량을 56개 넘겨요. 총 용량과 개별 노드 분포를 함께 봐야 해요.'},
   {id:'consumer',title:'소비자 처리율이나 직렬 구간이 한계다',verdict:'unconfirmed',feedback:'큐와 암달 모형에서 가능한 병목이에요. 다만 요청 배치 모형과 단위를 합쳐 하나의 계산처럼 해석하면 안 돼요.'}
  ],
  experimentNotes:{'scaling-distribution':'서버 수나 분산 정책 중 하나만 바꾸어 초과 요청을 비교해요.','bounded-queue':'초당 도착 8·처리 3을 5초간 실행해 대기 증가를 확인해요.','amdahl-speedup':'병렬 90%에서 코어 수를 늘릴 때 직렬 10%가 만드는 상한을 확인해요.'},
  improvement:['핫키를 분할하거나 복제해 요청 분포를 고르게 만든다','큐 길이·거부율·상류 지연을 관찰하고 소비자 처리율을 조정한다','직렬 구간과 데이터 이동 비용을 측정한 뒤 늘릴 자원을 결정한다'],
  cautions:['요청 묶음·초 단위 큐·고정 작업 계산은 단위와 시간 범위가 다른 모형이에요.','서버 수 증가와 CPU 코어 수 증가는 같은 동작이 아니에요.','처리량 증가만으로 모든 요청의 지연 개선을 단정하지 않아요.'],
  diagrams:[
   {type:'servers',title:'서버별 부하와 용량',caption:'총 용량보다 한 노드의 40개 상한을 넘는지 먼저 확인해요.'},
   {type:'queue',title:'생산·대기·소비 흐름',caption:'도착 8/초와 처리 3/초의 차이가 대기열에 남아요.'},
   {type:'amdahl',title:'직렬 구간과 병렬 구간',caption:'코어를 늘려도 직렬 10%는 그대로 남아 이상적 상한을 만들어요.'}
  ]
 }
];
})();
