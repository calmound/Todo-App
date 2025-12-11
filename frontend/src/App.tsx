import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AllPage } from './pages/All/AllPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { InboxPage } from './pages/Inbox/InboxPage';

function App() {
  dayjs.locale('zh-cn');
  return (
    <MantineProvider defaultColorScheme="light">
      <ModalsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/all" replace />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="all" element={<AllPage />} />
              <Route path="calendar" element={<CalendarPage />} />
            </Route>
          </Routes>
        </Router>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
