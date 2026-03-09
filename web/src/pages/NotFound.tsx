import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
                <h1 className="text-[120px] sm:text-[160px] font-extrabold text-gray-100 leading-none select-none">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-2">🔍</div>
                    </div>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Page Not Found
            </h2>
            <p className="text-gray-500 max-w-md mb-8 text-sm leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
                Check the URL or head back to your dashboard.
            </p>
            <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
                ← Go to Dashboard
            </Link>
        </div>
    );
}
