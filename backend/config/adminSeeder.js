import bcrypt from "bcryptjs"
import User from "../models/user.model.js"

/**
 * adminSeeder — Idempotent ADMIN account initialization.
 *
 * Runs on every server startup:
 *  1. Migrates any legacy role values (user → customer, owner → admin)
 *  2. Reads ADMIN credentials from .env
 *  3. Checks if an admin account already exists
 *  4. Creates one if it doesn't — never creates duplicates
 */
const adminSeeder = async () => {
    try {
        // ── Step 1: Migrate legacy roles (user → customer, owner → admin) ──────
        const legacyUserCount = await User.countDocuments({ role: "user" })
        if (legacyUserCount > 0) {
            await User.updateMany({ role: "user" }, { $set: { role: "customer" } })
            console.log(`[AdminSeeder] ✅ Migrated ${legacyUserCount} legacy 'user' → 'customer'`)
        }

        const legacyOwnerCount = await User.countDocuments({ role: "owner" })
        if (legacyOwnerCount > 0) {
            await User.updateMany({ role: "owner" }, { $set: { role: "admin" } })
            console.log(`[AdminSeeder] ✅ Migrated ${legacyOwnerCount} legacy 'owner' → 'admin'`)
        }

        // ── Step 2: Read admin credentials from .env ─────────────────────────
        const {
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
            ADMIN_NAME,
            ADMIN_PHONE,
        } = process.env

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
            console.warn("[AdminSeeder] ⚠️  ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME not set in .env — skipping admin creation.")
            return
        }

        // ── Step 3: Check existence (idempotent) ──────────────────────────────
        const existing = await User.findOne({ email: ADMIN_EMAIL })
        if (existing) {
            if (existing.role !== 'admin') {
                // Account exists but with wrong role (e.g. created via Google as customer)
                // → promote it to admin
                existing.role = 'admin'
                existing.isEmailVerified = true
                await existing.save()
                console.log(`[AdminSeeder] ✅ Existing account for ${ADMIN_EMAIL} promoted to admin.`)
            } else {
                console.log(`[AdminSeeder] ✅ Admin already exists (${ADMIN_EMAIL}) — no action needed.`)
            }
            return
        }

        // ── Step 4: Hash password and create admin ────────────────────────────
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12)

        await User.create({
            fullName: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            mobile: ADMIN_PHONE || undefined,
            role: "admin",
            isEmailVerified: true,
        })

        console.log(`[AdminSeeder] ✅ Admin account created successfully for ${ADMIN_EMAIL}`)

    } catch (error) {
        console.error("[AdminSeeder] ❌ Error during admin seeding:", error.message)
    }
}

export default adminSeeder
