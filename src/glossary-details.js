(()=>{
'use strict';
CS.glossaryDetailHTML=(termId,{open=false,from=''}={})=>{
 const detail=CS.glossaryDetails?.[termId];if(!detail)return '';
 const e=CS.helpers.escape,origin=CS.glossaryLinks.validOrigin(from,CS.lessons);
 return `<details class="glossary-deep"${open?' open':''}><summary><span>찬찬히 이해하기</span><small>원리 · 예시 · 헷갈리는 점</small></summary><div class="glossary-deep-body"><section aria-labelledby="${e(termId)}-explain"><h4 id="${e(termId)}-explain">조금 더 풀어 보면</h4>${detail.explain.map(paragraph=>`<p>${e(paragraph)}</p>`).join('')}</section><section class="glossary-example" aria-labelledby="${e(termId)}-example"><h4 id="${e(termId)}-example">게임 속 예시</h4><p>${e(detail.example)}</p></section><aside class="glossary-confusion"><h4>여기서 헷갈리기 쉬워요</h4><p>${e(detail.confusion)}</p></aside>${origin?`<a class="glossary-back-to-text" href="#${e(origin)}">이제 읽던 문장으로 돌아가기 →</a>`:''}</div></details>`;
};
})();
