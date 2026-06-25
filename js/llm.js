import { pipeline } from '@huggingface/transformers'

const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct'

// Singleton promise — concurrent callers share the same load
let pipePromise = null

async function getGenerator(onProgress) {
  if (!pipePromise) {
    pipePromise = pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
      progress_callback: onProgress,
    })
  }
  return pipePromise
}

export function isLoaded() {
  // Resolved promise means model is in memory
  return pipePromise !== null
}

/**
 * @param {string} prompt
 * @param {(progress: {status:string, progress?:number}) => void} [onProgress]
 */
export async function generate(prompt, onProgress) {
  const gen = await getGenerator(onProgress)
  const messages = [{ role: 'user', content: prompt }]
  const result = await gen(messages, {
    max_new_tokens: 200,
    temperature: 0.6,
    do_sample: true,
  })
  return result[0].generated_text.at(-1).content.trim()
}
