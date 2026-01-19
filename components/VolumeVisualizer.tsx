
import React, { useState, useImperativeHandle, forwardRef } from 'react';

export interface VolumeVisualizerHandle {
    setVolume: (vol: number) => void;
}

const VolumeVisualizer = forwardRef<VolumeVisualizerHandle, {}>((props, ref) => {
    const [volume, setVolume] = useState(0);

    useImperativeHandle(ref, () => ({
        setVolume: (vol: number) => {
            setVolume(vol);
        }
    }));

    return (
        <div className="flex items-end gap-1 h-10">
            <div className="w-2 bg-green-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, Math.min(40, volume * 200))}px` }} />
            <div className="w-2 bg-green-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, Math.min(50, volume * 300))}px` }} />
            <div className="w-2 bg-green-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, Math.min(40, volume * 200))}px` }} />
        </div>
    );
});

export default React.memo(VolumeVisualizer);
