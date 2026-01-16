import express from "express";
import dotenv from "dotenv"


const app= express()
dotenv.config()

app.use(express.json())

const port= process.env.PORT


app.get('/', (req,res) => {
    res.send("Hello world")
})

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    
})