// Run with: npm run seed
// Loads .env.local by hand (no extra dependency) then upserts the seed
// exercise catalogue into MongoDB by slug, so it's safe to re-run.

import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

const { exerciseSeed } = await import('../lib/seed-data/exercises.js')
const { default: Exercise } = await import('../models/Exercise.js')

const libraryPath = path.resolve(process.cwd(), 'lib/seed-data/exercise-library.json')
const exerciseLibrary = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

const allExercises = [...exerciseSeed, ...exerciseLibrary]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.local.example to .env.local first.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log(
    `Connected. Seeding ${allExercises.length} exercises ` +
    `(${exerciseSeed.length} hand-authored + ${exerciseLibrary.length} from Free Exercise DB)...`
  )

  let created = 0
  let updated = 0

  for (const entry of allExercises) {
    const result = await Exercise.findOneAndUpdate(
      { slug: entry.slug },
      { $set: entry },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    )
    if (result.lastErrorObject?.updatedExisting) {
      updated += 1
    } else {
      created += 1
    }
  }

  console.log(`Done. Created ${created}, updated ${updated}.`)

  const publishedCount = await Exercise.countDocuments({ publicationStatus: 'published' })
  const totalCount = await Exercise.countDocuments({})
  console.log(`Sanity check: ${publishedCount} of ${totalCount} exercises in the DB are "published" (this is what /explore and the workout generator query for).`)
  if (publishedCount === 0) {
    console.warn('WARNING: 0 published exercises — something is wrong with the seed data or the DB connection.')
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
