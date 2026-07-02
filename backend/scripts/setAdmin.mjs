import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'

await mongoose.connect(process.env.MONGODB_URL)
console.log('DB connected')

const adminEmail = process.env.ADMIN_EMAIL
const result = await mongoose.connection.collection('users').updateOne(
  { email: adminEmail },
  { $set: { role: 'admin', isEmailVerified: true } }
)

console.log('Updated admin account:', result.modifiedCount, 'doc(s) modified')

const all = await mongoose.connection.collection('users')
  .find({}, { projection: { fullName: 1, email: 1, role: 1 } })
  .toArray()

console.log('\nAll users:')
all.forEach(u => console.log(' ', u.email, '->', u.role))

await mongoose.disconnect()
console.log('\nDone!')
