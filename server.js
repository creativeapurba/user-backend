require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require("./Post")
const mysql = require('mysql');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(express.json())

// MONGODB DETAILS
const dbUser = "atg";
const dbPassword = process.env.MONGODB_PASSWORD;
const mongoUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.m05ti.mongodb.net/`
mongoose.connect(mongoUrl + 'atgdb')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err.message));

// MYSQL DETAILS
const connection = mysql.createConnection({
    host: 'db4free.net',
    user: 'omprakash',
    password: process.env.MYSQL_PASSWORD,
    database: 'omprakash'
});

// JWT 
const secretKey = process.env.SECRET_KEY;
function fetchToken(req, res, next) {
    const authBearer = req.headers['authorization']
    if (authBearer !== undefined) {
        token = authBearer.split(" ")[1];
        // console.log(token);
        req.token = token;
        next()
    }
    else {
        res.status(401).send("Missing token")
    }
}

// HOME ROUTE
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


    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) console.log(err.message)
        // console.log(hash);
        connection.query(`INSERT IGNORE INTO users 
                    (username, password, email)
                    VALUES 
                    ("${username}", "${hash}", "${email}")`,
            (err, result, fields) => {
                if (err) console.log(err.message);
                let data = JSON.parse(JSON.stringify(result));
                if (data.affectedRows) {
                    console.log("User Created");
                    const user = {
                        username: username
                    }
                    jwt.sign({ user }, secretKey, { expiresIn: "300s" }, (err, token) => {
                        if (err) {
                            console.log(err.message)
                        }
                        else {
                            res.status(201).send(token);
                        }
                    })
                }
                else {
                    console.log("User Already Exists");
                    res.status(200).send("User Already Exists")
                }
            }
        )
    });

    // connection.query(`INSERT IGNORE INTO users 
    //                 (username, password, email)
    //                 VALUES 
    //                 ("${username}", "${password}", "${email}")`,
    //     (err, result, fields) => {
    //         if (err) console.log(err.message);
    //         let data = JSON.parse(JSON.stringify(result));
    //         if (data.affectedRows) {
    //             console.log("User Created");
    //             const user = {
    //                 username: username
    //             }
    //             jwt.sign({ user }, secretKey, { expiresIn: "300s" }, (err, token) => {
    //                 if (err) {
    //                     console.log(err.message)
    //                 }
    //                 else {
    //                     res.status(201).send(token);
    //                 }
    //             })
    //         }
    //         else {
    //             console.log("User Already Exists");
    //             res.status(200).send("User Already Exists")
    //         }
    //     }
    // )

});

// LOGIN USER
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    connection.query(`SELECT password FROM users 
    WHERE username = "${username}"`, (err, result, fields) => {
        if (err) console.log(err.message);
        let data = JSON.parse(JSON.stringify(result));

        if (data.length > 0) {
            // console.log(password);
            // console.log(data[0].password);

            bcrypt.compare(password, data[0].password, function (err, result) {
                // console.log(result);
                if (err) {
                    console.log(err.message);
                }
                else if (result) {
                    console.log("Login Successful");
                    const user = {
                        username: username
                    }
                    jwt.sign({ user }, secretKey, { expiresIn: "300s" }, (err, token) => {
                        if (err) console.log(err.message);
                        res.status(200).send(token)
                    })
                }
                else {
                    res.status(401).send("Invalid credential")
                }
            });

            // if (data[0].password == password) {
            //     console.log("Login Successful");
            //     const user = {
            //         username: username
            //     }
            //     jwt.sign({ user }, secretKey, { expiresIn: "300s" }, (err, token) => {
            //         if (err) console.log(err.message);
            //         res.status(200).send(token)
            //     })

            // } else {
            //     console.log("Login Unsuccessful");
            //     res.status(404).send("Login Unsuccessful")
            // }
        } else {
            res.status(404).send("User Not-found")
        }
    });
});

// FORGOT PASSWORD
app.post("/forgot", (req, res) => {
    const username = req.body.username;
    const new_password = req.body.password;
    // const rePassword = req.body.rePassword;

    bcrypt.hash(new_password, saltRounds, function (err, hash) {

        if (err) console.log(err.message);

        connection.query(`UPDATE users SET password = "${hash}" 
        WHERE username = "${username}"`, (err, result, fields) => {
            if (err) console.log(err.message);
            let data = JSON.parse(JSON.stringify(result));
            // console.log(data);

            if (data.affectedRows) {
                const user = {
                    username: username
                }
                jwt.sign({ user }, secretKey, { expiresIn: "300s" }, (err, token) => {
                    res.status(200).send(token)
                })
                console.log("Password Updated");
            }
            else {
                res.status(403).send("Invalid Input");
            }
        });
    });

});

// CREATE POST
app.post("/createpost/:username", fetchToken, (req, res) => {
    const username = req.params.username
    const title = req.body.title;
    const body = req.body.body;

    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) res.status(401).send(err.message);
        else if (username === authData.user.username) {
            const post = new Post({
                username: username,
                title: title,
                body: body
            })
            post.save().then(() => {
                console.log("Post Created");
                res.status(201).send("Post created")
            }).catch((err) => res.status(500).send(err.message))
        }
        else {
            res.send("Username Missmatch")
        }
    })
})

// READ POSTS
app.get("/posts/:username", fetchToken, (req, res) => {
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        } else {
            const username = req.params.username;
            Post.find({ username: username }).then((result) => {
                if (result.length > 0) {
                    res.status(200).send(result)
                }
                else {
                    console.log(username + " does not have any post");
                    res.status(404).send(username + " does not have any post")
                }
            })
        }
    })
})
app.get("/post/:postId", fetchToken, (req, res) => {
    const postId = req.params.postId;
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        } else {
            Post.findById(postId).then((result) => {
                if (result != null) {
                    res.status(200).send(result)
                }
                else {
                    res.status(404).send("Post not found")
                }
            })
        }
    })

})

// UPDATE POST
app.put("/post/:postId", fetchToken, (req, res) => {
    const postId = req.params.postId;
    const newTitle = req.body.title;
    const newBody = req.body.body;

    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        }
        else {
            Post.findById(postId).then((result) => {
                if (result != null) {
                    if (result.username == authData.user.username) {
                        Post.findOneAndUpdate({ _id: postId }, { title: newTitle, body: newBody })
                            .then((result) => {
                                res.status(200).send("Updated")
                            })
                            .catch((err) => res.status(500).send(err.message))
                    }
                    else {
                        res.send("Post creator can update only")
                    }
                }
                else {
                    res.status(404).send("Post not found")
                }
            })
        }
    })

})

// DELETE POST
app.delete("/post/:postId", fetchToken, (req, res) => {
    const postId = req.params.postId;

    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        }
        else {
            Post.findById(postId).then((result) => {
                if (result != null) {
                    if (result.username == authData.user.username) {
                        Post.findOneAndDelete({ _id: postId })
                            .then((result) => {
                                res.status(200).send("Deleted")
                            })
                            .catch((err) => res.status(500).send(err.message))
                    }
                    else {
                        res.send("Post creator can delete only")
                    }
                }
                else {
                    res.status(404).send("Post not found")
                }
            })
        }
    })
})

// ADD COMMENT TO POST
app.post("/comment/post/:postId", fetchToken, (req, res) => {
    const postId = req.params.postId;
    const commentText = req.body.commentText;

    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        } else {
            Post.findById(postId).then((result) => {
                if (result != null && commentText !== undefined) {
                    const comments = result.comments
                    comments.push({ username: authData.user.username, commentText: commentText })
                    Post.findByIdAndUpdate(postId, { comments: comments })
                        .then(() => res.send("Commented"))
                }
                else if (commentText === undefined) {
                    res.send("Comment Text is empty")
                }
                else {
                    res.status(404).send("Post not found")
                }
            })
        }
    })
})

// LIKE A POST
app.post("/like/post/:postId", fetchToken, (req, res) => {
    const postId = req.params.postId;

    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            res.status(401).send(err.message);
        }
        else {
            const username = authData.user.username;
            Post.findById(postId).then((result) => {
                if (result != null) {
                    const likes = result.likes
                    if (likes.find((e) => e === username) === undefined) {
                        likes.push(username)
                        Post.findByIdAndUpdate(postId, { likes: likes })
                            .then(() => res.send("Liked"))
                    }
                    else {
                        console.log("Already Liked");
                        res.send("Already Liked")
                    }

                }
                else {
                    res.status(404).send("Post not found")
                }
            })
        }
    })
})


app.listen(8080, () => {
    console.log("Listening on port 8080");
});