const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const jwt =require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const stripe = require("stripe")(process.env.SK)
const port = process.env.PORT || 5000
require('dotenv').config()

app.use(cors({
    origin: [
      // 'http://localhost:5173',
      'https://newspaper-ed240.web.app'
  ],
    credentials:true,
  }))
app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.uoehazd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    console.log(decoded.email)
    req.user = decoded
    next()
  })
}
// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
  const email = req?.decoded?.email;
  console.log(email,'email')
  const query = { email: email };
  const user = await userCollection.findOne(query);
  console.log("user",user)
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}

async function run() {
  try {
    const publisher = client.db("NewsInfoDB").collection("Publisher");
    const addArticle = client.db("NewsInfoDB").collection("addArticle");
    const user = client.db("NewsInfoDB").collection("user");
    // await client.connect();

    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    app.post('/logout',async(req,res)=>{
      const body =req.body
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })

    app.get('/user',verifyToken,async (req, res) => {
      const result = await user.find().toArray()
      res.send(result)
    })

    app.put('/user/:email',verifyToken, async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const options = { upsert: true };
      const bodyData = req.body

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
    app.delete('/user/:id',verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id)}
      const result = await user.deleteOne(query)
      res.send(result)
    })
    app.patch(`/user/:id`,async(req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const bodyData = req?.body
      const update = {
        $set: {
          role: bodyData?.role ,
        }
      }
      const result = await user.updateOne(query, update, options)
      res.send(result)
    })

    app.get('/publisher',verifyToken,async (req, res) => {
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

    app.get('/articleDetails/:id',verifyToken,async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await addArticle.findOne(query)
      res.send(result)
    })

    app.get('/myArticles',verifyToken,async (req, res) => {
      const filter =req.query.email
      let query = {}
      if (req?.query?.email) {
        query = { 
          email: req?.query?.email 
        }
      }
      const result = await addArticle.find(query).toArray()
      res.send(result)
    })

    app.get('/approvedArticle',verifyToken,async (req, res) => {
      const filter =req.query
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

    app.get('/premiumArticle',verifyToken,async (req, res) => {
      let query = {}
      if (req?.query?.premium) {
        query = { 
          premium: req?.query?.premium 
        }
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

    app.patch(`/addArticle/:id`,verifyToken,async(req,res) => {
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