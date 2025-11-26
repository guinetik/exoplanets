import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
//
import App from './App';
import Home from './routes/home';
import Stars from './routes/stars';
import Star from './routes/star';
import Planets from './routes/planets';
import Planet from './routes/planet';
import About from './routes/about';
import Apod from './routes/apod';
import { AuthProvider } from './data/context';
//
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <HashRouter>
      <Routes>
        <Route path='/' element={<App />}>
          <Route path='/' index element={<Home />} />
          <Route path='about' element={<About />} />
          <Route path='apod' element={<Apod />} />
          <Route path='stars' element={<Stars />}></Route>
          <Route path='stars/:star_id' element={<Star />} />
          <Route path='planets' element={<Planets />} />
          <Route path='planets/:planet_id' element={<Planet />} />
        </Route>
      </Routes>
    </HashRouter>
  </AuthProvider>
);
