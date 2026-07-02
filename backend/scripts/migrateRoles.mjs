import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'

await mongoose.connect(process.env.MONGODB_URL)
console.log('DB connected')

// Migrate legacy roles directly via raw collection (bypasses schema enum)
const ownerRes = await mongoose.connection.collection('users').updateMany(
  { role: 'owner' }, { $set: { role: 'admin' } }
)
console.log('Migrated owner->admin:', ownerRes.modifiedCount, 'docs')

const userRes = await mongoose.connection.collection('users').updateMany(
  { role: 'user' }, { $set: { role: 'customer' } }
)
console.log('Migrated user->customer:', userRes.modifiedCount, 'docs')

// Show all users
const users = await mongoose.connection.collection('users')
  .find({}, { projection: { fullName: 1, email: 1, role: 1 } })
  .toArray()

console.log('\nAll users after migration:')
users.forEach(u => console.log(' ', u.email, '->', u.role))

await mongoose.disconnect()
console.log('\nMigration complete!')
