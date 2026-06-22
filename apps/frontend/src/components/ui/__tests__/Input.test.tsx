import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Name" error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Search" />);
    const input = screen.getByLabelText('Search');
    await user.type(input, 'test query');
    expect(input).toHaveValue('test query');
  });

  it('shows hint text', () => {
    render(<Input label="API Key" hint="Keep this secret" />);
    expect(screen.getByText('Keep this secret')).toBeInTheDocument();
  });
});
