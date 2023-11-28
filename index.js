const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
// const jwt =require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
const stripe = require("stripe")(process.env.SK)
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
    const user = client.db("NewsInfoDB").collection("user");
    // await client.connect();


    app.get('/user',async (req, res) => {
      const result = await user.find().toArray()
      res.send(result)
    })
    // app.put('/user/:email', async (req, res) => {
    //   const email = req.params.email
    //   console.log("email",email)
    //   const user = req.body
    //   console.log('user',user)
    //   const query = { email: email }
    //   const options = { upsert: true }
    //   const isExist = await user.findOne(query)
    //   console.log('User found?----->', isExist)
    //   if (isExist) return res.send(isExist)
    //   const result = await user.updateOne(
    //     query,
    //     {
    //       $set: { ...user, timestamp: Date.now() },
    //     },
    //     options
    //   )
    //   res.send(result)
    // })


    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      console.log("email",email)
      const query = { email: email }
      const options = { upsert: true };
      const bodyData = req.body
      console.log('user',bodyData)

      const update = {
        $set: {
          name: bodyData.name,
          email: bodyData.email,
          image: bodyData.image,
          role: bodyData.role,
        }
      }
      const result = await user.updateOne(query, update, options)
      res.send(result)
    })

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
      const filter =req.query
      console.log(filter)
      let query = {}
      if (req?.query?.status) {
        query = { 
          title:{$regex: filter.search, $options:'i' },
          status: req?.query?.status 

        }
      }
      const result = await addArticle.find(query).toArray()
      res.send(result)
    })

    app.get('/premiumArticle',async (req, res) => {
      // const filter =req.query.premium
      let query = {}
      if (req?.query?.premium) {
        query = { 
          premium: req?.query?.premium 
        }
      }
      const result = await addArticle.find(query).toArray()
      res.send(result)
    })

    // app.get('/approved',async (req, res) => {
    //   const filter =req.query
    //   console.log(filter)
      // const query ={
      //   title:{$regex: filter.search, $options:'i' }
      // }
      // let query = {}
      // if (req?.query?.status) {
      //   query = { status: req?.query?.status}
      // }
      // const result = await addArticle.find(query).toArray()
      // res.send(result)
    // })

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

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount =parseInt(price * 100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types:['card']
        // automatic_payment_methods: {
        //   enabled: true,
        // },
      });
      res.send({
        clientSecret:paymentIntent.client_secret
      })
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