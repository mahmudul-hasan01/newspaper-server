const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
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

    app.get('/addArticle',async (req, res) => {
      const result = await addArticle.find().toArray()
      res.send(result)
    })

    app.get('/approvedArticle',async (req, res) => {
      let query = {}
      if (req?.query?.status) {
        query = { status: req?.query?.status}
      }
      const result = await addArticle.find(query).toArray()
      res.send(result)
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
    
    app.patch(`/addArticle/:id`,async(req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const bodyData = req?.body
      console.log(bodyData)
      const update = {
        $set: {
          status: bodyData?.status ,
        }
      }
      const result = await addArticle.updateOne(query, update, options)
      res.send(result)
    })
    app.patch(`/premium/:id`,async(req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const bodyData = req?.body
      const update = {
        $set: {
          premium: bodyData?.premium,
        }
      }
      const result = await addArticle.updateOne(query, update, options)
      res.send(result)
    })

    app.delete('/addArticles/:id', async (req, res) => {
      const id = req.params.id
      console.log(id)
      const query = { _id: new ObjectId(id)}
      const result = await addArticle.deleteOne(query)
      res.send(result)
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