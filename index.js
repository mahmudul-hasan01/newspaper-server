const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
// const jwt =require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
require('dotenv').config()

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials:true,
  }))
app.use(express.json())
// app.use(cookieParser())



const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.uoehazd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const publisher = client.db("NewsInfoDB").collection("Publisher");
    const addArticle = client.db("NewsInfoDB").collection("addArticle");
    // await client.connect();


    app.get('/publisher',async (req, res) => {
      // console.log(req.cookies)
      const result = await publisher.find().toArray()
      res.send(result)
    })
    app.post('/publisher',async(req,res)=>{
      try {
        const body = req.body
        const result = await publisher.insertOne(body)
        res.send(result)
      }catch(error){
        console.log(error)
      }
    })

    app.post('/addArticle',async(req,res)=>{
      try {
        const body = req.body
        const result = await addArticle.insertOne(body)
        res.send(result)
      }catch(error){
        console.log(error)
      }
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})