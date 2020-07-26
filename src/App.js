import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
import ImageMapper from 'react-image-mapper';
			
const coordPercentages = [[0.28981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519]];
const imgSize = {x: 486, y: 608};
var scale = 1.0;
var maps = {name: "my-map", areas: []};
genMaps();

function updateMapSize(w){
	this.setState({width: w});
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
		maps["areas"].push({name: i.toString(), shape: "poly", coords: calcCoords(i), strokeColor: "red"});
	};
};

$(document).ready(function(){
	resizeStage($(".container").width());
});

$(window).resize(function(){
	resizeStage($(".container").width());
});

class App extends React.Component {
	constructor(props){
		super(props);
		this.state = {albumPicked: {}, placePicked: 0};
	};
	
	//updated when an album is picked from the search bar
	updateAlbum = (album) => {
		this.setState({albumPicked: album})
		
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
								<canvas className="albumStage" id="imgStage" width={imgSize.x} height={imgSize.y} />
								<ImgMap className="imgWithMap" src="./stu_small.png" imgWidth={imgSize.x} width={imgSize.x} map={maps} onClick={area => this.clicked(area)} />
							</div>
							
						</main>
					</div>
				</div>
			</>
		);
	};
}

class ImgMap extends ImageMapper {
	constructor(props){
		super(props);
		console.log(props);
		updateMapSize = updateMapSize.bind(this);
	};
};	
			
export default App;
