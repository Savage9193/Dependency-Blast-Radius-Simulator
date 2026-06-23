import { render, screen } from '@testing-library/react';
import CardHeader, { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders header with title and description', () => {
    render(
      <Card>
        <CardHeader title="Test Title" description="Test description" />
      </Card>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('supports padding variants', () => {
    const { container } = render(<Card padding="none">No padding</Card>);
    expect(container.firstChild).not.toHaveClass('p-6');
  });
});
