const start = Date.now();

// Test 1: DNS resolution
const dns = require('dns');
console.log('--- Test 1: DNS Resolution ---');
dns.resolveSrv('_mongodb._tcp.cluster1.cil6w4z.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV resolution FAILED:', err.message);
    console.log('Waktu:', Date.now() - start, 'ms');
  } else {
    console.log('DNS SRV resolved in', Date.now() - start, 'ms');
    console.log('Addresses:', JSON.stringify(addresses, null, 2));
  }

  // Test 2: Mongoose connection
  console.log('\n--- Test 2: Mongoose Connection ---');
  const mongoStart = Date.now();
  const mongoose = require('mongoose');
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ramadan123:ramadan123@cluster1.cil6w4z.mongodb.net/TSHUB?appName=Cluster1';
  console.log('Connecting to:', uri.replace(/:[^:@]+@/, ':***@'));

  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  }).then(async () => {
    console.log('Mongoose connected in', Date.now() - mongoStart, 'ms');
    console.log('readyState:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);

    try {
      const cols = await mongoose.connection.db.listCollections().toArray();
      console.log('Collections:', cols.map(c => c.name));
    } catch (e) {
      console.log('List collections error:', e.message);
    }

    // Test 3: Check users collection
    console.log('\n--- Test 3: Users Collection ---');
    try {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log('Users count:', usersCount);

      if (usersCount > 0) {
        const sampleUser = await mongoose.connection.db.collection('users').findOne({}, { projection: { password: 0, salt: 0 } });
        console.log('Sample user:', JSON.stringify(sampleUser, null, 2));
      }
    } catch (e) {
      console.log('Users collection error:', e.message);
    }

    await mongoose.disconnect();
    console.log('\nTotal time:', Date.now() - start, 'ms');
  }).catch(err => {
    console.error('Mongoose connection FAILED after', Date.now() - mongoStart, 'ms');
    console.error('Error:', err.message);
    process.exit(1);
  });
});
