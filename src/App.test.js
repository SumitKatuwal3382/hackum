import { render, screen } from '@testing-library/react';
import App from './App';
import { DataProvider } from './store';

test('renders app header', () => {
  render(<DataProvider><App /></DataProvider>);
  const header = screen.getByText(/StudyMate Graph/i);
  expect(header).toBeInTheDocument();
});
