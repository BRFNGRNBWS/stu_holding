import React from 'react';
import $ from 'jquery';
import Autosuggest from 'react-autosuggest';
import axios from 'axios'

//used to replace the text in the searchbar once an option is clicked, needs to be album name
const getSuggestionValue = suggestion => suggestion.name;

const renderSuggestion = suggestion => (
	<div>
		{suggestion.name}
	</div>
);

const getSugg = value => {
	var lastfm = getLastFM(value);
	
	return lastfm;
};

function getLastFM(value){
	var data = [];
	var url = "https://ws.audioscrobbler.com/2.0/?method=album.search&album="
		+ value
		+ "&api_key=" + process.env.REACT_APP_LASTFM_KEY
		+ "&format=json&limit=4";
	
	console.log("url: " + url);
	axios.get(url).then(response => data = response);
	
	console.log("data");
	console.log(data);
	return value.length === 0 || data.length === 0 ? [] : data["results"]["albummatches"]["album"];
};

class SearchBar extends React.Component {
	constructor(){
		super();
		this.state = {
			value: '',
			suggestions: []
		};
	};
	
	onChange = (event, {newValue}) => {
		this.setState({
			value: newValue
		});
	};
	
	//called every time suggestions need to be updated
	onSuggestionsFetchRequested = ({value}) => {
		this.setState({
			suggestions: getSugg(value)
		});
	}
	
	//every time suggestions are cleard
	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: []
		});
	};
	
	render(){
		const {value, suggestions} = this.state;
		
		//all these props are passed to the input
		const inputProps = {
			placeholder: 'Type album or artist',
			value,
			onChange: this.onChange
		};
		
		return (
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				getSuggestionValue={getSuggestionValue}
				renderSuggestion={renderSuggestion}
				inputProps={inputProps}
			/>
		);
	};
};

export default SearchBar;
