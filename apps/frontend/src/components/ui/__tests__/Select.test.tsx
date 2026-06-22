import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders with label and options', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByLabelText('Choose')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Select label="Status" options={options} error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('allows selection', async () => {
    const user = userEvent.setup();
    render(<Select label="Pick" options={options} />);
    const select = screen.getByLabelText('Pick');
    await user.selectOptions(select, 'b');
    expect(select).toHaveValue('b');
  });
});
