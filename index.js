const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

// prime-hospital-firebase-adminsdk.json

const serviceAccount = require('./prime-hospital-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// data receive korar jonno below 2 ta lagbe
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d1z6k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// for token purpose
async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer')) {
        const token = req.headers.authorization.split('')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        // below 2ta code er jonno  primeDB database er vitor appointments create kore tar vitor data patahabo client er web site theke
        const database = client.db('primeDB');
        // for create a  appointments   collection into mongodb database
        const appointmentsCollection = database.collection('appointments');
        // for create a  users collection into mongodb database
        const usersCollection = database.collection('users');

        // Step-2
        //Ei part database part e dekhar jonno use hoi
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            // console.log(date);
            const query = { email: email, date: date };
            // console.log(query);
            // step-1
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            // console.log(appointments);
            res.json(appointments);
        })

        // Step-1
        app.post('/appointments', verifyToken, async (req, res) => {
            // ekhane appointment ta bookingModal part theke asche
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            // console.log(appointment);
            res.json(result);
        });

        // Step-3
        // Ei part database part e extra kore new user Register korar shomoy information save korar jonno use hoi
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        // Step-4
        // for update google signin and also others update
        // ######## for Update we Use app.put ###########
        app.put('/users', async (req, res) => {
            const user = req.body;
            // console.log('put', user);
            // query and filter same thing
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // Step-5
        // for  data MakeAdmin
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            // console.log('put', user);
            // console.log('put', req.decodedEmail);
            console.log('decodedEmail', req.decodedEmail);
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(401).json({ message: 'you do not permission to make admin' })
            }

        });

        // Step-6
        // // for user admin or not
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })


    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Doctors Portal!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})


// app.get('/users')
// app.post('/users')
// app.get('/users/:id')
// app.put('/users/:id');
// app.delete('/users/:id')
// users: get
// users: post



// page====72-7