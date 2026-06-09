// ─────────────────────────────────────────────────────────────
// main.js  —  アプリ起動・状態管理・全画面レンダリング
// ─────────────────────────────────────────────────────────────
import './style.css'
import { GRADES, STATUSES, AREAS, LQ, DQ, SCALE_LABELS, AXIS_META } from './data.js'
import { calcScores, gradeNum, determinePattern, GRADE_MSGS, scoreDesc, reasonTexts } from './scoring.js'
import { PATTERNS } from './patterns.js'
import { submitToSheets, generateOpenAIReport } from './api.js'
import { initRadar, drawMap } from './chart.js'

// ─── State ────────────────────────────────────────────────────
const S = {
  screen: 'landing',
  info: {},
  consent: false,
  lq: new Array(20).fill(0),   // 1-5、0 = 未回答
  lqIdx: 0,
  dq: new Array(25).fill(0),
  dqIdx: 0,
  scores: null,
  pattern: null,
  feedback: null,
  aiReport: null,
  movedToDetail: false,
  completedDetail: false,
  optOpen: false,
}

// ─── Navigation ───────────────────────────────────────────────
function go(screen) {
  S.screen = screen
  render()
  window.scrollTo(0, 0)
}

// ─── Render dispatcher ────────────────────────────────────────
function render() {
  switch (S.screen) {
    case 'landing':   renderLanding();   break
    case 'basicInfo': renderBasicInfo(); break
    case 'lightQ':    renderLightQ();    break
    case 'results':   renderResults();   break
    case 'detailQ':   renderDetailQ();   break
    case 'report':    renderReport();    break
    default:          renderLanding()
  }
}

// ─── Landing ──────────────────────────────────────────────────
function renderLanding() {
  document.getElementById('app').innerHTML = `
  <div class="hero fadeUp">
    <div class="hero-badge">🧭 Career Compass</div>
    <h1 class="hero-h1">就活の正解ではなく、<br><em>今のあなたの進み方</em>を<br>見つけよう</h1>
    <p class="hero-p">Career Compass は、性格診断ではありません。自己理解・社会探索・行動・意思決定・深度から、就活に向けた<strong style="color:#fff">現在地と次の一歩</strong>を見える化します。</p>
    <div class="hero-pills">
      <div class="hero-pill"><strong>3分</strong>ライト診断</div>
      <div class="hero-pill"><strong>5軸</strong>スコア</div>
      <div class="hero-pill"><strong>詳細</strong>レポート</div>
    </div>
    <button class="btn btn-wh btn-lg" onclick="window._go('basicInfo')">現在地を見る →</button>
    <p class="hero-note">個人を特定する情報は収集しません</p>
  </div>`
}

// ─── Basic Info ───────────────────────────────────────────────
function renderBasicInfo() {
  const i = S.info
  document.getElementById('app').innerHTML = `
  <div class="bi-screen fadeUp">
    <div class="bi-hd wrap">
      <div class="bi-eyebrow">STEP 1 / 3</div>
      <h2 class="bi-title">あなたの現在地を、少しだけ教えてください</h2>
      <p class="bi-sub">学年や就活状況によって、より自然なフィードバックを返すために、最小限の情報だけ入力してください。</p>
    </div>
    <div class="wrap">
      <div class="form-sec">
        <div class="form-sec-title">必須項目</div>
        <div class="fg">
          <label class="flabel">大学名 <span class="req">*</span></label>
          <input class="finput" id="fi-univ" placeholder="例：○○大学" value="${i.university || ''}" oninput="S.info.university=this.value">
        </div>
        <div class="fgrid">
          <div class="fg">
            <label class="flabel">学年 <span class="req">*</span></label>
            <div class="fsel-wrap">
              <select class="fsel" onchange="S.info.grade=this.value">
                <option value="">選択してください</option>
                ${GRADES.map(g => `<option value="${g}" ${i.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="fg">
            <label class="flabel">文理区分 <span class="req">*</span></label>
            <div class="fsel-wrap">
              <select class="fsel" onchange="S.info.hs=this.value">
                <option value="">選択</option>
                ${['文系','理系','その他'].map(v => `<option value="${v}" ${i.hs === v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="fg">
          <label class="flabel">就活状況 <span class="req">*</span></label>
          <div class="fsel-wrap">
            <select class="fsel" onchange="S.info.status=this.value">
              <option value="">選択してください</option>
              ${STATUSES.map(s => `<option value="${s}" ${i.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="form-sec">
        <button class="opt-toggle" onclick="window._toggleOpt()" type="button">
          <span id="opt-arrow">${S.optOpen ? '▾' : '▸'}</span> 任意項目を入力する（研究データに活用）
        </button>
        <div class="opt-section${S.optOpen ? ' open' : ''}" id="opt-section">
          <div class="fgrid">
            <div class="fg">
              <label class="flabel">学部・学科 <span class="opt">任意</span></label>
              <input class="finput" placeholder="例：経済学部" value="${i.faculty || ''}" oninput="S.info.faculty=this.value">
            </div>
            <div class="fg">
              <label class="flabel">性別 <span class="opt">任意</span></label>
              <div class="fsel-wrap">
                <select class="fsel" onchange="S.info.gender=this.value">
                  <option value="">回答しない</option>
                  ${['男性','女性','その他'].map(v => `<option value="${v}" ${i.gender === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="fgrid">
            <div class="fg">
              <label class="flabel">居住地域 <span class="opt">任意</span></label>
              <div class="fsel-wrap">
                <select class="fsel" onchange="S.info.residence=this.value">
                  <option value="">選択</option>
                  ${AREAS.map(a => `<option value="${a}" ${i.residence === a ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="fg">
              <label class="flabel">出身地域 <span class="opt">任意</span></label>
              <div class="fsel-wrap">
                <select class="fsel" onchange="S.info.hometown=this.value">
                  <option value="">選択</option>
                  ${AREAS.map(a => `<option value="${a}" ${i.hometown === a ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="fg">
            <label class="flabel">インターン参加経験 <span class="opt">任意</span></label>
            <div class="toggle-row">
              ${['参加経験あり（1〜2社）','参加経験あり（3社以上）','短期のみ参加','参加したことはない'].map(v => `
              <label class="tog ${i.internship === v ? 'sel' : ''}" onclick="window._setTog('internship','${v}',this)">
                <span class="tog-chk">${i.internship === v ? '✓' : ''}</span>${v}
              </label>`).join('')}
            </div>
          </div>
          <div class="fgrid">
            <div class="fg">
              <label class="flabel">キャリア相談経験 <span class="opt">任意</span></label>
              <div class="fsel-wrap">
                <select class="fsel" onchange="S.info.careerConsult=this.value">
                  <option value="">選択</option>
                  ${['ある','なし'].map(v => `<option value="${v}" ${i.careerConsult === v ? 'selected' : ''}>${v === 'ある' ? '経験あり' : 'なし'}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="fg">
              <label class="flabel">AI活用経験 <span class="opt">任意</span></label>
              <div class="fsel-wrap">
                <select class="fsel" onchange="S.info.aiUsage=this.value">
                  <option value="">選択</option>
                  ${['活発に利用','少し利用','未使用'].map(v => `<option value="${v}" ${i.aiUsage === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="consent-box">
        <div class="consent-ttl">🔒 データの取り扱いについて</div>
        <div class="consent-body">本アンケートの回答内容は、個人が特定されない形で集計・分析され、キャリア支援、研究、サービス改善、商品開発、企業向けレポート作成に活用される場合があります。回答は統計的に処理され、氏名・メールアドレスなど個人を特定する情報と紐づけて公開されることはありません。</div>
        <label class="c-check">
          <input type="checkbox" id="consent-chk" ${S.consent ? 'checked' : ''} onchange="S.consent=this.checked;window._updateConsentBtn()">
          <span class="c-check-txt">上記を確認し、回答データが個人を特定しない形で研究・サービス改善・商品開発等に活用されることに同意します</span>
        </label>
      </div>

      <button class="btn btn-pr btn-fw btn-lg" id="start-btn"
        onclick="window._startLQ()"
        style="margin-bottom:8px;opacity:${S.consent ? 1 : 0.5};pointer-events:${S.consent ? 'auto' : 'none'}">
        アンケートへ進む →
      </button>
      <button class="btn btn-fw" style="background:none;color:var(--tx2);font-size:13px" onclick="window._go('landing')">← トップへ戻る</button>
    </div>
  </div>`
}

function toggleOpt() {
  S.optOpen = !S.optOpen
  const sec = document.getElementById('opt-section')
  const arrow = document.getElementById('opt-arrow')
  if (!sec || !arrow) return
  sec.classList.toggle('open', S.optOpen)
  arrow.textContent = S.optOpen ? '▾' : '▸'
}

function setTog(field, val, el) {
  S.info[field] = val
  el.closest('.toggle-row').querySelectorAll('.tog').forEach(t => {
    const isThis = t === el
    t.classList.toggle('sel', isThis)
    t.querySelector('.tog-chk').textContent = isThis ? '✓' : ''
  })
}

function updateConsentBtn() {
  const btn = document.getElementById('start-btn')
  if (!btn) return
  btn.style.opacity = S.consent ? '1' : '0.5'
  btn.style.pointerEvents = S.consent ? 'auto' : 'none'
}

function startLQ() {
  if (!S.consent)         { alert('同意のチェックが必要です'); return }
  if (!S.info.university) { alert('大学名を入力してください'); return }
  if (!S.info.grade)      { alert('学年を選択してください'); return }
  if (!S.info.hs)         { alert('文理区分を選択してください'); return }
  if (!S.info.status)     { alert('就活状況を選択してください'); return }
  S.lqIdx = 0
  go('lightQ')
}

// ─── Light Questionnaire ──────────────────────────────────────
function renderLightQ() {
  const idx = S.lqIdx
  const q   = LQ[idx]
  const pct = Math.round((idx / LQ.length) * 100)
  const cur = S.lq[idx]
  const axisLabel = { self:'自己理解', social:'社会探索', action:'行動性', decision:'意思決定', depth:'深度・解像度' }

  document.getElementById('app').innerHTML = `
  <div class="quiz-screen">
    <div class="step-hd">
      <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
      <div class="prog-label"><span>ライト診断</span><span>${idx + 1} / ${LQ.length}</span></div>
    </div>
    <div class="quiz-body fadeUp">
      <div class="quiz-qnum">Q${idx + 1} — ${axisLabel[q.axis]}</div>
      <div class="quiz-qtxt">${q.text}</div>
      <div class="scale-opts">
        ${[1,2,3,4,5].map(v => `
        <div class="scale-opt ${cur === v ? 'sel' : ''}" onclick="window._answerLQ(${v})">
          <div class="scale-num">${v}</div>
          <div class="scale-lbl">${SCALE_LABELS[v - 1]}</div>
        </div>`).join('')}
      </div>
      <div class="quiz-nav">
        ${idx > 0
          ? `<button class="btn-back" onclick="S.lqIdx--;window._renderLightQ()">← 前の問へ</button>`
          : ''}
      </div>
    </div>
  </div>`
}

function answerLQ(val) {
  S.lq[S.lqIdx] = val
  if (S.lqIdx < LQ.length - 1) {
    S.lqIdx++
    renderLightQ()
  } else {
    computeAndShowResults()
  }
}

// ─── Compute & Show Results ───────────────────────────────────
async function computeAndShowResults() {
  document.getElementById('app').innerHTML = `
  <div class="loading">
    <div class="spinner"></div>
    <div class="loading-txt">現在地を分析しています…</div>
  </div>`

  await new Promise(r => setTimeout(r, 900))

  S.scores  = calcScores(S.lq)
  S.pattern = determinePattern(S.scores)
  S.feedback = PATTERNS[S.pattern]

  // シート保存（非同期・ブロックしない）
  submitToSheets(buildSheetRow()).catch(() => {})

  go('results')
}

// ─── Results ──────────────────────────────────────────────────
function renderResults() {
  const sc  = S.scores
  const fb  = S.feedback
  const gn  = gradeNum(S.info.grade)
  const gradMsg = GRADE_MSGS[Math.min(gn, 5)] || GRADE_MSGS[3]
  const reasons = reasonTexts(sc)

  const scoreCards = Object.entries(AXIS_META).map(([axis, meta]) => {
    const val = sc[axis]
    return `
    <div class="sc-card">
      <div class="sc-bar-top" style="background:${meta.gradient}"></div>
      <div class="sc-axis">${meta.label}</div>
      <div class="sc-val" style="color:${meta.color}">${val}</div>
      <div class="sc-prog"><div class="sc-prog-fill" style="width:${val}%;background:${meta.gradient}"></div></div>
      <div class="sc-desc">${scoreDesc(axis, val)}</div>
    </div>`
  }).join('')

  const strengthCards = fb.strengths.map(str => `
  <div class="str-card">
    <div class="str-icon">${str.icon}</div>
    <div><div class="str-name">${str.name}</div><div class="str-sub">${str.sub}</div></div>
  </div>`).join('')

  const cautionItems  = fb.cautions.map(c => `<div class="caut-item">⚠️ ${c}</div>`).join('')
  const nsItems       = fb.nextSteps.map((s, i) => `<div class="ns-item"><div class="ns-num">${i + 1}</div><div class="ns-txt">${s}</div></div>`).join('')
  const reasonItems   = reasons.map(r => `<div class="reason-item"><div class="reason-dot"></div><div class="reason-txt">${r}</div></div>`).join('')

  document.getElementById('app').innerHTML = `
  <div class="results-screen fadeUp">
    <div class="res-hero">
      <div class="res-eyebrow">YOUR CAREER COMPASS</div>
      <div class="res-hl">${fb.hl(gn)}</div>
      <div class="res-tag">${fb.emoji} ${fb.name}</div>
      <div class="res-grade-note">📍 ${S.info.grade}向けのメッセージ：${gradMsg}</div>
    </div>

    <div class="sec-hd wrap"><div class="sec-lbl">CURRENT POSITION</div><div class="sec-title">現在地スコア</div></div>
    <div class="scores-grid">${scoreCards}</div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">RADAR VIEW</div><div class="sec-title">5軸レーダーチャート</div></div>
    <div class="chart-wrap"><div class="chart-inner"><canvas id="radarCanvas" style="max-height:300px"></canvas></div></div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">3D MAP</div><div class="sec-title">就活現在地マップ</div></div>
    <div class="map-wrap">
      <div class="map-inner">
        <div class="map-title">X軸: 自己理解 ／ Y軸: 社会探索 ／ Z軸: 深度</div>
        <canvas id="mapCanvas" style="width:100%;display:block"></canvas>
      </div>
    </div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">WHY THIS RESULT</div><div class="sec-title">そう見える理由</div></div>
    <div class="reasons-list">${reasonItems}</div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">YOUR STRENGTHS</div><div class="sec-title">面接で伝えやすい強み</div></div>
    <div class="str-grid">${strengthCards}</div>
    <div class="str-tip" style="margin-top:12px"><div class="str-tip-txt">💬 ${fb.tip}</div></div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">THINGS TO WATCH</div><div class="sec-title">就活での注意ポイント</div></div>
    <div class="caut-list">${cautionItems}</div>

    <div class="sec-hd wrap" style="padding-top:24px"><div class="sec-lbl">NEXT ACTIONS</div><div class="sec-title">次の一歩</div></div>
    <div class="ns-list">${nsItems}</div>

    <div class="cta-sec">
      <div class="cta-card">
        <div class="cta-ey">DEEP DIVE</div>
        <div class="cta-ttl">詳しいキャリア探索<br>レポートを作成する</div>
        <div class="cta-sub-txt">追加の25問に答えると、あなたの探索スタイルをより詳細に分析し、面接準備に使えるレポートを生成します。</div>
        <div class="cta-btns">
          <button class="cta-main" onclick="window._startDetailQ()">面接で伝わる強みを詳しく見る →</button>
          <button class="cta-sub-btn" onclick="window._startDetailQ()">自分の探索スタイルを深掘りする</button>
        </div>
      </div>
    </div>
  </div>`

  setTimeout(() => {
    initRadar(sc)
    drawMap('mapCanvas', sc)
  }, 100)
}

// ─── Detail Questionnaire ─────────────────────────────────────
function renderDetailQ() {
  const idx = S.dqIdx
  const q   = DQ[idx]
  const pct = Math.round((idx / DQ.length) * 100)
  const cur = S.dq[idx]

  const opts = q.type === 'scale'
    ? `<div class="scale-opts">
        ${[1,2,3,4,5].map(v => `
        <div class="scale-opt ${cur === v ? 'sel' : ''}" onclick="window._answerDQ(${v})">
          <div class="scale-num">${v}</div>
          <div class="scale-lbl">${SCALE_LABELS[v - 1]}</div>
        </div>`).join('')}
       </div>`
    : `<div class="ab-opts">
        ${q.opts.map((o, i) => `
        <div class="ab-opt ${cur === i + 1 ? 'sel' : ''}" onclick="window._answerDQ(${i + 1})">
          <div class="ab-tag">${i === 0 ? 'A' : 'B'}</div>
          <div class="ab-txt">${o}</div>
        </div>`).join('')}
       </div>`

  document.getElementById('app').innerHTML = `
  <div class="quiz-screen">
    <div class="step-hd">
      <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
      <div class="prog-label"><span>詳細診断</span><span>${idx + 1} / ${DQ.length}</span></div>
    </div>
    <div class="quiz-body fadeUp">
      <div class="quiz-qnum">詳細 Q${idx + 1}</div>
      <div class="quiz-qtxt">${q.text}</div>
      ${opts}
      <div class="quiz-nav">
        ${idx > 0
          ? `<button class="btn-back" onclick="S.dqIdx--;window._renderDetailQ()">← 前の問へ</button>`
          : `<button class="btn-back" onclick="window._go('results')">← 結果に戻る</button>`}
      </div>
    </div>
  </div>`
}

function answerDQ(val) {
  S.dq[S.dqIdx] = val
  if (S.dqIdx < DQ.length - 1) {
    S.dqIdx++
    renderDetailQ()
  } else {
    S.movedToDetail = true
    showDetailReport()
  }
}

function startDetailQ() {
  S.dqIdx = 0
  go('detailQ')
}

// ─── Detail Report ────────────────────────────────────────────
async function showDetailReport() {
  document.getElementById('app').innerHTML = `
  <div class="loading">
    <div class="spinner"></div>
    <div class="loading-txt">詳細レポートを生成しています…</div>
  </div>`

  await new Promise(r => setTimeout(r, 1200))

  S.completedDetail = true
  submitToSheets(buildSheetRow()).catch(() => {})

  // OpenAI 生成（設定済みの場合のみ）
  S.aiReport = await generateOpenAIReport(S.scores, S.info)

  go('report')
}

function renderReport() {
  const sc  = S.scores
  const fb  = S.feedback
  const gn  = gradeNum(S.info.grade)
  const style = deriveDetailStyle()

  document.getElementById('app').innerHTML = `
  <div class="fadeUp" style="padding-bottom:80px">
    <div class="rpt-hero">
      <div class="rpt-ey">CAREER EXPLORATION REPORT</div>
      <div class="rpt-ttl">${fb.hl(gn)}</div>
      <div class="rpt-style-tag">🔎 探索スタイル：${style.name}</div>
    </div>

    <div style="padding:24px 0 0">
      ${rptSection('01','現在の探索スタイル', `<p class="rpt-txt">${style.desc}</p>`)}
      ${rptSection('02','そのように見える理由', rptList(style.reasons))}
      ${rptSection('03','あなたが面接で伝えやすい要素',
        rptList(fb.strengths.map(s => `<strong>${s.name}</strong> — ${s.sub}`)) +
        `<div class="q-card" style="margin-top:14px"><div class="q-card-txt">「${fb.tip}」</div></div>`)}
      ${rptSection('04','企業から評価されやすい可能性がある点', rptList(style.companyView))}
      ${rptSection('05','就活で注意したいポイント', rptList(fb.cautions))}
      ${rptSection('06','深度・解像度を上げるための問い',
        style.depthQs.map(q => `<div class="q-card"><div class="q-card-txt">${q}</div></div>`).join(''))}
      ${rptSection('07','次の1週間でできる行動', rptList(fb.nextSteps))}
      ${rptSection('08','キャリア相談で話すとよいテーマ', rptList(style.consultTopics))}
      ${S.aiReport ? rptSection('AI','AIによる詳細フィードバック', `<p class="rpt-txt" style="white-space:pre-line">${S.aiReport}</p>`) : ''}

      <div class="share-card">
        <div class="share-ttl">📋 相談時に使うメモ</div>
        <div class="share-sub">就職課やキャリアアドバイザーへの相談時に見せることができます。スクリーンショットで保存しておくのがおすすめです。</div>
        <div style="background:rgba(255,255,255,.08);border-radius:10px;padding:12px;text-align:left;font-size:12px;color:rgba(255,255,255,.7);line-height:1.65">
          ✦ パターン：${fb.name}<br>
          ✦ 自己理解 ${sc.self} ／ 社会探索 ${sc.social} ／ 行動性 ${sc.action}<br>
          ✦ 意思決定 ${sc.decision} ／ 深度・解像度 ${sc.depth}
        </div>
        <div class="share-note">Career Compass — 就活現在地マップ</div>
      </div>

      <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-pr btn-fw" onclick="window._go('results')">← 結果に戻る</button>
        <button class="btn btn-fw" style="background:#fff;border:1.5px solid var(--bdr);color:var(--tx2)" onclick="window._go('landing')">最初からやり直す</button>
      </div>
    </div>
  </div>`
}

// ─── Detail Style Derivation ──────────────────────────────────
function deriveDetailStyle() {
  const dq  = S.dq
  const sc  = S.scores
  let deepScore = 0
  // scale questions (1-indexed): 12,18,20,22 → 0-indexed: 11,17,19,21
  for (const i of [11, 17, 19, 21]) if (dq[i] >= 3) deepScore++
  // ab Q2 (index 1): opts[1]="整理する" → value 2
  if (dq[1] === 2) deepScore += 2

  const isReflective = deepScore >= 3
  const isBroad = sc.social >= 65
  const isAction = sc.action >= 60

  if (isReflective && sc.depth >= 60) return DETAIL_STYLES.reflective
  if (isBroad && !isReflective)       return DETAIL_STYLES.broad
  if (isAction)                       return DETAIL_STYLES.active
  return DETAIL_STYLES.balanced
}

const DETAIL_STYLES = {
  reflective: {
    name: '意味づけ先行型',
    desc: '経験を振り返り、意味づけすることを大切にする傾向が見られます。面接でのエピソードを「なぜ」まで語れる素地があります。',
    reasons: [
      'インターンや説明会後に「何を感じたか」を整理する傾向があります',
      '経験を言語化することに時間をかける傾向があります',
      '具体的な自己PRエピソードを思い浮かべやすい状態にある可能性があります',
    ],
    companyView: [
      '論理的な自己分析ができる学生として評価されやすい可能性があります',
      '「なぜ志望するか」の説明に説得力が出やすい傾向があります',
      '振り返る力が、成長意欲の高さとして伝わりやすい場合があります',
    ],
    depthQs: [
      'その経験で、最も驚いたことや予想外だったことは何でしたか？',
      'その経験がなかった場合、今の自分はどう違っていたと思いますか？',
      'その経験を通じて、「自分ならでは」と感じた瞬間はどこにありましたか？',
    ],
    consultTopics: [
      '強みを面接でどのように伝えれば、より相手に伝わるか',
      '深く考える力を、企業側に評価してもらうための言語化戦略',
      '志望動機の「自分らしい視点」をどう磨くか',
    ],
  },
  broad: {
    name: '広域収集型',
    desc: '幅広く情報や経験を集めることに積極的な傾向が見られます。次の段階では、集めた情報を「自分の言葉」に変えていくことが鍵になりそうです。',
    reasons: [
      '複数の業界・企業を比較しながら情報を集めている傾向があります',
      '説明会やイベントへの参加意欲が高い傾向があります',
      '広い視野で就活を進めている可能性があります',
    ],
    companyView: [
      '業界知識の広さが、柔軟性のある学生として評価されやすい場合があります',
      '多様な経験が、汎用的なコミュニケーション能力として見えることがあります',
      '視野の広さが、長期的な成長可能性として評価される場合があります',
    ],
    depthQs: [
      '調べてきた中で、最も「自分らしい」と感じた企業・職種はどこでしたか？',
      'その企業のどの点に惹かれましたか？それはなぜだと思いますか？',
      '複数を比べてきた中で、共通して引っかかったことはありましたか？',
    ],
    consultTopics: [
      '広く集めた情報をどう絞り込むか、判断基準の作り方',
      '面接で伝わる「絞った理由」の言語化',
      '複数の選択肢の中から、自分なりの答えを出す方法',
    ],
  },
  active: {
    name: '体験主導型',
    desc: '実際に動きながら就活を進めていく傾向が見られます。行動量の多さを、振り返りと組み合わせることでさらに強みを活かせる可能性があります。',
    reasons: [
      '情報収集だけでなく、実際に参加・体験する傾向があります',
      '新しい環境に飛び込む行動力が見られます',
      '経験を積み重ねながら就活を進めている可能性があります',
    ],
    companyView: [
      '主体性と行動力が、入社後の活躍イメージにつながりやすい場合があります',
      '挑戦経験の多さが、エピソードの豊富さとして評価されやすい場合があります',
      '動きながら学ぶスタイルが、成長意欲として映ることがあります',
    ],
    depthQs: [
      '最も印象に残っているインターンや経験で、予想外だったことは何でしたか？',
      'その経験を通じて「自分って○○な人間だ」と気づいた瞬間はありましたか？',
      '面接で話せる経験の中で、最も「自分らしさ」が出ているものはどれですか？',
    ],
    consultTopics: [
      '多くの経験の中から、面接で伝えるエピソードを選ぶ基準',
      '行動の振り返りを言語化する方法',
      '「行動力」を面接で伝えるための具体的なエピソード設計',
    ],
  },
  balanced: {
    name: 'バランス成長型',
    desc: '各軸をバランスよく育てながら探索を続けている傾向が見られます。自分の得意な進め方を活かして、少しずつ深めていくことが次の一歩になりそうです。',
    reasons: [
      '全体的に均等なペースで就活を進めている可能性があります',
      '特定の軸に偏らず、バランスよく探索できている傾向があります',
      '柔軟に状況に応じて動ける可能性があります',
    ],
    companyView: [
      '幅広い視点を持つ、協調性のある学生として評価されやすい場合があります',
      '偏りなく学ぶ姿勢が、継続的な成長可能性として見えることがあります',
      'チームワークや適応力の高さが評価される場合があります',
    ],
    depthQs: [
      'これまでの就活活動の中で「これは自分に向いているかも」と感じた瞬間はありましたか？',
      '一番楽しかった就活の経験はどれですか？それはなぜ楽しかったと思いますか？',
      '自分の「こだわり」や「譲れないもの」は、就活のどこかに現れていますか？',
    ],
    consultTopics: [
      '自分の強みを一つ絞り込む方法',
      '就活の軸（大切にしたいこと）を3つに整理する方法',
      '面接で印象に残るエピソードの選び方',
    ],
  },
}

// ─── HTML helpers ─────────────────────────────────────────────
function rptSection(num, title, body) {
  return `
  <div class="rpt-sec">
    <div class="rpt-card">
      <div class="rpt-card-hd">
        <div class="rpt-card-num">${num}</div>
        <div class="rpt-card-ttl">${title}</div>
      </div>
      <div class="rpt-card-body">${body}</div>
    </div>
  </div>`
}

function rptList(items) {
  return `<div class="rpt-list">${items.map(t =>
    `<div class="rpt-li"><div class="rpt-dot"></div><div class="rpt-li-txt">${t}</div></div>`
  ).join('')}</div>`
}

// ─── Sheet row builder ────────────────────────────────────────
function buildSheetRow() {
  const sc = S.scores || {}
  return {
    response_id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submitted_at: new Date().toISOString(),
    university: S.info.university || '',
    grade: S.info.grade || '',
    faculty: S.info.faculty || '',
    department: '',
    humanities_or_science: S.info.hs || '',
    gender_optional: S.info.gender || '',
    residence_area: S.info.residence || '',
    hometown_area: S.info.hometown || '',
    desired_work_location: S.info.workLoc || '',
    local_employment_interest: '',
    job_hunting_status: S.info.status || '',
    internship_experience: S.info.internship || '',
    career_consultation_experience: S.info.careerConsult || '',
    ai_usage_experience: S.info.aiUsage || '',
    consent_research_use: S.consent ? '1' : '0',
    ...Object.fromEntries(S.lq.map((v, i) => [`q${i + 1}`, v])),
    ...Object.fromEntries(S.dq.map((v, i) => [`detail_q${i + 1}`, v])),
    self_understanding_score: sc.self || 0,
    social_exploration_score: sc.social || 0,
    action_score: sc.action || 0,
    decision_score: sc.decision || 0,
    resolution_depth_score: sc.depth || 0,
    self_understanding_high_low:  (sc.self   || 0) >= 60 ? 'H' : 'L',
    social_exploration_high_low:  (sc.social || 0) >= 60 ? 'H' : 'L',
    action_high_low:              (sc.action || 0) >= 60 ? 'H' : 'L',
    decision_high_low:            (sc.decision||0) >= 60 ? 'H' : 'L',
    depth_high_low:               (sc.depth  || 0) >= 60 ? 'H' : 'L',
    recommended_feedback_pattern: S.pattern || '',
    moved_to_detail_diagnosis:    S.movedToDetail  ? '1' : '0',
    completed_detail_diagnosis:   S.completedDetail ? '1' : '0',
    first_view_copy:    S.feedback ? S.feedback.hl(gradeNum(S.info.grade)) : '',
    interview_strengths: S.feedback ? S.feedback.strengths.map(s => s.name).join(',') : '',
    caution_points:     S.feedback ? S.feedback.cautions.join(' | ') : '',
    next_actions:       S.feedback ? S.feedback.nextSteps.join(' | ') : '',
    generated_report_text: S.aiReport || '',
  }
}

// ─── Expose to window (inline onclick から呼べるように) ────────
window._go            = go
window._toggleOpt     = toggleOpt
window._setTog        = setTog
window._updateConsentBtn = updateConsentBtn
window._startLQ       = startLQ
window._answerLQ      = answerLQ
window._renderLightQ  = renderLightQ
window._answerDQ      = answerDQ
window._renderDetailQ = renderDetailQ
window._startDetailQ  = startDetailQ
// S もアクセスできるように（select/checkbox の oninput から参照）
window.S = S

// ─── Boot ─────────────────────────────────────────────────────
render()
