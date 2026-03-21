import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive mb-4">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Ops! Algo deu errado.
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Ocorreu um erro inesperado ao carregar esta parte da aplicação.
                        </p>

                        {this.state.error && (
                            <div className="bg-muted p-4 rounded-lg text-left overflow-auto max-h-40 font-mono text-xs border border-border">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-12 text-lg font-semibold"
                            >
                                <RefreshCcw className="mr-2 h-5 w-5" />
                                Recarregar Página
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = "/"}
                                className="w-full h-12 text-lg font-semibold"
                            >
                                Voltar para o Início
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
