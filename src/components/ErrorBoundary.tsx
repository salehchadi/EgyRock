"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#1c1a17] text-[#f2ede4] p-4">
          <div className="max-w-md w-full bg-[#282521] border-2 border-[#dc2626] p-8 text-center">
            <h1 className="text-2xl font-heading uppercase text-[#dc2626] mb-4">
              Something went wrong
            </h1>
            <p className="text-sm text-[#9e978e] mb-6">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#e0562c] text-white font-heading uppercase text-sm border-2 border-black shadow-[4px_4px_0px_black] hover:bg-[#c44721] transition cursor-pointer"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-[#9e978e] cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-[#dc2626] overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
