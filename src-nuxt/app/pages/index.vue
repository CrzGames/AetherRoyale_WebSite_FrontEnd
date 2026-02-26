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
                <th class="px-5 py-3">Version</th>
                <th class="px-5 py-3">Commit</th>
                <th class="px-5 py-3">Date</th>

                <!-- Colonnes dynamiques -->
                <th v-for="p in platformColumns" :key="p" class="px-5 py-3">
                  <div class="flex flex-col leading-tight">
                    <span>{{ prettyPlatform(p) }}</span>
                    <span v-if="platformSubtitle(p)" class="mt-1 text-[10px] font-medium normal-case text-zinc-500">
                      {{ platformSubtitle(p) }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="r in rows" :key="r.key" class="border-t border-white/10 align-top">
                <td class="px-5 py-4">
                  <span class="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs font-semibold">
                    {{ r.environment }}
                  </span>
                </td>

                <td class="px-5 py-4">
                  <span class="font-mono text-xs md:text-sm">{{ r.version ?? '—' }}</span>
                </td>

                <td class="px-5 py-4">
                  <span class="font-mono text-xs md:text-sm">{{ r.commitSha ?? '—' }}</span>
                </td>

                <td class="px-5 py-4 text-zinc-200">
                  {{ formatDate(r.lastModifiedIso) }}
                </td>

                <!-- Cellules dynamiques : 1 bouton par arch si besoin -->
                <td v-for="p in platformColumns" :key="`${r.key}:${p}`" class="px-5 py-4">
                  <div v-if="r.platforms[p] && Object.keys(r.platforms[p]!).length" class="flex flex-wrap gap-2">
                    <button
                      v-for="a in Object.keys(r.platforms[p]!)"
                      :key="`${r.key}:${p}:${a}`"
                      class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 active:bg-white/20"
                      :title="r.platforms[p]![a]!.filename"
                      @click="download(r.platforms[p]![a]!.downloadUrl)"
                    >
                      Télécharger <span v-if="a !== 'noarch'" class="opacity-70">({{ a }})</span>
                    </button>
                  </div>

                  <span v-else class="text-zinc-500">—</span>
                </td>
              </tr>

              <tr v-if="!pending && rows.length === 0">
                <td class="px-5 py-6 text-zinc-400" :colspan="4 + platformColumns.length">Aucun build trouvé.</td>
              </tr>

              <tr v-if="pending && rows.length === 0">
                <td class="px-5 py-6 text-zinc-400" :colspan="4 + platformColumns.length">Chargement…</td>
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

type Environment = 'staging' | 'production' | string
type PlatformName = string // windows | linux | macos | steamrt4 | android | ios | ...

/**
 * Nouveau format backend (celui que tu montres):
 * {
 *   filename, downloadUrl, size, lastModified,
 *   environment, version, commitSha, platform, arch
 * }
 */
type GameClientBuildFile = {
  key: string
  filename: string
  downloadUrl: string
  size: number | null
  lastModified: string | null

  environment: Environment | null
  version: string | null
  commitSha: string | null
  platform: PlatformName | null
  arch: string | null
}

type Row = {
  key: string
  environment: Environment
  version: string | null
  commitSha: string | null
  lastModifiedIso: string | null
  // platforms[platform][archKey] = file
  platforms: Record<string, Record<string, GameClientBuildFile>>
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

function platformSubtitle(p: string) {
  switch (p) {
    case 'steamrt4':
      return 'SteamLinux / SteamDeck'
    case 'ios':
      return 'AppStore / TestFlight'
    case 'android':
      return 'PlayStore (AAB) / APK'
    default:
      return null
  }
}

/**
 * Colonnes dynamiques :
 * - On prend les plateformes présentes dans les données
 * - On les trie avec un ordre “humain” (desktop d’abord)
 */
const platformColumns = computed<string[]>(() => {
  const set = new Set<string>()
  for (const f of rawFiles.value) {
    if (f.platform) set.add(f.platform)
  }
  const arr = Array.from(set)

  const order = ['windows', 'steamrt4', 'linux', 'macos', 'android', 'ios']
  arr.sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return arr
})

const rows = computed<Row[]>(() => {
  const byKey = new Map<string, Row>()

  for (const f of rawFiles.value) {
    const environment = f.environment ?? 'unknown'
    const version = f.version ?? null
    const commitSha = f.commitSha ?? null
    const platform = f.platform ?? null
    if (!platform) continue

    // clé release: prod = env+version, staging = env+version+sha (sha dispo)
    const key = `${environment}:${version ?? '—'}:${commitSha ?? '—'}`
    const lastModifiedIso = f.lastModified ?? null

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        environment,
        version,
        commitSha,
        lastModifiedIso,
        platforms: {},
      })
    }

    const row = byKey.get(key)!
    if (!row.platforms[platform]) row.platforms[platform] = {}

    // archKey: pour android/ios (ou si arch absent) -> "noarch"
    const archKey = f.arch ?? 'noarch'
    row.platforms[platform][archKey] = f

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

function prettyPlatform(p: string) {
  // simple “labeling” (tu peux custom)
  if (p === 'steamrt4') return 'SteamRT4'
  if (p === 'macos') return 'macOS'
  return p.charAt(0).toUpperCase() + p.slice(1)
}
</script>
