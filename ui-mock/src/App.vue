<script setup lang="ts">
import { computed, ref } from 'vue'

type TabKey = 'canliBilgi' | 'canliTv'

type WinnerCard = {
  id: string
  title: string
  badge?: string
  kazanc: string
  tutar: string
}

const activeTab = ref<TabKey>('canliTv')

const matchTitle = ref('Bangkok Utd - Shan Utd')
const matchOpen = ref(false)

const liveTvOpen = ref(true)
const winnersOpen = ref(true)
const betCheckerOpen = ref(true)

const betMode = ref<'diger' | 'spor'>('diger')
const betNumber = ref('')

const cards = ref<WinnerCard[]>([
  {
    id: 'tekli-1',
    title: 'Tekli',
    kazanc: '7 877 682.15 TRY',
    tutar: '3 189 345 TRY',
  },
  {
    id: 'tekli-2',
    title: 'Tekli',
    kazanc: '4 700 000 TRY',
    tutar: '1 000 000 TRY',
  },
  {
    id: 'kombine',
    title: 'Kombine',
    kazanc: '3 622 007.6 TRY',
    tutar: '25 000 TRY',
  },
])

const betPlaceholder = computed(() => {
  return betMode.value === 'diger' ? 'Bahis Numarası Girin' : 'Kupon Numarası Girin'
})

function toggle(refBool: { value: boolean }) {
  refBool.value = !refBool.value
}

function onControl() {
  // UI mock. Replace with API call.
  // eslint-disable-next-line no-alert
  alert(`KONTROL: ${betMode.value} / ${betNumber.value || '(empty)'}`)
}
</script>

<template>
  <div class="page">
    <div class="shell">
      <!-- Top tabs -->
      <div class="topbar">
        <button
          class="tab"
          :class="{ active: activeTab === 'canliBilgi' }"
          @click="activeTab = 'canliBilgi'"
          type="button"
        >
          <span class="tab-label">CANLI BILGI</span>
          <span class="tab-badge">63</span>
        </button>

        <button
          class="tab"
          :class="{ active: activeTab === 'canliTv' }"
          @click="activeTab = 'canliTv'"
          type="button"
        >
          <span class="tab-label">CANLI TV</span>
          <span class="tab-badge red">232</span>
        </button>

        <button class="icon-btn" type="button" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24" class="icon">
            <path
              d="M7 3H3v4h2V5h2V3zm14 0h-4v2h2v2h2V3zM5 17H3v4h4v-2H5v-2zm16 0h-2v2h-2v2h4v-4z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <!-- Match dropdown row -->
      <div class="match-row" :class="{ open: matchOpen }">
        <div class="match-pill" role="button" tabindex="0" @click="matchOpen = !matchOpen">
          <span class="ball">
            <svg viewBox="0 0 24 24" class="ball-icon">
              <path
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.7 0 3.3.5 4.7 1.4l-1.7 1.2-2.2-.2-1.1-1.8c.1 0 .2 0 .3 0zm-2.9.6 1.3 2.1-1.1 1.9-2.4.4-1.5-1.1a7.96 7.96 0 0 1 3.7-3.3zM4.6 9.6l1.6 1.2.7 2.4-1.2 2.1-2.1.1A7.96 7.96 0 0 1 4.6 9.6zm2.6 8.6.8-2.3 2.2-1.1 2.1 1.1.7 2.4-1.6 1.5a7.96 7.96 0 0 1-4.2-1.6zm9.6 1.4-1.5-1.4.7-2.5 2-1.1 2.3 1 .8 2.2a7.96 7.96 0 0 1-4.3 1.8zm4.9-4.1-.8-2.3.7-2.4 1.8-1.3 2.1.1a7.96 7.96 0 0 1-1.4 5.9z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span class="match-title">{{ matchTitle }}</span>
          <span class="caret">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </span>
        </div>
        <button class="x-btn" type="button" aria-label="Close">
          <span class="x">×</span>
        </button>
      </div>

      <div v-if="matchOpen" class="dropdown">
        <button class="drop-item" type="button" @click="(matchTitle = 'Bangkok Utd - Shan Utd'), (matchOpen = false)">
          Bangkok Utd - Shan Utd
        </button>
        <button class="drop-item" type="button" @click="(matchTitle = 'Bangkok Utd - Chiangmai'), (matchOpen = false)">
          Bangkok Utd - Chiangmai
        </button>
        <button class="drop-item" type="button" @click="(matchTitle = 'Shan Utd - Bangkok Utd'), (matchOpen = false)">
          Shan Utd - Bangkok Utd
        </button>
      </div>

      <!-- Live TV panel -->
      <section class="panel">
        <header class="panel-head" @click="toggle({ value: liveTvOpen } as any)">
          <div class="panel-title">&nbsp;</div>
          <button class="chev" type="button" aria-label="Toggle">
            <svg viewBox="0 0 24 24" class="icon" :class="{ rot: !liveTvOpen }">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </header>

        <div v-show="liveTvOpen" class="live-box">
          <div class="lock-art">
            <div class="lock" aria-hidden="true">
              <div class="lock-top"></div>
              <div class="lock-body"></div>
              <div class="lock-dot"></div>
              <div class="lock-wave"></div>
            </div>
          </div>
          <div class="live-text">
            <div class="live-title">LIVE TV IS UNAVAILABLE!</div>
            <div class="live-sub">Log in to watch live matches by using your username and password.</div>
            <a class="login" href="#" @click.prevent>GİRİŞ</a>
          </div>
        </div>
      </section>

      <!-- Winners -->
      <section class="panel">
        <header class="panel-head" @click="winnersOpen = !winnersOpen">
          <div class="panel-title">En Çok Kazananlar</div>
          <button class="chev" type="button" aria-label="Toggle">
            <svg viewBox="0 0 24 24" class="icon" :class="{ rot: !winnersOpen }">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </header>

        <div v-show="winnersOpen" class="cards">
          <article v-for="c in cards" :key="c.id" class="card">
            <div class="card-top">
              <div class="card-icon">
                <div class="m"></div>
              </div>
              <div class="card-name">{{ c.title }}</div>
              <div class="card-underline"></div>
            </div>
            <div class="kv">
              <div class="k">Kazanç</div>
              <div class="v">{{ c.kazanc }}</div>
            </div>
            <div class="kv">
              <div class="k">Tutar</div>
              <div class="v">{{ c.tutar }}</div>
            </div>
          </article>
        </div>
      </section>

      <!-- Bet checker -->
      <section class="panel">
        <header class="panel-head" @click="betCheckerOpen = !betCheckerOpen">
          <div class="panel-title">BAHİS DENETLEYİCİSİ</div>
          <button class="chev" type="button" aria-label="Toggle">
            <svg viewBox="0 0 24 24" class="icon" :class="{ rot: !betCheckerOpen }">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </header>

        <div v-show="betCheckerOpen" class="bet-body">
          <div class="radios">
            <label class="radio">
              <input type="radio" value="diger" v-model="betMode" />
              <span class="dot"></span>
              <span class="txt">Diğer</span>
            </label>
            <label class="radio">
              <input type="radio" value="spor" v-model="betMode" />
              <span class="dot"></span>
              <span class="txt">Spor Turnuvası</span>
            </label>
          </div>

          <input class="bet-input" :placeholder="betPlaceholder" v-model="betNumber" />

          <button class="control" type="button" @click="onControl">KONTROL</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Color system tuned to screenshot (olive/khaki). */
:root {
  --bg: #6b6c3a;
  --bg2: #5f6033;
  --panel: rgba(0, 0, 0, 0.18);
  --panel2: rgba(0, 0, 0, 0.22);
  --stroke: rgba(255, 255, 255, 0.08);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.62);
  --muted2: rgba(255, 255, 255, 0.45);
  --accent: #b8b57a;
  --accent2: #a8a66f;
  --red: #cc4b4b;
  --shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
}

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg2), var(--bg));
  padding: 10px 10px 24px;
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

.shell {
  max-width: 470px;
  margin: 0 auto;
}

/* Desktop: center a "device" look. */
@media (min-width: 900px) {
  .page {
    padding: 24px;
  }
  .shell {
    max-width: 520px;
    background: rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 14px;
    box-shadow: var(--shadow);
  }
}

.topbar {
  display: grid;
  grid-template-columns: 1fr 1fr 44px;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.tab {
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.12);
  color: rgba(255, 255, 255, 0.8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  font-size: 13px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 120ms ease, filter 120ms ease, background 120ms ease;
}
.tab:hover {
  filter: brightness(1.06);
}
.tab:active {
  transform: translateY(1px);
}
.tab.active {
  background: rgba(0, 0, 0, 0.18);
  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.15);
}

.tab-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  font-size: 13px;
  line-height: 1;
}
.tab-badge.red {
  background: var(--red);
}

.icon-btn {
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.12);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: filter 120ms ease;
}
.icon-btn:hover {
  filter: brightness(1.08);
}

.icon {
  width: 18px;
  height: 18px;
}

.match-row {
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.match-pill {
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.12);
  display: grid;
  grid-template-columns: 38px 1fr 34px;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
  transition: filter 120ms ease;
}
.match-pill:hover {
  filter: brightness(1.06);
}

.ball {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.35);
}

.ball-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.8);
}

.match-title {
  font-weight: 800;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.caret {
  justify-self: end;
  color: rgba(255, 255, 255, 0.7);
}

.x-btn {
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.12);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: filter 120ms ease;
}
.x-btn:hover {
  filter: brightness(1.06);
}

.x {
  font-size: 22px;
  line-height: 1;
  transform: translateY(-1px);
}

.dropdown {
  margin-top: -4px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.14);
  overflow: hidden;
}

.drop-item {
  width: 100%;
  text-align: left;
  padding: 12px 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  border: 0;
  cursor: pointer;
  font-weight: 700;
}
.drop-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.panel {
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.35);
  margin-bottom: 10px;
  overflow: hidden;
}

.panel-head {
  height: 44px;
  display: grid;
  grid-template-columns: 1fr 44px;
  align-items: center;
  padding: 0 10px;
  background: rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.panel-title {
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.9);
}

.chev {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.icon.rot {
  transform: rotate(180deg);
}

.live-box {
  height: 250px;
  background: rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  padding: 18px;
  position: relative;
}

.lock-art {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0.5;
}

.lock {
  width: 190px;
  height: 140px;
  position: relative;
  transform: translateY(-4px);
}

.lock-top {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 120px;
  height: 70px;
  border: 10px solid rgba(255, 255, 255, 0.22);
  border-bottom: 0;
  border-radius: 60px 60px 0 0;
  transform: translateX(-50%);
}

.lock-body {
  position: absolute;
  left: 50%;
  top: 62px;
  width: 170px;
  height: 92px;
  border: 10px solid rgba(255, 255, 255, 0.22);
  border-radius: 16px;
  transform: translateX(-50%);
}

.lock-dot {
  position: absolute;
  left: 50%;
  top: 92px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(-50%);
}

.lock-wave {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(72px);
  box-shadow:
    18px 10px 0 rgba(255, 255, 255, 0.22),
    34px 24px 0 rgba(255, 255, 255, 0.22);
  opacity: 0.9;
}

.live-text {
  text-align: center;
  z-index: 1;
  max-width: 320px;
}

.live-title {
  font-weight: 950;
  letter-spacing: 0.5px;
  font-size: 16px;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.live-sub {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 10px;
}

.login {
  display: inline-block;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: underline;
  font-weight: 900;
  letter-spacing: 0.2px;
}
.login:hover {
  color: rgba(255, 255, 255, 0.95);
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.06);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

@media (max-width: 420px) {
  .cards {
    grid-template-columns: 1fr;
  }
}

.card {
  background: rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  padding: 10px;
  cursor: default;
  transition: transform 120ms ease, filter 120ms ease;
}

.card:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.card-top {
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.card-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}

.card-icon .m {
  width: 14px;
  height: 14px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 4px;
  transform: rotate(45deg);
}

.card-name {
  font-weight: 900;
  font-size: 14px;
}

.card-underline {
  grid-column: 2 / 3;
  height: 3px;
  width: 22px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 2px;
  margin-top: -6px;
}

.kv {
  margin-top: 8px;
}

.k {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
  font-size: 12px;
}

.v {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 950;
  font-size: 14px;
  margin-top: 2px;
}

.bet-body {
  padding: 12px;
  background: rgba(0, 0, 0, 0.06);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.radios {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 12px;
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}

.radio input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio .dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.2);
}

.radio input:checked + .dot {
  border-color: rgba(255, 255, 255, 0.75);
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.65);
}

.bet-input {
  width: 100%;
  height: 46px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  padding: 0 14px;
  font-weight: 750;
  outline: none;
}

.bet-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.bet-input:focus {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
}

.control {
  width: 100%;
  margin-top: 12px;
  height: 52px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.12));
  color: rgba(255, 255, 255, 0.88);
  font-weight: 950;
  letter-spacing: 0.6px;
  cursor: pointer;
  transition: transform 120ms ease, filter 120ms ease;
}

.control:hover {
  filter: brightness(1.06);
}

.control:active {
  transform: translateY(1px);
}
</style>
