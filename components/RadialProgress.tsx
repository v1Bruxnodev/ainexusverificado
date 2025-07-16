import React from 'react';

interface RadialProgressProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ progress, size = 120, strokeWidth = 10 }) => {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const [displayProgress, setDisplayProgress] = React.useState(0);

    React.useEffect(() => {
        const animation = requestAnimationFrame(() => setDisplayProgress(progress));
        return () => cancelAnimationFrame(animation);
    }, [progress]);
    
    const offset = circumference - (displayProgress / 100) * circumference;

    const progressColor = displayProgress < 40 ? 'text-red-500' : displayProgress < 70 ? 'text-yellow-500' : 'text-teal-500 dark:text-teal-400';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-gray-300 dark:text-gray-700/50"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className={`transition-all duration-1000 ease-out ${progressColor}`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${progressColor}`}>{Math.round(displayProgress)}</span>
                <span className={`text-xl font-medium ml-1 ${progressColor}`}>%</span>
            </div>
        </div>
    );
};

export default RadialProgress;