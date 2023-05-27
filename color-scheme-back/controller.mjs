// The controller of the back end
// Uses a Port to receive HTTP requests from the front end
// Uses ZeroMQ to send and receive data from the Python server files

// Some code based on the ZeroMQ get started webpage for Node.js
// Other code based on source material from CS290 - Web Development

import 'dotenv/config';
import express from 'express';
import zmq from 'zeromq'
import * as fs from 'fs'

// Express and Port set up for HTTP requests
const app = express()
app.use(express.json({limit: '15mb'}));

const PORT = process.env.PORT;


// takes data and a ZMQ port, sends the data over the port and awaits response
async function retrieve(data, port) {
    console.log(data)
    console.log(`Connecting to server ${port}…`);

    //  Creates a socket to talk to server
    const sock = new zmq.Request();
    sock.connect(`tcp://localhost:${port}`);

    console.log(`Sending Data ${data}`);
    // Sends the data to the server (Python files)
    await sock.send(data);
    // Retrieves the response from the server
    const [result] = await sock.receive();

    // Determines if req successful or if error string returned
    let res;
    try{
      res = JSON.parse(result.toString())
    }
    catch{
      res = result.toString()
    }

    // Returns the response
    return res
}


// HTTP post request takes data and the ZMQ port, calls the retrieve function
app.post('/retrieve', async function (req, res) {
  const data = await retrieve(req.body.request, req.body.port)

  // sends back error or data returned from the retrieve function
  if (typeof data == "string") {
    console.log("Returning error")
    res.type("application/json").status(200).send(data)
  }
  else if (typeof data == "number") {
    console.log("Returning response")
    res.type("application/json").status(201).send([data])
  }
  else {
    console.log("Returning response")
    res.type("application/json").status(201).send(data)
  }
})


// HTTP post request takes data and writes it to an image file
app.post('/image', async function (req, res) {
  const buf = Buffer.from(req.body.request, 'base64')
  let response;
  fs.writeFile('../image.jpg', buf, (err) => {
    if (err) response = err;
    else response = "success"
  })

  if (response == "success") res.type("application/json").status(201)
  else res.type("application/json").status(200)
})




app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});