(()=>{
 'use strict';
 CS.examPresets=[
  {id:'lesson-01',label:'단원별 시험',title:'선택한 단원 시험',description:'한 소단원의 핵심 개념과 동작을 6문항으로 확인해요.',minutes:10,count:6,lessonIds:[] ,scope:'lesson'},
  {id:'stage-1',label:'1강 시험',title:'1강 — 컴퓨터 기초',description:'CPU·운영체제·자료구조·네트워크의 기본 흐름을 확인해요.',minutes:30,count:20,lessonIds:CATALOG.lessons.filter(l=>l.chapter<=6).map(l=>l.id)},
  {id:'stage-2',label:'2강 시험',title:'2강 — 알고리즘과 시스템',description:'알고리즘·운영체제·동시성·데이터베이스를 연결해요.',minutes:30,count:20,lessonIds:CATALOG.lessons.filter(l=>l.chapter>=7&&l.chapter<=12).map(l=>l.id)},
  {id:'stage-3',label:'3강 시험',title:'3강 — 심화 시스템',description:'인터넷·보안·컴파일러·병렬·분산 시스템을 적용해요.',minutes:30,count:20,lessonIds:CATALOG.lessons.filter(l=>l.chapter>=13&&l.chapter<=20).map(l=>l.id)},
  {id:'appendix',label:'부록 시험',title:'부록 — 설계와 운영',description:'확장성·아키텍처·테스트·배포·복구를 점검해요.',minutes:25,count:15,lessonIds:CATALOG.lessons.filter(l=>l.chapter>=21).map(l=>l.id)},
  {id:'all',label:'전체 시험',title:'전체 과정 시험',description:'24개 대단원의 연결을 40문항으로 확인해요.',minutes:60,count:40,lessonIds:CATALOG.lessons.map(l=>l.id)}
 ];
})();
