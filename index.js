const express = require('express')
const cors = require('cors')
const app = express();

require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.store_id
const store_passwd = process.env.store_passwd
const is_live = false

app.use(express.json());



app.get('/', (req, res) => {
     res.send('Hello World!')
})



console.log(store_passwd);
console.log(store_id);

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
     const PaymentCollection = client.db("Easyshop").collection("payment");


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
          const email = req.params.email;
          const result = await addcardCollection.find({ email: email }).toArray();
          res.send(result)
     })
     app.delete('/addcard/:id', async (req, res) => {
          const id = req.params.id;
          const result = await addcardCollection.deleteOne({ _id: new ObjectId(id) })
          res.send(result)
     })


     // payment Related API 

     app.post('/order', (req, res) => {
          const tran_id = new ObjectId().toString();
          const item = req.body;
          console.log(item);
          const data = {
               total_amount: item?.price,
               currency: 'BDT',
               tran_id: tran_id, // use unique tran_id for each api call
               success_url: `https://easyshop-client.vercel.app/payment/success/${tran_id}`,
               fail_url: `https://easyshop-client.vercel.app/payment/fail/${tran_id}`,
               cancel_url: 'http://localhost:3030/cancel',
               ipn_url: 'http://localhost:3030/ipn',
               shipping_method: 'Courier',
               product_name: 'Computer.',
               product_category: 'Electronic',
               product_profile: 'general',
               cus_name: 'Customer Name',
               cus_email: item?.email,
               cus_add1: 'Dhaka',
               cus_add2: 'Dhaka',
               cus_city: 'Dhaka',
               cus_state: 'Dhaka',
               cus_postcode: '1000',
               cus_country: 'Bangladesh',
               cus_phone: '01711111111',
               cus_fax: '01711111111',
               ship_name: item?.name,
               ship_add1: 'Dhaka',
               ship_add2: 'Dhaka',
               ship_city: 'Dhaka',
               ship_state: 'Dhaka',
               ship_postcode: 1000,
               ship_country: 'Bangladesh',
          };

          const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
          sslcz.init(data).then(apiResponse => {
               // Redirect the user to payment gateway
               let GatewayPageURL = apiResponse.GatewayPageURL
               res.send({ url: GatewayPageURL })
               const ressult = PaymentCollection.insertOne(item);
               item.tranjectionId = tran_id
               item.paidStatus = false
               console.log('Redirecting to: ', GatewayPageURL)
          });


          app.post('/payment/success/:tranID', async (req, res) => {
               console.log(req.params.tranID);
               const result = await PaymentCollection.updateOne(
                    { tranjectionId: req.params.tranID }, {
                    $set: {
                         paidStatus: true
                    }
               })
               if (result.matchedCount > 0) {
                  
                    res.redirect(`https://easyshop-client.vercel.app/payment/success/${req.params.tranID}`)
               }
          })

          app.post('/payment/fail/:tranID', async (req, res) => {

               const result = await PaymentCollection.deleteOne(
                    { tranjectionId: req.params.tranID })

               if (result.deletedCount > 0) {
                    res.redirect(`https://easyshop-client.vercel.app/payment/fail/${req.params.tranID}`)
               }
          })

     })
     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");
}


run().catch(console.dir);
app.listen(port, () => {
     console.log(`Example app listening on port ${port}`)
})
