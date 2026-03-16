"""
Custom Resemble AI TTS plugin for LiveKit Agents.

Uses the streaming synthesis API with no_audio_header for raw PCM output:
https://docs.resemble.ai/voice-generation/text-to-speech/streaming-http
"""

import os
import logging
from typing import Any
import httpx
from livekit.agents import tts, APIConnectOptions
import uuid

logger = logging.getLogger("resemble-tts")


class ResembleTTS(tts.TTS):
    """
    Text-to-Speech using Resemble AI API.
    
    This implementation supports synthesis (text -> audio stream).
    Uses no_audio_header=true for raw PCM output, eliminating WAV header parsing.
    
    Requires:
    - RESEMBLE_API_KEY
    - RESEMBLE_VOICE_UUID
    """
    
    def __init__(
        self,
        *,
        api_key: str | None = None,
        voice_uuid: str | None = None,
        project_uuid: str | None = None,
        sample_rate: int = 22050,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=sample_rate,
            num_channels=1,
        )
        
        self._api_key = api_key or os.environ.get("RESEMBLE_API_KEY")
        self._voice_uuid = voice_uuid or os.environ.get("RESEMBLE_VOICE_UUID")
        self._project_uuid = project_uuid or os.environ.get("RESEMBLE_PROJECT_UUID")
        
        if not self._api_key:
            raise ValueError("RESEMBLE_API_KEY is required")
        if not self._voice_uuid:
            raise ValueError("RESEMBLE_VOICE_UUID is required")
        
        self._http_client: httpx.AsyncClient | None = None
        
        logger.info(f"Initialized Resemble TTS with voice: {self._voice_uuid}")
    
    def _ensure_client(self) -> httpx.AsyncClient:
        """Lazily create the HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client
    
    async def aclose(self) -> None:
        """Close the HTTP client."""
        if self._http_client is not None:
            await self._http_client.aclose()
            self._http_client = None
    
    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions = APIConnectOptions(),
    ) -> "ResembleChunkedStream":
        """Synthesize text to speech using Resemble AI streaming."""
        return ResembleChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options,
            api_key=self._api_key,
            voice_uuid=self._voice_uuid,
            project_uuid=self._project_uuid,
            sample_rate=self._sample_rate,
        )


class ResembleChunkedStream(tts.ChunkedStream):
    """Streaming chunk for Resemble AI TTS."""
    
    def __init__(
        self,
        *,
        tts: ResembleTTS,
        input_text: str,
        conn_options: APIConnectOptions,
        api_key: str,
        voice_uuid: str,
        project_uuid: str | None,
        sample_rate: int,
    ):
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._resemble_tts = tts
        self._api_key = api_key
        self._voice_uuid = voice_uuid
        self._project_uuid = project_uuid
        self._sample_rate = sample_rate
    
    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        """Stream audio from Resemble AI with no_audio_header for raw PCM."""
        import time
        request_id = str(uuid.uuid4())
        http_client = self._resemble_tts._ensure_client()
        text_preview = self._input_text[:80].replace('\n', ' ')
        t0 = time.time()

        logger.info(f"[TTS] Starting synthesis request={request_id}, text='{text_preview}...', voice={self._voice_uuid}")

        try:
            payload = {
                "voice_uuid": self._voice_uuid,
                "data": self._input_text,
                "sample_rate": self._sample_rate,
                "precision": "PCM_16",
                "no_audio_header": True,
            }
            if self._project_uuid:
                payload["project_uuid"] = self._project_uuid

            output_emitter.initialize(
                request_id=request_id,
                sample_rate=self._sample_rate,
                num_channels=1,
                mime_type="audio/pcm",
            )

            async with http_client.stream(
                "POST",
                "https://f.cluster.resemble.ai/stream",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                logger.info(f"[TTS] Resemble API response: status={response.status_code}, request={request_id}")
                if response.status_code >= 400:
                    error_content = await response.aread()
                    error_msg = error_content.decode('utf-8')
                    logger.error(f"[TTS] FAILED: HTTP {response.status_code} - {error_msg}, request={request_id}")
                    raise RuntimeError(f"Resemble AI error {response.status_code}: {error_msg}")

                total_bytes = 0
                chunk_count = 0
                # Use larger chunks (16KB) to reduce push overhead and buffer underruns
                async for chunk in response.aiter_bytes(chunk_size=16384):
                    if not chunk:
                        continue
                    if len(chunk) % 2 != 0:
                        chunk = chunk[:-1]
                    if len(chunk) > 0:
                        output_emitter.push(chunk)
                        total_bytes += len(chunk)
                        chunk_count += 1

                output_emitter.flush()
                elapsed = time.time() - t0
                logger.info(
                    f"[TTS] Completed: request={request_id}, chunks={chunk_count}, "
                    f"bytes={total_bytes}, elapsed={elapsed:.2f}s"
                )

        except httpx.HTTPStatusError as e:
            logger.error(f"[TTS] HTTP status error: {e}, request={request_id}")
            raise RuntimeError(f"Resemble AI TTS error: {e}")
        except httpx.RequestError as e:
            logger.error(f"[TTS] Request error (network/timeout): {e}, request={request_id}")
            raise RuntimeError(f"Resemble AI TTS error: {e}")
        except Exception as e:
            logger.error(f"[TTS] Unexpected error: {e}, request={request_id}", exc_info=True)
            raise RuntimeError(f"Resemble AI TTS error: {e}")
