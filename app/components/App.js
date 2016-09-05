import React from 'react';
import Header from './Header';
import Footer from './Footer';

class App extends React.Component {
  render() {
    return (
      <div>
        <Header/>
        <div className="content-wrapper">
            {this.props.children}
        </div>
        <Footer/>
      </div>
    );
  }
}

export default App;
