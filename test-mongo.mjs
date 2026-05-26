import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://ramadan123:ramadan123@cluster1.cil6w4z.mongodb.net/TSHUB?appName=Cluster1'

async function test() {
  console.log('🔗 Connecting to MongoDB Atlas...')
  console.log('URI:', uri.replace(/\/\/.*@/, '//<credentials>@'))
  
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    
    await client.connect()
    console.log('✅ Connected to MongoDB Atlas!')
    
    // List all databases
    const adminDb = client.db().admin()
    const dbs = await adminDb.listDatabases()
    console.log('\n📂 Databases found:')
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`)
    })
    
    // Check TSHUB database
    const db = client.db('TSHUB')
    const collections = await db.listCollections().toArray()
    console.log('\n📂 Collections in TSHUB:')
    collections.forEach(col => {
      console.log(`  - ${col.name}`)
    })
    
    // Check if Reservasi collection has any data
    const col = db.collection('input_database')
    const count = await col.countDocuments()
    console.log(`\n📊 Documents in input_database: ${count}`)
    
    if (count > 0) {
      const docs = await col.find().limit(3).toArray()
      console.log('\n📄 Sample documents:')
      docs.forEach((doc, i) => {
        console.log(`  [${i}]:`, JSON.stringify(doc, null, 2))
      })
    }
    
    // Try inserting a test document
    console.log('\n📝 Inserting test document...')
    const result = await col.insertOne({
      _test: true,
      namaAdmin: 'Test Script',
      namaTamu: 'Test Tamu',
      createdAt: new Date(),
    })
    console.log('✅ Insert result:', {
      acknowledged: result.acknowledged,
      insertedId: result.insertedId,
    })
    
    // Verify the insert
    const verifyDoc = await col.findOne({ _id: result.insertedId })
    console.log('✅ Verified document exists:', verifyDoc ? 'YES' : 'NO')
    
    // Clean up test doc
    await col.deleteOne({ _id: result.insertedId })
    console.log('🧹 Test document cleaned up')
    
    await client.close()
    console.log('\n✅ Done! Connection and write operations work correctly.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

test()
