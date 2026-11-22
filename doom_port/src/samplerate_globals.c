/* i_sound.c binds these two sound-config variables, normally defined by
 * i_sdlsound.c. This port supplies its own ALSA backend, so define them here. */
int use_libsamplerate = 0;
float libsamplerate_scale = 0.65f;
