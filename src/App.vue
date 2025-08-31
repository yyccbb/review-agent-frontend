<script setup>
import { ref, onMounted } from 'vue'
import { checkHealth, predict } from './lib/api'

const messages = ref([
  { role: 'assistant', text: `Paste a single Google review JSON below and hit Send.` }
])
const input = ref(`{
    "user_id": "112999531470949065175",
    "name": "Charles Persell",
    "time": 1562983105296,
    "rating": 5,
    "text": "Good",
    "pics": null,
    "resp": {"time": 1563014216513, "text": "Thank you for the review Charles"},
    "gmap_id": "0x89e8363049f05b3b:0xe7a43dca06b0032"
}`)
const sending = ref(false)
const healthStatus = ref({ ok: false, msg: 'Checking…' })
const lastError = ref(null)

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
      .replace(/```json([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
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
        ></textarea>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button :disabled="sending" @click="send">
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
          <button :disabled="sending" @click="doHealth" style="background:#1f2937;">
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

<style scoped>
code { color: #cbd5e1; }
pre {
  background: #0b1220;
  padding: 10px;
  border: 1px solid #1f2937;
  border-radius: 8px;
  overflow: auto;
}
</style>
