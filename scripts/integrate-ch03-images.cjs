const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'..','content','ch03.js');
let source=fs.readFileSync(file,'utf8');
const figures={
 'DB_TABLE_FIGURE':`<figure class="teaching-figure compact"><img src="{{asset:database-table-records.jpg}}" width="1280" height="853" loading="lazy" alt="세 장의 책 기록 카드가 행처럼 놓여 있고 각 카드에는 식별 도형, 책 표지, 빈 정보 칸이 열처럼 나뉘어 있어요. 앞의 두 카드는 같은 책 표지지만 식별 도형의 색이 달라요."><figcaption><strong>카드 세 장을 표처럼 읽어 보세요</strong><ul class="picture-key"><li><b>가로 카드 한 장</b>책 한 종류를 나타내는 행이에요.</li><li><b>세로로 같은 위치의 칸</b>같은 속성을 나타내는 열이에요.</li><li><b>서로 다른 원형 표식</b>같은 제목도 구별하는 기본키를 떠올려요.</li></ul></figcaption></figure>`,
 'DB_MODELS_FIGURE':`<figure class="teaching-figure compact"><img src="{{asset:database-models.jpg}}" width="1280" height="853" loading="lazy" alt="한 탁자에 격자로 나뉜 카드함, 문서 폴더함, 모양표가 달린 열쇠함, 점과 선으로 연결한 보드가 나란히 있어요."><figcaption><strong>같은 자료를 다르게 정리하는 네 관점</strong><ul class="picture-key"><li><b>격자 카드함</b>행과 열로 보는 관계형 모델</li><li><b>문서 폴더함</b>관련 필드를 묶는 문서형 모델</li><li><b>열쇠함</b>키로 값을 찾는 키–값 모델</li><li><b>연결 보드</b>대상 사이 관계를 따라가는 그래프 모델</li></ul></figcaption></figure>`,
 'DBMS_CONTROL_FIGURE':`<figure class="teaching-figure compact"><img src="{{asset:dbms-control.jpg}}" width="1280" height="853" loading="lazy" alt="사서의 관리 책상에 조회용 돋보기, 권한을 나타내는 자물쇠와 열쇠, 규칙 확인 도장, 백업 자료 상자가 놓여 있어요."><figcaption><strong>DBMS가 돕는 네 가지 관리</strong><ul class="picture-key"><li><b>돋보기</b>조건에 맞는 데이터를 조회해요.</li><li><b>자물쇠와 열쇠</b>사용자별 접근 권한을 검사해요.</li><li><b>확인 도장</b>정한 제약을 지키는지 검사해요.</li><li><b>보관 상자</b>백업과 복구를 준비해요.</li></ul></figcaption></figure>`,
 'TRANSACTION_FIGURE':`<figure class="teaching-figure compact"><img src="{{asset:transaction-all-or-nothing.jpg}}" width="1280" height="853" loading="lazy" alt="사서가 파란 수량 토큰과 흰 대출 카드를 한 투명 쟁반에 함께 담고 있어요. 왼쪽의 기울어진 통로에도 두 조각이 함께 있어요."><figcaption><strong>두 변경은 한 묶음으로 움직여요</strong><ul class="picture-key"><li><b>파란 토큰</b>남은 수량의 변경</li><li><b>흰 카드</b>대출 기록의 추가</li><li><b>오른쪽 쟁반</b>둘을 함께 확정하는 커밋</li><li><b>왼쪽 되돌림 통로</b>오류가 나면 둘 다 시작 상태로 돌리는 롤백</li></ul></figcaption></figure>`,
 'SQL_QUERY_FIGURE':`<figure class="teaching-figure compact dark-asset"><img src="{{asset:sql-query.jpg}}" width="1280" height="853" loading="lazy" alt="왼쪽의 책 카드 세 장이 투명한 선별 장치를 지나며 파란 카드 두 장은 오른쪽 결과 줄에 놓이고 갈색 카드 한 장은 아래 제외 칸에 놓여 있어요."><figcaption><strong>질의는 원본에서 조건에 맞는 결과를 만들어요</strong><ul class="picture-key"><li><b>왼쪽 카드 세 장</b>조회 전 원본 행</li><li><b>가운데 선별 장치</b>WHERE 조건과 정렬을 적용하는 DBMS의 처리를 비유</li><li><b>오른쪽 파란 카드 두 장</b>조건을 만족한 결과 행</li><li><b>아래 갈색 카드</b>결과에서 제외됐지만 원본에서 삭제된 것은 아님</li></ul></figcaption></figure>`
};
for(const [key,html] of Object.entries(figures)){
 const marker=`<!-- ${key} -->`;
 if(!source.includes(marker))throw Error(`missing marker ${marker}`);
 source=source.replace(marker,html);
}
fs.writeFileSync(file,source);
console.log(`Integrated ${Object.keys(figures).length} teaching images into ${file}`);
