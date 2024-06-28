import './App.css';
import DrawableCanvas from './components/drawableCanvas'
import RowContainer from './components/rowContainer';
import {useState} from 'react'

function App() {
  const [digits, setDigits] = useState([])
  
  return (
    <div className='app-container'>
      <h1>Digit Recogniser</h1>     
      <RowContainer digits={digits}/>
      <DrawableCanvas setDigits={setDigits}/>
    </div>
  );
}

export default App;
