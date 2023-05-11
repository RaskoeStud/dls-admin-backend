import express from "express";
import userRouter from "./routers/admin-router.js";
import customerRouter from "./routers/customer-router.js";
import amqp from 'amqplib/callback_api.js';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
app.use(express.json());
app.use(userRouter);
app.use(customerRouter);



const options = {
    definition: {
        openapi: "3.0.0",
        info: {	
            title: "Customer API",
            version: "1.0.0",
            description: "A simple Express Library API for customers",
        },
        servers: [
            {
                url: process.env.SWAGGER_URL || "http://localhost:3000",
            },
        ],
    },
    apis: ["./routers/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.post("/rabbitmq", (req, res) => {
    amqp.connect(process.env.CLOUDAMQP_URL + "?heartbeat=60", (err, conn) => {
        if(err) {
            throw err;
        }
        conn.createChannel((err, ch) => {
            if(err) {
                throw err;
            }
            let queueName = 'servermessage';
            let msg = req.body.msg || "Hello World!";
            ch.assertQueue(queueName, {
                durable: false // if true, the queue will survive a broker restart
            });
            ch.sendToQueue(queueName, Buffer.from(msg));
            console.log(`Sent: ${msg}`)
            setTimeout(() => {
                res.sendStatus(200)
                conn.close();
            }, 500);
        });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on:", PORT));