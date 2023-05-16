import express from "express";
import { getAdmins, getAdminById, getDeletedAdmins, createAdmin, updateAdmin, deleteAdmin } from "./routers/admin-router.js";
import userRouter from "./routers/admin-router.js";
import customerRouter from "./routers/customer-router.js";
import amqp from 'amqplib/callback_api.js';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import fs from "fs";

const app = express();
app.use(express.json());
app.use(userRouter);
app.use(customerRouter);

// GRAPHQL
const typeDefs = fs.readFileSync('./graphql/schema.graphql', 'utf8');

const adminData = [
    {
        id: 1,
        name: "Admin 1",
        email: ""
    },
    {
        id: 2,
        name: "Admin 2",
        email: ""
    },
    {
        id: 3,
        name: "Admin 3",
        email: ""
    }];

const resolvers = {
    Query: {
        GetAdmins: async () => {
            try{
                const admins = await getAdmins();
                console.log(admins)
                return admins;
            } catch(err) {
                console.log(err);
            }
        },
        GetAdminById: async (_, {admin_id}) => {
            try{
                const admin = await getAdminById(admin_id);
                return admin;
            }catch(err){
                console.log(err);
            }
        },
        GetDeletedAdmins: async () => {
            try{
                const admins = await getDeletedAdmins();
                return admins;
            } catch(err) {
                console.log(err);
            }
        },
        CreateAdmin: async (_, {username, email, pass}) => {
            try{
                const values = {username, email, pass};
                const admin = await createAdmin(values);
                return admin;
            }catch(err){
                console.log(err);
            }
        },
        UpdateAdmin: async (_, {admin_id, username, email, pass}) => {
            try{
                const values = {admin_id, username, email, pass};
                const admin = await updateAdmin(values);
                return admin;
            }catch(err){
                console.log(err);
            }
        },
        DeleteAdmin: async (_, {admin_id}) => {
            try{
                const admin = await deleteAdmin(admin_id);
                return admin;
            }catch(err){
                console.log(err);
            }
        }
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});



// SWAGGER
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

// RABBITMQ
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

const { url } = await startStandaloneServer(server, {listen: { port: PORT },});
  console.log(`🚀  Server ready at: ${url}`);

//app.listen(PORT, () => console.log("Server running on:", PORT));