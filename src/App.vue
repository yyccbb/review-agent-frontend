<script setup>
import { ref, onMounted } from 'vue'
import { checkHealth, predict } from './lib/api'

const messages = ref([
  { role: 'assistant', text: `Paste a single Google review JSON below and hit Send.` }
])
// const input = ref(`{
//     "user_id": "112999531470949065175",
//     "name": "Charles Persell",
//     "time": 1562983105296,
//     "rating": 5,
//     "text": "Good",
//     "pics": null,
//     "resp": {"time": 1563014216513, "text": "Thank you for the review Charles"},
//     "gmap_id": "0x89e8363049f05b3b:0xe7a43dca06b0032"
// }`)
const input = ref('')
const textarea = ref(null)
const sending = ref(false)
const healthStatus = ref({ ok: false, msg: 'Checking…' })
const lastError = ref(null)

const MAX_HEIGHT = 200

async function doHealth () {
  try {
    const h = await checkHealth()
    healthStatus.value = { ok: true, msg: `Model: ${h?.model || ''}` }
  } catch (e) {
    healthStatus.value = { ok: false, msg: e.message }
  }
}
onMounted(doHealth)

function pushUserMessage(text) { messages.value.push({ role: 'user', text }) }
function pushAssistantMessage(text) { messages.value.push({ role: 'assistant', text }) }

function autoGrow() {
  const el = textarea.value
  if (!el) return

  el.style.height = 'auto' // reset so it can shrink
  const newHeight = el.scrollHeight

  if (newHeight <= MAX_HEIGHT) {
    el.style.overflowY = 'hidden'  // no scrollbar while expanding
    el.style.height = newHeight + 'px'
  } else {
    el.style.overflowY = 'auto'    // lock height + enable scrollbar
    el.style.height = MAX_HEIGHT + 'px'
  }
}
function tryParseLooseObject(raw) {
  // First, try strict JSON
  try { return JSON.parse(raw) } catch (_) {}

  // Coerce common JS-object syntax to JSON:
  // - Quote unquoted keys  { key: ... , other_key: ... } -> {"key":..., "other_key":...}
  // - Convert single quotes to double quotes (basic case)
  let t = raw
      // add quotes after { or , before key:
      .replace(/(\{|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1 "$2":')
      // normalize single quotes
      .replace(/'/g, '"')

  return JSON.parse(t) // will throw if still invalid
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function format(s) {
  return (s || '')
      .replace(/```json([\s\S]*?)```/g, '<div class="codebox"><pre class="codebox-pre"><code>$1</code></pre></div>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
}

async function send() {
  lastError.value = null
  const raw = (input.value || '').trim()
  if (!raw) return

  let parsed
  try {
    parsed = tryParseLooseObject(raw)
    if (!isPlainObject(parsed)) {
      throw new Error('Input must be a single JSON object (not null/array/primitive).')
    }
  } catch (e) {
    lastError.value = `Invalid JSON-like input: ${e.message}`
    return
  }

  pushUserMessage(raw)
  sending.value = true
  input.value = ''
  console.log('Parsed payload:\n', parsed)

  try {
    const data = await predict(parsed)
    const pretty = [
      `**final_decision**: ${data.final_decision}`,
      `**confidence**: ${data.confidence}`,
      `**model**: ${data.model}`,
      `**explanation**: ${data.explanation}`,
      '',
      '```json',
      JSON.stringify(data, null, 2),
      '```'
    ].join('\n')
    pushAssistantMessage(pretty)
  } catch (e) {
    pushAssistantMessage(`I couldn’t get a response.\n\n**Error**: ${e.message}`)
  } finally {
    sending.value = false
    requestAnimationFrame(() => {
      const el = document.querySelector('.chat')
      if (el) el.scrollTop = el.scrollHeight
    })
  }
}
</script>

<template>
  <div class="app">
    <div>
      <div class="header">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-weight:700;">Review Relevance Agent</div>
          <div v-if="healthStatus.ok" class="ok">{{ healthStatus.msg }}</div>
          <div v-else class="error">{{ healthStatus.msg }}</div>
        </div>
      </div>

      <div class="chat">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <div class="role">{{ m.role === 'user' ? 'You' : 'Assistant' }}</div>
          <div v-html="format(m.text)"></div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="inputbar">
        <textarea
            v-model="input"
            spellcheck="false"
            placeholder='Paste one JSON object representing a Google review…'
            @keydown.enter.exact.prevent="send"
            @input="autoGrow"
            ref="textarea"
            class="smart-textarea"
        ></textarea>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button :disabled="sending" @click="send" style="width:100%;">
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
          <button :disabled="sending" @click="doHealth" style="background:#1f2937; width:100%">
            Recheck Health
          </button>
        </div>
      </div>
      <div class="hint">
        Must be a single JSON object. Example keys: <code>user_id, name, time, rating, text, pics</code>.
        <span v-if="lastError" class="error"> — {{ lastError }}</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Global so it affects v-html content inside .chat */
.chat .codebox {
  border: 1px solid #334155;
  background: #0b1220;
  border-radius: 10px;
  overflow: hidden; /* keep scrollbars inside */
}

.chat .codebox-pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 320px;   /* cap height */
  overflow: auto;      /* scroll inside the box */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
}

.chat .codebox-pre code {
  color: #cbd5e1;
  white-space: pre;    /* preserve whitespace/newlines */
}
</style>

<style scoped>
code { color: #cbd5e1; }
pre {
  background: #0b1220;
  padding: 10px;
  border: 1px solid #1f2937;
  border-radius: 8px;
  overflow: auto;
}

.smart-textarea {
  resize: none;
  max-height: 200px;
  min-height: 60px;

  /* Prevent layout shift when the scrollbar appears */
  scrollbar-gutter: stable both-edges;

  /* Firefox */
  scrollbar-width: thin;                  /* thin | auto | none */
  scrollbar-color: #475569 transparent;
}

/* WebKit (Chrome/Edge/Safari) */
.smart-textarea::-webkit-scrollbar {
  width: 10px;                            /* thickness */
}

.smart-textarea::-webkit-scrollbar-track {
  background: transparent;        /* subtle seam on dark BG */
}

.smart-textarea::-webkit-scrollbar-thumb {
  background: #334155;                    /* thumb color */
  border-radius: 8px;                     /* rounded look */
  border: 2px solid #0b1220;              /* creates “gap” around thumb */
}

.smart-textarea::-webkit-scrollbar-thumb:hover {
  background: #475569;                    /* hover state */
}

.smart-textarea::-webkit-scrollbar-thumb:active {
  background: #64748b;                    /* active (dragging) */
}

.smart-textarea::-webkit-scrollbar-corner {
  background: transparent;                    /* for diagonally resizable areas */
}
</style>
