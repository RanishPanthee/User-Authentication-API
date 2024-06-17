import express from 'express';
import bodyParser from "body-parser";
import { connectDB } from "./db/connection.js"
import userRoutes from "./routes/userRoutes.js"
import config from './config.js';


const port = config.server.port
const app = express()

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello, welcome !!')
})

app.use("/user", userRoutes)

connectDB()
.then(() => {
    app.listen(port || 8000, () => {
        console.log(`Server is running at port : ${port}`);
    })
})
.catch((err) => {
    console.log("DB connection failed !!! ", err);
})