import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Badge variant="success">Healthy</Badge>);
    expect(screen.getByText('Healthy')).toHaveClass('text-accent-emerald');
  });

  it('defaults to default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-surface-overlay');
  });
});
