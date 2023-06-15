var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var cors = require('cors');
var path = require('path');
var fs = require('fs');
var app = express();

const { v4: uuidv4 } = require('uuid');


app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

var users = [
    {
        username: "admin",
        passwordHash: bcrypt.hashSync("admin", 10)
    }
];

console.log('Hashed password for admin:', users[0].passwordHash);

app.post('/login', function (req, res) {
    console.log('Received a login request:', req.body);
    var found = false;
    var user;

    for (var i = 0; i < users.length; i++) {
        if (users[i].username === req.body.username) {
            console.log('Username matches');
            console.log('Stored password hash:', users[i].passwordHash);
            if (bcrypt.compareSync(req.body.password, users[i].passwordHash)) {
                console.log('Password matches');
                found = true;
                user = users[i];
                break;
            } else {
                console.log('Password does not match');
            }
        }
    }

    if (found) {
        req.session.user = user;
        res.status(200).send("Connexion autorisée");
    } else {
        res.status(401).send("Identifiants invalides");
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

app.post('/contacts', function (req, res) {
    console.log('Received a contact request:', req.body);

    fs.readFile('contacts.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
            res.status(500).send("Une erreur s'est produite lors de la lecture du fichier");
        } else {
            var contacts = data ? JSON.parse(data) : [];
            var contact = req.body;
            contact.id = uuidv4(); // Générer un UUID et l'ajouter à l'objet du contact
            contacts.push(contact);

            fs.writeFile('contacts.json', JSON.stringify(contacts), 'utf8', function (err) {
                if (err) {
                    console.log(err);
                    res.status(500).send("Une erreur s'est produite lors de l'écriture dans le fichier");
                } else {
                    res.status(200).send("Contact ajouté avec succès");
                }
            });
        }
    });
});

app.get('/contacts', function (req, res) {
    fs.readFile('contacts.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
            res.status(500).send("Une erreur s'est produite lors de la lecture du fichier");
        } else {
            var obj = data ? JSON.parse(data) : [];
            res.json(obj);
        }
    });
});

app.delete('/contacts/:id', (req, res) => {
    const id = req.params.id;

    fs.readFile('contacts.json', 'utf8', function readFileCallback(err, data){
        if (err) {
            console.log(err);
            res.status(500).send("Une erreur s'est produite lors de la lecture du fichier");
        } else {
            var contacts = data ? JSON.parse(data) : [];
            const index = contacts.findIndex(contact => contact.id === id);

            if (index !== -1) {
                contacts.splice(index, 1);
                fs.writeFile('contacts.json', JSON.stringify(contacts), 'utf8', function (err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send("Une erreur s'est produite lors de l'écriture dans le fichier");
                    } else {
                        res.status(200).send('Contact supprimé avec succès');
                    }
                });
            } else {
                res.status(404).send('Contact non trouvé');
            }
        }
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000);
console.log('Server running at http://localhost:3000/');