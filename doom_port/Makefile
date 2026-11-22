PROJECT_ROOT ?= /Volumes/500GB/Ydpen/doom_port
SRC_ROOT ?= /tmp/doomsrc
BUILD ?= /tmp/doombuild
ZIG ?= /Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig

CC := ZIG_GLOBAL_CACHE_DIR=$(BUILD)/zigcache $(ZIG) cc
LINK_CC := ZIG_GLOBAL_CACHE_DIR=$(HOME)/.cache/zig $(ZIG) cc
TARGET := aarch64-linux-gnu.2.29
DEFS := -DNORMALUNIX -DLINUX -D_DEFAULT_SOURCE -DFEATURE_SOUND \
        -DDOOMGENERIC_RESX=320 -DDOOMGENERIC_RESY=200
INCS := -I$(SRC_ROOT)/doomgeneric -I$(SRC_ROOT)/wl -I$(SRC_ROOT)/alsa
CFLAGS := -target $(TARGET) -O2 -fPIC -Wall \
          -Wno-unused-parameter -Wno-unused-variable -Wno-unused-but-set-variable \
          -Wno-error=date-time -Wno-macro-redefined $(DEFS) $(INCS)
LIBS := -L$(SRC_ROOT)/lib -lwayland-client -lasound -lm -lpthread

DOOM_SRCS := dummy am_map doomdef doomstat dstrings d_event d_items d_iwad d_loop \
  d_main d_mode d_net f_finale f_wipe g_game hu_lib hu_stuff info i_cdmus i_endoom \
  i_joystick i_scale i_sound i_system i_timer memio m_argv m_bbox m_cheat m_config \
  m_controls m_fixed m_menu m_misc m_random p_ceilng p_doors p_enemy p_floor p_inter \
  p_lights p_map p_maputl p_mobj p_plats p_pspr p_saveg p_setup p_sight p_spec \
  p_switch p_telept p_tick p_user r_bsp r_data r_draw r_main r_plane r_segs r_sky \
  r_things sha1 sounds statdump st_lib st_stuff s_sound tables v_video wi_stuff \
  w_checksum w_file w_main w_wad z_zone w_file_stdc i_input i_video doomgeneric

OBJS := $(addprefix $(BUILD)/obj/doom_,$(addsuffix .o,$(DOOM_SRCS))) \
        $(BUILD)/obj/src_alsa_sound.o \
        $(BUILD)/obj/src_samplerate_globals.o \
        $(BUILD)/obj/src_doomgeneric_ydpen.o \
        $(BUILD)/obj/wl_xdg_shell_protocol.o

.PHONY: all clean probe

all: $(BUILD)/doom_ydpen
	@mkdir -p $(PROJECT_ROOT)/build
	@cp -f $< $(PROJECT_ROOT)/build/doom_ydpen
	@echo "built $(PROJECT_ROOT)/build/doom_ydpen"

$(BUILD)/doom_ydpen: $(OBJS)
	@mkdir -p $(dir $@)
	$(LINK_CC) $(CFLAGS) $(OBJS) -o $@ -Wl,--allow-shlib-undefined $(LIBS)
	@echo "[link] $@"

$(BUILD)/obj/doom_%.o: $(SRC_ROOT)/doomgeneric/%.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD)/obj/src_%.o: $(SRC_ROOT)/src/%.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD)/obj/wl_xdg_shell_protocol.o: $(SRC_ROOT)/wl/xdg-shell-protocol.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -Wno-unused-parameter -c $< -o $@

probe: $(BUILD)/wl_probe
	@mkdir -p $(PROJECT_ROOT)/build
	@cp -f $< $(PROJECT_ROOT)/build/wl_probe

$(BUILD)/wl_probe: $(SRC_ROOT)/src/wl_probe.c $(SRC_ROOT)/wl/xdg-shell-protocol.c
	@mkdir -p $(dir $@)
	$(LINK_CC) $(CFLAGS) $^ -o $@ -Wl,--allow-shlib-undefined $(LIBS)

clean:
	rm -rf $(BUILD)
	rm -f $(PROJECT_ROOT)/build/doom_ydpen $(PROJECT_ROOT)/build/wl_probe
