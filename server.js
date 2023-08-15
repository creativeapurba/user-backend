const express = require("express");
const mysql = require('mysql');

const app = express();
app.use(express.json())

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
    connection.query(`INSERT INTO users 
                    (username, password, email)
                    VALUES 
                    ("${username}", "${password}", "${email}")`,
        (err, result, fields) => {
            if (err) console.log(err.message);
            let data = JSON.parse(JSON.stringify(result));
            res.status(200).send(data);
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

app.listen(8080, () => {
    console.log("Listening on port 8080");
});