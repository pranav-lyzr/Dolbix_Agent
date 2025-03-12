import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProcessFiles from './ProcessFiles';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Index />} /> */}
        <Route path="/" element={<ProcessFiles />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
