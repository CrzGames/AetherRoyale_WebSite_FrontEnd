<template>
  <main class="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <!-- Header -->
      <header class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm text-zinc-400">Aether Royale</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Client Builds</h1>
          <p class="mt-3 max-w-2xl text-zinc-300">
            Télécharge la build par plateforme. Les liens sont signés et expirent après 30 minutes.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            class="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 active:bg-white/20 disabled:opacity-50"
            :disabled="pending"
            @click="loadBuilds"
          >
            {{ pending ? 'Chargement…' : 'Rafraîchir' }}
          </button>
        </div>
      </header>

      <!-- Cards -->
      <section class="mt-8 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs text-zinc-400">API</p>
          <p class="mt-1 break-all font-mono text-xs md:text-sm">{{ config.public.baseUrlApi }}</p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs text-zinc-400">Liens valides encore</p>
          <p class="mt-1 text-lg font-semibold">
            <span v-if="fetchedAt">{{ expiresInText }}</span>
            <span v-else class="text-zinc-400">—</span>
          </p>
          <p class="mt-1 text-xs text-zinc-400">Si expiré, clique sur “Rafraîchir”.</p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs text-zinc-400">Statut</p>
          <p v-if="error" class="mt-1 text-sm text-red-300">Erreur: {{ error }}</p>
          <p v-else class="mt-1 text-sm text-emerald-300">OK</p>
          <p class="mt-1 text-xs text-zinc-400">
            Dernière maj:
            <span v-if="fetchedAt">{{ fetchedAt.toLocaleString('fr-FR') }}</span>
            <span v-else>—</span>
          </p>
        </div>
      </section>

      <!-- Table -->
      <section class="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 class="text-sm font-semibold">Releases</h2>
          <p class="text-xs text-zinc-400">Triées par date (récent → ancien)</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-white/5 text-left text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th class="px-5 py-3">Env</th>
                <th class="px-5 py-3">Commit</th>
                <th class="px-5 py-3">Date</th>
                <th class="px-5 py-3">Windows</th>
                <th class="px-5 py-3">Linux</th>
                <th class="px-5 py-3">macOS</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="r in rows" :key="r.key" class="border-t border-white/10">
                <td class="px-5 py-4">
                  <span class="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs font-semibold">
                    {{ r.env }}
                  </span>
                </td>

                <td class="px-5 py-4">
                  <span class="font-mono text-xs md:text-sm">{{ r.commitSha }}</span>
                </td>

                <td class="px-5 py-4 text-zinc-200">
                  {{ formatDate(r.lastModifiedIso) }}
                </td>

                <!-- Windows -->
                <td class="px-5 py-4">
                  <button
                    v-if="r.platforms.windows"
                    class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:bg-white/20"
                    :title="r.platforms.windows.filename"
                    @click="download(r.platforms.windows.downloadUrl)"
                  >
                    Télécharger
                  </button>
                  <span v-else class="text-zinc-500">—</span>
                </td>

                <!-- Linux -->
                <td class="px-5 py-4">
                  <button
                    v-if="r.platforms.linux"
                    class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:bg-white/20"
                    :title="r.platforms.linux.filename"
                    @click="download(r.platforms.linux.downloadUrl)"
                  >
                    Télécharger
                  </button>
                  <span v-else class="text-zinc-500">—</span>
                </td>

                <!-- macOS -->
                <td class="px-5 py-4">
                  <button
                    v-if="r.platforms.macos"
                    class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:bg-white/20"
                    :title="r.platforms.macos.filename"
                    @click="download(r.platforms.macos.downloadUrl)"
                  >
                    Télécharger
                  </button>
                  <span v-else class="text-zinc-500">—</span>
                </td>
              </tr>

              <tr v-if="!pending && rows.length === 0">
                <td class="px-5 py-6 text-zinc-400" colspan="6">Aucun build trouvé.</td>
              </tr>

              <tr v-if="pending && rows.length === 0">
                <td class="px-5 py-6 text-zinc-400" colspan="6">Chargement…</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer class="mt-8 text-xs text-zinc-400">
        ⚠️ Les liens sont signés (S3) et expirent au bout de 30 minutes. Si quelqu’un garde la page ouverte trop
        longtemps, il faut rafraîchir.
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Le backend expose une API qui liste les fichiers de builds disponibles sur S3, avec des liens de téléchargement
 * signés (expirent après 30 min). Cette page consomme cette API pour afficher les builds disponibles et permettre
 * de les télécharger.
 * @object
 * 
 */
type GameClientBuildFile = {
  filename: string
  commitSha: string | null
  size: number | null
  lastModified: string | null
  downloadUrl: string
}

type Platform = 'windows' | 'linux' | 'macos'
type EnvName = string

type Row = {
  key: string
  env: EnvName
  commitSha: string
  lastModifiedIso: string | null
  platforms: Record<Platform, GameClientBuildFile | null>
}

const config = useRuntimeConfig()

const pending = ref(false)
const error = ref<string | null>(null)
const fetchedAt = ref<Date | null>(null)

const rawFiles = ref<GameClientBuildFile[]>([])

async function loadBuilds() {
  pending.value = true
  error.value = null

  try {
    const { data } = await axios.get<GameClientBuildFile[]>(`${config.public.baseUrlApi}/s3/list-game-client-builds`, {
      headers: { Accept: 'application/json' },
    })

    rawFiles.value = Array.isArray(data) ? data : []
    fetchedAt.value = new Date()
  } catch (e: any) {
    error.value = e?.message ?? 'Erreur inconnue'
  } finally {
    pending.value = false
  }
}

onMounted(loadBuilds)

// aetherroyale-<platform>-<env>-<sha>.zip
function parseFilename(filename: string): { platform: Platform | null; env: EnvName | null; sha: string | null } {
  const m = filename.match(/^aetherroyale-(windows|linux|macos)-([a-z0-9_-]+)-([0-9a-f]{7,40})\.zip$/i)
  if (!m) return { platform: null, env: null, sha: null }

  const [, platform, env, sha] = m
  if (!platform || !env || !sha) return { platform: null, env: null, sha: null }

  return {
    platform: platform.toLowerCase() as Platform,
    env: env.toLowerCase(),
    sha,
  }
}


const rows = computed<Row[]>(() => {
  const byKey = new Map<string, Row>()

  for (const f of rawFiles.value) {
    const { platform, env, sha } = parseFilename(f.filename)
    if (!platform || !env || !sha) continue

    const key = `${env}:${sha}`
    const lastModifiedIso = f.lastModified ?? null

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        env,
        commitSha: sha,
        lastModifiedIso,
        platforms: { windows: null, linux: null, macos: null },
      })
    }

    const row = byKey.get(key)!
    row.platforms[platform] = f

    // date la plus récente sur la ligne
    if (!row.lastModifiedIso) row.lastModifiedIso = lastModifiedIso
    else if (lastModifiedIso && lastModifiedIso > row.lastModifiedIso) row.lastModifiedIso = lastModifiedIso
  }

  const arr = Array.from(byKey.values())
  arr.sort((a, b) => (b.lastModifiedIso ?? '').localeCompare(a.lastModifiedIso ?? ''))
  return arr
})

// Timer 30 min
const now = ref(Date.now())
let interval: any = null

onMounted(() => {
  interval = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(interval))

const expiresAt = computed(() => (fetchedAt.value ? new Date(fetchedAt.value.getTime() + 30 * 60 * 1000) : null))

const expiresInText = computed(() => {
  if (!expiresAt.value) return '—'
  const ms = expiresAt.value.getTime() - now.value
  if (ms <= 0) return 'expiré'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
})

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
}

function download(url: string) {
  window.open(url, '_blank', 'noopener')
}
</script>
