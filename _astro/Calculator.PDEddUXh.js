import{d as i}from"./hooks.module.CP9m-5O3.js";import{l as y,S as I}from"./preact.module.DaYdYXBZ.js";var P=0;function e(o,c,u,b,s,g){c||(c={});var l,r,n=c;if("ref"in n)for(r in n={},c)r=="ref"?l=c[r]:n[r]=c[r];var _={type:o,props:n,key:u,ref:l,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--P,__i:-1,__u:0,__source:s,__self:g};if(typeof o=="function"&&(l=o.defaultProps))for(r in l)n[r]===void 0&&(n[r]=l[r]);return y.vnode&&y.vnode(_),_}const h=[{id:"object",title:"Что нужно оценить?",caption:"Выберите тип объекта — это определит методику и срок.",options:[{value:"share-llc",label:"Доля в ООО",hint:"выход участника, наследство, развод"},{value:"business",label:"Бизнес целиком",hint:"M&A, реорганизация, инвестор"},{value:"realestate",label:"Недвижимость",hint:"здание, помещение, земля"},{value:"transport",label:"Транспорт",hint:"легковой, грузовой, спецтехника"},{value:"equipment",label:"Оборудование",hint:"станки, линии, инструмент"},{value:"other",label:"Что-то другое",hint:"опишем после звонка"}]},{id:"purpose",title:"Для чего нужна оценка?",caption:"От цели зависит набор разделов отчёта.",options:[{value:"court",label:"Для суда",hint:"арбитраж, общая юрисдикция"},{value:"accounting",label:"Для бухучёта",hint:"переоценка по ФСБУ, МСФО"},{value:"deal",label:"Для сделки",hint:"купля-продажа, инвестор"},{value:"bank",label:"Для банка",hint:"залог, ипотека, кредит"},{value:"damage",label:"Расчёт ущерба",hint:"ДТП, залив, пожар"},{value:"other",label:"Другое",hint:"уточним по телефону"}]},{id:"urgency",title:"Какие сроки?",caption:"Срочные задачи стоят дороже, но мы умеем уложиться.",options:[{value:"standard",label:"Стандарт",hint:"5–10 рабочих дней"},{value:"fast",label:"Ускоренно",hint:"3–5 рабочих дней, +30%"},{value:"urgent",label:"Срочно",hint:"от 1–2 дней, по согласованию"}]}],B=({size:o=16})=>e("svg",{width:o,height:o,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round",children:e("path",{d:"M5 12h14M13 6l6 6-6 6"})}),D=({size:o=16})=>e("svg",{width:o,height:o,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round",children:e("path",{d:"M19 12H5M11 18l-6-6 6-6"})}),k=({size:o=18})=>e("svg",{width:o,height:o,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2.4","stroke-linecap":"round","stroke-linejoin":"round",children:e("path",{d:"M5 12.5l4.5 4.5L19 7"})});function L(){const[o,c]=i(0),[u,b]=i({}),[s,g]=i(""),[l,r]=i(""),[n,_]=i(!0),[w,z]=i(!1),[x,v]=i(!1),m=o<h.length,S=o===h.length,p=w,d=h[o],f=h.length+1,C=p?100:(o+1)/f*100,j=t=>{b(a=>({...a,[d.id]:t})),setTimeout(()=>c(a=>Math.min(a+1,h.length)),180)},M=()=>c(t=>Math.max(0,t-1)),$=async t=>{if(t.preventDefault(),!(!s.trim()||!l.trim()||!n)){v(!0);try{const a=new FormData;a.append("source","calculator"),a.append("name",s),a.append("phone",l),Object.entries(u).forEach(([A,q])=>a.append(`q_${A}`,q)),await fetch("/api/lead",{method:"POST",body:a}).catch(()=>{}),z(!0)}finally{v(!1)}}};return e("div",{class:"calc",children:[e("div",{class:"calc__progress","aria-hidden":"true",children:e("div",{class:"calc__progress-fill",style:{width:`${C}%`}})}),e("div",{class:"calc__head",children:[e("span",{class:"calc__step",children:p?`${f} / ${f}`:`${o+1} / ${f}`}),!p&&e("h3",{class:"calc__title",children:m?d.title:"Куда отправить расчёт?"})]}),m&&e(I,{children:[e("p",{class:"calc__caption",children:d.caption}),e("div",{class:"calc__opts",children:d.options.map(t=>{const a=u[d.id]===t.value;return e("button",{type:"button",class:`calc__opt${a?" is-active":""}`,onClick:()=>j(t.value),children:[e("span",{class:"calc__opt-tick","aria-hidden":"true",children:a&&e(k,{size:14})}),e("span",{class:"calc__opt-body",children:[e("span",{class:"calc__opt-label",children:t.label}),t.hint&&e("span",{class:"calc__opt-hint",children:t.hint})]})]})})})]}),S&&!p&&e("form",{class:"calc__form",onSubmit:$,children:[e("p",{class:"calc__caption",children:"Точную стоимость пришлёт оценщик в течение часа в рабочее время."}),e("label",{class:"calc__field",children:[e("span",{children:"Имя"}),e("input",{type:"text",required:!0,value:s,autoComplete:"name",placeholder:"Например, Ирина",onInput:t=>g(t.target.value)})]}),e("label",{class:"calc__field",children:[e("span",{children:"Телефон"}),e("input",{type:"tel",required:!0,value:l,autoComplete:"tel",placeholder:"+7 (___) ___-__-__",onInput:t=>r(t.target.value)})]}),e("label",{class:"calc__check",children:[e("input",{type:"checkbox",checked:n,onChange:t=>_(t.target.checked)}),e("span",{children:["Согласен с обработкой персональных данных по ",e("a",{href:"/intelis-site-preview/privacy",children:"политике конфиденциальности"}),"."]})]}),e("button",{class:"calc__submit",type:"submit",disabled:x||!s||!l||!n,children:[x?"Отправляем…":"Получить расчёт",!x&&e(B,{})]})]}),p&&e("div",{class:"calc__done",children:[e("div",{class:"calc__done-icon",children:e(k,{size:28})}),e("h4",{children:"Заявка принята"}),e("p",{children:"Перезвоним в течение часа. Если срочно — звоните напрямую +7 (495) 995-82-58."})]}),!p&&o>0&&e("div",{class:"calc__nav",children:e("button",{type:"button",class:"calc__back",onClick:M,children:[e(D,{}),e("span",{children:"Назад"})]})}),e("style",{children:`
        .calc {
          background: var(--color-paper);
          border-radius: 24px;
          padding: 36px 36px 32px;
          box-shadow: var(--shadow-3);
          position: relative;
          overflow: hidden;
          max-width: 640px;
          margin-inline: auto;
          width: 100%;
        }
        .calc__progress {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--color-mist);
        }
        .calc__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-azure), var(--color-cyan));
          transition: width .35s cubic-bezier(.6,.2,.2,1);
        }
        .calc__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
        }
        .calc__step {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-azure);
          flex: none;
        }
        .calc__title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(22px, 2.2vw, 28px);
          line-height: 1.15;
          letter-spacing: -0.01em;
          color: var(--color-ink);
          margin: 0;
        }
        .calc__caption {
          font-size: 14.5px;
          color: var(--color-ink-mute);
          margin: 6px 0 22px;
          line-height: 1.5;
        }
        .calc__opts {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (max-width: 540px) {
          .calc__opts { grid-template-columns: 1fr; }
          .calc { padding: 28px 22px; }
        }
        .calc__opt {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          background: var(--color-paper);
          border: 1px solid var(--color-line);
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          transition: border-color .15s, transform .12s, box-shadow .15s;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-ink);
        }
        .calc__opt:hover {
          border-color: var(--color-azure);
        }
        .calc__opt.is-active {
          border-color: var(--color-azure);
          box-shadow: 0 0 0 3px rgba(21, 152, 216, 0.12);
        }
        .calc__opt-tick {
          width: 22px; height: 22px;
          flex: none;
          border-radius: 999px;
          border: 1.5px solid var(--color-line);
          display: flex; align-items: center; justify-content: center;
          color: white;
          background: var(--color-paper);
          transition: background .15s, border-color .15s;
          margin-top: 1px;
        }
        .calc__opt.is-active .calc__opt-tick {
          background: var(--color-azure);
          border-color: var(--color-azure);
          color: white;
        }
        .calc__opt-body {
          display: flex; flex-direction: column;
          gap: 3px;
          line-height: 1.3;
        }
        .calc__opt-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14.5px;
          color: var(--color-ink);
        }
        .calc__opt-hint {
          font-size: 12.5px;
          color: var(--color-ink-mute);
        }

        .calc__form {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }
        .calc__field { display: grid; gap: 5px; }
        .calc__field span {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-ink-mute);
        }
        .calc__field input {
          width: 100%;
          padding: 13px 16px;
          border: 1px solid var(--color-line);
          border-radius: 8px;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--color-ink);
          background: var(--color-paper);
          transition: border-color .15s, box-shadow .15s;
        }
        .calc__field input:focus {
          outline: none;
          border-color: var(--color-azure);
          box-shadow: 0 0 0 3px rgba(21, 152, 216, 0.15);
        }
        .calc__check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--color-ink-mute);
          line-height: 1.45;
          cursor: pointer;
          padding: 4px 0;
        }
        .calc__check input {
          width: 18px; height: 18px;
          margin-top: 2px;
          accent-color: var(--color-azure);
          flex: none;
        }
        .calc__check a {
          color: var(--color-azure);
          border-bottom: 1px solid currentColor;
        }
        .calc__submit {
          margin-top: 4px;
          width: 100%;
          padding: 16px 24px;
          background: var(--color-azure);
          color: #fff;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .15s, transform .12s, opacity .15s;
          box-shadow: var(--shadow-cyan);
        }
        .calc__submit:hover:not(:disabled) {
          background: var(--color-azure-deep);
          transform: translateY(-1px);
        }
        .calc__submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calc__done {
          padding: 24px 8px 8px;
          text-align: center;
        }
        .calc__done-icon {
          width: 64px; height: 64px;
          border-radius: 999px;
          background: rgba(27, 180, 122, 0.12);
          color: var(--color-success);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .calc__done h4 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          margin: 0 0 8px;
          color: var(--color-ink);
        }
        .calc__done p {
          font-size: 14px;
          color: var(--color-ink-mute);
          margin: 0;
          line-height: 1.5;
        }

        .calc__nav {
          margin-top: 18px;
          display: flex;
          justify-content: flex-start;
        }
        .calc__back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: 0;
          color: var(--color-ink-mute);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color .15s;
          border-radius: 8px;
        }
        .calc__back:hover { color: var(--color-ink); }
      `})]})}export{L as default};
