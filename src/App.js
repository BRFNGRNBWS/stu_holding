import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
import ImageMapper from 'react-image-mapper';
import Perspective from './perspective.min.js';
//import db from './db';

//coordinates of the corners of each cutout, expressed as a percentage of the image width/height
//format [x, y, x, y, x, y...]
//always start coords from the top left of where the album should be and go clockwise
//this is also the order the pictures will be rendered in, so the album at the first
//coords will be rendered first, then the next one put on top of that, etc.
const coordPercentages = [
	[0.74537, 0.32370, 0.83981, 0.32148, 0.84444, 0.39407, 0.74907, 0.39556],
	[0.28981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519]
];
//the cutout that is initially selected once the page loads
const initialSelected = 1;
//size of the preview image, mine is /public/stu_small.png
//the actual size of this image doesnt really matter, it will always be scaled to the page appropriately,
//i just scaled it down to this for data/loading time saving, and because it's the biggest it ever scales to on the page
const imgSize = {x: 486, y: 608};
const previewImage = "/stu_small.png";
//size of the full image, /public/stu.png
const fullImgSize = {x: 1080, y: 1350};
const fullImage = "/stu.png";
var scale = 1.0;
var maps = {name: "my-map", areas: []};
var placePicked = 0;
var albumsPicked = [];
var renderedImage = "";
var imageDataURLSArray = [];
var leaderShown = false;
var leaderboardLength = 10;
genMaps();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateMapSize(w){
	this.setState({canWidth: w});
};

//resizes the canvases and the ImgMap
function resizeStage(w){
	scale = w / imgSize.x;
	var h = imgSize.y * scale;
	updateMapSize(w);
	$(".albumStage").width(w);
	$(".albumStage").height(h);
	
	if (scale < 1){
		$(".leaderboard").css("overflow", "scroll");
		$(".leaderboard").css("white-space", "nowrap");
		$(".leaderboard td:nth-child(1)").css("display", "none");
		$(".leaderboard th:nth-child(1)").css("display", "none");
	}else {
		$(".leaderboard").css("overflow", "initial");
		$(".leaderboard").css("white-space", "initial");
		$(".leaderboard td:nth-child(1)").css("display", "block");
		$(".leaderboard th:nth-child(1)").css("display", "block");
	}
};

//calculates the pixel coordinates of the albums based on the percentage coordinate array, [x, y, x, y...] format
function calcCoords(which, imageDimensions){
	var output = [];
	for (var i = 0; i < coordPercentages[which].length; i++){
		if (i % 2 === 0)
			output.push(coordPercentages[which][i] * imageDimensions.x);
		else
			output.push(coordPercentages[which][i] * imageDimensions.y);
	};
	return output;
};

//takes coords generated from calcCoords() and puts them in [[x, y], [x, y]...] format
function parseCoords(coords){
	var output = [];
	for (var i = 0; i < 8; i += 2)
		output.push([coords[i], coords[i + 1]]);
	return output;
};

//generates the image maps using calcCoords()
function genMaps(){
	for (var i = 0; i < coordPercentages.length; i++){
		maps["areas"].push({name: i.toString(), shape: "poly", coords: calcCoords(i, imgSize), preFillColor: "rgba(0, 0, 0, 0.1)"});
	};
};

//when one of the cutout areas is clicked on
function spotClicked(area){
	var number = parseInt(area["name"]);
	placePicked = number;
	for (var i = 0; i < maps["areas"].length; i++){
		if (i === placePicked)
			maps["areas"][i]["preFillColor"] = "rgba(255, 0, 0, 0.4)";
		else
			maps["areas"][i]["preFillColor"] = "rgba(0, 0, 0, 0.1)";
	};
	this.setState({map: maps});
};

//called once an album is picked from the search bar, this puts it on the preview
function renderAlbum(album){
	albumsPicked[placePicked] = album;
	var canvas = document.getElementById("img" + placePicked);
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		var p = new Perspective(ctx, img);
		var m = maps["areas"][placePicked]["coords"];
		p.draw(parseCoords(m));	

		//selects the next area automatically
		if (placePicked === coordPercentages.length - 1)
			spotClicked(maps["areas"][0]);
		else
			spotClicked(maps["areas"][placePicked + 1]);
	};
	img.src = album["image"][album["image"].length - 1]["#text"];
	
	if (albumsPicked.length === coordPercentages.length){
		$(".renderButton").prop("disabled", false);
	};
};

async function renderFinal(){
	$(".renderButton").html("rendering...");
	addToSQL();
	imageDataURLSArray = [];
	var canvas = document.getElementById("renderCanvas");
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < coordPercentages.length; i++){
		await renderImages(canvas, ctx, i);
	};

	while (coordPercentages.length !== imageDataURLSArray.length){
		await sleep(500);
	};

	for (var i = 0; i < coordPercentages.length; i++){
		await drawRenderedImages(ctx, i);	
	};
	
	var img = new Image();
	img.onload = function(){
		ctx.drawImage(img, 0, 0);
		//console.log(canvas.toDataURL());
		$(".renderImg").attr("src", canvas.toDataURL());
		$(".pictureHolder").css("display", "none");
		$(".renderImg").css("display", "block");
		$(".renderButton").html("rendered!");
		$(".renderButton").prop("disabled", true);
	};
	img.src = fullImage;
};

function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

async function addToSQL(){
	console.log("addToSQL");
	for (var i = 0; i < coordPercentages.length; i++){
		var fullAlbum = albumsPicked[i]["artist"].toLowerCase().replace(/['"/\\.,\-_]/g, "").replace(/\&/g, "and") + " - "
			+ albumsPicked[i]["name"].toLowerCase().replace(/['"/\\.,\-_]/g, "");
		var sql = "INSERT INTO mostPicked (album, name, artist, url, timesPicked) VALUES ("
			+ "'" + fullAlbum + "', '"
			+ addslashes(encodeURIComponent(albumsPicked[i]["name"])) + "', '"
			+ addslashes(encodeURIComponent(albumsPicked[i]["artist"])) + "', '"
			+ albumsPicked[i]["image"][1]["#text"] +"', 1) "
			+ "ON DUPLICATE KEY UPDATE timesPicked = timesPicked+1";
		console.log(sql);
		
		$.ajax({
			url: "/addToDB",
			type: "post",
			headers: {
				sql_string: sql,
				sqlhost: process.env.REACT_APP_SQL_HOST,
				sqldatabase: process.env.REACT_APP_SQL_DATABASE,
				sqluser: process.env.REACT_APP_SQL_USERNAME
			},
			dataType: "json",
			success: function(data){
				console.log("successful: ");
				console.log(data);
			},
			error: function(data){
				console.log("error " + data);
			}
		});
	};
};

function renderImages(canvas, ctx, i){
	var coords = calcCoords(i, fullImgSize);
	var img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = function(){
		var p = new Perspective(ctx, img);
		p.draw(parseCoords(coords));
		imageDataURLSArray[i] = canvas.toDataURL();
	};
	img.src = albumsPicked[i]["image"][albumsPicked[i]["image"].length - 1]["#text"];
};

function drawRenderedImages(ctx, i){
	var img = new Image();
	img.onload = function(){
		ctx.drawImage(img, 0, 0);
	};
	img.src = imageDataURLSArray[i];
};

function startOver(){
	hideLeader();
	if (albumsPicked.length === coordPercentages.length)
		$(".renderButton").prop("disabled", false);
	else
		$(".renderButton").prop("disabled", true);
	$(".pictureHolder").css("display", "block");
	$(".renderImg").css("display", "none");
	$(".renderButton").html("render");
};

function toggleLeader(){
	if (leaderShown) hideLeader();
	else showLeader();
};

function showLeader(){
	$(".searchbarDiv").css("display", "none");
	$(".pictureHolder").css("display", "none");
	$(".renderImg").css("display", "none");
	$(".leaderboardButton").html("hide leaderboard");
	$(".leaderboard").css("display", "block");
	leaderShown = true;
	
	var sql = "SELECT * FROM mostPicked ORDER BY timesPicked DESC LIMIT 0, " + (leaderboardLength - 1);
	
	$.ajax({
		url: "/addToDB",
		type: "post",
		headers: {
			sql_string: sql,
			sqlhost: process.env.REACT_APP_SQL_HOST,
			sqldatabase: process.env.REACT_APP_SQL_DATABASE,
			sqluser: process.env.REACT_APP_SQL_USERNAME
		},
		dataType: "json",
		success: function(data){
			var tableBody = "<tr> <th></th> <th>Name</th> <th>Artist</th> <th>Times Picked</th> </tr>";
			for (var i = 0; i < data.length; i++){
				tableBody += 
					"<tr>" +
						"<td><img src='" + data[i]["url"] + "' /></td>" +
						"<td>" + decodeURIComponent(data[i]["name"]) + "</td>" +
						"<td>" + decodeURIComponent(data[i]["artist"]) + "</td>" +
						"<td>" + data[i]["timesPicked"] + "</td>" +
					"</tr>";
			};
			$(".leaderboard").html(tableBody);
		},
		error: function(data){
			console.log("error " + data);
		}
	});
	

};

function hideLeader(){
	$(".searchbarDiv").css("display", "block");
	$(".pictureHolder").css("display", "block");
	$(".renderImg").css("display", "block");
	$(".leaderboardButton").html("show leaderboard");
	$(".leaderboard").css("display", "none");
	$(".leaderboard").html("");
	
	if ($(".renderButton").html() === "rendered!"){
		$(".pictureHolder").css("display", "none");
		$(".renderImg").css("display", "block");
	}else {
		$(".pictureHolder").css("display", "block");
		$(".renderImg").css("display", "none");
	};
	
	leaderShown = false;
};

$(document).ready(function(){
	$(".renderButton").prop("disabled", true);
	spotClicked({name: initialSelected.toString()});
	resizeStage($(".container").width());
	$(window).resize(function(){
		resizeStage($(".container").width());
	});
});



class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {canWidth: imgSize.x};
	};
	
	componentDidMount(){
		updateMapSize = updateMapSize.bind(this);
		document.title = "Stu Holds";
	};
	
	//updated when an album is picked from the search bar
	updateAlbum = (album) => {
		renderAlbum(album);
	};
	
	renderIt = () => {
		renderFinal();
	};
	
	startOver = () => {
		startOver();
	};
	
	toggleLeader = () => {
		toggleLeader();
	};
	
	render(){
		return (
			<>
				<div className="parentContainer">
					<div className="container">
						<header className="header">
							<h1>Stu Holding</h1>
						</header>
						
						<div className="searchbarDiv">
							<SearchBar className="albumText" selectedAlbum={this.updateAlbum} />
						</div>
			
						<main>
							<div className="pictureHolder">
								<canvas className="albumStage" id="img0" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img1" width={imgSize.x} height={imgSize.y} />
								<ImgMap className="imgWithMap" src={previewImage} imgWidth={imgSize.x} width={this.state.canWidth} map={maps} onClick={area => spotClicked(area)} />
							</div>
							
							<img className="renderImg" id="renderImg" />
							
							<br />
							
							<table className="leaderboard"></table>
							
							<div className="buttonContainer">
								<button className="renderButton" onClick={this.renderIt}>render</button>
								<button className="leaderboardButton" onClick={this.toggleLeader}>show leaderboard</button>
								<button className="startOverButton" onClick={this.startOver}>start over</button>
							</div>
						</main>
					</div>
				</div>
				<canvas className="renderCanvas" id="renderCanvas" width={fullImgSize.x} height={fullImgSize.y} src={renderedImage} />
			</>
		);
	};
}

class ImgMap extends ImageMapper{
	constructor(props){
		super(props)
	};
	
	componentDidMount(){
		spotClicked = spotClicked.bind(this);
	};
};
			
export default App;
