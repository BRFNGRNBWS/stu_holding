const express = require('express');
const favicon = require('express-favicon');
//const db = require('./src/db.js');
const path = require('path');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
const app = express();
app.use(favicon(__dirname + '/build/favicon.ico'));
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.raw())

var connection = "";

async function query(query, host, database, user, password, res){
	try {
		if (connection === "")
			connection = mysql.createConnection({
				host: host,
				database: database,
				user: user,
				password: password
			});

		await connection.query(query, function (err, result){
			if (err){
				console.log(err);
				return err;
			};
			res.send(result);
		});
	} catch (error){
		console.log(error);
		return [error];
	};
};

app.post('/addToDB', async function (req, res){
	query(req["headers"]["sql_string"], req["headers"]["sqlhost"], req["headers"]["sqldatabase"], req["headers"]["sqluser"], "jabj2b5h1Z", res);
});

app.get('/*', function (req, res) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port);
