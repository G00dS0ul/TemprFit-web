const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://user:pass@cluster.mongodb.net/temprfit?retryWrites=true&w=majority"; // Wait, I need to get the real URI from .env.local

async function reset() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  await mongoose.connection.db.collection('pods').deleteMany({});
  console.log('Pods collection dropped.');
  process.exit(0);
}
reset();
