import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackClassName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <Card className={this.props.fallbackClassName}>
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive/70 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground">Something went wrong</h3>
            {isDev && this.state.error && (
              <p className="mt-1 max-w-md text-xs text-destructive font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              An unexpected error occurred in this section.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" variant="default" onClick={this.handleReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button size="sm" variant="ghost" onClick={this.handleReload}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
