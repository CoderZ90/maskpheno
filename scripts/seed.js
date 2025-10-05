require('dotenv').config()
const mongoose = require('mongoose')
const path = require('path')

// Models and data
const Menu = require(path.join(__dirname, '..', 'app', 'models', 'menu'))
const rawMenus = require(path.join(__dirname, '..', 'menus.json'))

async function runSeed() {
  const mongoUrl = process.env.MONGO_CONNECTION_URL
  if (!mongoUrl) {
    console.error('MONGO_CONNECTION_URL is not set in environment')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongoUrl)
    console.log('Connected to MongoDB')

    // Normalize data types (price should be Number)
    const menus = rawMenus.map((item) => ({
      name: item.name,
      image: item.image,
      price: typeof item.price === 'number' ? item.price : Number(item.price),
      size: item.size
    }))

    await Menu.deleteMany({})
    const result = await Menu.insertMany(menus)
    console.log(`Seeded ${result.length} menu items`)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
    console.log('MongoDB connection closed')
  }
}

runSeed()


