ARG BASE=ydpen-dict3:3.4.5
FROM ${BASE}

# 补齐被排除掉的可写目录（笔上这些是 tmpfs / 独立分区）
RUN mkdir -p /tmp /run /var/run /var/log /var/tmp /userdisk /userdata /uresource \
             /mnt/sdcard /media/usb0 /oem && \
    chmod 1777 /tmp /var/tmp && \
    ln -sfn /userdata /data || true

# 笔上的 weston 只编了 drm/wayland 后端，补一个 headless 后端方便无头测试
COPY weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8/headless-backend.so /usr/lib/libweston-8/headless-backend.so
COPY weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8/fbdev-backend.so /usr/lib/libweston-8/fbdev-backend.so

COPY weston-headless.ini /etc/xdg/weston/weston-headless.ini
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod 755 /usr/local/bin/entrypoint.sh

ENV XDG_RUNTIME_DIR=/tmp/xdg
ENV WAYLAND_DISPLAY=wayland-0
ENV LD_LIBRARY_PATH=/usr/lib:/lib
WORKDIR /userdisk
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/sh"]
