import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { TodayPage } from './pages/Today/TodayPage';
import { WeekPage } from './pages/Week/WeekPage';
import { AllPage } from './pages/All/AllPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';

function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/today" replace />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="week" element={<WeekPage />} />
            <Route path="all" element={<AllPage />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </Router>
    </MantineProvider>
  );
}

export default App;
