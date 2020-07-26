import React from 'react';
import './App.scss';
import SearchBar from './SearchBar';
import $ from 'jquery';
			
//var coordPercentages = [[0.28.981, 0.34518, 0.75370, 0.35926, 0.72500, 0.70741, 0.28611, 0.70519], []];
const imgSize = {x: 1080, y: 1350};
var scale = 1.0;
var img = new Image;
img.src = '/stu.png';

function resizeStage(w){
	scale = w / imgSize.x;
	$(".imgStage").width(w);
	$(".imgStage").height(imgSize.y * scale);
};

$(document).ready(function(){
	resizeStage($(".container").width());
	var canvas = document.getElementById("imgStage");
	var ctx = canvas.getContext("2d");
	img.onload = function(){
		ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
	};
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
							
							<canvas className="imgStage" id="imgStage" useMap="imgMap" />
							
							<map name="imgMap">
								<area shape="poly" />
							</map>
						</main>
					</div>
				</div>
			</>
		);
	};

}

export default App;
