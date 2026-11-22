#define _GNU_SOURCE 1
#include <alsa/asoundlib.h>
#include <errno.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "deh_str.h"
#include "i_sound.h"
#include "w_wad.h"
#include "z_zone.h"

#define NUM_VOICES 16
#define OUT_RATE 48000
#define OUT_CHANNELS 2
#define MIX_FRAMES 480

typedef struct {
    uint8_t *data;
    size_t cap;
    size_t len;
    int rate;
    double pos;
    double gain_l;
    double gain_r;
    int active;
} voice_t;

static voice_t voices[NUM_VOICES];
static pthread_mutex_t voices_lock = PTHREAD_MUTEX_INITIALIZER;
static pthread_t audio_thread;
static atomic_int audio_run = 0;
static snd_pcm_t *pcm = NULL;
static int audio_ready = 0;
static int sfx_prefix = 1;
static unsigned long long frames_written = 0;
static unsigned int xruns = 0;

static void set_gains(voice_t *v, int vol, int sep) {
    if (vol < 0) vol = 0;
    if (vol > 127) vol = 127;
    if (sep < 0) sep = 0;
    if (sep > 255) sep = 255;
    double base = (vol / 127.0) * 0.85;
    double pan = sep / 255.0;
    double l = pan <= 0.5 ? 1.0 : (1.0 - pan) * 2.0;
    double r = pan >= 0.5 ? 1.0 : pan * 2.0;
    v->gain_l = base * l;
    v->gain_r = base * r;
}

static int mix_frames(int16_t *out, int frames) {
    memset(out, 0, (size_t)frames * OUT_CHANNELS * sizeof(int16_t));
    pthread_mutex_lock(&voices_lock);
    for (int vi = 0; vi < NUM_VOICES; vi++) {
        voice_t *v = &voices[vi];
        if (!v->active)
            continue;
        if (v->len < 2 || v->rate <= 0) {
            v->active = 0;
            continue;
        }
        double step = (double)v->rate / (double)OUT_RATE;
        for (int i = 0; i < frames; i++) {
            size_t idx = (size_t)v->pos;
            if (idx + 1 >= v->len) {
                v->active = 0;
                break;
            }
            double frac = v->pos - (double)idx;
            int a = (int)v->data[idx] - 128;
            int b = (int)v->data[idx + 1] - 128;
            double s = (a + (b - a) * frac) * 256.0;
            int32_t l = out[i * 2] + (int32_t)(s * v->gain_l);
            int32_t r = out[i * 2 + 1] + (int32_t)(s * v->gain_r);
            out[i * 2] = l > 32767 ? 32767 : (l < -32768 ? -32768 : (int16_t)l);
            out[i * 2 + 1] = r > 32767 ? 32767 : (r < -32768 ? -32768 : (int16_t)r);
            v->pos += step;
        }
    }
    pthread_mutex_unlock(&voices_lock);
    return 0;
}

static const char *opened_pcm_name = NULL;

static int alsa_pcm_busy(void) {
    FILE *f = fopen("/proc/asound/card1/pcm0p/sub0/status", "r");
    if (!f)
        return 0;
    char line[128];
    int busy = 1;
    while (fgets(line, sizeof(line), f)) {
        if (strncmp(line, "state:", 6) == 0) {
            busy = strstr(line, "CLOSED") == NULL;
            break;
        }
    }
    fclose(f);
    return busy;
}

static int try_open_pcm(int verbose) {
    const char *candidates[] = { "default", "speaker", "plughw:1,0", "hw:1,0" };
    const char *opened = NULL;
    int err = -1;

    for (size_t i = 0; i < sizeof(candidates) / sizeof(candidates[0]); i++) {
        err = snd_pcm_open(&pcm, candidates[i], SND_PCM_STREAM_PLAYBACK, 0);
        if (err >= 0) {
            opened = candidates[i];
            break;
        }
        if (verbose)
            fprintf(stderr, "[audio] open %s failed: %s\n", candidates[i], snd_strerror(err));
        pcm = NULL;
    }
    if (!pcm)
        return -1;

    err = snd_pcm_set_params(pcm, SND_PCM_FORMAT_S16_LE, SND_PCM_ACCESS_RW_INTERLEAVED,
                             OUT_CHANNELS, OUT_RATE, 1, 50000);
    if (err < 0) {
        if (verbose)
            fprintf(stderr, "[audio] set_params failed on %s: %s\n", opened, snd_strerror(err));
        snd_pcm_close(pcm);
        pcm = NULL;
        return -1;
    }
    err = snd_pcm_prepare(pcm);
    if (err < 0) {
        if (verbose)
            fprintf(stderr, "[audio] prepare failed: %s\n", snd_strerror(err));
        snd_pcm_close(pcm);
        pcm = NULL;
        return -1;
    }
    opened_pcm_name = opened;
    return 0;
}

static void *audio_thread_main(void *arg) {
    (void)arg;
    int16_t *buf = malloc((size_t)MIX_FRAMES * OUT_CHANNELS * sizeof(int16_t));
    if (!buf) {
        fprintf(stderr, "[audio] out of memory for mix buffer\n");
        return NULL;
    }
    int logged_start = 0;
    unsigned long long last_report = 0;
    int wait_logged = 0;
    while (atomic_load(&audio_run)) {
        if (!pcm) {
            if (alsa_pcm_busy() || try_open_pcm(0) < 0) {
                if (!wait_logged) {
                    fprintf(stderr, "[audio] ALSA unavailable; will attach when device is free\n");
                    wait_logged = 1;
                }
                /* keep voice lifecycles moving while output is unavailable */
                for (int i = 0; i < OUT_RATE / MIX_FRAMES / 2; i++)
                    mix_frames(buf, MIX_FRAMES);
                usleep(500000);
                continue;
            }
            fprintf(stderr, "[audio] ALSA %s opened after retry: 48000 Hz S16_LE stereo\n",
                    opened_pcm_name ? opened_pcm_name : "?");
            wait_logged = 0;
            logged_start = 0;
        }
        mix_frames(buf, MIX_FRAMES);
        int off = 0;
        while (off < MIX_FRAMES && atomic_load(&audio_run)) {
            snd_pcm_sframes_t n = snd_pcm_writei(pcm, buf + (size_t)off * OUT_CHANNELS,
                                                 (snd_pcm_uframes_t)(MIX_FRAMES - off));
            if (n < 0) {
                if (n == -EAGAIN) {
                    usleep(1000);
                    continue;
                }
                if (n == -EPIPE) {
                    xruns++;
                    fprintf(stderr, "[audio] underrun (%u), recovering\n", xruns);
                } else {
                    fprintf(stderr, "[audio] write error: %s\n", snd_strerror((int)n));
                }
                n = snd_pcm_recover(pcm, (int)n, 1);
                if (n < 0) {
                    fprintf(stderr, "[audio] recover failed: %s\n", snd_strerror((int)n));
                    if (n == -ENODEV || n == -EBADFD) {
                        snd_pcm_close(pcm);
                        pcm = NULL;
                    }
                    usleep(20000);
                    break;
                }
                continue;
            }
            if (n == 0) {
                usleep(1000);
                continue;
            }
            off += (int)n;
            frames_written += (unsigned long long)n;
        }
        if (!logged_start && frames_written > 0) {
            fprintf(stderr, "[audio] streaming 48000 Hz S16_LE stereo (frames=%llu)\n", frames_written);
            logged_start = 1;
        }
        if (frames_written - last_report >= OUT_RATE * 10ULL) {
            fprintf(stderr, "[audio] 10s checkpoint: frames=%llu xruns=%u\n", frames_written, xruns);
            last_report = frames_written;
        }
    }
    free(buf);
    return NULL;
}

static boolean SoundInit(boolean use_sfx_prefix) {
    sfx_prefix = use_sfx_prefix ? 1 : 0;
    if (audio_ready)
        return true;

    if (try_open_pcm(1) < 0)
        fprintf(stderr, "[audio] no ALSA playback device available; silent mode, retrying in background\n");

    atomic_store(&audio_run, 1);
    if (pthread_create(&audio_thread, NULL, audio_thread_main, NULL) != 0) {
        fprintf(stderr, "[audio] cannot create mixing thread\n");
        atomic_store(&audio_run, 0);
        if (pcm) {
            snd_pcm_close(pcm);
            pcm = NULL;
        }
        return false;
    }
    audio_ready = 1;
    if (pcm)
        fprintf(stderr, "[audio] ALSA %s opened: 48000 Hz S16_LE stereo, mixing thread started\n",
                opened_pcm_name ? opened_pcm_name : "?");
    else
        fprintf(stderr, "[audio] mixing thread started; waiting for ALSA device\n");
    return true;
}

static void SoundShutdown(void) {
    if (!audio_ready)
        return;
    atomic_store(&audio_run, 0);
    pthread_join(audio_thread, NULL);
    if (pcm) {
        snd_pcm_drain(pcm);
        snd_pcm_close(pcm);
        pcm = NULL;
    }
    pthread_mutex_lock(&voices_lock);
    for (int i = 0; i < NUM_VOICES; i++) {
        free(voices[i].data);
        memset(&voices[i], 0, sizeof(voices[i]));
    }
    pthread_mutex_unlock(&voices_lock);
    audio_ready = 0;
    fprintf(stderr, "[audio] shutdown after %llu frames, xruns=%u\n", frames_written, xruns);
}

static void sfx_lump_name(sfxinfo_t *sfx, char *buf, size_t len) {
    if (sfx->link)
        sfx = sfx->link;
    if (sfx_prefix)
        snprintf(buf, len, "DS%s", DEH_String(sfx->name));
    else
        snprintf(buf, len, "%s", DEH_String(sfx->name));
}

static int SoundGetSfxLumpNum(sfxinfo_t *sfx) {
    char name[16];
    sfx_lump_name(sfx, name, sizeof(name));
    return W_GetNumForName(name);
}

static void SoundUpdate(void) {
}

static void SoundUpdateParams(int channel, int vol, int sep) {
    if (channel < 0 || channel >= NUM_VOICES)
        return;
    pthread_mutex_lock(&voices_lock);
    set_gains(&voices[channel], vol, sep);
    pthread_mutex_unlock(&voices_lock);
}

static int SoundStart(sfxinfo_t *sfx, int channel, int vol, int sep) {
    if (!audio_ready || channel < 0 || channel >= NUM_VOICES)
        return -1;
    int lump = sfx->lumpnum;
    if (lump < 0)
        return -1;
    unsigned int lumplen = W_LumpLength((unsigned int)lump);
    if (lumplen < 48)
        return -1;
    uint8_t *raw = W_CacheLumpNum(lump, PU_STATIC);
    if (!raw) {
        W_ReleaseLumpNum(lump);
        return -1;
    }
    if (raw[0] != 0x03 || raw[1] != 0x00) {
        W_ReleaseLumpNum(lump);
        return -1;
    }
    int rate = (int)raw[2] | ((int)raw[3] << 8);
    uint32_t length = (uint32_t)raw[4] | ((uint32_t)raw[5] << 8) |
                      ((uint32_t)raw[6] << 16) | ((uint32_t)raw[7] << 24);
    if (rate <= 0)
        rate = 11025;
    if (length > lumplen - 8 || length <= 48) {
        W_ReleaseLumpNum(lump);
        return -1;
    }
    if (length > 32)
        length -= 16; /* DMX lumps carry 16 bytes of trailing padding */
    if (length > 1024 * 1024)
        length = 1024 * 1024;

    pthread_mutex_lock(&voices_lock);
    voice_t *v = &voices[channel];
    if (v->cap < length) {
        uint8_t *nb = realloc(v->data, length);
        if (!nb) {
            pthread_mutex_unlock(&voices_lock);
            W_ReleaseLumpNum(lump);
            return -1;
        }
        v->data = nb;
        v->cap = length;
    }
    memcpy(v->data, raw + 8, length);
    v->len = length;
    v->rate = rate;
    v->pos = 0.0;
    set_gains(v, vol, sep);
    v->active = 1;
    pthread_mutex_unlock(&voices_lock);
    W_ReleaseLumpNum(lump);
    return channel;
}

static void SoundStop(int channel) {
    if (channel < 0 || channel >= NUM_VOICES)
        return;
    pthread_mutex_lock(&voices_lock);
    voices[channel].active = 0;
    pthread_mutex_unlock(&voices_lock);
}

static boolean SoundIsPlaying(int channel) {
    if (channel < 0 || channel >= NUM_VOICES)
        return false;
    pthread_mutex_lock(&voices_lock);
    boolean playing = voices[channel].active && voices[channel].pos < voices[channel].len;
    pthread_mutex_unlock(&voices_lock);
    return playing;
}

static void SoundPrecache(sfxinfo_t *sounds, int num_sounds) {
    (void)sounds;
    (void)num_sounds;
}

static snddevice_t sound_devices[] = {
    SNDDEVICE_SB, SNDDEVICE_PAS, SNDDEVICE_GUS, SNDDEVICE_WAVEBLASTER,
    SNDDEVICE_SOUNDCANVAS, SNDDEVICE_GENMIDI, SNDDEVICE_AWE32,
};

sound_module_t DG_sound_module = {
    sound_devices,
    (int)(sizeof(sound_devices) / sizeof(sound_devices[0])),
    SoundInit,
    SoundShutdown,
    SoundGetSfxLumpNum,
    SoundUpdate,
    SoundUpdateParams,
    SoundStart,
    SoundStop,
    SoundIsPlaying,
    SoundPrecache,
};

/* Music is intentionally a safe no-op: SFX are fully mixed, MUS/OPL synthesis
 * is out of scope for this port. Doom tolerates this via the music module API. */
static snddevice_t music_devices[] = { SNDDEVICE_SB, SNDDEVICE_GENMIDI };

static boolean MusicInit(void) {
    fprintf(stderr, "[audio] music module: disabled (SFX-only port)\n");
    return true;
}
static void MusicShutdown(void) {}
static void MusicSetVolume(int volume) { (void)volume; }
static void MusicPause(void) {}
static void MusicResume(void) {}
static void *MusicRegisterSong(void *data, int len) {
    (void)data;
    (void)len;
    return (void *)1;
}
static void MusicUnRegisterSong(void *handle) { (void)handle; }
static void MusicPlaySong(void *handle, boolean looping) {
    (void)handle;
    (void)looping;
}
static void MusicStopSong(void) {}
static boolean MusicIsPlaying(void) { return false; }
static void MusicPoll(void) {}

music_module_t DG_music_module = {
    music_devices,
    (int)(sizeof(music_devices) / sizeof(music_devices[0])),
    MusicInit,
    MusicShutdown,
    MusicSetVolume,
    MusicPause,
    MusicResume,
    MusicRegisterSong,
    MusicUnRegisterSong,
    MusicPlaySong,
    MusicStopSong,
    MusicIsPlaying,
    MusicPoll,
};
