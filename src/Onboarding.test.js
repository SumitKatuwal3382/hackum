import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';
import { DataProvider } from './store';

function setup() {
  render(<DataProvider><App /></DataProvider>);
}

test('user onboarding adds a new student', () => {
  setup();
  const addBtn = screen.getByRole('button', { name: /add yourself/i });
  fireEvent.click(addBtn);
  const nameInput = screen.getByPlaceholderText(/jane doe/i);
  fireEvent.change(nameInput, { target: { value: 'Test User' } });
  const majorInput = screen.getByLabelText(/major/i);
  fireEvent.change(majorInput, { target: { value: 'Engineering' } });
  const save = screen.getByRole('button', { name: /save/i });
  fireEvent.click(save);
  // After save, onboarding form closes and select should contain new name
  const select = screen.getByDisplayValue(/Test User/);
  expect(select).toBeInTheDocument();
});
