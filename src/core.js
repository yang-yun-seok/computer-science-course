'use strict';
window.CS={lessons:{},labs:{},overview:null,helpers:{}};
CS.helpers.escape=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
CS.helpers.table=(headers,rows)=>`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
CS.helpers.flow=(items,separator='→')=>`<div class="flow-row">${items.map((v,i)=>`${i?`<span class="flow-arrow" aria-hidden="true">${separator}</span>`:''}<span class="flow-item">${v}</span>`).join('')}</div>`;
CS.helpers.integer=(raw,min,max,label)=>{const s=String(raw).trim();if(!/^\d+$/.test(s)||+s<min||+s>max)throw Error(`${label}에 ${min}부터 ${max}까지의 정수를 입력해 주세요.`);return +s;};
CS.helpers.value=(v)=>v===null?'<span class="device-value empty">아직 없음</span>':`<span class="device-value">${CS.helpers.escape(v)}</span>`;
