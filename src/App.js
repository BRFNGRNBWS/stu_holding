import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
import ImageMapper from 'react-image-mapper';
import Perspective from './perspective.js'

//coordinates of the corners of each cutout, expressed as a percentage of the image width/height
// format [x, y, x, y, x, y...]
//always start coords from the top left of where the album should be and go clockwise
const coordPercentages = [[0.28981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519], [0.74537, 0.32370, 0.83981, 0.32148, 0.84444, 0.39407, 0.74907, 0.39556]];
const imgSize = {x: 486, y: 608};
var scale = 1.0;
var maps = {name: "my-map", areas: []};
var placePicked = 0;
genMaps();

function updateMapSize(w){
	this.setState({canWidth: w});
};

function resizeStage(w){
	scale = w / imgSize.x;
	var h = imgSize.y * scale;
	updateMapSize(w);
	$(".albumStage").width(w);
	$(".albumStage").height(h);
};

function calcCoords(which){
	var output = [];
	for (var i = 0; i < coordPercentages[which].length; i++){
		if (i % 2 === 0)
			output.push(coordPercentages[which][i] * imgSize.x);
		else
			output.push(coordPercentages[which][i] * imgSize.y);
	};
	return output;
};

function genMaps(){
	for (var i = 0; i < coordPercentages.length; i++){
		maps["areas"].push({name: i.toString(), shape: "poly", coords: calcCoords(i), preFillColor: "rgba(0, 0, 0, 0.1)"});
	};
};

function spotClicked(area){
	var number = parseInt(area["name"]);
	placePicked = number;
	for (var i = 0; i < maps["areas"].length; i++){
		if (i === placePicked)
			maps["areas"][i]["preFillColor"] = "rgba(255, 0, 0, 0.2)";
		else
			maps["areas"][i]["preFillColor"] = "rgba(0, 0, 0, 0.1)";
	};
	this.setState({map: maps});
};

function renderAlbum(album){
	console.log(album);
	var canvas = document.getElementById("img" + placePicked);
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var img = new Image();
	img.onload = function(){
		var p = new Perspective(ctx, img);
		var m = maps["areas"][placePicked]["coords"];
		p.draw([
			[m[0], m[1]],
			[m[2], m[3]],
			[m[4], m[5]],
			[m[6], m[7]]
		]);
	};
	img.src = album["image"][album["image"].length - 1]["#text"];
};

$(document).ready(function(){
	spotClicked({name: "0"});
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
	};
	
	//updated when an album is picked from the search bar
	updateAlbum = (album) => {
		renderAlbum(album);
	};
	
	render(){
		return (
			<>
				<div className="parentContainer">
					<div className="container">
						<header className="header">
							<h1>Stu Holds</h1>
						</header>
						
						<main>
							<SearchBar className="albumText" selectedAlbum={this.updateAlbum} />
							
							<br />
							
							<div className="pictureHolder">
								<canvas className="albumStage" id="img0" width={imgSize.x} height={imgSize.y} />
								<canvas className="albumStage" id="img1" width={imgSize.x} height={imgSize.y} />
								<ImgMap className="imgWithMap" src="/stu_small.png" imgWidth={imgSize.x} width={this.state.canWidth} map={maps} onClick={area => spotClicked(area)} />
							</div>
							
						</main>
					</div>
				</div>
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
