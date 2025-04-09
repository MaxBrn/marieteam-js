export default function LoadingSpinner({ text }) {
    return (
        <div className="flex flex-col justify-center items-center ">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-900"></div>
            </div>
            {text && <p className='text-center text-sky-900 animate-pulse mt-2'>{text}</p>}
        </div>
    );
}
