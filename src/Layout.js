import React from 'react';
import './Layout.scss';
import App from './App';

function Layout()
{
	return (
	<div className="parentContainer">
		<div className="container">
			<App/>
		</div>
	</div>
	);
}

export default Layout;
