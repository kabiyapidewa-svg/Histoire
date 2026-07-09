import { Component, ErrorInfo, ReactNode } from 'react';
import { Heart } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global — attrape toute erreur de rendu React
 * et affiche un fallback propre au lieu d'un écran blanc.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
            <Heart className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h1 className="text-2xl font-playfair font-bold text-brun-doux mb-2">
              Oups, quelque chose s'est cassé
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              Une erreur inattendue est survenue. Vous pouvez recharger l'application.
            </p>
            {this.state.error?.message && (
              <pre className="bg-gray-100 text-gray-700 text-xs p-3 rounded-lg mb-4 overflow-x-auto text-left">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
