const {
    Server
} = require('socket.io');
const express = require('express');
const {
    createServer
} = require('node:http');
const {
    Redis
} = require('ioredis')
const bodyParser = require('body-parser');
const redisCache = new Redis();
const serverConfig = require('./src/serverConfig');

const app = express();
app.use(bodyParser.json());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
        methods: ["GET", "POST"]
    }
});


io.on('connection', (socket) => {
    console.log("User Has connected to the socket ", socket.id);
    socket.on('setUserSocketId', async function (userId) {
        console.log("Reaching here setUserSocketId ", userId);
        await redisCache.set(userId, socket.id);
    });

    socket.on('getUserSocketId', async function (userId) {
        let data = await redisCache.get(userId);
        console.log("Reaching here getUserSocketId ", data);
        socket.emit('userSocketId', data);
    })
});

app.post("/send-payload", async function (req, res) {
    const {
        userId,
        submissionPayload
    } = req.body;
    if (!userId || !submissionPayload) {
        return res.status(404).send("Invalid Request either the userId missing or submissionPayload. check UserId , submissionPayload ", userId, submissionPayload);
    }

    let roomId = await redisCache.get(userId);
    if (roomId) {
        io.to(roomId).emit('submissionPayloadResponse', submissionPayload);
        return res.status(200).send("Success for the submission to the client");
    } else {
        return res.status(404).send("Failure for the submission to the client");
    }
});

server.listen(serverConfig.PORT, function () {
    console.log(`Server has started Listening to the ${serverConfig.PORT}`);
});
