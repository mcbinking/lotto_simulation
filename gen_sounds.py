import wave
import math
import random
import struct
import os

SOUNDS_DIR = "sounds"
SAMPLE_RATE = 44100

def save_wav(filename, samples):
    filepath = os.path.join(SOUNDS_DIR, filename)
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        for sample in samples:
            # Clamp to 16-bit range
            val = max(-32767, min(32767, int(sample * 32767)))
            wav_file.writeframes(struct.pack('<h', val))
    print(f"Generated {filepath}")

def generate_button_sound():
    duration = 0.1
    freq = 1000
    samples = []
    for i in range(int(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        val = math.sin(2 * math.pi * freq * t) * 0.5
        # Envelope: quick fade out
        env = 1.0 - (t / duration)
        samples.append(val * env)
    save_wav("button.wav", samples)

def generate_mixing_sound():
    duration = 2.0 # Loopable-ish
    samples = []
    for i in range(int(duration * SAMPLE_RATE)):
        # White noise
        val = (random.random() * 2 - 1) * 0.3
        samples.append(val)
    save_wav("mixing.wav", samples)

def generate_pop_sound():
    duration = 0.15
    start_freq = 400
    end_freq = 800
    samples = []
    for i in range(int(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        # Frequency slide
        curr_freq = start_freq + (end_freq - start_freq) * (t / duration)
        val = math.sin(2 * math.pi * curr_freq * t) * 0.6
        env = 1.0 - (t / duration)
        samples.append(val * env)
    save_wav("pop.wav", samples)

def generate_complete_sound():
    duration = 1.5
    notes = [523.25, 659.25, 783.99, 1046.50] # C Major: C5, E5, G5, C6
    samples = [0] * int(duration * SAMPLE_RATE)
    
    for idx, note in enumerate(notes):
        start_time = idx * 0.1
        note_duration = 1.0
        for i in range(int(note_duration * SAMPLE_RATE)):
            global_idx = int(start_time * SAMPLE_RATE) + i
            if global_idx < len(samples):
                t = i / SAMPLE_RATE
                val = math.sin(2 * math.pi * note * t) * 0.3
                env = 1.0 - (t / note_duration)
                samples[global_idx] += val * env

    save_wav("complete.wav", samples)

if __name__ == "__main__":
    if not os.path.exists(SOUNDS_DIR):
        os.makedirs(SOUNDS_DIR)
    generate_button_sound()
    generate_mixing_sound()
    generate_pop_sound()
    generate_complete_sound()
