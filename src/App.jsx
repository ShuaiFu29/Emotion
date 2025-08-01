import './App.css'
import {
  Router,
  Routes,
  Route
} from 'react-router-dom'
import NotFound from './pages/NotFound/NotFound'

function App() {


  return (
    <>
      <Routes>
        <Route path='/' element={<div>首页</div>}></Route>
        <Route path='/notFound' element={<NotFound />}></Route>
      </Routes>
    </>
  )
}

export default App
