import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { MainPage } from './pages/MainPage';
import { AdminPage } from './pages/AdminPage';
import { CalendarPage } from './pages/CalendarPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <MainPage />
            </AppLayout>
          }
        />

        <Route
          path="/calendar"
          element={
            <AppLayout>
              <CalendarPage />
            </AppLayout>
          }
        />

        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
