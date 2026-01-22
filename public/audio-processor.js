class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Buffer size: We want to send chunks of approx 100-200ms.
        // At 48kHz, 100ms is 4800 samples.
        // At 44.1kHz, 100ms is 4410 samples.
        // Let's pick a safe power of 2 approx size, or just fixed size.
        // 4096 @ 48kHz = ~85ms.
        // 4096 @ 44.1kHz = ~92ms.
        this.bufferSize = 4096;
        this.buffer = new Float32Array(this.bufferSize);
        this.bytesWritten = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // Handle case where input might not be connected or empty
        if (!input || !input.length) return true;

        const channelData = input[0];

        // If adding this chunk would overflow, process currently buffered data first
        if (this.bytesWritten + channelData.length > this.bufferSize) {
            this.flush();
        }

        // Append new data
        this.buffer.set(channelData, this.bytesWritten);
        this.bytesWritten += channelData.length;

        // Optional: Pass through to output (for monitoring / debugging)
        // We generally valid silence strictly in the main app, but we can copy input to output if needed.
        // For this app, the destination is mute anyway, so we don't strictly need to copy.
        // But keeping the chain alive is good practice.
        // channelData.length usually is 128.
        // for (let i = 0; i < channelData.length; i++) {
        //    output[0][i] = channelData[i];
        // }

        return true; // Keep processor alive
    }

    flush() {
        // Extract valid data
        const dataToSend = this.buffer.subarray(0, this.bytesWritten);

        // Downsample to 16kHz
        // 'sampleRate' is a global in AudioWorkletGlobalScope
        const downsampled = this.downsample(dataToSend, sampleRate, 16000);

        // Post to main thread using zero-copy transfer if possible (second arg)
        // Note: Float32Array is a view, we need buffer.
        // But we created a new array in downsample, so it's safe to transfer.
        this.port.postMessage(downsampled, [downsampled.buffer]);

        this.bytesWritten = 0;
    }

    downsample(input, currentRate, targetRate) {
        if (currentRate === targetRate) {
            // Clone to ensure we don't send the shared `this.buffer` ref which we overwrite
            return input.slice();
        }

        const ratio = currentRate / targetRate;
        const newLength = Math.ceil(input.length / ratio);
        const result = new Float32Array(newLength);

        for (let i = 0; i < newLength; i++) {
            const offset = i * ratio;
            const index = Math.floor(offset);
            const decimal = offset - index;

            const s1 = input[index] || 0;
            const s2 = input[index + 1] || s1;

            // Linear interpolation
            result[i] = s1 + (s2 - s1) * decimal;
        }

        return result;
    }
}

registerProcessor('audio-processor', AudioProcessor);
