import './App.css';
import Index from './Index';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProcessFiles from './ProcessFiles';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/report" element={<ProcessFiles />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
