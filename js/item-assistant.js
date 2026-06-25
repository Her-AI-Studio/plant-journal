import { currentItem } from './state.js'
import { generate, isLoaded } from './llm.js'

const $ = (id) => document.getElementById(id)

export function initItemAssistant() {
  $('btn-ask')?.addEventListener('click', () => askQuestion())
  $('item-question')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') askQuestion()
  })

  document.querySelectorAll('[data-item-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.itemChip
      if ($('item-question')) $('item-question').value = q
      askQuestion(q)
    })
  })

  window.addEventListener('item-identified', () => {
    updateItemContext()
  })

  $('item-select')?.addEventListener('change', () => {
    const name = $('item-select').value
    if (name) updateItemContext(name)
  })

  if (currentItem) updateItemContext(currentItem.name)
}

export function populateItemSelect(classNames) {
  const sel = $('item-select')
  if (!sel) return
  const current = sel.value
  sel.innerHTML = '<option value="">Choose an item…</option>'
  for (const name of classNames) {
    const opt = document.createElement('option')
    opt.value = name
    opt.textContent = name
    sel.append(opt)
  }
  if (current && classNames.includes(current)) sel.value = current
}

function updateItemContext(name) {
  const display = $('item-display')
  if (display) display.textContent = name || '—'
  const messages = $('item-messages')
  if (messages) messages.innerHTML = ''
  if (name) {
    appendMessage('assistant', `You selected "${name}". Ask a question about it below.`)
  }
}

function setStatus(text, online = false) {
  const el = $('llm-status')
  if (!el) return
  el.textContent = text
  el.classList.toggle('is-online', online)
}

function buildChatPrompt(question, itemName) {
  return `You are a helpful assistant. The user identified an item called "${itemName}" in their room.
Answer the following question in 2-3 short sentences. No markdown.

Question: ${question}`
}

async function askQuestion(presetQuestion) {
  const input = $('item-question')
  const question = (presetQuestion || input?.value || '').trim()
  if (!question) return

  const itemName = $('item-display')?.textContent
  if (!itemName || itemName === '—') {
    appendMessage('assistant', 'Identify or select an item first.')
    return
  }

  appendMessage('user', question)
  if (input) input.value = ''

  const thinkingDiv = appendMessage('assistant', isLoaded() ? 'Thinking…' : 'Loading model (first run downloads ~270 MB)…')

  try {
    const reply = await generate(buildChatPrompt(question, itemName), (p) => {
      if (p.status === 'progress' && p.progress != null) {
        setStatus(`Loading model… ${Math.round(p.progress)}%`)
      }
    })
    thinkingDiv.textContent = reply
    setStatus('AI assistant ready.', true)
  } catch (err) {
    thinkingDiv.textContent = 'Failed to generate a response.'
    setStatus('Model error. Check the console.')
    console.error(err)
  }
}

function appendMessage(role, text) {
  const box = $('item-messages')
  if (!box) return
  const div = document.createElement('div')
  div.className = `item-msg item-msg--${role}`
  div.textContent = text
  box.append(div)
  box.scrollTop = box.scrollHeight
  return div
}
