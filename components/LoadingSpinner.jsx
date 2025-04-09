export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center min-h-full">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-900"></div>
            </div>
        </div>
    );
}
