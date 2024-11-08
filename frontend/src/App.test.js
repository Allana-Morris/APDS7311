import { render, screen } from '@testing-library/react';
import { act } from 'react';
import App from './App';

test('renders learn react link', () => {
  act(() => {
    render(<App />);
  });
  // Replace 'Learn React' with the actual text you expect to render in App
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
