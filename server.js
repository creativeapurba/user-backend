const express = require("express");
const mongoose = require('mongoose');
const Post = require("./Post")
const mysql = require('mysql');
const { MongoErrorLabel } = require("mongodb");

const app = express();
app.use(express.json())

// MONGODB DETAILS
const dbUser = "atg"
const dbPassword = "c3pkJgKLCcQgqoEI"
const mongoUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.m05ti.mongodb.net/`
mongoose.connect(mongoUrl + 'atgdb')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err.message));


const connection = mysql.createConnection({
    host: 'db4free.net',
    user: 'omprakash',
    password: 'omprakash@1',
    database: 'omprakash'
});


app.get("/", (req, res) => {
    connection.query('SELECT * FROM users', function (error, results, fields) {
        if (error) throw error;
        const data = JSON.parse(JSON.stringify(results));
        console.log(data);
    });
    res.send("App is running!!!");
});

// LIST ALL USER
app.get("/users", (req, res) => {
    connection.query('SELECT * FROM users', function (error, results, fields) {
        if (error) throw error;
        const data = JSON.parse(JSON.stringify(results));
        // console.log(data);
        res.send(data);

    });
});

// CREATE USER
app.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    connection.query(`INSERT IGNORE INTO users 
                    (username, password, email)
                    VALUES 
                    ("${username}", "${password}", "${email}")`,
        (err, result, fields) => {
            if (err) console.log(err.message);
            let data = JSON.parse(JSON.stringify(result));
            if (data.affectedRows) {
                console.log("User Created");
                res.status(201).send("User Created");
            }
            else {
                console.log("User Already Exists");
                res.status(200).send("User Already Exists")
            }
        }
    )

});

// LOGIN USER
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    connection.query(`SELECT password FROM users 
    WHERE username = "${username}"`, (err, result, fields) => {
        if (err) console.log(err.message);
        let data = JSON.parse(JSON.stringify(result));
        // console.log(data.length);
        if (data.length > 0) {
            if (data[0].password == password) {
                res.status(200).send("Login Successful")
            } else {
                res.status(404).send("Login Unuccessful")
            }
        } else {
            res.send("User Not-found")
        }
    });
});

// FORGOT PASSWORD
app.post("/forgot", (req, res) => {
    const username = req.body.username;
    const new_password = req.body.password;
    // const rePassword = req.body.rePassword;
    connection.query(`UPDATE users SET password = "${new_password}" 
        WHERE username = "${username}"`, (err, result, fields) => {
        if (err) console.log(err.message);
        let data = JSON.parse(JSON.stringify(result));
        console.log(data);

        if (data.affectedRows) {
            res.status(200).send("Password Updated");
        }
        else {
            res.status(403).send("Invalid Input");
        }
    });

});

// // POST SCHEMA
// const postSchema = new mongoose.Schema({
//     username: String,
//     title: String,
//     body: String,
//     likes: Array,
//     likeCount: Number,
//     comment: Array
// });

// CREATE POST
app.post("/createpost/:username", (req, res) => {
    const username = req.params.username
    const title = req.body.title;
    const body = req.body.body;
    const post = new Post({
        username: username,
        title: title,
        body: body
    })

    post.save().then(() => {
        res.status(201).send("Post created")
    }).catch((err) => res.send(err.message))
})

// READ POSTS
app.get("/posts/:username", (req, res) => {
    const username = req.params.username;
    Post.find({ username: username }).then((result)=>{
        res.send(result)
    })
})

// UPDATE POST

// DELETE POST

// ADD COMMENT TO POST

// LIKE A POST

// DISLIKE A POST

app.listen(8080, () => {
    console.log("Listening on port 8080");
});