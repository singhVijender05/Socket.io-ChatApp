
import './App.css'

import Home from './pages/Home'
import Chat from './pages/Chat'
import {Route,Routes } from 'react-router-dom'

function App() {


  return (

      <div className='App'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/chat' element={<Chat />} />
        </Routes>
      </div>

  )
}

export default App
