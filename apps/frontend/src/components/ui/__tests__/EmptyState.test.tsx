import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';
import { Inbox } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState icon={Inbox} title="No items" description="Add your first item" />,
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        icon={Inbox}
        title="Empty"
        actionLabel="Create"
        onAction={onAction}
      />,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});
