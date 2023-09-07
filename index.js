const express = require('express')
const cors = require('cors')
const app = express();

require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());



app.get('/', (req, res) => {
     res.send('Hello World!')
})





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jt15atw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});

async function run() {

     const productCollection = client.db("Easyshop").collection("product");
     const addcardCollection = client.db("Easyshop").collection("addcard");


     app.get('/product', async (req, res) => {
          const result = await productCollection.find().toArray();
          res.send(result)
     });

     app.get('/product/:id', async (req, res) => {
          const query = { _id: new ObjectId(req.params.id) }
          const result = await productCollection.findOne(query);
          res.send(result)
     })
     app.get('/item/:category', async (req, res) => {
          const query = { category: req.params.category }
          const result = await productCollection.find(query).toArray();
          res.send(result)
     })

     app.post('/addcard', async (req, res) => {
          const data = req.body;
          const result = await addcardCollection.insertOne(data);
          res.send(result)
     })
     app.get('/addcard/:email', async (req, res) => {
          const email=req.params.email;
          const result = await addcardCollection.find({email:email}).toArray();
          res.send(result)
     })
     app.delete('/addcard/:id', async (req, res) => {
          const id=req.params.id;
          const result = await addcardCollection.deleteOne({_id:new ObjectId(id)})
          res.send(result)
     })

     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");

}
run().catch(console.dir);
app.listen(port, () => {
     console.log(`Example app listening on port ${port}`)
})
