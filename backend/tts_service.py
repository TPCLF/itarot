"""
Text-to-Speech service using Piper TTS CLI
Provides high-quality neural voice synthesis for tarot interpretations
"""

import subprocess
import os

class TTSService:
    def __init__(self, model_path="./voices/ru_RU-irina-medium.onnx", speech_rate=1.0):
        """
        Initialize TTS service with American English female voice (Amy)
        
        Args:
            model_path: Path to voice model
            speech_rate: Speech speed multiplier (1.0=normal, faster/slower as needed)
        """
        self.model_path = os.path.abspath(model_path)
        self.piper_cmd = "piper"  # Use piper from venv
        self.speech_rate = speech_rate  # Default 1.0 for natural speed
        
        # Verify model exists
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Voice model not found: {self.model_path}")
        
        print(f"✓ TTS service initialized with model: {self.model_path}")
        print(f"  Speech rate: {self.speech_rate}x (1.0=normal, higher=slower/clearer)")
    
    def synthesize(self, text, custom_rate=None):
        """
        Convert text to speech audio using Piper CLI
        
        Args:
            text (str): Text to convert to speech
            custom_rate (float): Optional custom speech rate for this synthesis
            
        Returns:
            bytes: WAV audio data
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        
        # Use custom rate if provided, otherwise use default
        rate = custom_rate if custom_rate is not None else self.speech_rate
        
        try:
            # Call piper CLI with length-scale for speech rate control
            # length-scale > 1.0 = slower (clearer), < 1.0 = faster
            result = subprocess.run(
                [self.piper_cmd, "--model", self.model_path, 
                 "--length-scale", str(rate),
                 "--output-raw"],
                input=text.encode('utf-8'),
                capture_output=True,
                check=True
            )
            
            # Piper outputs raw PCM audio, we need to add WAV header
            raw_audio = result.stdout
            
            # Create WAV file with header
            wav_data = self._create_wav(raw_audio)
            
            return wav_data
            
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Piper TTS failed: {e.stderr.decode('utf-8')}")
        except FileNotFoundError:
            raise RuntimeError("Piper command not found. Make sure piper-tts is installed.")
    
    def _create_wav(self, raw_pcm_data):
        """Add WAV header to raw PCM data"""
        import struct
        
        # WAV file parameters (must match Piper output)
        channels = 1  # Mono
        sample_width = 2  # 16-bit
        framerate = 22050  # 22.05 kHz
        
        # Calculate sizes
        data_size = len(raw_pcm_data)
        file_size = 36 + data_size
        
        # Build WAV header
        wav_header = struct.pack('<4sI4s4sIHHIIHH4sI',
            b'RIFF',
            file_size,
            b'WAVE',
            b'fmt ',
            16,  # fmt chunk size
            1,   # PCM format
            channels,
            framerate,
            framerate * channels * sample_width,  # byte rate
            channels * sample_width,  # block align
            sample_width * 8,  # bits per sample
            b'data',
            data_size
        )
        
        return wav_header + raw_pcm_data
    
    def test(self):
        """Test TTS with sample text"""
        test_text = "The cards reveal your path. Trust in the wisdom of the universe."
        print(f"Testing TTS with: '{test_text}'")
        audio = self.synthesize(test_text)
        print(f"✓ Generated {len(audio)} bytes of audio")
        return audio
