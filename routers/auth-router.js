import express from "express";
import bcrypt from "bcrypt";
import conn from "./startConnection.js";

const router = express.Router();
router.use(express.json());

// Login router
router.post("/auth/login", async (req, res) => {
    console.log("Login request received");
    console.log(req.body)
    conn.getConnection(function (err, connection) {
        if(err) throw err;
        const select_admin = 'SELECT * FROM admins a JOIN admins_data ad ON a.id = ad.admin_id WHERE (ad.admin_id, ad.snap_timestamp) IN (SELECT admin_id, MAX(snap_timestamp) FROM admins_data GROUP BY admin_id) AND a.deleted=false AND ad.username=?;';
        connection.query(select_admin, [req.body.username], function (err, result) {
            if (err) {
                connection.release();
                throw err;
            }
            if(result.length === 0) {
                res.status(404).send("admin not found");
                connection.release();
            }else{
                console.log('admin with username: ' + req.body.username + ' selected!\n ', result)
                bcrypt.compare(req.body.password, result[0].pass, function(err, result1) {
                    if(err) {
                        connection.release();
                        throw err;
                    }
                    if(result1 === true) {
                        
                        res.status(200).send([result[0].admin_id, result[0].username, result[0].email, result[0].is_superuser],);
                        connection.release();
                    }else{
                        res.status(401).send("Wrong password");
                        connection.release();
                    }
                });
            }
        });
    });
});

export default router;