import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@ui/components/ui/button';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Last line of defense: an unexpected render error shows a reload screen instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook your error tracker here (Sentry etc.).
    // eslint-disable-next-line no-console
    console.error(error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="text-muted-foreground">Recarregue a página para continuar.</p>
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
      </div>
    );
  }
}
